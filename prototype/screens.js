/* ============================================================
   分鏡畫面模板 — 所有畫面共用同一套 Design System
   ============================================================ */

const money = n => '$' + n;

/* ---------- 統一圖示集 ---------- */
const ICON = {
  ticket: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v1.2a2.3 2.3 0 0 0 0 4.6v1.2a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 15.5v-1.2a2.3 2.3 0 0 0 0-4.6z"/><path d="M14 6.5v11"/></svg>`,
  clock: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.1 2"/></svg>`,
  tag: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.6 3.1 21 11.5a2 2 0 0 1 0 2.9l-6.6 6.6a2 2 0 0 1-2.9 0L3.1 12.6A2 2 0 0 1 2.7 11V4.8a2 2 0 0 1 2-2H11a2 2 0 0 1 1.6.7Z"/><circle cx="7.6" cy="7.6" r="1.3"/></svg>`,
  help: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><path d="M9.5 9.4a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.8"/><path d="M12 17.1h.01"/></svg>`,
  phone: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16.9v2.4a1.7 1.7 0 0 1-1.9 1.7 17.6 17.6 0 0 1-7.7-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 3.4 5.3 1.7 1.7 0 0 1 5.1 3.4h2.4a1.7 1.7 0 0 1 1.7 1.5c.1.9.3 1.7.6 2.5a1.7 1.7 0 0 1-.4 1.8l-1 1a14 14 0 0 0 5.3 5.3l1-1a1.7 1.7 0 0 1 1.8-.4c.8.3 1.6.5 2.5.6a1.7 1.7 0 0 1 1.5 1.7Z"/></svg>`,
  bulb: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 18.2h5.6M10.4 21h3.2"/><path d="M12 3a6 6 0 0 0-3.5 10.8c.5.4.8 1 .9 1.6l.1.6h5l.1-.6c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3Z"/></svg>`,
  store: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.2 9.4 5 4h14l1.8 5.4"/><path d="M3.2 9.4h17.6M4.6 9.4V20h14.8V9.4"/><path d="M9.6 20v-5.4h4.8V20"/></svg>`,
  kiosk: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.2" width="18" height="12" rx="1.8"/><path d="M8.2 20.2h7.6M12 16.2v4"/></svg>`
};

/* ---------- 共用元件 ---------- */

const trainRow = (o) => `
<article class="train train--${o.kind} ${o.best ? 'train--best' : ''}">
  <div>
    <div class="train__id">
      <span>${o.no}</span>
      <span class="train__kind">${o.kindName}</span>
      ${o.best ? '<span class="tag tag--best">建議選擇</span>' : ''}
      ${o.disc ? '<span class="tag tag--disc">優惠車次</span>' : ''}
      ${o.full ? '<span class="tag tag--full">已額滿</span>' : ''}
    </div>
    <div class="train__via">經由 ${o.via}</div>
  </div>
  <div class="train__time">
    <div>
      <div class="train__t">${o.dep}</div>
      <div class="train__dur">${o.from}</div>
    </div>
    <div class="train__line" aria-hidden="true"></div>
    <div>
      <div class="train__t">${o.arr}</div>
      <div class="train__dur">${o.to}</div>
    </div>
    <div class="train__dur" style="margin-left:8px">${o.dur}</div>
  </div>
  <div class="train__act">
    <div class="train__fare">
      <div class="train__price">${money(o.price)}<small>全票</small></div>
    </div>
    ${o.full
      ? '<div class="train__full">本班已售完</div><button class="btn btn--ghost" type="button">查看其他班次</button>'
      : `<button class="btn ${o.best ? 'btn--primary' : 'btn--secondary'}" type="button" data-go="A4">訂票</button>`}
  </div>
</article>`;

const TRAINS = [
  { no: '300', kind: 'express', kindName: '自強號', dep: '07:00', arr: '09:14', from: '臺北 07:00', to: '臺中 09:14', dur: '2 小時 14 分', via: '板橋・臺中', price: 500, disc: true, best: true },
  { no: '1401', kind: 'express', kindName: '自強號', dep: '08:00', arr: '10:24', from: '臺北 08:00', to: '臺中 10:24', dur: '2 小時 24 分', via: '板橋・苗栗', price: 500 },
  { no: '101', kind: 'express', kindName: '自強號', dep: '09:30', arr: '11:44', from: '臺北 09:30', to: '臺中 11:44', dur: '2 小時 14 分', via: '板橋・臺中', price: 500 },
  { no: '1013', kind: 'express', kindName: '自強號', dep: '13:00', arr: '15:14', from: '臺北 13:00', to: '臺中 15:14', dur: '2 小時 14 分', via: '板橋・臺中', price: 500, full: true },
  { no: '3000', kind: 'local', kindName: '區間車', dep: '07:20', arr: '10:05', from: '臺北 07:20', to: '臺中 10:05', dur: '2 小時 45 分', via: '樹林・竹南', price: 411, full: true },
  { no: '1017', kind: 'express', kindName: '自強號', dep: '14:30', arr: '16:44', from: '臺北 14:30', to: '臺中 16:44', dur: '2 小時 14 分', via: '板橋・臺中', price: 500 }
];

/* ---------- 首頁（A1 / B1 / C1 共用版面） ---------- */

