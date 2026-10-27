from datetime import datetime, time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from railway.models import (
    Announcement,
    Booking,
    CarriageType,
    FareRule,
    Member,
    Passenger,
    SavedPassenger,
    ServiceStatus,
    Station,
    TicketType,
    Train,
    TrainType,
    Trip,
    TripCarriage,
)


STATIONS = [
    ("1000", "臺北", "Taipei", "臺北市", 10),
    ("1010", "板橋", "Banqiao", "新北市", 20),
    ("1020", "桃園", "Taoyuan", "桃園市", 30),
    ("1030", "新竹", "Hsinchu", "新竹市", 40),
    ("1040", "苗栗", "Miaoli", "苗栗縣", 50),
    ("3300", "臺中", "Taichung", "臺中市", 60),
    ("3310", "彰化", "Changhua", "彰化縣", 70),
    ("3320", "嘉義", "Chiayi", "嘉義市", 80),
    ("3330", "臺南", "Tainan", "臺南市", 90),
    ("3340", "高雄", "Kaohsiung", "高雄市", 100),
    ("3350", "新左營", "Xinzuoying", "高雄市", 110),
    ("3360", "屏東", "Pingtung", "屏東縣", 120),
    ("4000", "花蓮", "Hualien", "花蓮縣", 130),
    ("4200", "臺東", "Taitung", "臺東縣", 140),
    ("6000", "宜蘭", "Yilan", "宜蘭縣", 150),
    ("0900", "基隆", "Keelung", "基隆市", 5),
]

TRAIN_TYPES = [
    ("TCR", "自強號", "express", "速度最快的對號列車，適合中長途旅客。", "#C43E06"),
    ("CHU", "莒光號", "express", "停靠站較多，票價較親民的對號列車。", "#7A4B00"),
    ("LOCAL", "區間車", "local", "站站停靠，適合短程通勤。", "#256B3C"),
    ("PUYUMA", "普悠瑪", "express", "傾斜式列車，臺北至花東更快。", "#0B4F8F"),
    ("TAROKO", "太魯閣", "express", "傾斜式列車，適合東部幹線。", "#073763"),
]

TRAINS = [
    ("300", "TCR", "板橋・臺中", 134, False, True),
    ("1401", "TCR", "板橋・苗栗", 144, False, False),
    ("101", "TCR", "板橋・臺中", 134, False, True),
    ("1013", "TCR", "板橋・臺中", 134, False, False),
    ("3000", "LOCAL", "樹林・竹南", 165, True, False),
    ("1017", "TCR", "板橋・臺中", 134, False, True),
    ("111", "PUYUMA", "板橋・臺中", 130, False, False),
    ("203", "TAROKO", "板橋・臺中", 128, False, False),
    ("501", "CHU", "新竹・苗栗", 180, True, True),
]

CARRIAGES = [
    ("standard_free", "標準車廂（自由座）", "無指定座位，上車後自由入座。適合不趕時間的旅客。", 0, 0),
    ("standard_reserved", "標準車廂（指定座位）", "可選座位，選位後系統會保留 20 分鐘。", 0, 1),
    ("coleman", "Coleman 車廂", "座位較寬，附閱讀燈與個人插座，數量有限。", 150, 2),
    ("business", "商務車廂", "寬敞座椅與專屬服務，數量有限。", 300, 3),
]

TICKET_TYPES = [
    ("full", "全票（一般成人）", "任何人皆可購買，不需出示證件。", "無年齡限制。", 100, False, 0),
    ("discount", "優惠票（對座拆分）", "票價減半，但需同時購買 1 張全票，且兩者座位不相連。", "需與另一張全票同車、同區間。", 50, False, 1),
    ("senior", "敬老票", "年滿 65 歲適用，進站時須出示身分證明。", "年滿 65 歲（含）之本國籍旅客。", 50, True, 2),
    ("student", "學生票", "持有有效學生證適用，進站時須出示證件。", "持有有效學生證之在學學生。", 71, True, 3),
    ("child", "兒童票", "身高 100–125 公分兒童適用。", "身高 100–125 公分；超過 125 公分須買全票。", 50, False, 4),
    ("disability", "愛心票", "持有身心障礙證明者適用，本人與一名陪同者。", "須持有效身心障礙手冊或證明。", 50, True, 5),
]

ROUTE_PLANS = [
    ("臺北", "臺中", "臺北→臺中", 500, 250, 355, 250, 250, 134, ["300", "1401", "101", "3000", "1017", "111"]),
    ("臺北", "高雄", "臺北→高雄", 843, 421, 598, 421, 421, 300, ["101", "111", "203", "300"]),
    ("臺中", "臺南", "臺中→臺南", 220, 110, 156, 110, 110, 90, ["3000", "501", "1017"]),
    ("花蓮", "臺北", "花蓮→臺北", 440, 220, 312, 220, 220, 140, ["203", "111", "3000"]),
    ("高雄", "臺北", "高雄→臺北", 843, 421, 598, 421, 421, 300, ["101", "111", "203", "300"]),
    ("臺北", "花蓮", "臺北→花蓮", 440, 220, 312, 220, 220, 140, ["203", "111", "3000"]),
]

