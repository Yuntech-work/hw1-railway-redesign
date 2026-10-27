import secrets
import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models
from django.urls import reverse
from django.utils import timezone


id_number_validator = RegexValidator(
    r"^[A-Z][12]\d{8}$",
    "身分證字號格式應為 A123456789（1 個英文字母 + 9 位數字）。",
)
phone_validator = RegexValidator(
    r"^09\d{2}-?\d{3}-?\d{3}$",
    "手機號碼格式應為 0912-345-678 或 0912345678。",
)


class Member(AbstractUser):
    """前台會員；與 Django 管理員共用同一張表，以 is_staff 區分權限。"""

    phone = models.CharField("手機號碼", max_length=20, blank=True, validators=[phone_validator])
    birth_date = models.DateField("出生日期", null=True, blank=True)
    id_number = models.CharField("身分證字號", max_length=10, blank=True, validators=[id_number_validator])
    membership_level = models.CharField(
        "會員等級",
        max_length=20,
        choices=[("standard", "一般會員"), ("senior", "敬老會員"), ("student", "學生會員")],
        default="standard",
    )
    preferred_font_scale = models.CharField(
        "預設字級",
        max_length=10,
        choices=[("normal", "標準"), ("lg", "大字")],
        default="normal",
    )
    created_at = models.DateTimeField("建立時間", auto_now_add=True)

    class Meta:
        verbose_name = "會員"
        verbose_name_plural = "會員"

    def __str__(self):
        return self.get_full_name() or self.username

    @property
    def display_name(self):
        return self.get_full_name() or self.username


class Station(models.Model):
    code = models.CharField("車站代碼", max_length=10, unique=True)
    name = models.CharField("車站名稱", max_length=40, unique=True)
    name_en = models.CharField("英文名稱", max_length=80, blank=True)
    city = models.CharField("縣市", max_length=30, blank=True)
    is_active = models.BooleanField("啟用", default=True)
    sort_order = models.PositiveIntegerField("排序", default=0)

    class Meta:
        ordering = ["sort_order", "code"]
        verbose_name = "車站"
        verbose_name_plural = "車站"

    def __str__(self):
        return self.name


class TrainType(models.Model):
    CATEGORY_CHOICES = [
        ("express", "對號列車"),
        ("local", "非對號列車"),
    ]
    code = models.CharField("代碼", max_length=20, unique=True)
    name = models.CharField("車種名稱", max_length=30)
    category = models.CharField("分類", max_length=20, choices=CATEGORY_CHOICES, default="express")
    description = models.TextField("說明", blank=True)
    color = models.CharField("代表色", max_length=20, blank=True, default="#0B4F8F")

    class Meta:
        ordering = ["code"]
        verbose_name = "車種"
        verbose_name_plural = "車種"

    def __str__(self):
        return self.name


class Train(models.Model):
    number = models.CharField("車次", max_length=20, unique=True)
    train_type = models.ForeignKey(TrainType, verbose_name="車種", on_delete=models.PROTECT, related_name="trains")
    via = models.CharField("經由", max_length=100, blank=True)
    duration_min = models.PositiveIntegerField("行駛分鐘", default=0)
    has_pet = models.BooleanField("可攜帶寵物", default=False)
    has_dining = models.BooleanField("有餐車", default=False)
    is_active = models.BooleanField("啟用", default=True)

    class Meta:
        ordering = ["train_type__code", "number"]
        verbose_name = "列車"
        verbose_name_plural = "列車"

    def __str__(self):
        return f"{self.train_type.name} {self.number}"