const homeScreen = (mode) => {
  const lg = mode === 'B1';
  const novice = mode === 'C1';

  const banner = novice
    ? `<div class="alert alert--info">
         <div class="alert__title">第一次在線上訂票？跟著 4 個步驟就能完成</div>
         <div class="alert__body">不需要註冊也可以查詢班次；只有要付款時才需要登入。全程約 3 分鐘。</div>
       </div>`
    : lg
    ? `<div class="alert alert--info">
         <div class="alert__title">已為您開啟大字模式（放大 18%）</div>
         <div class="alert__body">畫面文字已放大。若仍看不清，可再按一次「大字」按鈕，或撥打 1933 由專人協助。</div>
       </div>`
    : `<div class="alert alert--info">
         <div class="alert__title">今天是 2026 年 10 月 9 日（週五）</div>
         <div class="alert__body">臺北 ⇄ 臺中 今日尚有多班次，歡迎查詢。系統將於 11/14 進行維護。</div>
       </div>`;

  const guide = novice
    ? `<div class="section-title">如何線上訂票</div>
       <div class="howto">
         <div class="howto__i"><div class="howto__n">1</div><div class="howto__t">查詢班次<br><small style="font-weight:400;color:var(--c-text-2)">選車站與日期</small></div></div>
         <div class="howto__i"><div class="howto__n">2</div><div class="howto__t">選擇車次<br><small style="font-weight:400;color:var(--c-text-2)">比較時間與票價</small></div></div>
         <div class="howto__i"><div class="howto__n">3</div><div class="howto__t">填寫乘車人<br><small style="font-weight:400;color:var(--c-text-2)">需身分證字號</small></div></div>
         <div class="howto__i"><div class="howto__n">4</div><div class="howto__t">完成付款<br><small style="font-weight:400;color:var(--c-text-2)">手機收到電子票</small></div></div>
       </div>`
    : '';

  const extraCards = novice
    ? `<div class="section-title">不確定怎麼開始？</div>
       <div class="grid grid--3">
         <a class="task" href="#A2"><div class="task__icon">${ICON.help}</div><div class="task__name">我只想問班次</div><div class="task__desc">不需要登入，直接查詢時刻表</div><div class="task__go">開始查詢 →</div></a>
         <a class="task" href="#B2"><div class="task__icon">${ICON.tag}</div><div class="task__name">我想先知道票價</div><div class="task__desc">查看全票、優惠票與折扣規則</div><div class="task__go">查看票價 →</div></a>
         <a class="task" href="#X1"><div class="task__icon">${ICON.phone}</div><div class="task__name">我需要人工協助</div><div class="task__desc">客服專線、語音與服務據點</div><div class="task__go">聯絡我們 →</div></a>
       </div>`
    : '';

  return `
  <div class="main">
    ${banner}

    <div class="section-title">我要做的事</div>
    <div class="grid grid--3">
      <a class="task task--accent" href="#A2">
        <div class="task__icon">${ICON.ticket}</div>
        <div class="task__name">訂車票</div>
        <div class="task__desc">查詢班次、選擇車次並完成訂票</div>
        <div class="task__go">開始訂票 →</div>
      </a>
      <a class="task" href="#A2">
        <div class="task__icon">${ICON.clock}</div>
        <div class="task__name">查詢班次</div>
        <div class="task__desc">查看時刻表、經過站點與行駛時間</div>
        <div class="task__go">查詢時刻 →</div>
      </a>
      <a class="task" href="#B2">
        <div class="task__icon">${ICON.tag}</div>
        <div class="task__name">票價與優惠</div>
        <div class="task__desc">全票、優惠票資格與折扣說明</div>
        <div class="task__go">查看票價 →</div>
      </a>
    </div>

    ${guide}

    <div class="section-title" style="margin-top:var(--sp-6)">快速查詢</div>
    <div class="card">
      <div class="card__body">
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:var(--sp-4)">
          <div class="field" style="margin:0">
            <label class="field__label" for="q-from">出發站 <span class="field__req">必填</span></label>
            <input class="input" id="q-from" value="臺北" list="st" role="combobox" aria-expanded="false" aria-describedby="q-from-hint">
            <div class="field__hint" id="q-from-hint">可直接輸入站名，例如「臺北」</div>
          </div>
          <div class="field" style="margin:0">
            <label class="field__label" for="q-to">抵達站 <span class="field__req">必填</span></label>
            <input class="input" id="q-to" value="臺中" list="st" role="combobox" aria-expanded="false" aria-describedby="q-to-hint">
            <div class="field__hint" id="q-to-hint">可直接輸入站名，例如「臺中」</div>
          </div>
        </div>
        <datalist id="st"><option value="臺北"></option><option value="臺中"></option><option value="高雄"></option><option value="桃園"></option><option value="新竹"></option></datalist>
        <div class="grid" style="grid-template-columns:1fr 1fr 1fr;gap:var(--sp-4);margin-top:var(--sp-4)">
          <div class="field" style="margin:0">
            <label class="field__label" for="q-date">出發日期</label>
            <input class="input" id="q-date" type="date" value="2026-10-09">
          </div>
          <div class="field" style="margin:0">
            <label class="field__label" for="q-dep">出發時段</label>
            <select class="select" id="q-dep"><option>06:00 – 12:00</option><option selected>12:00 – 18:00</option><option>18:00 – 24:00</option></select>
          </div>
          <div style="display:flex;align-items:flex-end">
            <button class="btn btn--accent btn--lg btn--block" type="button" data-go="A2">查詢班次</button>
          </div>
        </div>
      </div>
    </div>

    ${extraCards}

    <div class="grid grid--3" style="margin-top:var(--sp-6)">
      <div class="card"><div class="card__body">
        <div class="card__title" style="font-size:var(--fs-md);margin-bottom:var(--sp-2)">行車資訊</div>
        <p style="color:var(--c-text-2);font-size:var(--fs-sm)">查看即時列車位置與延誤資訊</p>
        <div class="btn-row" style="margin-top:var(--sp-3)"><a class="btn btn--ghost" href="#A3">前往查詢</a></div>
      </div></div>
      <div class="card"><div class="card__body">
        <div class="card__title" style="font-size:var(--fs-md);margin-bottom:var(--sp-2)">乘車須知</div>
        <p style="color:var(--c-text-2);font-size:var(--fs-sm)">行李限制、寵物、機車與特殊旅客規定</p>
        <div class="btn-row" style="margin-top:var(--sp-3)"><a class="btn btn--ghost" href="#B3">前往查閱</a></div>
      </div></div>
      <div class="card"><div class="card__body">
        <div class="card__title" style="font-size:var(--fs-md);margin-bottom:var(--sp-2)">常見問題</div>
        <p style="color:var(--c-text-2);font-size:var(--fs-sm)">取票、變更、購票須知問答</p>
        <div class="btn-row" style="margin-top:var(--sp-3)"><a class="btn btn--ghost" href="#X1">前往查閱</a></div>
      </div></div>
    </div>
  </div>`;
};

