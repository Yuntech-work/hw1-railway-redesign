# 介面設計 HW1｜Bad UI 案例分析與重新設計

案例網站：**國營臺灣鐵路股份有限公司 官方網站** — https://www.railway.gov.tw/

> **期中專題後端已加入**：本專案現在同時包含原本的靜態 redesign 原型，以及可操作的 **Django + Neon PostgreSQL** 前後台。
>
> - 前台：`/`（Django 樣板沿用 `prototype/styles.css`）
> - 後台：`/admin/`
> - 測試會員：`user / user123`
> - 測試管理員：`admin / admin123`
> - 後端說明：`docs/BACKEND.md`
> - Render 前台：部署後填入
> - Render 後台：部署後填入


## 交付物

| 檔案 | 說明 |
|---|---|
| `output/介面設計_HW1_台鐵BadUI案例分析與重新設計.docx` | 正式報告（38 頁，含 26 個表格與 19 張圖） |
| `output/介面設計_HW1_台鐵BadUI案例分析與重新設計.pdf` | 同份報告的 PDF 版本 |

## 專案結構

```
hw1/
├── output/          ← 最終交付的 Word 與 PDF
├── assets/
│   ├── badui/       ← 7 張 Bad UI 原始介面截圖（實際開啟網站擷取）
│   └── redesign/    ← 12 張 Redesign 分鏡圖（由下方原型產生）
├── prototype/       ← 高保真 HTML 原型（可互動點擊）
│   ├── index.html
│   ├── styles.css   ← Design System：色彩 / 字體 / 按鈕 / 導覽 / 版面
│   ├── screens.js   ← 12 個分鏡畫面模板
│   └── app.js       ← 共用外殼與路由
└── build/
    ├── server.js        ← 本機靜態伺服器（供原型截圖）
    ├── report.js        ← Word 報告產生器（docx-js）
    ├── topdf.ps1        ← 以 Word COM 轉 PDF
    ├── lighthouse-badui.json  ← Bad UI 頁面的 Lighthouse 原始結果
    └── pdfrender/       ← PDF 轉圖片檢視工具
```

## 開啟互動原型

```powershell
node build\server.js
# 瀏覽 http://localhost:8899/prototype/index.html
```

分鏡導覽（頁面底部）：Flow A `1–4`、Flow B `5–7`、Flow C `8–11`、支援畫面 `12`。

## 重新產出報告

```powershell
npm install                 # 需 docx
node build\report.js
powershell -ExecutionPolicy Bypass -File build\topdf.ps1
```

## 作業對應

| 章節 | 內容 | 對應檔案 |
|---|---|---|
| I | Bad UI Case 選擇＋7 張截圖 | `assets/badui/` |
| II | 8 項問題分析＋Lighthouse 數據 | `build/lighthouse-badui.json` |
| III | 3 類 Target User＋3 位 Persona | 報告 3.1–3.4 |
| IV | 8 則 User Story＋N1–N8 需求 | 報告 4 |
| V | 3 個 Scenario | 報告 5 |
| VI | 3 組 User Flow（含異常分支） | 報告 6.1–6.3 |
| VII | Design System＋12 張分鏡圖 | `assets/redesign/`、`prototype/` |
| VIII | AI 對照分析＋5 則 Prompt 紀錄 | 報告 8 |
| IX | 組員貢獻（分工與貢獻比例） | 報告 9 |

## 部署到雲端（讓大家都能檢視）

本專案為純靜態網站（HTML / CSS / JS），不需後端或資料庫，可部署到任何靜態託管服務。

### 方式一：GitHub Pages（免費、推薦）
1. 將專案推上 GitHub（建議以 `deploy/` 為發佈目錄）。
2. Repo → Settings → Pages → Source 選「GitHub Actions」。
3. 推送後 `.github/workflows/deploy-pages.yml` 會自動把 `deploy/` 發佈。
4. 完成後網址為 `https://<帳號>.github.io/<repo>/`。

亦可直接以 `deploy/` 資料夾作為 Pages 的發佈來源（Settings → Pages → Deploy from a branch → `/deploy`）。

### 方式二：Vercel（最簡單，拖曳即可）
1. 登入 https://vercel.com → Add New → Project → Import Git Repository，或直接拖曳 `deploy/` 資料夾。
2. Framework Preset 選「Other」，Build Command 留空，Output Directory 填 `deploy`（或拖曳時自動）。
3. 部署完成即取得 `https://<專案>.vercel.app`，每次 push 自動重新部署。

### 方式三：Netlify
1. 登入 https://app.netlify.com → Add new site → Deploy manually，拖曳 `deploy/` 資料夾。
2. 或連結 Git Repo，Build command 留空、Publish directory 填 `deploy`。
3. `deploy/_redirects` 已設定 SPA fallback。