class Trip(models.Model):
    STATUS_CHOICES = [
        ("scheduled", "正常行駛"),
        ("full", "已額滿"),
        ("cancelled", "停駛"),
    ]

    train = models.ForeignKey(Train, verbose_name="列車", on_delete=models.PROTECT, related_name="trips")
    travel_date = models.DateField("乘車日期")
    origin = models.ForeignKey(Station, verbose_name="出發站", on_delete=models.PROTECT, related_name="departures")
    destination = models.ForeignKey(Station, verbose_name="抵達站", on_delete=models.PROTECT, related_name="arrivals")
    departure_time = models.TimeField("出發時間")
    arrival_time = models.TimeField("抵達時間")
    duration_min = models.PositiveIntegerField("行駛分鐘")
    full_fare = models.PositiveIntegerField("全票票價")
    discount_fare = models.PositiveIntegerField("優惠票票價", null=True, blank=True)
    has_discount = models.BooleanField("有優惠票", default=False)
    is_recommended = models.BooleanField("建議班次", default=False)
    total_seats = models.PositiveIntegerField("總座位數", default=0)
    available_seats = models.PositiveIntegerField("剩餘座位", default=0)
    status = models.CharField("狀態", max_length=20, choices=STATUS_CHOICES, default="scheduled")
    notes = models.CharField("備註", max_length=200, blank=True)
    created_at = models.DateTimeField("建立時間", auto_now_add=True)

    class Meta:
        ordering = ["travel_date", "departure_time"]
        verbose_name = "班次"
        verbose_name_plural = "班次"
        constraints = [
            models.UniqueConstraint(
                fields=["train", "travel_date", "origin", "destination", "departure_time"],
                name="uniq_trip_schedule",
            )
        ]
        indexes = [
            models.Index(fields=["travel_date", "origin", "destination"]),
            models.Index(fields=["departure_time"]),
        ]

    def __str__(self):
        return f"{self.travel_date} {self.train} {self.origin}→{self.destination} {self.departure_time:%H:%M}"

    @property
    def route_label(self):
        return f"{self.origin.name} → {self.destination.name}"

    @property
    def duration_label(self):
        hours, minutes = divmod(self.duration_min, 60)
        if hours and minutes:
            return f"{hours} 小時 {minutes} 分"
        if hours:
            return f"{hours} 小時"
        return f"{minutes} 分"

    @property
    def is_sold_out(self):
        return self.available_seats <= 0

    @property
    def is_bookable(self):
        return self.status == "scheduled" and self.available_seats > 0

    def get_absolute_url(self):
        return reverse("railway:booking_carriage", args=[self.pk])


class CarriageType(models.Model):
    code = models.CharField("代碼", max_length=20, unique=True)
    name = models.CharField("車廂名稱", max_length=40)
    description = models.TextField("說明", blank=True)
    surcharge = models.PositiveIntegerField("加價金額", default=0)
    is_active = models.BooleanField("啟用", default=True)
    sort_order = models.PositiveIntegerField("排序", default=0)

    class Meta:
        ordering = ["sort_order", "code"]
        verbose_name = "車廂種類"
        verbose_name_plural = "車廂種類"

    def __str__(self):
        return self.name


class TripCarriage(models.Model):
    trip = models.ForeignKey(Trip, verbose_name="班次", on_delete=models.CASCADE, related_name="tripcarriages")
    carriage_type = models.ForeignKey(
        CarriageType, verbose_name="車廂種類", on_delete=models.PROTECT, related_name="tripcarriages"
    )
    fare = models.PositiveIntegerField("全票票價")
    total_seats = models.PositiveIntegerField("總座位數", default=0)
    available_seats = models.PositiveIntegerField("剩餘座位", default=0)

    class Meta:
        ordering = ["carriage_type__sort_order"]
        verbose_name = "班次車廂"
        verbose_name_plural = "班次車廂"
        constraints = [
            models.UniqueConstraint(fields=["trip", "carriage_type"], name="uniq_trip_carriage"),
        ]

    def __str__(self):
        return f"{self.trip} / {self.carriage_type.name}"

    @property
    def is_sold_out(self):
        return self.available_seats <= 0


class TicketType(models.Model):
    code = models.CharField("代碼", max_length=20, unique=True)
    name = models.CharField("票種名稱", max_length=40)
    description = models.TextField("說明", blank=True)
    eligibility = models.TextField("適用資格", blank=True)
    discount_percent = models.PositiveSmallIntegerField("票價百分比", default=100)
    requires_document = models.BooleanField("需要證件", default=False)
    is_active = models.BooleanField("啟用", default=True)
    sort_order = models.PositiveIntegerField("排序", default=0)

    class Meta:
        ordering = ["sort_order", "code"]
        verbose_name = "票種"
        verbose_name_plural = "票種"

    def __str__(self):
        return self.name

    def fare_for(self, amount):
        return int(round(amount * self.discount_percent / 100))