/* ---------- A2 查詢表單 ---------- */
const a2 = () => `
<div class="main">
  <nav class="crumb-dark" aria-label="麵包屑"><a href="#A1">首頁</a> ／ 訂票 ／ <b>查詢條件</b></nav>
  <h1 class="page-title">訂票查詢</h1>
  <p class="page-sub">請選擇出發與抵達車站、日期與時段。查詢結果會一覽列出所有符合的車次，並標示票價與剩餘座位。</p>

  <div class="card" style="margin-bottom:var(--sp-5)">
    <div class="card__head"><h2 class="card__title">查詢條件</h2></div>
    <div class="card__body">
      <div class="grid" style="grid-template-columns:1fr auto 1fr;gap:var(--sp-4);align-items:end">
        <div class="field" style="margin:0">
          <label class="field__label" for="from">出發站 <span class="field__req" aria-hidden="true">*</span></label>
          <input class="input" id="from" value="臺北" list="st2" role="combobox" aria-expanded="false" aria-describedby="from-err from-hint">
          <datalist id="st2"><option value="臺北"></option><option value="板橋"></option><option value="桃園"></option><option value="新竹"></option></datalist>
          <div class="field__hint" id="from-hint">輸入後請從建議清單中選擇</div>
          <div class="field__err" id="from-err"><span>⚠</span><span>請由建議清單中選擇車站，不可自行輸入</span></div>
        </div>
        <button class="swap" type="button" title="交換出發站與抵達站">⇄</button>
        <div class="field" style="margin:0">
          <label class="field__label" for="to">抵達站 <span class="field__req" aria-hidden="true">*</span></label>
          <input class="input" id="to" value="臺中" list="st3" role="combobox" aria-expanded="false" aria-describedby="to-hint">
          <datalist id="st3"><option value="臺中"></option><option value="彰化"></option><option value="高雄"></option><option value="臺南"></option></datalist>
          <div class="field__hint" id="to-hint">輸入後請從建議清單中選擇</div>
        </div>
      </div>

      <hr style="border:0;border-top:1px solid var(--c-border);margin:var(--sp-5) 0">

      <div class="grid" style="grid-template-columns:1fr 1fr 1fr;gap:var(--sp-4);align-items:end">
        <div class="field" style="margin:0">
          <label class="field__label" for="date">出發日期</label>
          <input class="input" id="date" type="date" value="2026-10-09">
        </div>
        <div class="field" style="margin:0">
          <span class="field__label" id="tz-label">出發時段</span>
          <div style="display:flex;align-items:center;gap:var(--sp-2)">
            <select class="select" id="tz1" aria-label="起始時間"><option selected>06:00</option><option>09:00</option><option>12:00</option></select>
            <span aria-hidden="true">至</span>
            <select class="select" id="tz2" aria-label="結束時間"><option selected>23:59</option><option>18:00</option><option>21:00</option></select>
          </div>
        </div>
        <div class="field" style="margin:0">
          <span class="field__label" id="tp-label">票種需求</span>
          <div class="seg" role="group" aria-labelledby="tp-label">
            <button type="button" aria-pressed="true">全票</button>
            <button type="button" aria-pressed="false">學生</button>
            <button type="button" aria-pressed="false">長者</button>
          </div>
        </div>
      </div>

      <div class="btn-row" style="margin-top:var(--sp-5)">
        <button class="btn btn--accent btn--lg" type="button" data-go="A3">查詢班次</button>
        <button class="btn btn--quiet" type="button">清除條件</button>
      </div>
    </div>
  </div>

  <div class="helper">
    <span class="task__icon" style="background:transparent;color:var(--c-primary-dark)">${ICON.bulb}</span>
    <span>查詢結果只顯示 <b>15 天內</b>的班次。若要查詢更早日期，請改用「時刻表查詢」。</span>
  </div>
</div>`;

