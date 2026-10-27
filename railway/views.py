from io import BytesIO
from urllib.parse import urlencode
from datetime import timedelta

import qrcode
import qrcode.image.svg
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.paginator import Paginator
from django.db import connection
from django.db.models import Count, Q
from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST

from .forms import LoginForm, PassengerFormSet, ProfileForm, SignupForm
from .models import (
    Announcement,
    Booking,
    FareRule,
    SavedPassenger,
    ServiceStatus,
    Station,
    TicketType,
    TrainType,
    Trip,
    TripCarriage,
)
from .services import (
    available_ticket_types,
    calculate_fare,
    cancel_booking,
    create_booking,
    parse_date,
    search_trips,
    station_suggestions,
    trip_is_past,
)


def _safe_next(request, fallback="railway:my_bookings"):
    target = request.POST.get("next") or request.GET.get("next")
    if target and target.startswith("/") and not target.startswith("//"):
        return target
    return reverse(fallback)


def _booking_draft(request, trip_id):
    draft = request.session.get("booking_draft") or {}
    if draft.get("trip_id") != int(trip_id):
        return None
    return draft


def _toggle_url(request, key):
    params = request.GET.copy()
    if params.get(key) == "1":
        params.pop(key)
    else:
        params[key] = "1"
    params.pop("page", None)
    return f"?{params.urlencode()}"


def _set_param_url(request, key, value):
    params = request.GET.copy()
    if value == "":
        params.pop(key, None)
    else:
        params[key] = value
    params.pop("page", None)
    return f"?{params.urlencode()}"


def home(request):
    today = timezone.localdate()
    announcements = [item for item in Announcement.objects.filter(is_active=True)[:5] if item.is_current]
    today_trips = Trip.objects.filter(
        travel_date=today,
        origin__name="臺北",
        destination__name="臺中",
        status__in=["scheduled", "full"],
        departure_time__gt=timezone.localtime().time(),
    ).count()
    mode = request.GET.get("mode", "")
    member_bookings = None
    if request.user.is_authenticated:
        member_bookings = Booking.objects.filter(member=request.user).count()

    context = {
        "today": today,
        "announcements": announcements,
        "today_trips": today_trips,
        "mode": mode,
        "member_bookings": member_bookings,
        "stations": Station.objects.filter(is_active=True),
        "ticket_types": available_ticket_types(),
        "page_title": "首頁",
    }
    return render(request, "railway/home.html", context)


def search_form(request):
    today = timezone.localdate()
    context = {
        "today": today,
        "max_date": today + timedelta(days=14),
        "stations": Station.objects.filter(is_active=True),
        "ticket_types": available_ticket_types(),
        "page_title": "訂票查詢",
        "default_date": request.GET.get("date") or today.isoformat(),
        "default_from": request.GET.get("from") or "臺北",
        "default_to": request.GET.get("to") or "臺中",
        "default_start": request.GET.get("start") or "06:00",
        "default_end": request.GET.get("end") or "23:59",
        "default_ticket_type": request.GET.get("ticket_type") or "full",
    }
    return render(request, "railway/search.html", context)


def search_results(request):
    qs, meta = search_trips(request.GET)
    if meta["origin"] and meta["destination"] and meta["origin"].pk == meta["destination"].pk:
        messages.warning(request, "出發站與抵達站不可相同，已為你顯示預設路線。")
        qs, meta = search_trips({"from": "臺北", "to": "臺中", "date": meta["travel_date"].isoformat()})

    paginator = Paginator(qs, 6)
    page_obj = paginator.get_page(request.GET.get("page"))
    total_count = qs.count()

    train_types = TrainType.objects.all()
    page_params = request.GET.copy()
    page_params.pop("page", None)
    filter_links = {
        "discount": _toggle_url(request, "discount"),
        "available": _toggle_url(request, "available"),
        "pet": _toggle_url(request, "pet"),
    }
    type_links = []
    for train_type in train_types:
        selected = train_type.code in meta["train_types"]
        type_links.append(
            {
                "obj": train_type,
                "active": selected,
                "url": _set_param_url(request, "type", train_type.code)
                if not selected
                else _set_param_url(request, "type", ""),
            }
        )

    context = {
        **meta,
        "trips": page_obj.object_list,
        "page_obj": page_obj,
        "paginator": paginator,
        "total_count": total_count,
        "train_types": train_types,
        "filter_links": filter_links,
        "type_links": type_links,
        "sort_price_url": _set_param_url(request, "sort", "price"),
        "sort_time_url": _set_param_url(request, "sort", "departure"),
        "page_title": "班次查詢結果",
        "querystring": request.GET.urlencode(),
        "page_query": page_params.urlencode(),
        "selected_ticket_type": request.GET.get("ticket_type", ""),
    }
    return render(request, "railway/results.html", context)


