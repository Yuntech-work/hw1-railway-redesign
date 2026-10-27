from django.contrib.auth import views as auth_views
from django.urls import path

from . import views
from .forms import LoginForm

app_name = "railway"

urlpatterns = [
    path("", views.home, name="home"),
    path("search/", views.search_form, name="search"),
    path("search/results/", views.search_results, name="results"),
    path("compare/", views.compare, name="compare"),
    path("fares/", views.fares, name="fares"),
    path("booking/<int:trip_id>/carriage/", views.booking_carriage, name="booking_carriage"),
    path("booking/<int:trip_id>/ticket/", views.booking_ticket, name="booking_ticket"),
    path("booking/<int:trip_id>/passenger/", views.booking_passenger, name="booking_passenger"),
    path("booking/complete/<str:order_no>/", views.booking_complete, name="booking_complete"),
    path("booking/<str:order_no>/qr.svg", views.booking_qr, name="booking_qr"),
    path("booking/<str:order_no>/cancel/", views.cancel_booking_view, name="cancel_booking"),
    path("status/", views.status_page, name="status"),
    path("api/stations/", views.station_search, name="station_search"),
    path("healthz/", views.health, name="health"),
    path(
        "accounts/login/",
        auth_views.LoginView.as_view(
            template_name="railway/login.html",
            authentication_form=LoginForm,
            redirect_authenticated_user=True,
        ),
        name="login",
    ),
    path("accounts/logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("accounts/signup/", views.signup, name="signup"),
    path("my/bookings/", views.my_bookings, name="my_bookings"),
    path("my/profile/", views.profile, name="profile"),
]