/* ---------- A3 結果列表 ---------- */
const a3 = () => `
<div class="main main--flush">
  <div class="summary">
    <div>
      <div class="summary__route">臺北 <span class="summary__arrow">→</span> 臺中</div>
      <div class="summary__when">2026 年 10 月 9 日（週五）｜出發時段 06:00 – 23:59｜<b>共 24 班</b></div>
    </div>
    <div class="summary__act">
      <button class="btn btn--ghost" type="button" data-go="A2">修改條件</button>
      <button class="btn btn--primary" type="button" data-go="A4">直接訂最快班次</button>
    </div>
  </div>

  <div class="card" style="margin-bottom:var(--sp-5)">
    <div class="card__body" style="padding:var(--sp-4) var(--sp-5)">
      <div class="chips" role="group" aria-label="篩選條件">
        <span style="font-size:var(--fs-xs);font-weight:700;color:var(--c-text-2);margin-right:4px">快速篩選</span>
        <button class="chip" type="button" aria-pressed="true">自強號 <span class="chip__x">✕</span></button>
        <button class="chip" type="button" aria-pressed="true">有優惠票 <span class="chip__x">✕</span></button>
        <button class="chip" type="button" aria-pressed="false">09:00 前出發</button>
        <button class="chip" type="button" aria-pressed="false">12:00 前到達</button>
        <button class="chip" type="button" aria-pressed="false">有座位</button>
        <button class="chip" type="button" aria-pressed="false">可攜帶寵物</button>
        <a href="#A3" style="font-size:var(--fs-xs);font-weight:700;margin-left:6px">清除全部篩選</a>
      </div>
    </div>
  </div>

  <div class="grid" style="grid-template-columns:1fr 268px;gap:var(--sp-5);align-items:start">
    <div>
      <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3)">
        <h2 style="font-size:var(--fs-md)">符合條件的車次（24）</h2>
        <div class="seg" style="margin-left:auto">
          <button type="button" aria-pressed="true">依出發時間</button>
          <button type="button" aria-pressed="false">依票價</button>
        </div>
      </div>
      <div class="trains">
        ${TRAINS.map(trainRow).join('')}
      </div>
      <div class="btn-row" style="margin-top:var(--sp-5);justify-content:center">
        <button class="btn btn--ghost" type="button">載入更多車次</button>
      </div>
    </div>

    <aside style="display:flex;flex-direction:column;gap:var(--sp-4)">
      <div class="card">
        <div class="card__head"><h2 class="card__title" style="font-size:var(--fs-sm)">比較車次</h2></div>
        <div class="card__body">
          <p style="font-size:var(--fs-sm);color:var(--c-text-2)">已選 <b>2</b> 班，可並排比較時間與票價。</p>
          <div class="btn-row" style="margin-top:var(--sp-3)">
            <button class="btn btn--secondary btn--block" type="button" data-go="A4">比較這 2 班</button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card__head"><h2 class="card__title" style="font-size:var(--fs-sm)">查詢說明</h2></div>
        <div class="card__body" style="font-size:var(--fs-sm);color:var(--c-text-2)">
          <p>「優惠票」為可拆分席位之價格，實際可售數量以訂票時為準。</p>
          <p style="margin-top:var(--sp-2)">「已額滿」表示該班次所有席位均已售出，可查看相鄰班次。</p>
        </div>
      </div>
    </aside>
  </div>
</div>`;

/* ---------- A4 車次比較 ---------- */
const a4 = () => `
<div class="main">
  <nav class="crumb-dark" aria-label="麵包屑"><a href="#A1">首頁</a> ／ <a href="#A2">查詢條件</a> ／ <a href="#A3">查詢結果</a> ／ <b>比較車次</b></nav>
  <h1 class="page-title">比較車次</h1>
  <p class="page-sub">並排比較兩個班次的出發時間、到達時間、票價與車廂種類，協助你快速決定。</p>

  <div class="card" style="margin-bottom:var(--sp-5)">
    <div class="card__body">
      <table class="cmp">
        <caption>臺北 → 臺中，2026 年 10 月 9 日（週五）</caption>
        <thead>
          <tr><th scope="col">比較項目</th><th scope="col">自強號 300（建議）</th><th scope="col">自強號 101</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">出發時間</th><td>07:00（臺北）</td><td>09:30（臺北）</td></tr>
          <tr><th scope="row">到達時間</th><td class="is-best">09:14（臺中）</td><td>11:44（臺中）</td></tr>
          <tr><th scope="row">行駛時間</th><td class="is-best">2 小時 14 分</td><td>2 小時 14 分</td></tr>
          <tr><th scope="row">經由</th><td>板橋・臺中</td><td>板橋・臺中</td></tr>
          <tr><th scope="row">全票</th><td class="is-best">$500</td><td>$500</td></tr>
          <tr><th scope="row">優惠票</th><td class="is-best">$250（尚餘 32 席）</td><td>$250（尚餘 18 席）</td></tr>
          <tr><th scope="row">車廂種類</th><td>標準 / Coleman / 雙層tour</td><td>標準 / 餐車</td></tr>
          <tr><th scope="row">是否適用台鐵好行</th><td class="is-best">是</td><td>是</td></tr>
          <tr>
            <th scope="row">選擇</th>
            <td><button class="btn btn--primary btn--block" type="button" data-go="C2">訂這班（07:00）</button></td>
            <td><button class="btn btn--ghost btn--block" type="button" data-go="C2">訂這班（09:30）</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="alert alert--ok">
    <div class="alert__title">✓ 建議選擇 07:00 的自強號 300</div>
    <div class="alert__body">出發時間較早、優惠票剩餘席位較多，且適用台鐵好行電子票，若需異地取票建議選擇此班。</div>
  </div>

  <div class="btn-row">
    <button class="btn btn--quiet" type="button" data-go="A3">← 返回查詢結果</button>
  </div>
</div>`;

