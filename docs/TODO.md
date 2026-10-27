# 待辦清單（期中專題後續）

> 目前狀態：前台、後台、Neon 資料庫、Render 部署與 smoke test 均已完成。以下為可選的維運與繳交收尾項目。

## 高優先

- [ ] **GitHub Actions + Render Deploy Hook 自動部署**
  - 在 Render Dashboard → `railway-redesign` → **Settings → Deploy Hook** 建立 hook，複製 URL。
  - 在 GitHub repo → **Settings → Secrets and variables → Actions** 新增 secret：`RENDER_DEPLOY_HOOK_URL`。
  - 新增 `.github/workflows/render-deploy.yml`：push 到 `main` 時以 `curl` 呼叫 hook。
  - 驗證：push 一個空 commit，Render 部署列表應出現 `trigger = deploy_hook` 的新部署。
  - 注意：deploy hook URL 視同密碼，只能放在 GitHub Secret，不可寫進 repo。
  - 背景：Render 的 GitHub 連結目前未觸發自動部署（已用 `ead1b97`、`95e759e` 空 commit 實測），因此改用 deploy hook 較可靠。

## 中優先

- [ ] 補齊 `docs/AI_PROMPTS.md` 的 12 組 AI 對話截圖（需實際操作畫面，不可用文字代替）。
- [ ] 重啟 OpenCode 後驗證 Render MCP（已改為 OAuth）可用 `list_workspaces`。
- [ ] 若自動部署上線，確認線上 commit 與 GitHub `main` HEAD 一致。

## 低優先

- [ ] 冷啟動因應：在報告註明 Render 免費方案首次開啟需 30–60 秒；或設定 uptime 監控每 10 分鐘 ping `/healthz/`。
- [ ] 評估是否清除兩個測試用的空 commit（`ead1b97`、`95e759e`）以保持歷史乾淨；清除需 force push，非必要不建議。
