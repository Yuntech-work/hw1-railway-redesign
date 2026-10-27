from datetime import date, datetime, time

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .models import Booking, Passenger, SavedPassenger, Station, TicketType, Trip, TripCarriage


def parse_date(value, default=None):
    default = default or timezone.localdate()
    if not value:
        return default
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return default


def parse_time(value, default):
    if not value:
        return default
    try:
        return datetime.strptime(value, "%H:%M").time()
    except (TypeError, ValueError):
        return default


def resolve_station(name, default_code="1000"):
    if name:
        station = Station.objects.filter(name=name, is_active=True).first()
        if station:
            return station
    return Station.objects.filter(code=default_code, is_active=True).first() or Station.objects.filter(is_active=True).first()


def search_trips(params):
    """Build the filtered queryset used by both the results page and tests."""
    def values(key):
        if hasattr(params, "getlist"):
            return params.getlist(key)
        value = params.get(key)
        if isinstance(value, (list, tuple)):
            return list(value)
        return [value] if value else []

    travel_date = parse_date(params.get("date"))
    start_time = parse_time(params.get("start"), time(6, 0))
    end_time = parse_time(params.get("end"), time(23, 59))
    origin = resolve_station(params.get("from") or "臺北", "1000")
    destination = resolve_station(params.get("to") or "臺中", "3300")

    qs = (
        Trip.objects.select_related("train", "train__train_type", "origin", "destination")
        .prefetch_related("tripcarriages__carriage_type")
        .filter(
            travel_date=travel_date,
            origin=origin,
            destination=destination,
            departure_time__gte=start_time,
            departure_time__lte=end_time,
            status__in=["scheduled", "full"],
        )
    )

    train_types = [value for value in values("type") if value]
    if train_types:
        qs = qs.filter(train__train_type__code__in=train_types)

    if params.get("discount") == "1":
        qs = qs.filter(has_discount=True)

    if params.get("available") == "1":
        qs = qs.filter(available_seats__gt=0)

    if params.get("pet") == "1":
        qs = qs.filter(train__has_pet=True)

    # 當日已發車的班次不再顯示，避免使用者點到不能訂的班次。
    if travel_date == timezone.localdate():
        qs = qs.filter(departure_time__gt=timezone.localtime().time())

    sort = params.get("sort", "departure")
    if sort == "price":
        qs = qs.order_by("full_fare", "departure_time")
    else:
        qs = qs.order_by("departure_time")

    return qs, {
        "travel_date": travel_date,
        "start_time": start_time,
        "end_time": end_time,
        "origin": origin,
        "destination": destination,
        "train_types": train_types,
        "discount": params.get("discount") == "1",
        "available": params.get("available") == "1",
        "pet": params.get("pet") == "1",
        "sort": sort,
    }


def trip_is_past(trip):
    now = timezone.localtime()
    return trip.travel_date < now.date() or (
        trip.travel_date == now.date() and trip.departure_time <= now.time()
    )


def calculate_fare(carriage, ticket_type, passenger_count, e_ticket=False):
    unit_fare = ticket_type.fare_for(carriage.fare)
    subtotal = unit_fare * passenger_count
    e_ticket_discount = 30 if e_ticket else 0
    total = max(0, subtotal - e_ticket_discount)
    return {
        "unit_fare": unit_fare,
        "service_fee": 0,
        "e_ticket_discount": e_ticket_discount,
        "total_amount": total,
    }


@transaction.atomic
def create_booking(
    *,
    member,
    trip,
    carriage,
    ticket_type,
    passenger_count,
    e_ticket,
    payment_method,
    passengers,
    contact_phone="",
    contact_email="",
):
    locked_trip = Trip.objects.select_for_update().select_related("train", "origin", "destination").get(pk=trip.pk)
    locked_carriage = TripCarriage.objects.select_for_update().get(pk=carriage.pk)

    if locked_trip.status != "scheduled" or trip_is_past(locked_trip):
        raise ValidationError("這個班次已無法訂購，請重新查詢。")
    if locked_trip.available_seats < passenger_count:
        raise ValidationError("剩餘座位不足，請減少人數或選擇其他班次。")
    if locked_carriage.available_seats < passenger_count:
        raise ValidationError("這個車廂的剩餘座位不足，請選擇其他車廂。")

    fare = calculate_fare(locked_carriage, ticket_type, passenger_count, e_ticket)
    booking = Booking.objects.create(
        member=member,
        trip=locked_trip,
        trip_carriage=locked_carriage,
        ticket_type=ticket_type,
        passenger_count=passenger_count,
        e_ticket=e_ticket,
        payment_method=payment_method,
        contact_phone=contact_phone,
        contact_email=contact_email,
        status="paid",
        paid_at=timezone.now(),
        payment_ref="DEMO-PAYMENT",
        **fare,
    )

    for index, data in enumerate(passengers):
        Passenger.objects.create(booking=booking, is_primary=index == 0, **data)

    locked_trip.available_seats -= passenger_count
    locked_carriage.available_seats -= passenger_count
    locked_trip.save(update_fields=["available_seats"])
    locked_carriage.save(update_fields=["available_seats"])

    first = passengers[0] if passengers else None
    if first:
        SavedPassenger.objects.update_or_create(
            member=member,
            id_number=first["id_number"],
            defaults={
                "name": first["name"],
                "birth_date": first.get("birth_date"),
                "phone": first["phone"],
                "email": first.get("email", ""),
                "is_default": True,
            },
        )

    return booking


@transaction.atomic
def cancel_booking(booking):
    locked = Booking.objects.select_for_update().get(pk=booking.pk)
    if locked.status not in {"pending", "paid"}:
        raise ValidationError("這張訂單目前無法取消。")
    if trip_is_past(locked.trip):
        raise ValidationError("已超過可取消時間。")

    if locked.trip_carriage_id:
        carriage = TripCarriage.objects.select_for_update().get(pk=locked.trip_carriage_id)
        carriage.available_seats = min(carriage.total_seats, carriage.available_seats + locked.passenger_count)
        carriage.save(update_fields=["available_seats"])

    trip = Trip.objects.select_for_update().get(pk=locked.trip_id)
    trip.available_seats = min(trip.total_seats, trip.available_seats + locked.passenger_count)
    trip.save(update_fields=["available_seats"])

    locked.status = "cancelled"
    locked.cancelled_at = timezone.now()
    locked.save(update_fields=["status", "cancelled_at"])
    return locked


def available_ticket_types():
    return TicketType.objects.filter(is_active=True)


def station_suggestions(query, limit=10):
    qs = Station.objects.filter(is_active=True)
    if query:
        qs = qs.filter(Q(name__icontains=query) | Q(name_en__icontains=query) | Q(code__icontains=query))
    return qs.order_by("sort_order", "code")[:limit]
