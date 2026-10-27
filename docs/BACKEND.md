# 期中專題後端｜Django × Neon PostgreSQL

本文件說明 `railway/` Django 後端、資料模型、路由、Neon 連線與部署方式。原有 `prototype/`、`deploy/` 保留為介面設計原型與 GitHub Pages 展示；正式可操作系統是 Django 版本。

## 1. 技術架構

```text
Browser
  │ HTML / CSS / Vanilla JS
  ▼
Django 5.2（Render Web Service）
  ├─ 前台 Views + Templates（沿用 prototype/styles.css）
  ├─ Session 會員登入 / CSRF
  ├─ Django Admin（/admin/）
  └─ ORM（psycopg2）
        │
        ▼
Neon PostgreSQL 18（production branch）
```

- 前台與後台使用同一個 Django ORM／Neon 資料庫。
- 正式環境使用 Render + Gunicorn + WhiteNoise；本機使用 `runserver`。
- 付款流程為課程 Demo 的模擬付款，不會傳送或儲存信用卡資料。
- 電子票 QR code 由 `qrcode` 即時產生 SVG，不需要媒體檔案儲存。

## 2. 資料模型

| Model | 說明 |
|---|---|
| `Member` | 自訂會員（繼承 `AbstractUser`），含手機、生日、身分證、字級偏好、會員等級 |
| `Station` | 車站代碼、名稱、英文名、城市 |
| `TrainType` | 自強號、莒光號、區間車、普悠瑪、太魯閣 |
| `Train` | 車次、車種、經由、行駛時間、寵物／餐車 |
| `Trip` | 某日某區間班次、起訖時間、票價、座位數、狀態、建議班次 |
| `CarriageType` | 標準自由座、標準指定座、Coleman、商務車廂 |
| `TripCarriage` | 班次 × 車廂的票價與剩餘座位 |
| `TicketType` | 全票、優惠票、敬老、學生、兒童、愛心票 |
| `FareRule` | 區間票價規則與電子票折扣 |
| `Booking` | 訂單、會員、班次、車廂、票種、金額、付款、狀態、QR token |
| `Passenger` | 訂單乘車人資料 |
| `SavedPassenger` | 會員常用乘車人，下次訂票自動帶入 |
| `Announcement` | 首頁與服務頁公告 |
| `ServiceStatus` | 訂票／取票／網站系統狀態 |
| `FavoriteRoute` | 會員常用路線（預留） |

### 訂票交易

`railway/services.py` 的 `create_booking()` 使用：

```python
with transaction.atomic():
    trip = Trip.objects.select_for_update().get(...)
    carriage = TripCarriage.objects.select_for_update().get(...)
    # 檢查剩餘座位、建立 Booking + Passenger、扣減座位
```

取消訂單會以 `select_for_update()` 鎖定訂單與班次，將座位加回，避免重複退座。

## 3. 路由與功能

| 路由 | 功能 |
|---|---|
| `/` | 首頁、任務卡、公告、快速查詢；`?mode=large` 大字、`?mode=novice` 新手導引 |
| `/search/` | 訂票查詢表單、車站 autocomplete、交換站、日期與時段 |
| `/search/results/` | 班次列表、車種／優惠／座位／寵物篩選、票價排序、分頁、勾選比較 |
| `/compare/` | 2–3 班次並排比較 |
| `/fares/` | 票價規則與票種資格 |
| `/booking/<trip_id>/carriage/` | 車廂選擇 |
| `/booking/<trip_id>/ticket/` | 票種、乘客人數、電子票、條款 |
| `/booking/<trip_id>/passenger/` | 乘車人 formset、付款方式、建立訂單 |
| `/booking/complete/<order_no>/` | 訂單明細與 QR code |
| `/booking/<order_no>/qr.svg` | 電子票 QR code（SVG） |
| `/status/` | 服務狀態、替代通路、客服；`?demo=maintenance` 預覽維護畫面 |
| `/accounts/login/`、`/accounts/signup/`、`/accounts/logout/` | 會員登入註冊登出 |
| `/my/bookings/` | 會員訂票紀錄、取消訂票 |
| `/my/profile/` | 會員資料與常用乘車人 |
| `/admin/` | Django 管理後台 |
| `/api/stations/?q=` | 車站 autocomplete JSON |
| `/healthz/` | Render 健康檢查（含 DB 查詢） |

### 登入前後差異

- 訪客：可查詢班次、票價、比較、服務狀態；訂票會被導向登入頁。
- 會員：可訂票、查看電子票、我的訂票、取消訂票、個人資料、常用乘車人自動帶入。
- 管理員：可進入 `/admin/` 管理會員、車站、班次、票價、訂單、公告與服務狀態。

## 4. 本機啟動

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# Neon CLI 會產生 .env.local（DATABASE_URL / DATABASE_URL_UNPOOLED / NEON_BRANCH）
neon init -y --no-agent-setup --org-id <ORG_ID> --project-id <PROJECT_ID> --branch production --services postgres
neon deploy

.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_demo
npm run build
npm start
# http://127.0.0.1:8000/
```

> 本機若沒有 `DATABASE_URL`，`config/settings.py` 會退回 SQLite，僅作為緊急啟動用途；驗收請確認 `connection.vendor == "postgresql"`。

## 5. 測試與驗證

```powershell
npm run build          # manage.py check + collectstatic
npm test               # Django TestCase（Neon test database，--keepdb）
.\.venv\Scripts\python.exe scripts\smoke_test.py
```

`scripts/smoke_test.py` 會實際走一次瀏覽器流程：

1. 訪客 GET 公開頁面。
2. 會員 `user / user123` 登入。
3. 查詢明日臺北→臺中班次。
4. 選車廂、票種、填乘車人、建立訂單。
5. 讀取完成頁與 QR code。
6. 管理員 `admin / admin123` 登入 `/admin/` 並查看訂單。
7. 直接查詢 Neon `current_database()`、`current_user`、PostgreSQL 版本。

## 6. Neon 與 MCP

- 專案層 OpenCode MCP 設定：`opencode.json`
  - `Neon`：`https://mcp.neon.tech/mcp?projectId=wild-shape-74199559`（OAuth）
  - `render`：`https://mcp.render.com/mcp`（OpenCode 重新啟動後授權）
- Neon 專案：`wild-shape-74199559`／branch `production`
- `neon.ts`：Neon config-as-code，使用 `neon deploy` 套用。
- `.env.local`、`.neon` 已加入 `.gitignore`，不進版控。

常用指令：

```powershell
neon status
neon env pull
neon deploy
neon psql production -c "select current_database();"
```

## 7. Render 部署

`render.yaml` 已定義：

- Web Service：`railway-redesign`（Python, Singapore, Free）
- Build：安裝套件 → `collectstatic` → `migrate` → `seed_demo`
- Start：`gunicorn config.wsgi:application`
- Health check：`/healthz/`
- 必要環境變數：`DATABASE_URL`（Neon pooled URL）、`SECRET_KEY`、`ALLOWED_HOSTS`、`CSRF_TRUSTED_ORIGINS`

部署後：

```text
前台：https://railway-redesign.onrender.com/
後台：https://railway-redesign.onrender.com/admin/
```

> Render 免費方案一段時間未使用會休眠，第一次開啟可能需要數十秒喚醒。

## 8. 已知限制

- 付款為模擬流程，未串接真實金流。
- 電子票 QR code 為課程 Demo，不會連動真實臺鐵閘門。
- 目前座位配置為整班／整車廂數量，未做到單一座位選位圖。
- 頭像、Email 通知、簡訊通知未實作；Email 使用 console backend。
