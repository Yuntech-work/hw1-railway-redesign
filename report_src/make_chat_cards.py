# -*- coding: utf-8 -*-
"""Generate OpenCode-style conversation cards for the midterm report."""
import os, html, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "report_src", "chat")
os.makedirs(OUT, exist_ok=True)

CARDS = [
    dict(
        sid="ses_e847594a3ffdr1ClFJASUDwXda",
        id="01", tag="需求規劃", title="期中專題後端需求與架構規劃",
        session="根據期中專題的報告要求完成後端系統…", time="2026/10/27 13:27",
        model="deepseek-v4.1-flash-free（Plan）",
        prompts=["幫我根據期中專題的報告要求完成後端系統，并且可以根據目前的 redesign ui 來設計。先規劃好步奏再開工。然後 neon 你可以幫我安裝 mcp 到這個專案上"],
        ai_intro="先說結論：目前 repo 只有靜態原型，沒有 Django 後端；我會以「Django 樣板沿用現有 redesign UI + Neon PostgreSQL + Django Admin + Render 部署」為主軸。",
        ai_bullets=[
            "技術架構：Browser → Django（Views／Templates／Auth／Admin／ORM）→ Neon PostgreSQL。",
            "資料模型：Member、Station、Train、Trip、TripCarriage、TicketType、FareRule、Booking、Passenger 等 15 個模型。",
            "頁面與路由：首頁、查詢、結果、比較、票價、訂票三步、完成、服務狀態、會員中心、Django Admin 共 10+ 條路由。",
            "施工順序：Neon／MCP → Django 基礎 → Model／Migration／Seed → 前台 → 會員與訂票 → Admin → 測試與部署。",
        ],
        tools=["read", "grep", "shell", "write"],
        purpose="確認專題範圍、技術選型與施工順序，避免直接動工造成架構返工。",
        result="docs/BACKEND.md、README 後端章節、railway/models.py、6 階段施工計畫",
    ),
    dict(
        sid="ses_e847594a3ffdr1ClFJASUDwXda",
        id="02", tag="環境建置", title="測試帳號、Neon 與 Render MCP 安裝",
        session="根據期中專題的報告要求完成後端系統…", time="2026/10/27 13:42",
        model="deepseek-v4.1-flash-free",
        prompts=["1. 會員帳號：user／密碼：user123；管理員帳號：admin／密碼：admin123。2. 其他：render 也有 agent，用 opencode 的這個網址 https://render.com/agents/opencode，你可以安裝這個 mcp 到這個專案上"],
        ai_intro="開工。先安裝 Neon CLI、確認登入狀態，並取得 Render MCP 的 OpenCode 安裝方式。",
        ai_bullets=[
            "Neon CLI 已安裝但尚未登入，執行 neon login 後完成專案連結；init 外掛安裝失敗時改用 --no-agent-setup 跳過。",
            "Neon MCP 已寫入專案層 opencode.json（OAuth，不把 API key 寫進 repo）。",
            "Render CLI 已安裝並完成 render login；Render MCP 以 OAuth 方式設定。",
            "建立 Django 專案與虛擬環境，開始建立資料模型、前台與種子資料。",
        ],
        tools=["shell", "write", "read"],
        purpose="建立可驗收的測試帳號與雲端工具鏈，讓後續開發、部署與資料庫操作可重現。",
        result="seed_demo 測試帳號、opencode.json、render.yaml、neon.ts、.env.local",
    ),
    dict(
        sid="ses_e847594a3ffdr1ClFJASUDwXda",
        id="03", tag="部署驗收", title="Render 部署完成與端對端 Smoke Test",
        session="根據期中專題的報告要求完成後端系統…", time="2026/10/27 14:04",
        model="deepseek-v4.1-flash-free",
        prompts=["繼續（接續完成部署與公開站驗證）"],
        ai_intro="部署與驗證全部完成。最新部署 dep-dbg3gs2jnfac73f5jt2g 已 live（commit ee10e2c）。",
        ai_bullets=[
            "公開前台 https://railway-redesign.onrender.com/、管理後台 /admin/、健康檢查 /healthz/ 均可存取。",
            "資料庫為 Neon neondb／PostgreSQL 18.6（pooler 連線）。",
            "公開站 smoke test 20 項全數 PASS，含實際訂票、QR code、後台登入與 Neon 查詢。",
            "npm run build 與 npm test 通過；Django 13 個測試 OK。",
        ],
        tools=["shell", "read", "write"],
        purpose="確認前後台與資料庫真的可用，而不是只在本機通過。",
        result="Render 前台／後台、healthz、smoke_test.py、13 個 Django tests",
    ),
    dict(
        sid="ses_e847594a3ffdr1ClFJASUDwXda",
        id="04", tag="問題診斷", title="Render MCP 與 GitHub 自動部署診斷",
        session="根據期中專題的報告要求完成後端系統…", time="2026/10/27 14:20",
        model="deepseek-v4.1-flash-free",
        prompts=["MCP 已授權（Neon, Render），render 中我看到有鏈接 github。這樣就完成了嗎？", "Render MCP 我重啓了。你再試用看看，如果沒有就用你的方法"],
        ai_intro="MCP 已通，但 Render MCP 仍回 unauthorized；我改用 REST API 繼續確認自動部署。",
        ai_bullets=[
            "服務設定顯示 autoDeploy: yes / commit，但推送兩個空 commit（ead1b97、95e759e）都沒有建立新部署。",
            "結論：Render 與 GitHub 只是關聯到 repo，push 尚未真正觸發自動部署。",
            "Render MCP 的 unauthorized 原因是 opencode.json 使用 {env:RENDER_API_KEY}，但程序沒有載入該變數，等於送空 Bearer。",
            "改為 OAuth 設定，並把 GitHub Actions + Render Deploy Hook 寫入 docs/TODO.md 待辦。",
        ],
        tools=["shell", "read", "write"],
        purpose="釐清「看起來已連結」與「實際會自動部署」的差異，避免報告與現況不一致。",
        result="docs/TODO.md、opencode.json OAuth 設定、自動部署問題紀錄",
    ),
    dict(
        sid="ses_e847594a3ffdr1ClFJASUDwXda",
        id="05", tag="雲端限制", title="Render 免費方案冷啟動與部署限制",
        session="根據期中專題的報告要求完成後端系統…", time="2026/10/27 14:26",
        model="deepseek-v4.1-flash-free",
        prompts=["rander 説會有這個限制：Your free instance will spin down with inactivity, which can delay requests by 50 seconds or more."],
        ai_intro="免費方案休眠屬正常限制，不算錯誤：閒置約 15 分鐘後實例會休眠，下一個請求需等 30–60 秒喚醒。",
        ai_bullets=[
            "醒來後功能與 Neon 資料都正常；建議在報告註明「首次開啟請稍候」。",
            "可用免費 uptime 監控每 10 分鐘 ping /healthz/，降低展示時等待時間。",
            "但自動部署其實還沒生效：推了兩個空 commit，Render 都沒有建立新部署。",
            "目前線上版本 ee10e2c 功能已是最新，smoke test 全過。",
        ],
        tools=["read", "write"],
        purpose="把平台限制轉成報告中的已知限制與展示說明，並找出自動部署的真正問題。",
        result="報告冷啟動說明、healthz 健康檢查、docs/TODO.md 低優先項目",
    ),
    dict(
        sid="ses_eabd1bb2cffeNnF1luy7p59XDG",
        id="06", tag="RWD 修正", title="手機版「出發時段」UI 跑版修正",
        session="手機頁面出發時段 UI 問題", time="2026/10/19 21:21",
        model="deepseek-v4.1-flash-free",
        prompts=["在手機頁面中，出發時段的 UI 怪怪的"],
        ai_intro="在 375px 的手機寬度下，出發時段欄位只有 144px 寬，兩個 select 各被壓縮到 56px。",
        ai_bullets=[
            "原因是 grid-template-columns:1fr 1fr 1fr 寫在 inline style，不會被 media query 覆蓋。",
            "把 A2 表單的 inline grid 改為 class（grid--stations、grid--3），讓斷點可以覆蓋。",
            "將出發時段的 flex 容器改為 .tz-selects，手機版改為垂直排列。",
            "用 375px 實際瀏覽器截圖驗證，修正後兩個 select 恢復可讀寬度。",
        ],
        tools=["browser", "read", "edit", "shell"],
        purpose="修正手機版查詢表單的實際操作問題，確保 375px 寬度仍可選取時段。",
        result="prototype/screens.js、prototype/styles.css、commit fb025af",
    ),
    dict(
        sid="ses_eabd1bb2cffeNnF1luy7p59XDG",
        id="07", tag="RWD 修正", title="其他頁面手機版跑版與結果列表修正",
        session="手機頁面出發時段 UI 問題", time="2026/10/19 21:31",
        model="deepseek-v4.1-flash-free",
        prompts=["其他頁面有些也有跑掉（手機版），幫我修正"],
        ai_intro="修復完成。除了 A2 查詢表單，A3 結果列表與首頁快速查詢也有 inline grid 造成的跑版。",
        ai_bullets=[
            "將 A3 結果列表的 inline grid 改為 grid--result class。",
            "將首頁快速查詢的 inline grid 改為 grid--2／grid--3 class。",
            "新增 .plan 手機版 flex-wrap，避免車廂選擇與票種方案卡片擠壓。",
            "共修改 screens.js 與 styles.css 兩個檔案，30 行新增、6 行刪除。",
        ],
        tools=["browser", "read", "edit", "shell"],
        purpose="一次修完所有已知手機版跑版頁面，避免只修單頁造成不一致。",
        result="commit fb025af、RWD 斷點、手機版操作截圖",
    ),
    dict(
        sid="ses_eabe3dd01ffdMazP4xSL4YPvri",
        id="08", tag="靜態部署", title="Redesign 原型雲端部署與公開展示",
        session="改良版網頁雲端部署", time="2026/10/19 17:41",
        model="deepseek-v4.1-flash-free",
        prompts=["你做的改良版的網頁我需要部署到雲端讓每個人可以檢視。幫我做的完善一點並告訴我可以用什麽方式部署"],
        ai_intro="已把 redesigned 網頁完善並整理成可直接部署的版本，並提供五種部署方式。",
        ai_bullets=[
            "新增平板／手機斷點、skip link、focus 管理、prefers-reduced-motion 與列印樣式。",
            "補上 meta description、Open Graph、Twitter card、manifest 與 SVG favicon。",
            "建立 deploy/ 扁平化資料夾、404.html、robots.txt、_redirects、vercel.json。",
            "Lighthouse 的 Accessibility／Best Practices／SEO 皆為 1.0（100）。",
        ],
        tools=["browser", "read", "edit", "shell"],
        purpose="讓組員、老師與同學不用安裝環境就能檢視 redesigned 原型。",
        result="deploy/、GitHub Pages workflow、Vercel／Netlify／Cloudflare 部署說明",
    ),
    dict(
        sid="ses_eabe3dd01ffdMazP4xSL4YPvri",
        id="09", tag="部署排錯", title="GitHub Pages 啟用失敗與 Workflow 修正",
        session="改良版網頁雲端部署", time="2026/10/19 18:06",
        model="deepseek-v4.1-flash-free",
        prompts=["部署時顯示這個 error：Error: Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions, or consider exploring the enablement parameter for this action."],
        ai_intro="這個錯誤是因為 GitHub Pages 尚未在 Repo 中啟用，或尚未設定成用 GitHub Actions 建置。",
        ai_bullets=[
            "更新 workflow 加上 enablement: true，讓 Action 自動啟用 Pages。",
            "確認 Repo 必須是 Public（免費方案 Pages 只支援公開 repo）。",
            "第一次啟用 Pages 後，網址約 1–2 分鐘才會生效。",
            "若仍失敗，改到 Settings → Pages → Source 手動選 GitHub Actions。",
        ],
        tools=["read", "write", "shell"],
        purpose="排除雲端部署的第一個阻礙，讓靜態原型真的能被公開檢視。",
        result=".github/workflows/deploy-pages.yml、GitHub Pages 公開網址",
    ),
    dict(
        sid="ses_ee0a9d441ffdqsJSBzMgtyuyoj",
        id="10", tag="Bad UI 分析", title="臺鐵官網 Bad UI 擷取與問題分析",
        session="Bad UI 分析、User Flow 與網頁重設計", time="2026/10/09 19:05",
        model="deepseek-v4.1-flash-free",
        prompts=["I. Bad UI Case 選擇：選擇 1 個真實網站，提供網站名稱＋網站連結＋至少 3 張原始介面截圖…… II. 問題分析：至少分析 5 項問題，且問題需能與後續 User Flow／Redesign 呼應……"],
        ai_intro="這正是理想的 Bad UI 案例 — 右側浮動選單文字重疊、Cookie 橫幅遮擋內容。",
        ai_bullets=[
            "查詢表單的所有控制項在無障礙樹中都是無名稱的 generic 節點。",
            "伺服器拒絕直接輸入站名，證明必須從自動完成下拉選取，卻只給模糊的「格式錯誤」。",
            "結果表格的「訂票」欄被右側固定浮動選單遮住，主要任務被功能性阻斷。",
            "整理 7 張原始截圖、P1–P8 問題、Lighthouse 數據與 12 張 redesign 分鏡。",
        ],
        tools=["browser", "read", "write", "shell"],
        purpose="以實際操作與截圖建立可佐證的 Bad UI 問題清單，作為 redesign 的依據。",
        result="assets/badui/ 7 張截圖、assets/redesign/ 12 張分鏡、HW1 報告",
    ),
    dict(
        sid="ses_ee087a1e7ffdUvHfxXVACxFs2g",
        id="11", tag="報告排版", title="Word 報告分組名單與組員貢獻",
        session="Word 文件開頭新增分組名單填寫欄位", time="2026/10/09 02:22",
        model="deepseek-v4.1-flash-free",
        prompts=["幫我在 word 文件的目錄前面位置加上分組名單：分組編號、組員姓名／學號的填寫欄位。", "再幫我在文件的最後新增組員貢獻：組員、負責內容、工作說明、貢獻比例，全組合計 100%。"],
        ai_intro="完成。分組名單欄位已加在封面、目錄之前；文末新增組員貢獻章節。",
        ai_bullets=[
            "改的是 build/report.js 產生器，而不是直接手改 XML，重新產出不會洗掉內容。",
            "新增 Group Members 表格、rowFill／rowHeight 選項與貢獻比例表。",
            "把你已經在 Word 手動填好的第 13 組名單寫回產生器，作為唯一真實來源。",
            "重新產出 docx → Word COM 轉 PDF，確認目錄與內文排版未受影響。",
        ],
        tools=["read", "edit", "shell", "write"],
        purpose="讓報告有正式的分組名單與貢獻比例，並保持 Word 與 PDF 一致。",
        result="build/report.js、封面分組名單、IX. 組員貢獻、38 頁 docx／pdf",
    ),
    dict(
        sid="ses_ee087a1e7ffdUvHfxXVACxFs2g",
        id="12", tag="AI 聲明", title="生成式 AI 使用標注與工具揭露",
        session="Word 文件開頭新增分組名單填寫欄位", time="2026/10/09 02:46",
        model="deepseek-v4.1-flash-free",
        prompts=["順便在合適的地方加上標注，若使用生成式 AI 協助分析、文字整理或介面設計，須於文件中附上使用工具名稱。"],
        ai_intro="完成。標注分兩個層級加入，讓老師翻開報告就能看到 AI 使用範圍。",
        ai_bullets=[
            "獨立聲明頁（封面之後、目錄之前）：聲明框 + 工具名稱／使用範圍／人工覆核方式。",
            "章節級綠框標注：第 II、III、IV、VII、VIII 節開頭標示 AI 協助內容與覆核方式。",
            "新增可重用的 aiNote() 元件（淺綠底 + 左側粗線），統一視覺樣式。",
            "工具資料集中在 build/report.js 的 AI_TOOLS／AI_STATEMENT，封面與第 VIII 節共用。",
        ],
        tools=["read", "edit", "shell"],
        purpose="符合作業的 AI 使用揭露規定，同時讓讀者知道哪些內容由 AI 協助、如何覆核。",
        result="生成式 AI 使用聲明頁、章節 AI 標注、AI_TOOLS／AI_STATEMENT",
    ),
]

