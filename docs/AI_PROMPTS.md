# AI Prompt 使用紀錄（期中專題）

> 報告要求至少 10 組，且每組需有「AI 對話截圖、使用目的、AI 回覆與結果、實際應用成果」。
> 下方是本次後端開發實際使用的 Prompt 與落地位置；**截圖請補上你與 OpenCode／Claude 的實際對話畫面**，請勿用文字紀錄取代截圖。

| # | Prompt（實際輸入摘要） | 使用目的 | AI 回覆／結果 | 實際應用成果 | 截圖 |
|---|---|---|---|---|---|
| 1 | 「根據期中專題報告要求完成後端系統，並依目前 redesign UI 設計；先規劃步驟再開工。並幫我安裝 Neon MCP。」 | 確認專題範圍與技術方向 | 提出 Django + Neon + Render 的架構、資料模型與施工順序 | `README.md` 的後端章節、`docs/BACKEND.md` | 待補 |
| 2 | 「會員帳號 user／密碼 user123；管理員 admin／admin123；Render 用 A 方案；安裝 Render OpenCode MCP。」 | 設定驗收帳號與部署方式 | 建立 `seed_demo` 測試帳號、Render CLI／MCP 安裝流程 | `/accounts/login/`、`/admin/`、`render.yaml` | 待補 |
| 3 | 「Neon CLI 尚未登入，請完成 login／init／deploy。」 | 建立雲端 PostgreSQL | 完成 Neon 專案連結、`.env.local`、`neon.ts`、MCP 設定 | Neon `production` branch、`opencode.json` | 待補 |
| 4 | 「請設計 Django models：會員、車站、車種、班次、車廂、票種、票價、訂單、乘車人、公告、服務狀態。」 | 將 redesign 畫面轉成資料模型 | 產生 `railway/models.py` 與 migration | `railway/migrations/0001_initial.py` | 待補 |
| 5 | 「把現有 redesign 的 HTML/CSS 改成 Django templates，保留大字模式與無障礙。」 | 前台整合 | 建立 `templates/base.html`、首頁、查詢、結果、票價、訂票流程模板 | 前台 `/`、`/search/`、`/fares/` | 待補 |
| 6 | 「實作多條件查詢：車站、日期、時段、車種、優惠、座位、寵物、票價排序、分頁。」 | 滿足「多元資料查詢／篩選」要求 | 產生 `services.search_trips()` 與結果頁 filter chips | `/search/results/?from=臺北&to=臺中&discount=1` | 待補 |
| 7 | 「實作會員登入前後差異：訪客可查詢，登入才能訂票；會員要有我的訂票與常用乘車人。」 | 滿足會員功能要求 | `login_required`、`SavedPassenger`、`my_bookings`、`profile` | `/my/bookings/`、`/my/profile/` | 待補 |
| 8 | 「訂票流程要有車廂、票種、乘車人三步，並避免超賣。」 | 訂票與交易安全 | `create_booking()` 使用 `transaction.atomic` + `select_for_update`；取消退座 | `/booking/<id>/carriage/` 到完成頁 | 待補 |
| 9 | 「建立 Django Admin，管理會員權限、班次、票價、訂單、公告；訂單要能取消並退座。」 | 滿足後台管理要求 | 自訂 `MemberAdmin`、`BookingAdmin`、`TripAdmin`、actions | `/admin/` 後台 | 待補 |
| 10 | 「幫我寫 Neon + Django 的建置、測試與 Render 部署，並證明前後台可用。」 | 驗收與部署 | `npm run build`、13 個 Django tests、`smoke_test.py`、`render.yaml` | 測試輸出、Render 前台／後台連結 | 待補 |
| 11 | 「本機 psycopg3 連 Neon 一直被 TLS 中斷，請診斷。」 | 排錯 | 改用 `psycopg2-binary` 後成功連線 PostgreSQL 18.6 | `requirements.txt`、`settings.py` | 待補 |
| 12 | 「Render MCP 與 Neon MCP 要安裝到這個專案。」 | 安裝 MCP | Neon 專案層 MCP、Render plugin／skills／MCP 設定 | `opencode.json`、`~/.config/opencode/skills/render-*` | 待補 |

## 截圖建議

1. OpenCode 對話中輸入 Prompt 的畫面（含時間／模型名稱）。
2. AI 回覆的程式碼或指令片段。
3. 對應的網站畫面：首頁、查詢結果、訂票完成、`/admin/`。
4. 終端機輸出：`npm run build`、`npm test`、`scripts/smoke_test.py`。
5. Neon Console 的 `production` branch 與資料表。
6. Render Dashboard 的服務與環境變數（遮蔽 `DATABASE_URL` 密碼）。

> 提醒：報告中的截圖必須與實際開發過程一致；本文件只提供 Prompt 與成果對照，不代替截圖。