def compare(request):
    raw_values = request.GET.getlist("ids")
    if not raw_values:
        raw_values = [request.GET.get("ids", "")]
    ids = []
    for raw in raw_values:
        for value in str(raw).split(","):
            if value.isdigit() and int(value) not in ids:
                ids.append(int(value))
    ids = ids[:3]
    if len(ids) < 2:
        messages.warning(request, "請先從查詢結果勾選 2–3 個班次再進行比較。")
        params = request.GET.copy()
        params.pop("ids", None)
        return redirect(f"{reverse('railway:results')}?{params.urlencode()}")

    trips = list(
        Trip.objects.select_related("train", "train__train_type", "origin", "destination")
        .prefetch_related("tripcarriages__carriage_type")
        .filter(pk__in=ids)
    )
    trips.sort(key=lambda item: ids.index(item.pk))
    if len(trips) < 2:
        messages.warning(request, "找不到足夠的班次可以比較。")
        return redirect("railway:results")

    context = {
        "trips": trips,
        "page_title": "比較車次",
        "first_trip": trips[0],
        "recommended_trip": next((trip for trip in trips if trip.is_recommended), trips[0]),
    }
    return render(request, "railway/compare.html", context)


def fares(request):
    rules = FareRule.objects.filter(is_active=True).select_related("origin", "destination", "train_type")
    origin_name = request.GET.get("from")
    destination_name = request.GET.get("to")
    if origin_name:
        rules = rules.filter(origin__name=origin_name)
    if destination_name:
        rules = rules.filter(destination__name=destination_name)

    context = {
        "rules": rules,
        "ticket_types": available_ticket_types(),
        "stations": Station.objects.filter(is_active=True),
        "selected_from": origin_name or "",
        "selected_to": destination_name or "",
        "page_title": "票價與優惠",
    }
    return render(request, "railway/fares.html", context)


@login_required
def booking_carriage(request, trip_id):
    trip = get_object_or_404(
        Trip.objects.select_related("train", "train__train_type", "origin", "destination").prefetch_related(
            "tripcarriages__carriage_type"
        ),
        pk=trip_id,
    )
    if trip_is_past(trip) or trip.status != "scheduled":
        messages.error(request, "這個班次已無法訂購，請重新查詢。")
        return redirect("railway:results")
    if trip.is_sold_out:
        messages.warning(request, "這個班次已售完，為你顯示其他班次。")
        return redirect("railway:results")

    carriages = trip.tripcarriages.select_related("carriage_type").filter(carriage_type__is_active=True)
    preselected_ticket = TicketType.objects.filter(
        code=request.GET.get("ticket_type") or request.POST.get("ticket_type"), is_active=True
    ).first()
    if request.method == "POST":
        carriage = get_object_or_404(TripCarriage, pk=request.POST.get("carriage_id"), trip=trip)
        if carriage.is_sold_out:
            messages.error(request, "這個車廂已售完，請選擇其他車廂。")
        else:
            draft = {
                "trip_id": trip.pk,
                "carriage_id": carriage.pk,
                "passenger_count": 1,
                "e_ticket": False,
            }
            if preselected_ticket:
                draft["ticket_type_id"] = preselected_ticket.pk
            request.session["booking_draft"] = draft
            return redirect("railway:booking_ticket", trip_id=trip.pk)

    context = {
        "trip": trip,
        "carriages": carriages,
        "default_carriage_id": next((carriage.pk for carriage in carriages if carriage.available_seats > 0), None),
        "page_title": "選擇車廂",
        "steps": ["查詢條件", "選擇車廂"],
    }
    return render(request, "railway/carriage.html", context)


