/* ============================================================
   應用外殼：共用導覽、頁尾、分鏡說明列
   ============================================================ */

const NAV_ITEMS = [
  { id: 'A1', label: '首頁' },
  { id: 'A2', label: '訂票' },
  { id: 'A3', label: '時刻查詢' },
  { id: 'B2', label: '票價與優惠' },
  { id: 'X1', label: '服務資訊' }
];

const FLOWS = [
  { key: 'A', label: 'Flow A・通勤族（查詢並比較車次）', ids: ['A1', 'A2', 'A3', 'A4'] },
  { key: 'B', label: 'Flow B・熟齡旅客（看懂票價與優惠）', ids: ['B1', 'B2', 'B3'] },
  { key: 'C', label: 'Flow C・首次使用者（完成訂票）', ids: ['C1', 'C2', 'C3', 'C4'] },
  { key: 'X', label: '支援畫面', ids: ['X1'] }
];

const currentId = () => {
  const h = (location.hash || '#A1').replace('#', '').toUpperCase();
  return SCREENS[h] ? h : 'A1';
};

/* ---------- 共用頁首 ---------- */
function renderHeader(screen) {
  const steps = screen.steps || [];
  const stepsHtml = steps.length ? `
    <div class="steps" aria-label="目前進度">
      ${steps.map((s, i) => {
        const state = i === steps.length - 1 ? 'current' : 'done';
        return `
        <div class="steps__item" data-state="${state}">
          <span class="steps__dot">${i + 1}</span><span>${s}</span>
        </div>${i < steps.length - 1 ? '<span class="steps__sep"></span>' : ''}`;
      }).join('')}
    </div>` : '';

  return `
  <header class="appbar">
    <div class="appbar__top">
      <a class="brand" href="#A1">
        <span class="brand__mark" aria-hidden="true">鐵</span>
        <span class="brand__txt">
          <span class="brand__title">臺鐵乘車資訊服務</span>
          <span class="brand__sub">Taiwan Railway e-Service</span>
        </span>
      </a>
      <nav class="nav" aria-label="主要導覽">
        ${NAV_ITEMS.map(n => `<a href="#${n.id}" ${n.label === screen.nav ? 'aria-current="page"' : ''}>${n.label}</a>`).join('')}
      </nav>
      <div class="appbar__tools">
        <button class="tool" type="button" id="fs-toggle" aria-pressed="${document.body.dataset.fontscale === 'lg'}" title="放大畫面文字">${ICON.tag.replace('class="icon"', 'class="icon"')} 大字</button>
        <button class="tool" type="button" title="切換語言">中文 / EN</button>
        <button class="tool" type="button" title="登入會員">登入</button>
      </div>
    </div>
    <div class="appbar__sub">
      <div class="appbar__sub-in">
        <span class="status">全線行車正常</span>
        ${stepsHtml || '<span style="color:#C9DCF2;font-size:13px">系統狀態：正常｜最後更新 2026/10/09 14:28</span>'}
        <nav class="breadcrumb" aria-label="麵包屑" style="margin-left:auto">
          <ul>
            <li><a href="#A1">首頁</a></li>
            ${screen.nav === '首頁' ? '' : `<li><span>${screen.nav}</span></li>`}
          </ul>
        </nav>
      </div>
    </div>
  </header>`;
}

/* ---------- 共用頁尾 ---------- */
function renderFooter() {
  return `
  <footer class="appfoot">
    <div class="appfoot__in">
      <div>
        <h3>臺鐵乘車資訊服務</h3>
        <p>本網站提供臺灣鐵路管理局行車資訊查詢、線上訂票與票價資訊。<br>
        如有疑問請撥打 1933 或 02-2191-0096（代表號）。</p>
      </div>
      <div>
        <h3>快速連結</h3>
        <a href="#A2">線上訂票</a>
        <a href="#A3">列車時刻查詢</a>
        <a href="#B2">票價與優惠</a>
        <a href="#X1">服務資訊</a>
      </div>
      <div>
        <h3>無障礙與政策</h3>
        <a href="#X1">無障礙服務聲明</a>
        <a href="#X1">隱私權政策</a>
        <a href="#X1">乘車條款</a>
        <a href="#X1">網站意見箱</a>
      </div>
    </div>
    <div class="appfoot__bar">國營臺灣鐵路股份有限公司 ｜ 本頁為介面設計課程之重新設計原型，非正式服務</div>
  </footer>`;
}