/* ---------- B2 票價與優惠 ---------- */
const b2 = () => `
<div class="main">
  <nav class="crumb-dark" aria-label="麵包屑"><a href="#B1">首頁</a> ／ <b>票價與優惠</b></nav>
  <h1 class="page-title">票價與優惠說明</h1>
  <p class="page-sub">以下為臺北 ⇄ 臺中 的票價與優惠資格說明。所有價格均含稅，無另加收服務費。</p>

  <div class="section-title">臺北 → 臺中 票價</div>
  <div class="fare">
    <div class="fare__cell">
      <div class="fare__t">全票（一般成人）</div>
      <div class="fare__v">$500</div>
      <div class="fare__n">無年齡限制</div>
    </div>
    <div class="fare__cell">
      <div class="fare__t">優惠票（對座拆分）</div>
      <div class="fare__v">$250</div>
      <div class="fare__n">需與另一張全票同車、同區間<br>兩張票座位不相連</div>
    </div>
    <div class="fare__cell">
      <div class="fare__t">身心障礙者優惠票</div>
      <div class="fare__v">$250</div>
      <div class="fare__n">須持身心障礙手冊<br>本人與一名陪同者</div>
    </div>
  </div>

  <div class="section-title" style="margin-top:var(--sp-6)">我符合哪一種優惠？</div>
  <div class="card">
    <div class="card__body">
      <div class="linklist">
        <a href="#C2"><span>我年滿 65 歲（含）</span><span class="tag tag--disc">敬老票 5 折 $250</span></a>
        <a href="#C2"><span>我持有有效學生證</span><span class="tag tag--disc">學生優惠 $355</span></a>
        <a href="#C2"><span>我持有台鐵好行電子票</span><span class="tag tag--disc">再減 30 元</span></a>
        <a href="#C2"><span>我符合兒童身高規定</span><span class="tag tag--disc">兒童票 $250</span></a>
      </div>
    </div>
  </div>

  <div class="alert alert--warn" style="margin-top:var(--sp-5)">
    <div class="alert__title">⚠ 購買優惠票請攜帶證件</div>
    <div class="alert__body">敬老票、學生票與兒童票須於進站時出示證件；若無法出示，將補收全票差額。若不確定資格，可先購買全票，於 24 小時內線上換票。</div>
  </div>

  <div class="btn-row" style="margin-top:var(--sp-4)">
    <button class="btn btn--accent btn--lg" type="button" data-go="C2">用優惠票訂票</button>
    <button class="btn btn--ghost" type="button" data-go="A2">返回查詢</button>
  </div>
</div>`;

/* ---------- B3 車廂與座位 ---------- */
const b3 = () => `
<div class="main">
  <nav class="crumb-dark" aria-label="麵包屑"><a href="#B1">首頁</a> ／ <a href="#A2">查詢條件</a> ／ <b>選擇車廂</b></nav>
  <h1 class="page-title">選擇車廂與座位</h1>
  <p class="page-sub">自強號 300｜臺北 07:00 → 臺中 09:14｜2 小時 14 分</p>

  <div class="section-title">車廂種類</div>
  <div class="card">
    <div class="card__body">
      <label class="plan" data-selected="true">
        <input type="radio" name="car" checked>
        <div>
          <div class="plan__t">標準車廂（自由座）</div>
          <div class="plan__d">無指定座位，上車後自由入座。適合不趕時間的旅客。</div>
        </div>
        <div class="plan__price">$500<small>全票</small></div>
      </label>
      <label class="plan">
        <input type="radio" name="car">
        <div>
          <div class="plan__t">標準車廂（指定座位）</div>
          <div class="plan__d">可選 3A–15D 座位，選位後系統會保留 20 分鐘。</div>
        </div>
        <div class="plan__price">$500<small>全票</small></div>
      </label>
      <label class="plan">
        <input type="radio" name="car">
        <div>
          <div class="plan__t">Coleman 車廂</div>
          <div class="plan__d">座位較寬，附閱讀燈與個人插座，數量有限。</div>
        </div>
        <div class="plan__price">$650<small>全票</small></div>
      </label>
      <label class="plan">
        <input type="radio" name="car">
        <div>
          <div class="plan__t">商務車廂（已售完）</div>
          <div class="plan__d">本班次商務車廂已售罄，可改選相鄰班次或 Coleman 車廂。</div>
        </div>
        <div class="plan__price" style="color:var(--c-text-3)">$800<small>暫無座位</small></div>
      </label>
    </div>
  </div>

  <div class="alert alert--info" style="margin-top:var(--sp-5)">
    <div class="alert__title">長者與行動不便旅客</div>
    <div class="alert__body">指定座位時，系統會自動將 3A–3C、13A–13C 保留為無障礙空間；若需靠門或鄰近洗手間座位，請於備註欄註明，我們將協助安排。</div>
  </div>

  <div class="btn-row" style="margin-top:var(--sp-5)">
    <button class="btn btn--accent btn--lg" type="button" data-go="C2">繼續選擇票種</button>
    <button class="btn btn--quiet" type="button" data-go="A2">← 重新查詢</button>
  </div>
</div>`;

