from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.core.exceptions import ValidationError
from django.utils.html import format_html

from .models import (
    Announcement,
    Booking,
    CarriageType,
    FareRule,
    FavoriteRoute,
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
from .services import cancel_booking


admin.site.site_header = "臺鐵乘車資訊服務｜管理後台"
admin.site.site_title = "臺鐵乘車資訊服務"
admin.site.index_title = "會員、班次、票價與訂單管理"


@admin.register(Member)
class MemberAdmin(UserAdmin):
    list_display = ("username", "email", "display_name", "phone", "membership_level", "is_staff", "is_active", "date_joined")
    list_filter = ("membership_level", "is_staff", "is_superuser", "is_active", "preferred_font_scale")
    search_fields = ("username", "email", "first_name", "last_name", "phone", "id_number")
    ordering = ("-date_joined",)
    fieldsets = UserAdmin.fieldsets + (
        (
            "會員資料",
            {
                "fields": (
                    "phone",
                    "birth_date",
                    "id_number",
                    "membership_level",
                    "preferred_font_scale",
                )
            },
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "會員資料",
            {
                "fields": (
                    "email",
                    "phone",
                    "birth_date",
                    "id_number",
                    "membership_level",
                    "preferred_font_scale",
                )
            },
        ),
    )

    @admin.display(description="姓名")
    def display_name(self, obj):
        return obj.display_name


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "name_en", "city", "is_active", "sort_order")
    list_filter = ("is_active", "city")
    search_fields = ("code", "name", "name_en")
    ordering = ("sort_order", "code")


@admin.register(TrainType)
class TrainTypeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "description")
    list_filter = ("category",)
    search_fields = ("code", "name")


class TripCarriageInline(admin.TabularInline):
    model = TripCarriage
    extra = 0
    autocomplete_fields = ("carriage_type",)


@admin.register(Train)
class TrainAdmin(admin.ModelAdmin):
    list_display = ("number", "train_type", "via", "duration_min", "has_pet", "has_dining", "is_active")
    list_filter = ("train_type", "has_pet", "has_dining", "is_active")
    search_fields = ("number", "via")
    autocomplete_fields = ("train_type",)


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = (
        "travel_date",
        "train",
        "route",
        "departure_time",
        "arrival_time",
        "duration_min",
        "full_fare",
        "available_seats",
        "status",
    )
    list_filter = ("travel_date", "status", "origin", "destination", "train__train_type")
    search_fields = ("train__number", "origin__name", "destination__name")
    date_hierarchy = "travel_date"
    autocomplete_fields = ("train", "origin", "destination")
    inlines = [TripCarriageInline]
    list_select_related = ("train", "origin", "destination")

    @admin.display(description="路線")
    def route(self, obj):
        return obj.route_label


@admin.register(CarriageType)
class CarriageTypeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "surcharge", "is_active", "sort_order")
    list_filter = ("is_active",)
    search_fields = ("code", "name")


@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "discount_percent", "requires_document", "is_active", "sort_order")
    list_filter = ("is_active", "requires_document")
    search_fields = ("code", "name")
    list_editable = ("is_active", "sort_order")


@admin.register(FareRule)
class FareRuleAdmin(admin.ModelAdmin):
    list_display = (
        "origin",
        "destination",
        "train_type",
        "full_fare",
        "discount_fare",
        "student_fare",
        "senior_fare",
        "e_ticket_discount",
        "is_active",
    )
    list_filter = ("is_active", "train_type", "origin", "destination")
    search_fields = ("origin__name", "destination__name")
    autocomplete_fields = ("origin", "destination", "train_type")


class PassengerInline(admin.TabularInline):
    model = Passenger
    extra = 0
    fields = ("name", "id_number", "birth_date", "phone", "email", "is_primary")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "order_no",
        "member",
        "trip",
        "ticket_type",
        "passenger_count",
        "total_amount",
        "status",
        "payment_method",
        "created_at",
    )
    list_filter = ("status", "payment_method", "ticket_type", "created_at")
    search_fields = ("order_no", "member__username", "member__email", "trip__train__number", "passengers__name")
    date_hierarchy = "created_at"
    readonly_fields = ("order_no", "qr_token", "created_at", "paid_at", "cancelled_at", "total_amount")
    autocomplete_fields = ("member", "trip", "ticket_type")
    inlines = [PassengerInline]
    list_select_related = ("member", "trip", "ticket_type")
    actions = ("mark_paid", "cancel_selected")

    @admin.display(description="電子票")
    def qr_preview(self, obj):
        if not obj.pk:
            return "-"
        return format_html('<img src="/booking/{}/qr.svg" alt="QR" style="height:90px">', obj.order_no)

    @admin.action(description="標記為已付款")
    def mark_paid(self, request, queryset):
        updated = queryset.update(status="paid")
        self.message_user(request, f"已將 {updated} 筆訂單標記為已付款。", messages.SUCCESS)

    @admin.action(description="取消訂單並釋出座位")
    def cancel_selected(self, request, queryset):
        ok = 0
        failed = 0
        for booking in queryset:
            try:
                cancel_booking(booking)
            except ValidationError:
                failed += 1
            else:
                ok += 1
        self.message_user(
            request,
            f"已取消 {ok} 筆訂單；{failed} 筆因狀態或日期限制未取消。",
            messages.SUCCESS if not failed else messages.WARNING,
        )


@admin.register(SavedPassenger)
class SavedPassengerAdmin(admin.ModelAdmin):
    list_display = ("name", "member", "phone", "email", "is_default", "created_at")
    list_filter = ("is_default",)
    search_fields = ("name", "member__username", "id_number", "phone")
    autocomplete_fields = ("member",)


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "is_active", "starts_at", "ends_at", "created_at")
    list_filter = ("kind", "is_active")
    search_fields = ("title", "body")


@admin.register(ServiceStatus)
class ServiceStatusAdmin(admin.ModelAdmin):
    list_display = ("system", "status", "message", "expected_recovery_at", "updated_at", "is_active")
    list_filter = ("system", "status", "is_active")
    search_fields = ("message",)


@admin.register(FavoriteRoute)
class FavoriteRouteAdmin(admin.ModelAdmin):
    list_display = ("member", "origin", "destination", "created_at")
    search_fields = ("member__username", "origin__name", "destination__name")
    autocomplete_fields = ("member", "origin", "destination")