/* ---------- 分鏡說明列 ---------- */
function renderCaption(screen) {
  return `
  <div class="shot__caption">
    <span class="shot__no">${screen.no}</span>
    <span class="shot__name">${screen.name}</span>
    <span class="shot__meta">${screen.action}</span>
    <span class="shot__flow">${screen.flow}</span>
  </div>`;
}

/* ---------- 分鏡切換列 ---------- */
function renderShotNav(active) {
  const groups = FLOWS.map(f => `
    <span class="shotnav__lbl">${f.label}</span>
    ${f.ids.map(id => `<a href="#${id}" ${id === active ? 'aria-current="page"' : ''}>${SCREENS[id].no.replace('分鏡 ', '')}</a>`).join('')}
  `).join('');
  return `<nav class="shotnav" aria-label="分鏡導覽">${groups}</nav>`;
}

/* ---------- 渲染 ---------- */
function render() {
  const id = currentId();
  const screen = SCREENS[id];

  document.body.dataset.screen = id;
  document.title = `${screen.no}｜${screen.name} — 臺鐵介面重新設計`;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="shot">
      ${renderCaption(screen)}
      <div class="app">
        ${renderHeader(screen)}
        <main id="main" tabindex="-1">${screen.body()}</main>
        ${renderFooter()}
      </div>
      ${renderShotNav(id)}
    </div>
    <button class="backtop" type="button" aria-label="回到頁面頂端" id="backtop">↑</button>`;

  // 大字模式：畫面指定 or 使用者偏好
  const wantLg = screen.fs === 'lg' || localStorage.getItem('tw-fontscale') === 'lg';
  if (wantLg) document.body.dataset.fontscale = 'lg';
  else delete document.body.dataset.fontscale;
  syncFsButton();
}

/* ---------- 互動 ---------- */
function syncFsButton() {
  const b = document.getElementById('fs-toggle');
  if (b) b.setAttribute('aria-pressed', document.body.dataset.fontscale === 'lg' ? 'true' : 'false');
}

document.addEventListener('click', (e) => {
  // 畫面跳轉
  const go = e.target.closest('[data-go]');
  if (go) { location.hash = '#' + go.dataset.go; return; }

  // 大字模式
  if (e.target.closest('#fs-toggle')) {
    const on = document.body.dataset.fontscale === 'lg';
    if (on) { delete document.body.dataset.fontscale; localStorage.removeItem('tw-fontscale'); }
    else { document.body.dataset.fontscale = 'lg'; localStorage.setItem('tw-fontscale', 'lg'); }
    syncFsButton();
    return;
  }

  // 分段控制 / 篩選 chip
  const segBtn = e.target.closest('.seg button');
  if (segBtn) {
    Array.from(segBtn.parentElement.children).forEach(b => b.setAttribute('aria-pressed', 'false'));
    segBtn.setAttribute('aria-pressed', 'true');
    return;
  }
  const chip = e.target.closest('.chip');
  if (chip) {
    chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    return;
  }

  // 方案卡選取
  const plan = e.target.closest('.plan');
  if (plan && plan.dataset.selected !== undefined) {
    const group = plan.parentElement;
    Array.from(group.querySelectorAll('.plan')).forEach(p => p.dataset.selected = 'false');
    plan.dataset.selected = 'true';
    const radio = plan.querySelector('input[type=radio]');
    if (radio) radio.checked = true;
  }
});

window.addEventListener('hashchange', () => { render(); window.scrollTo({ top: 0, behavior: 'smooth' }); const m = document.getElementById('main'); if (m) m.focus({ preventScroll: true }); });

// 回到頂端按鈕
document.addEventListener('click', (e) => {
  if (e.target.closest('#backtop')) { window.scrollTo({ top: 0, behavior: 'smooth' }); }
});
window.addEventListener('scroll', () => {
  const b = document.getElementById('backtop');
  if (!b) return;
  b.classList.toggle('backtop--show', window.scrollY > 400);
}, { passive: true });

render();