@login_required
def booking_ticket(request, trip_id):
    draft = _booking_draft(request, trip_id)
    if not draft:
        messages.warning(request, "請先選擇班次與車廂。")
        return redirect("railway:booking_carriage", trip_id=trip_id)

    trip = get_object_or_404(Trip.objects.select_related("train", "train__train_type", "origin", "destination"), pk=trip_id)
    carriage = get_object_or_404(TripCarriage.objects.select_related("carriage_type"), pk=draft["carriage_id"], trip=trip)
    ticket_types = list(available_ticket_types())

    selected_code = draft.get("ticket_type_id")
    selected_ticket = next((item for item in ticket_types if item.pk == selected_code), ticket_types[0] if ticket_types else None)
    passenger_count = int(draft.get("passenger_count", 1))
    e_ticket = bool(draft.get("e_ticket", False))

    if request.method == "POST":
        ticket = get_object_or_404(TicketType, pk=request.POST.get("ticket_type"), is_active=True)
        try:
            passenger_count = int(request.POST.get("passenger_count", "1"))
        except ValueError:
            passenger_count = 1
        passenger_count = max(1, min(4, passenger_count))
        e_ticket = request.POST.get("e_ticket") == "on"
        if request.POST.get("terms") != "on":
            messages.error(request, "請先閱讀並同意乘車條款與隱私權政策。")
        elif passenger_count > carriage.available_seats:
            messages.error(request, "這個車廂的剩餘座位不足，請減少人數或選擇其他車廂。")
        else:
            draft.update(
                {
                    "ticket_type_id": ticket.pk,
                    "passenger_count": passenger_count,
                    "e_ticket": e_ticket,
                }
            )
            request.session["booking_draft"] = draft
            return redirect("railway:booking_passenger", trip_id=trip.pk)
        selected_ticket = ticket

    ticket_options = [
        {"obj": item, "fare": item.fare_for(carriage.fare), "selected": selected_ticket and item.pk == selected_ticket.pk}
        for item in ticket_types
    ]
    preview = calculate_fare(carriage, selected_ticket, passenger_count, e_ticket) if selected_ticket else {}
    context = {
        "trip": trip,
        "carriage": carriage,
        "ticket_types": ticket_types,
        "ticket_options": ticket_options,
        "passenger_count": passenger_count,
        "e_ticket": e_ticket,
        "preview": preview,
        "page_title": "選擇票種",
        "steps": ["票種", "乘車人", "付款"],
    }
    return render(request, "railway/ticket.html", context)


@login_required
def booking_passenger(request, trip_id):
    draft = _booking_draft(request, trip_id)
    if not draft or not draft.get("ticket_type_id"):
        messages.warning(request, "請先完成票種與人數選擇。")
        return redirect("railway:booking_ticket", trip_id=trip_id)

    trip = get_object_or_404(Trip.objects.select_related("train", "train__train_type", "origin", "destination"), pk=trip_id)
    carriage = get_object_or_404(TripCarriage.objects.select_related("carriage_type"), pk=draft["carriage_id"], trip=trip)
    ticket_type = get_object_or_404(TicketType, pk=draft["ticket_type_id"], is_active=True)
    passenger_count = int(draft.get("passenger_count", 1))
    fare = calculate_fare(carriage, ticket_type, passenger_count, bool(draft.get("e_ticket")))

    saved = list(SavedPassenger.objects.filter(member=request.user)[:passenger_count])
    initial = []
    for index in range(passenger_count):
        if index < len(saved):
            person = saved[index]
            initial.append(
                {
                    "name": person.name,
                    "id_number": person.id_number,
                    "birth_date": person.birth_date,
                    "phone": person.phone,
                    "email": person.email,
                }
            )
        elif index == 0:
            initial.append(
                {
                    "name": request.user.get_full_name() or request.user.username,
                    "id_number": request.user.id_number,
                    "birth_date": request.user.birth_date,
                    "phone": request.user.phone,
                    "email": request.user.email,
                }
            )
        else:
            initial.append({})

    if request.method == "POST":
        formset = PassengerFormSet(request.POST)
        payment_method = request.POST.get("payment_method", "credit_card")
        if payment_method not in dict(Booking.PAYMENT_CHOICES):
            payment_method = "credit_card"
        if formset.is_valid():
            passengers = []
            for form in formset:
                if not form.cleaned_data:
                    continue
                data = form.cleaned_data
                passengers.append(
                    {
                        "name": data["name"],
                        "id_number": data["id_number"],
                        "birth_date": data.get("birth_date"),
                        "phone": data["phone"],
                        "email": data.get("email", ""),
                    }
                )
            if len(passengers) != passenger_count:
                messages.error(request, f"請填寫 {passenger_count} 位乘車人的完整資料。")
            else:
                try:
                    booking = create_booking(
                        member=request.user,
                        trip=trip,
                        carriage=carriage,
                        ticket_type=ticket_type,
                        passenger_count=passenger_count,
                        e_ticket=bool(draft.get("e_ticket")),
                        payment_method=payment_method,
                        passengers=passengers,
                        contact_phone=passengers[0]["phone"],
                        contact_email=passengers[0].get("email", ""),
                    )
                except ValidationError as exc:
                    messages.error(request, exc.messages[0])
                else:
                    request.session.pop("booking_draft", None)
                    messages.success(request, f"訂單 {booking.order_no} 已成立，電子票已準備完成。")
                    return redirect("railway:booking_complete", order_no=booking.order_no)
    else:
        formset = PassengerFormSet(initial=initial)

    context = {
        "trip": trip,
        "carriage": carriage,
        "ticket_type": ticket_type,
        "passenger_count": passenger_count,
        "fare": fare,
        "formset": formset,
        "payment_choices": Booking.PAYMENT_CHOICES,
        "selected_payment": request.POST.get("payment_method", "credit_card"),
        "page_title": "填寫乘車人資料",
        "steps": ["票種", "乘車人", "付款"],
    }
    return render(request, "railway/passenger.html", context)


