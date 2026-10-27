from django.utils import timezone

from .models import ServiceStatus


def global_context(request):
    service_status = (
        ServiceStatus.objects.filter(system="booking", is_active=True).order_by("-updated_at").first()
    )
    font_scale = "normal"
    if request.GET.get("mode") == "large":
        font_scale = "lg"
    elif request.user.is_authenticated and getattr(request.user, "preferred_font_scale", "normal") == "lg":
        font_scale = "lg"

    return {
        "service_status": service_status,
        "font_scale": font_scale,
        "current_year": timezone.localdate().year,
        "nav_name": getattr(request.resolver_match, "url_name", ""),
    }
