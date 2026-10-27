/* 共用互動：大字模式、回到頂端、方案選取、車站交換、比較勾選 */
(function () {
  const root = document.body;
  const fsButton = document.getElementById('fs-toggle');

  function syncFontButton() {
    if (fsButton) fsButton.setAttribute('aria-pressed', root.dataset.fontscale === 'lg' ? 'true' : 'false');
  }

  if (fsButton) {
    fsButton.addEventListener('click', function () {
      const on = root.dataset.fontscale === 'lg';
      if (on) {
        delete root.dataset.fontscale;
        localStorage.removeItem('tw-fontscale');
      } else {
        root.dataset.fontscale = 'lg';
        localStorage.setItem('tw-fontscale', 'lg');
      }
      syncFontButton();
    });
  }

  // 使用者手動選過大字，就延續偏好（伺服器端也會依會員設定帶入）。
  if (localStorage.getItem('tw-fontscale') === 'lg') root.dataset.fontscale = 'lg';
  syncFontButton();

  // 回到頂端
  const backtop = document.getElementById('backtop');
  if (backtop) {
    backtop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      backtop.classList.toggle('backtop--show', window.scrollY > 400);
    }, { passive: true });
  }

  // 方案卡 / 車廂卡選取
  document.addEventListener('change', (event) => {
    const input = event.target.closest('.plan input[type="radio"]');
    if (!input) return;
    const group = input.closest('.card__body') || document;
    group.querySelectorAll('.plan').forEach((plan) => {
      plan.dataset.selected = plan.contains(input) ? 'true' : 'false';
    });
  });

  // 交換出發 / 抵達站
  const swap = document.getElementById('swap-stations');
  if (swap) {
    swap.addEventListener('click', () => {
      const from = document.getElementById('from');
      const to = document.getElementById('to');
      if (!from || !to) return;
      const value = from.value;
      from.value = to.value;
      to.value = value;
    });
  }

  // 比較勾選最多 3 班
  const compareBoxes = Array.from(document.querySelectorAll('input[name="ids"]'));
  const compareButton = document.getElementById('compare-submit');
  function syncCompare() {
    const checked = compareBoxes.filter((box) => box.checked);
    compareBoxes.forEach((box) => {
      box.disabled = !box.checked && checked.length >= 3;
    });
    if (compareButton) {
      compareButton.textContent = checked.length
        ? `比較這 ${checked.length} 班`
        : '比較勾選班次';
      compareButton.disabled = checked.length < 2;
    }
  }
  compareBoxes.forEach((box) => box.addEventListener('change', syncCompare));
  syncCompare();

  // 表單送出時確認至少勾選 2 班；view 會接收多個 ids 參數
  const compareForm = document.getElementById('compare-form');
  if (compareForm) {
    compareForm.addEventListener('submit', (event) => {
      const ids = compareBoxes.filter((box) => box.checked).map((box) => box.value);
      if (ids.length < 2) {
        event.preventDefault();
      }
    });
  }

  // 車站 autocomplete（若頁面有 data-station-autocomplete）
  document.querySelectorAll('[data-station-autocomplete]').forEach((input) => {
    const list = document.getElementById(input.getAttribute('list'));
    if (!list) return;
    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const query = input.value.trim();
      if (query.length < 1) return;
      timer = setTimeout(async () => {
        try {
          const response = await fetch(`/api/stations/?q=${encodeURIComponent(query)}`);
          if (!response.ok) return;
          const data = await response.json();
          list.innerHTML = '';
          data.results.forEach((station) => {
            const option = document.createElement('option');
            option.value = station.name;
            option.label = `${station.name}（${station.city || station.code}）`;
            list.appendChild(option);
          });
        } catch (error) {
          /* 離線或 API 失敗時保留原本的 datalist 選項 */
        }
      }, 180);
    });
  });
})();