class FareRule(models.Model):
    origin = models.ForeignKey(Station, verbose_name="出發站", on_delete=models.PROTECT, related_name="fare_rules_from")
    destination = models.ForeignKey(
        Station, verbose_name="抵達站", on_delete=models.PROTECT, related_name="fare_rules_to"
    )
    train_type = models.ForeignKey(
        TrainType, verbose_name="車種", on_delete=models.PROTECT, null=True, blank=True, related_name="fare_rules"
    )
    full_fare = models.PositiveIntegerField("全票")
    discount_fare = models.PositiveIntegerField("優惠票", null=True, blank=True)
    student_fare = models.PositiveIntegerField("學生票", null=True, blank=True)
    senior_fare = models.PositiveIntegerField("敬老票", null=True, blank=True)
    child_fare = models.PositiveIntegerField("兒童票", null=True, blank=True)
    e_ticket_discount = models.PositiveIntegerField("電子票折扣", default=30)
    valid_from = models.DateField("生效日", null=True, blank=True)
    valid_to = models.DateField("失效日", null=True, blank=True)
    is_active = models.BooleanField("啟用", default=True)

    class Meta:
        ordering = ["origin__sort_order", "destination__sort_order", "train_type__code"]
        verbose_name = "票價規則"
        verbose_name_plural = "票價規則"

    def __str__(self):
        return f"{self.origin}→{self.destination} {self.train_type or '全部車種'}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "待付款"),
        ("paid", "已付款"),
        ("cancelled", "已取消"),
        ("used", "已使用"),
    ]
    PAYMENT_CHOICES = [
        ("credit_card", "信用卡／金融卡"),
        ("mobile_pay", "Apple Pay／Google Pay"),
        ("counter", "車站付款"),
    ]

    order_no = models.CharField("訂單編號", max_length=20, unique=True, editable=False)
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, verbose_name="會員", on_delete=models.PROTECT, related_name="bookings"
    )
    trip = models.ForeignKey(Trip, verbose_name="班次", on_delete=models.PROTECT, related_name="bookings")
    trip_carriage = models.ForeignKey(
        TripCarriage, verbose_name="車廂", on_delete=models.PROTECT, null=True, blank=True, related_name="bookings"
    )
    ticket_type = models.ForeignKey(TicketType, verbose_name="票種", on_delete=models.PROTECT, related_name="bookings")
    passenger_count = models.PositiveSmallIntegerField("乘客人數", default=1)
    unit_fare = models.PositiveIntegerField("單價")
    service_fee = models.PositiveIntegerField("服務費", default=0)
    e_ticket = models.BooleanField("使用電子票", default=False)
    e_ticket_discount = models.PositiveIntegerField("電子票折扣", default=0)
    total_amount = models.PositiveIntegerField("總金額")
    payment_method = models.CharField("付款方式", max_length=20, choices=PAYMENT_CHOICES, default="credit_card")
    payment_ref = models.CharField("付款參考", max_length=50, blank=True)
    status = models.CharField("訂單狀態", max_length=20, choices=STATUS_CHOICES, default="paid")
    qr_token = models.UUIDField("QR token", default=uuid.uuid4, unique=True, editable=False)
    contact_phone = models.CharField("聯絡手機", max_length=20, blank=True)
    contact_email = models.EmailField("聯絡信箱", blank=True)
    created_at = models.DateTimeField("建立時間", auto_now_add=True)
    paid_at = models.DateTimeField("付款時間", null=True, blank=True)
    cancelled_at = models.DateTimeField("取消時間", null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "訂單"
        verbose_name_plural = "訂單"
        indexes = [models.Index(fields=["member", "-created_at"])]

    def __str__(self):
        return self.order_no

    def save(self, *args, **kwargs):
        if not self.order_no:
            date_part = (self.trip.travel_date if self.trip_id else timezone.localdate()).strftime("%Y%m%d")
            for _ in range(20):
                candidate = f"T{date_part}-{secrets.randbelow(9000) + 1000}"
                if not Booking.objects.filter(order_no=candidate).exists():
                    self.order_no = candidate
                    break
            else:
                self.order_no = f"T{date_part}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    @property
    def status_label(self):
        return self.get_status_display()

    @property
    def is_cancellable(self):
        if self.status not in {"pending", "paid"}:
            return False
        now = timezone.localtime()
        if self.trip.travel_date > now.date():
            return True
        return self.trip.travel_date == now.date() and self.trip.departure_time > now.time()

    def get_absolute_url(self):
        return reverse("railway:booking_complete", args=[self.order_no])


class Passenger(models.Model):
    booking = models.ForeignKey(Booking, verbose_name="訂單", on_delete=models.CASCADE, related_name="passengers")
    name = models.CharField("姓名", max_length=60)
    id_number = models.CharField("身分證字號", max_length=10, validators=[id_number_validator])
    birth_date = models.DateField("出生日期", null=True, blank=True)
    phone = models.CharField("手機號碼", max_length=20, validators=[phone_validator])
    email = models.EmailField("電子郵件", blank=True)
    is_primary = models.BooleanField("主要乘車人", default=False)
    created_at = models.DateTimeField("建立時間", auto_now_add=True)

    class Meta:
        ordering = ["-is_primary", "id"]
        verbose_name = "乘車人"
        verbose_name_plural = "乘車人"

    def __str__(self):
        return f"{self.name} ({self.id_number})"


class SavedPassenger(models.Model):
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, verbose_name="會員", on_delete=models.CASCADE, related_name="saved_passengers"
    )
    name = models.CharField("姓名", max_length=60)
    id_number = models.CharField("身分證字號", max_length=10, validators=[id_number_validator])
    birth_date = models.DateField("出生日期", null=True, blank=True)
    phone = models.CharField("手機號碼", max_length=20, validators=[phone_validator])
    email = models.EmailField("電子郵件", blank=True)
    is_default = models.BooleanField("預設乘車人", default=False)
    created_at = models.DateTimeField("建立時間", auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]
        verbose_name = "常用乘車人"
        verbose_name_plural = "常用乘車人"

    def __str__(self):
        return f"{self.name} / {self.member}"