DEPARTURES = [
    "06:00", "06:30", "07:00", "07:20", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "17:00", "18:00", "19:00",
]


class Command(BaseCommand):
    help = "建立可重複執行的臺鐵 redesign 示範資料（車站、班次、票價、會員）。"

    @transaction.atomic
    def handle(self, *args, **options):
        stations = {}
        for code, name, name_en, city, order in STATIONS:
            station, _ = Station.objects.update_or_create(
                code=code,
                defaults={"name": name, "name_en": name_en, "city": city, "sort_order": order, "is_active": True},
            )
            stations[name] = station

        types = {}
        for code, name, category, description, color in TRAIN_TYPES:
            train_type, _ = TrainType.objects.update_or_create(
                code=code,
                defaults={"name": name, "category": category, "description": description, "color": color},
            )
            types[code] = train_type

        trains = {}
        for number, type_code, via, duration, has_pet, has_dining in TRAINS:
            train, _ = Train.objects.update_or_create(
                number=number,
                defaults={
                    "train_type": types[type_code],
                    "via": via,
                    "duration_min": duration,
                    "has_pet": has_pet,
                    "has_dining": has_dining,
                    "is_active": True,
                },
            )
            trains[number] = train

        carriages = {}
        for code, name, description, surcharge, order in CARRIAGES:
            carriage, _ = CarriageType.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": description,
                    "surcharge": surcharge,
                    "sort_order": order,
                    "is_active": True,
                },
            )
            carriages[code] = carriage

        tickets = {}
        for code, name, description, eligibility, percent, document, order in TICKET_TYPES:
            ticket, _ = TicketType.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": description,
                    "eligibility": eligibility,
                    "discount_percent": percent,
                    "requires_document": document,
                    "sort_order": order,
                    "is_active": True,
                },
            )
            tickets[code] = ticket

        for origin_name, destination_name, label, full, discount, student, senior, child, duration, train_numbers in ROUTE_PLANS:
            origin = stations[origin_name]
            destination = stations[destination_name]
            for train_number in train_numbers:
                train = trains[train_number]
                FareRule.objects.update_or_create(
                    origin=origin,
                    destination=destination,
                    train_type=train.train_type,
                    defaults={
                        "full_fare": full,
                        "discount_fare": discount,
                        "student_fare": student,
                        "senior_fare": senior,
                        "child_fare": child,
                        "e_ticket_discount": 30,
                        "is_active": True,
                    },
                )
            if destination_name == "臺中":
                FareRule.objects.update_or_create(
                    origin=origin,
                    destination=destination,
                    train_type=types["LOCAL"],
                    defaults={
                        "full_fare": 411,
                        "discount_fare": 205,
                        "student_fare": 292,
                        "senior_fare": 205,
                        "child_fare": 205,
                        "e_ticket_discount": 30,
                        "is_active": True,
                    },
                )

        today = timezone.localdate()
        trip_count = 0
        for offset in range(15):
            travel_date = today + timedelta(days=offset)
            for origin_name, destination_name, label, full, discount, student, senior, child, duration, train_numbers in ROUTE_PLANS:
                origin = stations[origin_name]
                destination = stations[destination_name]
                if Trip.objects.filter(travel_date=travel_date, origin=origin, destination=destination).exists():
                    continue
                route_departures = DEPARTURES if origin_name == "臺北" and destination_name == "臺中" else DEPARTURES[:8]
                for index, departure_text in enumerate(route_departures):
                    train_number = train_numbers[index % len(train_numbers)]
                    train = trains[train_number]
                    hour, minute = map(int, departure_text.split(":"))
                    departure = time(hour, minute)
                    arrival_dt = datetime.combine(travel_date, departure) + timedelta(minutes=duration)
                    sold_out = (train_number == "1013" and departure_text == "13:00") or index == (22 if len(route_departures) == 24 else 6)
                    total_seats = 0
                    available = 0
                    trip = Trip.objects.create(
                        train=train,
                        travel_date=travel_date,
                        origin=origin,
                        destination=destination,
                        departure_time=departure,
                        arrival_time=arrival_dt.time(),
                        duration_min=duration,
                        full_fare=full,
                        discount_fare=discount,
                        has_discount=discount is not None,
                        is_recommended=(train_number == "300" and departure_text == "07:00" and origin_name == "臺北" and destination_name == "臺中"),
                        status="full" if sold_out else "scheduled",
                        notes="本班次為示範資料。",
                    )
                    for code, _, _, surcharge, _ in CARRIAGES:
                        if sold_out:
                            seats = 0
                        elif code == "business":
                            seats = 0
                        elif code == "standard_free":
                            seats = 120
                        elif code == "standard_reserved":
                            seats = 60
                        else:
                            seats = 20
                        fare = full + surcharge
                        TripCarriage.objects.create(
                            trip=trip,
                            carriage_type=carriages[code],
                            fare=fare,
                            total_seats=max(seats, 1) if not sold_out else 12,
                            available_seats=seats,
                        )
                        total_seats += max(seats, 1) if not sold_out else 12
                        available += seats
                    trip.total_seats = total_seats
                    trip.available_seats = available
                    trip.save(update_fields=["total_seats", "available_seats"])
                    trip_count += 1

        if not Announcement.objects.filter(title__startswith="11/14 系統維護").exists():
            Announcement.objects.create(
                title="11/14 系統維護",
                body="11 月 14 日 00:00–06:00 進行系統升級，線上訂票暫停服務；時刻查詢與票價資訊不受影響。",
                kind="warn",
                is_active=True,
            )
        if not Announcement.objects.filter(title__startswith="台鐵好行電子票").exists():
            Announcement.objects.create(
                title="台鐵好行電子票上線",
                body="使用電子票可享 30 元折扣，出示 App 或 NFC 感應即可上車。",
                kind="info",
                is_active=True,
            )

        ServiceStatus.objects.update_or_create(
            system="booking",
            defaults={"status": "normal", "message": "全線行車正常，訂票與查詢服務正常。", "is_active": True},
        )
        ServiceStatus.objects.update_or_create(
            system="ticketing",
            defaults={"status": "normal", "message": "電子票與車站取票服務正常。", "is_active": True},
        )
        ServiceStatus.objects.update_or_create(
            system="website",
            defaults={"status": "normal", "message": "網站查詢服務正常。", "is_active": True},
        )

        member, _ = Member.objects.get_or_create(
            username="user",
            defaults={"email": "user@example.com", "first_name": "小明", "last_name": "王"},
        )
        member.email = "user@example.com"
        member.first_name = "小明"
        member.last_name = "王"
        member.phone = "0912-345-678"
        member.birth_date = "1998-03-15"
        member.id_number = "A123456789"
        member.set_password("user123")
        member.is_active = True
        member.save()

        admin_user, _ = Member.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@example.com", "first_name": "管理員"},
        )
        admin_user.email = "admin@example.com"
        admin_user.first_name = "管理員"
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password("admin123")
        admin_user.is_active = True
        admin_user.save()

        SavedPassenger.objects.update_or_create(
            member=member,
            id_number="A123456789",
            defaults={
                "name": "王小明",
                "birth_date": "1998-03-15",
                "phone": "0912-345-678",
                "email": "ming@example.com",
                "is_default": True,
            },
        )

        demo_trip = (
            Trip.objects.filter(
                travel_date=today + timedelta(days=1),
                origin__name="臺北",
                destination__name="臺中",
                train__number="300",
                status="scheduled",
            )
            .order_by("travel_date", "departure_time")
            .first()
        )
        if demo_trip and not Booking.objects.filter(order_no__startswith="T-DEMO").exists():
            carriage = demo_trip.tripcarriages.filter(available_seats__gt=0).first()
            if carriage:
                booking = Booking.objects.create(
                    order_no="T-DEMO-4471",
                    member=member,
                    trip=demo_trip,
                    trip_carriage=carriage,
                    ticket_type=tickets["full"],
                    passenger_count=1,
                    unit_fare=carriage.fare,
                    service_fee=0,
                    total_amount=carriage.fare,
                    payment_method="credit_card",
                    payment_ref="DEMO-PAYMENT",
                    status="paid",
                    paid_at=timezone.now(),
                    contact_phone="0912-345-678",
                    contact_email="ming@example.com",
                )
                Passenger.objects.create(
                    booking=booking,
                    name="王小明",
                    id_number="A123456789",
                    birth_date="1998-03-15",
                    phone="0912-345-678",
                    email="ming@example.com",
                    is_primary=True,
                )
                carriage.available_seats = max(0, carriage.available_seats - 1)
                carriage.save(update_fields=["available_seats"])
                demo_trip.available_seats = max(0, demo_trip.available_seats - 1)
                demo_trip.save(update_fields=["available_seats"])

        self.stdout.write(self.style.SUCCESS(
            f"Seed 完成：車站 {Station.objects.count()}、車種 {TrainType.objects.count()}、"
            f"班次 {Trip.objects.count()}（本次新增 {trip_count}）、訂單 {Booking.objects.count()}、會員 {Member.objects.count()}"
        ))
        self.stdout.write("測試帳號：user / user123（會員）、admin / admin123（管理員）")