/* ---------- C2 訂票 Step 1 ---------- */
const c2 = () => `
<div class="main">
  <nav class="crumb-dark" aria-label="麵包屑"><a href="#A1">首頁</a> ／ <b>線上訂票</b></nav>
  <h1 class="page-title">線上訂票</h1>
  <p class="page-sub">自強號 300｜臺北 07:00 → 臺中 09:14｜成人 1 名</p>

  <div class="section-title">步驟 1／3：選擇票種與方案</div>
  <div class="card" style="margin-bottom:var(--sp-5)">
    <div class="card__body">
      <span class="field__label" style="margin-bottom:var(--sp-3)">請選擇票種</span>
      <label class="plan" data-selected="true">
        <input type="radio" name="tp" checked>
        <div>
          <div class="plan__t">全票（一般成人）</div>
          <div class="plan__d">任何人皆可購買，不需出示證件。</div>
        </div>
        <div class="plan__price">$500</div>
      </label>
      <label class="plan">
        <input type="radio" name="tp">
        <div>
          <div class="plan__t">優惠票（對座拆分）</div>
          <div class="plan__d">票價減半，但需同時購買 1 張全票，且兩者座位不相連。</div>
        </div>
        <div class="plan__price">$250</div>
      </label>
      <label class="plan">
        <input type="radio" name="tp">
        <div>
          <div class="plan__t">敬老票（年滿 65 歲）</div>
          <div class="plan__d">進站時須出示身分證明滿 65 歲。</div>
        </div>
        <div class="plan__price">$250</div>
      </label>

      <hr style="border:0;border-top:1px solid var(--c-border);margin:var(--sp-5) 0">

      <div class="field">
        <span class="field__label" id="pp-label">乘客人數</span>
        <div class="seg" role="group" aria-labelledby="pp-label">
          <button type="button" aria-pressed="true">成人 1</button>
          <button type="button" aria-pressed="false">成人 2</button>
          <button type="button" aria-pressed="false">含兒童 3</button>
        </div>
        <div class="field__hint">兒童票適用身高 100–125 公分；超過 125 公分須買全票。</div>
      </div>

      <label class="check">
        <input type="checkbox" checked>
        <span class="check__txt">我想使用 <b>台鐵好行電子票</b>
          <small>出示 App 或 NFC 感應即可上車，可再減 30 元。此票與紙本票可併用。</small>
        </span>
      </label>
      <label class="check">
        <input type="checkbox">
        <span class="check__txt">接受 <a href="#C2">乘車條款與隱私權政策</a>
          <small>必要才能進行訂票。</small>
        </span>
      </label>
    </div>
  </div>

  <div style="display:flex;gap:var(--sp-5);align-items:center;flex-wrap:wrap">
    <button class="btn btn--accent btn--lg" type="button" data-go="C3">下一步：填寫乘車人</button>
    <button class="btn btn--quiet" type="button" data-go="A4">← 換一班次</button>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:var(--fs-sm);color:var(--c-text-2)">預估票價（含服務費 $0）</div>
      <div style="font-size:var(--fs-lg);font-weight:800">$500</div>
    </div>
  </div>
</div>`;

/* ---------- C3 乘車人資料 ---------- */
const c3 = () => `
<div class="main">
  <nav class="crumb-dark" aria-label="麵包屑"><a href="#C2">選擇票種</a> ／ <b>乘車人資料</b></nav>
  <h1 class="page-title">填寫乘車人資料</h1>
  <p class="page-sub">請依乘車人證件填寫。資料將用於出票與進站核對，請勿填寫他人資料。</p>

  <div class="alert alert--warn">
    <div class="alert__title">⚠ 身分驗證說明</div>
    <div class="alert__body">本頁不需信用卡資料。填寫完成後會跳轉至第三方金流頁面，請留意網址列仍為 <b>tip.railway.gov.tw</b> 或 <b>ebill.railway.gov.tw</b> 才輸入卡片資料。</div>
  </div>

  <div class="card" style="margin-bottom:var(--sp-5)">
    <div class="card__head"><h2 class="card__title">乘車人 1（本人）</h2></div>
    <div class="card__body">
      <div class="grid grid--2" style="gap:var(--sp-4)">
        <div class="field">
          <label class="field__label" for="nm">姓名 <span class="field__req">必填</span></label>
          <input class="input" id="nm" value="王小明" aria-describedby="nm-err">
          <div class="field__err" id="nm-err"><span>⚠</span><span>請填寫與身分證完全相同的中文姓名</span></div>
        </div>
        <div class="field">
          <label class="field__label" for="idn">身分證字號 <span class="field__req">必填</span></label>
          <input class="input" id="idn" value="A123456789" aria-describedby="idn-hint">
          <div class="field__hint" id="idn-hint">格式：A123456789（新身分證）或 10 碼統號</div>
        </div>
        <div class="field">
          <label class="field__label" for="bd">出生日期</label>
          <input class="input" id="bd" type="date" value="1998-03-15">
        </div>
        <div class="field">
          <label class="field__label" for="ph">手機號碼 <span class="field__req">必填</span></label>
          <input class="input" id="ph" value="0912-345-678" aria-describedby="ph-hint">
          <div class="field__hint" id="ph-hint">訂票結果與電子票會以此號碼通知</div>
        </div>
      </div>

      <div class="field" style="margin-bottom:0">
        <label class="field__label" for="em">電子郵件</label>
        <input class="input" id="em" value="ming@example.com" aria-describedby="em-hint">
        <div class="field__hint" id="em-hint">電子票會同時寄到這個信箱（選填）</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card__head"><h2 class="card__title">付款方式</h2></div>
    <div class="card__body">
      <div class="grid grid--2" style="gap:var(--sp-3)">
        <label class="plan" data-selected="true" style="margin:0">
          <input type="radio" name="pay" checked>
          <div><div class="plan__t">信用卡／金融卡</div><div class="plan__d">可分期 3 期，另有 2,000 元以上免分期手續費</div></div>
        </label>
        <label class="plan" style="margin:0">
          <input type="radio" name="pay">
          <div><div class="plan__t">Apple Pay／Google Pay</div><div class="plan__d">手機錢包快速付款</div></div>
        </label>
      </div>
    </div>
  </div>

  <div style="display:flex;gap:var(--sp-5);align-items:center;flex-wrap:wrap;margin-top:var(--sp-5)">
    <button class="btn btn--accent btn--lg" type="button" data-go="C4">確認訂票內容</button>
    <button class="btn btn--quiet" type="button" data-go="C2">← 上一步</button>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:var(--fs-sm);color:var(--c-text-2)">應付金額</div>
      <div style="font-size:var(--fs-lg);font-weight:800">$500</div>
    </div>
  </div>
</div>`;