class Announcement(models.Model):
    KIND_CHOICES = [
        ("info", "一般資訊"),
        ("warn", "重要提醒"),
        ("ok", "正面訊息"),
    ]
    title = models.CharField("標題", max_length=120)
    body = models.TextField("內容")
    kind = models.CharField("類型", max_length=10, choices=KIND_CHOICES, default="info")
    is_active = models.BooleanField("啟用", default=True)
    starts_at = models.DateTimeField("開始時間", null=True, blank=True)
    ends_at = models.DateTimeField("結束時間", null=True, blank=True)
    created_at = models.DateTimeField("建立時間", auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "公告"
        verbose_name_plural = "公告"

    def __str__(self):
        return self.title

    @property
    def is_current(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.starts_at and self.starts_at > now:
            return False
        if self.ends_at and self.ends_at < now:
            return False
        return True


class ServiceStatus(models.Model):
    SYSTEM_CHOICES = [
        ("booking", "線上訂票"),
        ("ticketing", "取票服務"),
        ("website", "網站服務"),
    ]
    STATUS_CHOICES = [
        ("normal", "正常"),
        ("maintenance", "維護中"),
        ("degraded", "部分異常"),
    ]
    system = models.CharField("系統", max_length=20, choices=SYSTEM_CHOICES)
    status = models.CharField("狀態", max_length=20, choices=STATUS_CHOICES, default="normal")
    message = models.TextField("說明", blank=True)
    expected_recovery_at = models.DateTimeField("預計恢復時間", null=True, blank=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)
    is_active = models.BooleanField("啟用", default=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "服務狀態"
        verbose_name_plural = "服務狀態"

    def __str__(self):
        return f"{self.get_system_display()}：{self.get_status_display()}"


class FavoriteRoute(models.Model):
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, verbose_name="會員", on_delete=models.CASCADE, related_name="favorite_routes"
    )
    origin = models.ForeignKey(Station, verbose_name="出發站", on_delete=models.CASCADE, related_name="+")
    destination = models.ForeignKey(Station, verbose_name="抵達站", on_delete=models.CASCADE, related_name="+")
    created_at = models.DateTimeField("建立時間", auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "常用路線"
        verbose_name_plural = "常用路線"
        constraints = [
            models.UniqueConstraint(fields=["member", "origin", "destination"], name="uniq_favorite_route"),
        ]

    def __str__(self):
        return f"{self.member}: {self.origin}→{self.destination}"