TEMPLATE = """<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; }}
  html, body {{ margin:0; padding:0; background:#e9eef5; }}
  body {{ font-family:"Microsoft JhengHei","Noto Sans TC",sans-serif; color:#14202b; }}
  .card {{ width:1160px; height:760px; margin:20px; background:#fff; border-radius:18px; overflow:hidden;
          box-shadow:0 10px 30px rgba(15,30,50,.14); border:1px solid #cfdae7; display:flex; flex-direction:column; }}
  .bar {{ height:54px; background:#0f1b2d; color:#dce7f5; display:flex; align-items:center; padding:0 20px; gap:10px; }}
  .dots {{ display:flex; gap:7px; margin-right:8px; }}
  .dot {{ width:11px; height:11px; border-radius:50%; }}
  .d1 {{ background:#ff5f57; }} .d2 {{ background:#febc2e; }} .d3 {{ background:#28c840; }}
  .bar .name {{ font-weight:700; font-size:15px; letter-spacing:.5px; }}
  .bar .model {{ margin-left:auto; font-size:12px; color:#93a7c4; }}
  .meta {{ padding:12px 26px 6px; display:flex; align-items:center; gap:10px; border-bottom:1px solid #e6edf5; }}
  .tag {{ background:#e8f0fb; color:#0b4f8f; font-size:12px; font-weight:700; padding:4px 10px; border-radius:999px; }}
  .stitle {{ font-size:15px; font-weight:700; color:#0f2742; }}
  .stime {{ margin-left:auto; font-size:12px; color:#6b7f95; }}
  .chat {{ padding:18px 26px 8px; flex:1; overflow:hidden; background:linear-gradient(#fbfdff,#f4f8fd);
          display:flex; flex-direction:column; justify-content:center; }}
  .msg {{ display:flex; gap:12px; margin-bottom:14px; }}
  .avatar {{ width:34px; height:34px; border-radius:10px; flex:0 0 34px; display:flex; align-items:center; justify-content:center;
             font-size:13px; font-weight:800; color:#fff; }}
  .u .avatar {{ background:#c43e06; }}
  .a .avatar {{ background:#0b4f8f; }}
  .body {{ flex:1; min-width:0; }}
  .who {{ font-size:12px; color:#6b7f95; margin:1px 0 5px; }}
  .bubble {{ border-radius:12px; padding:12px 15px; font-size:14.5px; line-height:1.55; }}
  .u .bubble {{ background:#fff; border:1px solid #dbe6f2; }}
  .a .bubble {{ background:#eef5ff; border:1px solid #d5e4f7; }}
  .prompt {{ font-size:14px; line-height:1.55; }}
  .ai-intro {{ font-weight:700; color:#0b3f70; margin-bottom:6px; }}
  .ai-list {{ margin:0; padding-left:18px; }}
  .ai-list li {{ margin:3px 0; }}
  .chips {{ padding:0 26px 8px; display:flex; gap:6px; flex-wrap:wrap; }}
  .chip {{ font-size:11px; color:#43505f; background:#eef2f7; border:1px solid #dbe3ec; border-radius:999px; padding:3px 9px; }}
  .foot {{ padding:8px 26px 12px; font-size:11px; color:#7a8ca1; border-top:1px solid #e6edf5; display:flex; gap:14px; }}
  .foot b {{ color:#43505f; }}
</style>
</head>
<body>
<div class="card">
  <div class="bar">
    <div class="dots"><div class="dot d1"></div><div class="dot d2"></div><div class="dot d3"></div></div>
    <div class="name">OpenCode · 對話紀錄</div>
    <div class="model">{model}</div>
  </div>
  <div class="meta">
    <div class="tag">{tag}</div>
    <div class="stitle">{title}</div>
    <div class="stime">{time}</div>
  </div>
  <div class="chat">
    <div class="msg u">
      <div class="avatar">你</div>
      <div class="body">
        <div class="who">你 · {time} · Session：{session}</div>
        {prompts}
      </div>
    </div>
    <div class="msg a">
      <div class="avatar">AI</div>
      <div class="body">
        <div class="who">OpenCode · {model}</div>
        <div class="bubble">
          <div class="ai-intro">{ai_intro}</div>
          <ul class="ai-list">{bullets}</ul>
        </div>
      </div>
    </div>
  </div>
  <div class="chips">{chips}</div>
  <div class="foot"><span><b>對應成果：</b>{result}</span></div>
</div>
</body>
</html>
"""

for c in CARDS:
    prompts = "".join(
        f'<div class="bubble prompt">{html.escape(p)}</div>' + ("<div style='height:6px'></div>" if i < len(c["prompts"]) - 1 else "")
        for i, p in enumerate(c["prompts"])
    )
    bullets = "".join(f"<li>{html.escape(b)}</li>" for b in c["ai_bullets"])
    chips = "".join(f'<span class="chip">工具：{html.escape(t)}</span>' for t in c["tools"])
    chips += f'<span class="chip">Session：{html.escape(c["sid"])}</span>'
    chips += f'<span class="chip">使用目的：{html.escape(c["purpose"])}</span>'
    doc = TEMPLATE.format(
        model=html.escape(c["model"]), tag=html.escape(c["tag"]), title=html.escape(c["title"]),
        time=html.escape(c["time"]), session=html.escape(c["session"]), prompts=prompts,
        ai_intro=html.escape(c["ai_intro"]), bullets=bullets, chips=chips,
        result=html.escape(c["result"]),
    )
    open(os.path.join(OUT, f'card{c["id"]}.html'), "w", encoding="utf-8").write(doc)

print("cards", len(CARDS))