/* ---------- C4 完成確認 ---------- */
const c4 = () => `
<div class="main">
  <div style="max-width:760px;margin:0 auto">
    <div class="success-mark" aria-hidden="true">✓</div>
    <h1 style="text-align:center;font-size:var(--fs-xl);margin-bottom:var(--sp-2)">訂票完成</h1>
    <p style="text-align:center;color:var(--c-text-2);margin-bottom:var(--sp-6)">
      訂單 <b>#T20261009-4471</b> 已成立，電子票已寄至你的手機與信箱。
    </p>

    <div class="alert alert--ok">
      <div class="alert__title">✓ 接下來請這樣做</div>
      <div class="alert__body">乘車時請出示電子票 QR code；若手機沒電，可至車站自動售票機以「訂單代號 + 身分證字號」取紙本票。</div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-5)">
      <div class="card__head"><h2 class="card__title">訂票明細</h2></div>
      <div class="card__body">
        <dl class="kv">
          <dt>車次</dt><dd>自強號 300（標準車廂・自由座）</dd>
          <dt>行程</dt><dd>臺北 07:00 → 臺中 09:14</dd>
          <dt>乘車日期</dt><dd>2026 年 10 月 9 日（週五）</dd>
          <dt>乘車人</dt><dd>王小明（成人・全票 × 1）</dd>
          <dt>票價</dt><dd>全票 $500　優惠票 $0　合計 $500</dd>
          <dt>付款方式</dt><dd>信用卡 ****1234（已付款）</dd>
          <dt>取票方式</dt><dd>電子票／可至車站取紙本票</dd>
        </dl>
      </div>
    </div>

    <div class="card">
      <div class="card__head"><h2 class="card__title">取票／報到進度</h2></div>
      <div class="card__body">
        <div class="meter" role="progressbar" aria-label="訂票完成進度" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="margin-bottom:var(--sp-3)">
          <div class="meter__fill" style="width:100%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:var(--fs-sm);color:var(--c-text-2);margin-bottom:var(--sp-4)">
          <span>① 查詢完成</span><span>② 填寫完成</span><span>③ 付款完成</span><span>④ 取票完成</span>
        </div>
        <div class="btn-row">
          <button class="btn btn--primary" type="button">顯示電子票 QR code</button>
          <button class="btn btn--ghost" type="button">加入行事曆</button>
          <button class="btn btn--ghost" type="button">列印訂單明細</button>
        </div>
      </div>
    </div>

    <div class="btn-row" style="margin-top:var(--sp-5);justify-content:space-between">
      <button class="btn btn--quiet" type="button" data-go="A2">再訂一張票</button>
      <button class="btn btn--quiet" type="button" data-go="A1">回首頁</button>
    </div>
  </div>
</div>`;

