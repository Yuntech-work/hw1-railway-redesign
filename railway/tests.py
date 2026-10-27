from datetime import time, timedelta

from django.core.exceptions import ValidationError
from django.test import Client, TestCase
from django.utils import timezone

from .models import (
    Booking,
    CarriageType,
    Member,
    Passenger,
    Station,
    TicketType,
    Train,
    TrainType,
    Trip,
    TripCarriage,
)
from .services import cancel_booking, create_booking, search_trips, trip_is_past


class RailwayFixture(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.member = Member.objects.create_user(username="testuser", password="testpass123")
        cls.staff = Member.objects.create_superuser(
            username="testadmin", email="admin@example.com", password="adminpass123"
        )
        cls.taipei = Station.objects.create(code="1000", name="臺北", city="臺北市", sort_order=1)
        cls.taichung = Station.objects.create(code="3300", name="臺中", city="臺中市", sort_order=2)
        cls.kaohsiung = Station.objects.create(code="3340", name="高雄", city="高雄市", sort_order=3)
        cls.train_type = TrainType.objects.create(code="TCR", name="自強號", category="express")
        cls.train = Train.objects.create(number="300", train_type=cls.train_type, via="板橋・臺中", duration_min=134)
        cls.carriage_type = CarriageType.objects.create(code="standard_free", name="標準車廂（自由座）", sort_order=1)
        cls.ticket = TicketType.objects.create(code="full", name="全票", discount_percent=100, sort_order=1)
        cls.tomorrow = timezone.localdate() + timedelta(days=1)
        cls.trip = Trip.objects.create(
            train=cls.train,
            travel_date=cls.tomorrow,
            origin=cls.taipei,
            destination=cls.taichung,
            departure_time=time(7, 0),
            arrival_time=time(9, 14),
            duration_min=134,
            full_fare=500,
            discount_fare=250,
            has_discount=True,
            total_seats=10,
            available_seats=10,
            is_recommended=True,
        )
        cls.carriage = TripCarriage.objects.create(
            trip=cls.trip,
            carriage_type=cls.carriage_type,
            fare=500,
            total_seats=10,
            available_seats=10,
        )


class BookingServiceTests(RailwayFixture):
    def _passengers(self):
        return [
            {
                "name": "王小明",
                "id_number": "A123456789",
                "birth_date": None,
                "phone": "0912-345-678",
                "email": "ming@example.com",
            }
        ]

    def test_create_booking_decrements_seats(self):
        booking = create_booking(
            member=self.member,
            trip=self.trip,
            carriage=self.carriage,
            ticket_type=self.ticket,
            passenger_count=2,
            e_ticket=True,
            payment_method="credit_card",
            passengers=self._passengers() * 2,
        )
        self.trip.refresh_from_db()
        self.carriage.refresh_from_db()
        self.assertEqual(booking.status, "paid")
        self.assertEqual(booking.total_amount, 970)
        self.assertEqual(self.trip.available_seats, 8)
        self.assertEqual(self.carriage.available_seats, 8)
        self.assertEqual(booking.passengers.count(), 2)

    def test_overbooking_raises(self):
        self.trip.available_seats = 1
        self.trip.save(update_fields=["available_seats"])
        with self.assertRaises(ValidationError):
            create_booking(
                member=self.member,
                trip=self.trip,
                carriage=self.carriage,
                ticket_type=self.ticket,
                passenger_count=2,
                e_ticket=False,
                payment_method="credit_card",
                passengers=self._passengers() * 2,
            )

    def test_cancel_restores_seats(self):
        booking = create_booking(
            member=self.member,
            trip=self.trip,
            carriage=self.carriage,
            ticket_type=self.ticket,
            passenger_count=1,
            e_ticket=False,
            payment_method="credit_card",
            passengers=self._passengers(),
        )
        cancel_booking(booking)
        self.trip.refresh_from_db()
        self.carriage.refresh_from_db()
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")
        self.assertEqual(self.trip.available_seats, 10)
        self.assertEqual(self.carriage.available_seats, 10)


class SearchTests(RailwayFixture):
    def test_search_returns_matching_trip(self):
        params = {
            "from": "臺北",
            "to": "臺中",
            "date": self.tomorrow.isoformat(),
            "start": "06:00",
            "end": "23:59",
        }
        qs, meta = search_trips(params)
        self.assertEqual(qs.count(), 1)
        self.assertEqual(meta["origin"], self.taipei)

    def test_discount_filter(self):
        params = {
            "from": "臺北",
            "to": "臺中",
            "date": self.tomorrow.isoformat(),
            "discount": "1",
        }
        qs, _ = search_trips(params)
        self.assertEqual(qs.count(), 1)
        params["discount"] = "0"
        qs, _ = search_trips(params)
        self.assertEqual(qs.count(), 1)

    def test_past_trip_is_not_bookable(self):
        past = Trip.objects.create(
            train=self.train,
            travel_date=timezone.localdate() - timedelta(days=1),
            origin=self.taipei,
            destination=self.taichung,
            departure_time=time(7, 0),
            arrival_time=time(9, 0),
            duration_min=120,
            full_fare=500,
            total_seats=10,
            available_seats=10,
        )
        self.assertTrue(trip_is_past(past))


class ViewTests(RailwayFixture):
    def test_public_pages(self):
        client = Client()
        for url in ["/", "/search/", "/search/results/", "/fares/", "/status/", "/accounts/login/", "/accounts/signup/"]:
            with self.subTest(url=url):
                self.assertEqual(client.get(url).status_code, 200)

    def test_booking_requires_login(self):
        response = Client().get(f"/booking/{self.trip.pk}/carriage/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/accounts/login/", response.url)

    def test_member_pages(self):
        client = Client()
        self.assertTrue(client.login(username="testuser", password="testpass123"))
        for url in [f"/booking/{self.trip.pk}/carriage/", "/my/bookings/", "/my/profile/"]:
            with self.subTest(url=url):
                self.assertEqual(client.get(url).status_code, 200)

    def test_admin_requires_staff(self):
        client = Client()
        self.assertTrue(client.login(username="testuser", password="testpass123"))
        self.assertEqual(client.get("/admin/").status_code, 302)
        staff = Client()
        self.assertTrue(staff.login(username="testadmin", password="adminpass123"))
        self.assertEqual(staff.get("/admin/").status_code, 200)

    def test_station_api(self):
        response = Client().get("/api/stations/?q=臺")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["results"]), 1)

    def test_compare_page(self):
        other = Trip.objects.create(
            train=self.train,
            travel_date=self.tomorrow,
            origin=self.taipei,
            destination=self.taichung,
            departure_time=time(9, 0),
            arrival_time=time(11, 0),
            duration_min=120,
            full_fare=500,
            total_seats=10,
            available_seats=10,
        )
        response = Client().get(f"/compare/?ids={self.trip.pk},{other.pk}")
        self.assertEqual(response.status_code, 200)