### 方式四：Cloudflare Pages
1. 登入 Cloudflare Dashboard → Pages → Create a project → Connect to Git。
2. Build command 留空，Build output directory 填 `deploy`。

### 方式五：Render / Firebase Hosting / Surge.sh
- Render：Static Site，Publish Directory `deploy`。
- Firebase：`firebase init hosting`，public 目錄指向 `deploy`。
- Surge：`npx surge deploy`（於 `deploy/` 目錄執行）。

### 本機預覽
```powershell
node build\server.js
# 瀏覽 http://localhost:8899/prototype/index.html
# （根路徑 / 會自動導向原型頁面，但建議直接開啟上述網址）
```

### 部署前檢查清單
- [ ] `deploy/` 與 `prototype/` 內容同步（修改原型後請重新複製）
- [ ] 手機 / 平板檢視（已加入 RWD 與大字模式）
- [ ] 鍵盤操作與螢幕閱讀器（skip link、focus 管理已加入）
- [ ] Lighthouse 檢測（建議 Performance / Accessibility / Best Practices / SEO 均 ≥ 90）

## 生成式 AI 使用聲明

報告內附有「生成式 AI 使用聲明」獨立頁（第 2 頁），列出工具名稱（Claude、OpenCode）、各工具的使用範圍與人工覆核方式；第 II、III、IV、VII、VIII 節另以綠框「生成式 AI 使用標注」標示該章節由 AI 協助的內容。資料定義於 `build/report.js` 的 `AI_TOOLS` 與 `AI_STATEMENT`。

---

## 期中專題後端（Django + Neon PostgreSQL）

### 技術棧

- Django 5.2 + Gunicorn + WhiteNoise
- Neon PostgreSQL 18（production branch）
- psycopg2-binary（本機 psycopg3 對 Neon TLS 交握會失敗，已改用 psycopg2）
- Render Web Service（Singapore / Free）
- 前端沿用 `prototype/styles.css` 的 Design System，改成 Django server-rendered templates

### 本機啟動

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# Neon 專案已連結；若尚未連結：
neon init -y --no-agent-setup --org-id org-fancy-water-62001387 --project-id wild-shape-74199559 --branch production --services postgres
neon deploy

.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_demo
npm run build
npm start
# http://127.0.0.1:8000/
```

### 測試帳號

| 角色 | 帳號 | 密碼 | 入口 |
|---|---|---|---|
| 會員 | `user` | `user123` | `/accounts/login/` |
| 管理員 | `admin` | `admin123` | `/admin/` |

### 主要路由

- `/` 首頁（`?mode=large` 大字、`?mode=novice` 新手導引）
- `/search/` 查詢表單、`/search/results/` 結果與篩選
- `/compare/` 班次比較
- `/fares/` 票價與優惠
- `/booking/<trip_id>/carriage/` → `/ticket/` → `/passenger/` → `/booking/complete/<order_no>/`
- `/status/` 服務狀態（`?demo=maintenance` 預覽維護）
- `/my/bookings/`、`/my/profile/`
- `/admin/` Django 管理後台
- `/api/stations/?q=` 車站 autocomplete
- `/healthz/` 健康檢查

### 建置與測試

```powershell
npm run build
npm test
.\.venv\Scripts\python.exe scripts\smoke_test.py
```

`npm run build` 會執行 `manage.py check` 與 `collectstatic`；`npm test` 使用 Neon 測試資料庫（`--keepdb`）；`scripts/smoke_test.py` 會實際登入、查詢、訂票、產生 QR code、登入管理後台並查詢 Neon。

### Neon 與 MCP

- 專案層 MCP：`opencode.json`
  - `Neon`：`https://mcp.neon.tech/mcp?projectId=wild-shape-74199559`（OAuth）
  - `render`：`https://mcp.render.com/mcp`（重新啟動 OpenCode 後授權）
- `neon.ts`：Neon config-as-code，`neon deploy` 套用。
- `.env.local`、`.neon` 已在 `.gitignore`，不進版控。
- 詳細架構與資料模型：`docs/BACKEND.md`
- AI Prompt 紀錄位置：`docs/AI_PROMPTS.md`

### Render 部署

`render.yaml` 已建立並通過 `render blueprints validate`：

- Web Service：`railway-redesign`
- Build：`pip install -r requirements.txt` → `collectstatic` → `migrate` → `seed_demo`
- Start：`gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- Health check：`/healthz/`
- 必要環境變數：`DATABASE_URL`、`SECRET_KEY`、`ALLOWED_HOSTS`、`CSRF_TRUSTED_ORIGINS`

部署後前台與後台網址會補在本節與報告中。