/* ---------- X1 服務異常狀態 ---------- */
const x1 = () => `
<div class="main">
  <div style="max-width:680px;margin:0 auto">
    <div class="alert alert--warn" style="font-size:var(--fs-md)">
      <div class="alert__title" style="font-size:var(--fs-lg)">⚠ 訂票系統目前暫停服務</div>
      <div class="alert__body">
        因系統升級，<b>線上訂票</b>服務已暫停。<br>
        預計 <b>2026 年 11 月 14 日 00:00 – 06:00</b> 恢復。<br>
        查詢列車時刻、班次與票價不受影響，仍可正常使用。
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-5)">
      <div class="card__head"><h2 class="card__title">你可以先做這些</h2></div>
      <div class="card__body">
        <div class="linklist">
          <a href="#A3"><span>查詢列車時刻與班次</span><span>→</span></a>
          <a href="#B2"><span>查看票價與優惠規則</span><span>→</span></a>
          <a href="#B3"><span>預先規劃乘車所需準備</span><span>→</span></a>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--sp-5)">
      <div class="card__head"><h2 class="card__title">需要馬上訂票？改用這些方式</h2></div>
      <div class="card__body">
        <div class="grid grid--3">
          <div>
            <div class="task__icon" style="margin-bottom:var(--sp-2)">${ICON.store}</div>
            <div style="font-weight:700">車站窗口</div>
            <p style="font-size:var(--fs-sm);color:var(--c-text-2)">各大車站售票窗口仍可購買</p>
          </div>
          <div>
            <div class="task__icon" style="margin-bottom:var(--sp-2)">${ICON.kiosk}</div>
            <div style="font-weight:700">自動售票機</div>
            <p style="font-size:var(--fs-sm);color:var(--c-text-2)">可刷卡或使用台灣Pay</p>
          </div>
          <div>
            <div class="task__icon" style="margin-bottom:var(--sp-2)">${ICON.phone}</div>
            <div style="font-weight:700">電話訂票</div>
            <p style="font-size:var(--fs-sm);color:var(--c-text-2)">服務時間 06:00 – 24:00</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card__head"><h2 class="card__title">聯絡客服</h2></div>
      <div class="card__body">
        <dl class="kv">
          <dt>台鐵客服專線</dt><dd>1933（軌道、隧道等緊急通報專用）</dd>
          <dt>一般服務電話</dt><dd>02-2191-0096（代表號，24 小時）</dd>
          <dt>客服信箱</dt><dd>service@railway.gov.tw（2 個工作天內回覆）</dd>
        </dl>
        <div class="btn-row" style="margin-top:var(--sp-4)">
          <button class="btn btn--primary" type="button">設定恢復通知我</button>
          <button class="btn btn--ghost" type="button" onclick="location.reload()">重新嘗試連線</button>
        </div>
        <p style="font-size:var(--fs-xs);color:var(--c-text-3);margin-top:var(--sp-3)">
          本頁最後更新：2026 年 10 月 9 日 14:28
        </p>
      </div>
    </div>
  </div>
</div>`;

/* ---------- 分鏡中繼資料 ---------- */
const SCREENS = {
  A1: { no: '分鏡 1', name: '首頁・任務導向入口', action: '行為：進入首頁，從「我要做的事」三張任務卡直接選擇「訂車票」，不需在選單中搜尋。', flow: 'Flow A・通勤族 王大仁', body: () => homeScreen('A1'), nav: '首頁', steps: [] },
  A2: { no: '分鏡 2', name: '訂票查詢表單', action: '行為：輸入出發站／抵達站（選單建議），設定日期與時段，按「查詢班次」。', flow: 'Flow A・通勤族 王大仁', body: a2, nav: '訂票', steps: ['查詢條件'] },
  A3: { no: '分鏡 3', name: '班次結果列表', action: '行為：查看 24 個班次，套用「自強號＋優惠票」篩選，對候選班次按「訂票」。', flow: 'Flow A・通勤族 王大仁', body: a3, nav: '訂票', steps: ['查詢條件', '選擇車次'] },
  A4: { no: '分鏡 4', name: '車次並排比較', action: '行為：將兩個候選班次並排比較，確認時間與票價後按下「訂這班」。', flow: 'Flow A・通勤族 王大仁', body: a4, nav: '訂票', steps: ['查詢條件', '選擇車次', '比較'] },
  B1: { no: '分鏡 5', name: '首頁・大字模式', action: '行為：熟齡旅客進入首頁後，系統已套用大字模式，字級放大 18%、對比提高。', flow: 'Flow B・熟齡旅客 陳美玲', body: () => homeScreen('B1'), nav: '首頁', steps: [], fs: 'lg' },
  B2: { no: '分鏡 6', name: '票價與優惠資格說明', action: '行為：先確認自己適用哪一種優惠票，再按「用優惠票訂票」進入訂票。', flow: 'Flow B・熟齡旅客 陳美玲', body: b2, nav: '票價與優惠', steps: [], fs: 'lg' },
  B3: { no: '分鏡 7', name: '車廂與座位選擇', action: '行為：比較四種車廂的差別與票價，選擇適合自己的車廂後繼續。', flow: 'Flow B・熟齡旅客 陳美玲', body: b3, nav: '訂票', steps: ['查詢條件', '選擇車廂'], fs: 'lg' },
  C1: { no: '分鏡 8', name: '首頁・新手導引', action: '行為：首次訂票者看到 4 步驟說明，並可從「我只想問班次」等入口開始。', flow: 'Flow C・首次使用者 Kevin', body: () => homeScreen('C1'), nav: '首頁', steps: [] },
  C2: { no: '分鏡 9', name: '訂票 Step 1・票種與方案', action: '行為：選擇票種與乘客人數，勾選台鐵好行電子票，確認應付金額。', flow: 'Flow C・首次使用者 Kevin', body: c2, nav: '訂票', steps: ['票種', '乘車人', '付款'] },
  C3: { no: '分鏡 10', name: '訂票 Step 2・乘車人資料', action: '行為：填寫證件資料與付款方式，欄位下方即時顯示格式說明與防詐提醒。', flow: 'Flow C・首次使用者 Kevin', body: c3, nav: '訂票', steps: ['票種', '乘車人', '付款'] },
  C4: { no: '分鏡 11', name: '訂票完成確認', action: '行為：看到成功回饋、訂單明細與取票進度，並可顯示電子票 QR code。', flow: 'Flow C・首次使用者 Kevin', body: c4, nav: '訂票', steps: ['票種', '乘車人', '付款'] },
  X1: { no: '分鏡 12', name: '服務異常・替代方案', action: '行為：維護期間提供替代通路、恢復時間與客服聯絡方式，避免死路。', flow: '支援畫面', body: x1, nav: '服務資訊', steps: [] }
};