class BookingFlowTests(RailwayFixture):
    def test_full_booking_and_cancel_flow(self):
        client = Client()
        client.login(username="testuser", password="testpass123")

        response = client.post(f"/booking/{self.trip.pk}/carriage/", {"carriage_id": self.carriage.pk})
        self.assertEqual(response.status_code, 302)

        response = client.post(
            f"/booking/{self.trip.pk}/ticket/",
            {"ticket_type": self.ticket.pk, "passenger_count": "1", "terms": "on"},
        )
        self.assertEqual(response.status_code, 302)

        response = client.post(
            f"/booking/{self.trip.pk}/passenger/",
            {
                "form-TOTAL_FORMS": "1",
                "form-INITIAL_FORMS": "0",
                "form-MIN_NUM_FORMS": "0",
                "form-MAX_NUM_FORMS": "1000",
                "form-0-name": "王小明",
                "form-0-id_number": "A123456789",
                "form-0-phone": "0912-345-678",
                "form-0-email": "ming@example.com",
                "payment_method": "credit_card",
            },
        )
        self.assertEqual(response.status_code, 302)
        booking = Booking.objects.get(member=self.member)
        self.assertEqual(booking.status, "paid")

        response = client.get(f"/booking/complete/{booking.order_no}/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, booking.order_no)

        response = client.post(f"/booking/{booking.order_no}/cancel/")
        self.assertEqual(response.status_code, 302)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")
        self.trip.refresh_from_db()
        self.assertEqual(self.trip.available_seats, 10)