def _get_booking_for_user(request, order_no):
    booking = get_object_or_404(
        Booking.objects.select_related(
            "trip", "trip__train", "trip__train__train_type", "trip__origin", "trip__destination",
            "trip_carriage__carriage_type", "ticket_type", "member",
        ).prefetch_related("passengers"),
        order_no=order_no,
    )
    if booking.member_id != request.user.pk and not request.user.is_staff:
        raise PermissionDenied
    return booking


@login_required
def booking_complete(request, order_no):
    booking = _get_booking_for_user(request, order_no)
    context = {
        "booking": booking,
        "passengers": booking.passengers.all(),
        "page_title": "訂票完成",
        "steps": ["票種", "乘車人", "付款"],
    }
    return render(request, "railway/complete.html", context)


@login_required
def booking_qr(request, order_no):
    booking = _get_booking_for_user(request, order_no)
    payload = request.build_absolute_uri(reverse("railway:booking_complete", args=[booking.order_no]))
    image = qrcode.make(payload, image_factory=qrcode.image.svg.SvgPathImage)
    buffer = BytesIO()
    image.save(buffer)
    return HttpResponse(buffer.getvalue(), content_type="image/svg+xml")


@login_required
def my_bookings(request):
    status = request.GET.get("status", "all")
    bookings = Booking.objects.filter(member=request.user).select_related(
        "trip", "trip__train", "trip__train__train_type", "trip__origin", "trip__destination",
        "trip_carriage__carriage_type", "ticket_type",
    )
    if status in {"paid", "pending", "cancelled", "used"}:
        bookings = bookings.filter(status=status)
    paginator = Paginator(bookings, 8)
    page_obj = paginator.get_page(request.GET.get("page"))
    counts = Booking.objects.filter(member=request.user).aggregate(
        total=Count("id"),
        paid=Count("id", filter=Q(status="paid")),
        cancelled=Count("id", filter=Q(status="cancelled")),
    )
    context = {
        "page_obj": page_obj,
        "bookings": page_obj.object_list,
        "counts": counts,
        "status": status,
        "page_title": "我的訂票",
    }
    return render(request, "railway/my_bookings.html", context)


@login_required
@require_POST
def cancel_booking_view(request, order_no):
    booking = _get_booking_for_user(request, order_no)
    try:
        cancel_booking(booking)
    except ValidationError as exc:
        messages.error(request, exc.messages[0])
    else:
        messages.success(request, f"訂單 {booking.order_no} 已取消，座位已釋出。")
    return redirect("railway:my_bookings")


@login_required
def profile(request):
    if request.method == "POST":
        form = ProfileForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, "個人資料已更新。")
            return redirect("railway:profile")
    else:
        form = ProfileForm(instance=request.user)
    context = {
        "form": form,
        "saved_passengers": SavedPassenger.objects.filter(member=request.user),
        "page_title": "會員資料",
    }
    return render(request, "railway/profile.html", context)


def signup(request):
    if request.user.is_authenticated:
        return redirect("railway:my_bookings")
    if request.method == "POST":
        form = SignupForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "註冊成功，歡迎使用臺鐵乘車資訊服務。")
            return redirect("railway:my_bookings")
    else:
        form = SignupForm()
    return render(request, "railway/signup.html", {"form": form, "page_title": "註冊會員"})


def status_page(request):
    statuses = ServiceStatus.objects.filter(is_active=True)
    announcements = [item for item in Announcement.objects.filter(is_active=True)[:5] if item.is_current]
    demo_maintenance = request.GET.get("demo") == "maintenance"
    context = {
        "statuses": statuses,
        "announcements": announcements,
        "demo_maintenance": demo_maintenance,
        "page_title": "服務資訊",
    }
    return render(request, "railway/status.html", context)


def station_search(request):
    query = request.GET.get("q", "").strip()
    data = [
        {"code": station.code, "name": station.name, "name_en": station.name_en, "city": station.city}
        for station in station_suggestions(query)
    ]
    return JsonResponse({"results": data})


def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        database = "ok"
    except Exception:
        database = "error"
    return JsonResponse({"status": "ok" if database == "ok" else "degraded", "database": database})
