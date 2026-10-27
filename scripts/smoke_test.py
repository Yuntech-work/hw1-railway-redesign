"""End-to-end smoke test for the local Django server.

Run with the project virtualenv:
    .\\.venv\\Scripts\\python.exe scripts\\smoke_test.py

It exercises the same HTTP flow a browser uses: CSRF login, search, carriage,
ticket, passenger, booking completion, QR code, and Django admin login.
"""

from __future__ import annotations

import html
import http.cookiejar
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from django.db import connection  # noqa: E402

from railway.models import Booking, Member  # noqa: E402

BASE_URL = os.getenv("SMOKE_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
MEMBER_USER = os.getenv("SMOKE_MEMBER_USER", "user")
MEMBER_PASS = os.getenv("SMOKE_MEMBER_PASS", "user123")
ADMIN_USER = os.getenv("SMOKE_ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("SMOKE_ADMIN_PASS", "admin123")


class Browser:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def get(self, path):
        response = self.opener.open(f"{BASE_URL}{path}", timeout=30)
        body = response.read().decode("utf-8", "replace")
        return response.geturl(), response.status, body

    def post(self, path, data):
        payload = urllib.parse.urlencode(data, doseq=True).encode("utf-8")
        request = urllib.request.Request(
            f"{BASE_URL}{path}",
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded", "Referer": f"{BASE_URL}{path}"},
        )
        response = self.opener.open(request, timeout=30)
        body = response.read().decode("utf-8", "replace")
        return response.geturl(), response.status, body

    def csrf(self, body):
        match = re.search(r'name="csrfmiddlewaretoken" value="([^"]+)"', body)
        if not match:
            raise AssertionError("找不到 CSRF token")
        return html.unescape(match.group(1))


def check(label, condition, detail=""):
    print(f"{'PASS' if condition else 'FAIL'}  {label}{(' — ' + detail) if detail else ''}")
    if not condition:
        raise SystemExit(1)


def main():
    browser = Browser()

    for path in ("/", "/search/", "/search/results/", "/fares/", "/status/", "/accounts/login/", "/accounts/signup/"):
        url, status, body = browser.get(path)
        check(f"GET {path}", status == 200 and len(body) > 1000, f"{status} {url}")

    _, _, login_page = browser.get("/accounts/login/")
    token = browser.csrf(login_page)
    final_url, status, body = browser.post(
        "/accounts/login/",
        {"username": MEMBER_USER, "password": MEMBER_PASS, "csrfmiddlewaretoken": token, "next": "/my/bookings/"},
    )
    check("會員登入", status == 200 and "我的訂票" in body, final_url)

    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    results_path = "/search/results/?" + urllib.parse.urlencode(
        {"from": "臺北", "to": "臺中", "date": tomorrow, "start": "06:00", "end": "23:59"}
    )
    _, status, results_page = browser.get(results_path)
    links = re.findall(r'href="(/booking/(\d+)/carriage/[^"]*)"', results_page)
    check("查詢結果含可訂班次", status == 200 and bool(links), f"{len(links)} 個訂票連結")
    carriage_path = html.unescape(links[0][0])

    _, status, carriage_page = browser.get(carriage_path)
    carriage_id = re.search(r'name="carriage_id" value="(\d+)"', carriage_page)
    check("車廂頁面", status == 200 and bool(carriage_id), f"{carriage_id.group(1) if carriage_id else 'no carriage'}")
    token = browser.csrf(carriage_page)
    final_url, status, ticket_page = browser.post(
        carriage_path,
        {"carriage_id": carriage_id.group(1), "csrfmiddlewaretoken": token},
    )
    ticket_id = re.search(r'name="ticket_type" value="(\d+)"', ticket_page)
    check("票種頁面", status == 200 and bool(ticket_id), final_url)

    token = browser.csrf(ticket_page)
    final_url, status, passenger_page = browser.post(
        final_url.replace(BASE_URL, ""),
        {
            "ticket_type": ticket_id.group(1),
            "passenger_count": "1",
            "terms": "on",
            "csrfmiddlewaretoken": token,
        },
    )
    check("乘車人頁面", status == 200 and "填寫乘車人資料" in passenger_page, final_url)

    token = browser.csrf(passenger_page)
    final_url, status, complete_page = browser.post(
        final_url.replace(BASE_URL, ""),
        {
            "form-TOTAL_FORMS": "1",
            "form-INITIAL_FORMS": "0",
            "form-MIN_NUM_FORMS": "0",
            "form-MAX_NUM_FORMS": "1000",
            "form-0-name": "煙霧測試旅客",
            "form-0-id_number": "A123456789",
            "form-0-phone": "0912-345-678",
            "form-0-email": "smoke@example.com",
            "payment_method": "credit_card",
            "csrfmiddlewaretoken": token,
        },
    )
    order_match = re.search(r"#(T[\w-]+)", complete_page)
    check("訂票完成頁", status == 200 and "訂票完成" in complete_page and bool(order_match), final_url)
    order_no = order_match.group(1)

    booking = Booking.objects.get(order_no=order_no)
    check("訂單已寫入 Neon", booking.member.username == MEMBER_USER and booking.total_amount > 0, f"{order_no} ${booking.total_amount}")

    _, status, qr = browser.get(f"/booking/{order_no}/qr.svg")
    check("QR code", status == 200 and "<svg" in qr, f"{len(qr)} bytes")

    admin = Browser()
    _, _, admin_login = admin.get("/admin/login/")
    token = admin.csrf(admin_login)
    final_url, status, admin_page = admin.post(
        "/admin/login/",
        {"username": ADMIN_USER, "password": ADMIN_PASS, "csrfmiddlewaretoken": token, "next": "/admin/"},
    )
    check("管理員登入", status == 200 and "管理後台" in admin_page, final_url)
    _, status, booking_admin = admin.get("/admin/railway/booking/")
    check("管理員可查看訂單", status == 200 and order_no in booking_admin, "/admin/railway/booking/")

    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database(), current_user, version()")
        database, user, version = cursor.fetchone()
    check("資料庫連線", connection.vendor == "postgresql", f"{database} / {user}")
    check("Neon PostgreSQL 版本", "PostgreSQL" in version, version.split(" on ")[0])
    check("會員資料存在", Member.objects.filter(username=MEMBER_USER).exists(), MEMBER_USER)

    print("\nSMOKE TEST OK")
    print(f"訂單：{order_no}｜金額：${booking.total_amount}｜狀態：{booking.get_status_display()}")
    print(f"資料庫：{database}（{user}）")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\nSMOKE TEST FAILED: {exc}", file=sys.stderr)
        raise
