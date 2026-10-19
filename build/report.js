/* ============================================================
   介面設計 HW1 — Bad UI 案例分析與重新設計 報告產生器
   ============================================================ */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, HeadingLevel, AlignmentType, WidthType, ShadingType,
  BorderStyle, PageBreak, Footer, PageNumber, LevelFormat, VerticalAlign,
  UnderlineType, HeightRule
} = require('docx');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'output');
const OUT = path.join(OUT_DIR, '介面設計_HW1_台鐵BadUI案例分析與重新設計.docx');

/* ---------- 常數 ---------- */
const PAGE_W = 11906;            // A4
const MARGIN = 1080;
const CONTENT = PAGE_W - MARGIN * 2;   // 9746

const FONT = { ascii: 'Microsoft JhengHei', eastAsia: 'Microsoft JhengHei', hAnsi: 'Microsoft JhengHei', cs: 'Microsoft JhengHei' };
const MONO = { ascii: 'Consolas', eastAsia: 'Microsoft JhengHei', hAnsi: 'Consolas', cs: 'Consolas' };
const PRIMARY = '0B4F8F';
const ACCENT = 'C43E06';
const HDR_BG = 'E6EFF8';
const ALT_BG = 'F6F9FC';

const BD = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
const BORDERS = { top: BD, bottom: BD, left: BD, right: BD };
const CELL_MARGIN = { top: 70, bottom: 70, left: 110, right: 110 };

/* ---------- 生成式 AI 使用聲明（共用資料） ---------- */
const AI_TOOLS = [
  ['Claude（Anthropic）',
    '第 II 節截圖介面問題診斷、8 項 Bad UI 問題分類與影響推論；第 III 節 Persona 特徵與痛點擬定；第 IV 節 User Story 撰寫；第 VI 節 User Flow 異常分支檢核。',
    '逐項回到臺鐵官網實際操作驗證，並以 Lighthouse 檢測數據佐證。'],
  ['OpenCode（opencode）',
    '第 VII 節高保真原型之 HTML／CSS／JS 程式撰寫（Design System、12 張分鏡畫面）；第 VIII 節 Bad UI vs. Redesign 比較表與量化指標草擬；全文章節文字整理、表格與 Word 排版程式產出。',
    '逐張人工檢視 12 張分鏡圖，確認共用同一套 Design System；全文數據與截圖皆為實測值。']
];

const AI_STATEMENT =
  '本報告部分內容（介面問題分析、Persona 與 User Story 擬定、User Flow 檢核、重新設計分鏡圖之介面實作、全文文字整理）使用生成式 AI 協助完成。' +
  '使用的工具名稱與各工具的協助範圍詳見下方對照表，並於對應章節以「生成式 AI 使用標注」標示。' +
  '所有 AI 產出內容均經組員人工覆核，並回到原始網站實測或以 Lighthouse 數據佐證後才納入本報告。';

/* ---------- 工具 ---------- */
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('not png: ' + file);
  return { buf: b, w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const t = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color });
const p = (text, o = {}) => new Paragraph({
  alignment: o.align || AlignmentType.BOTH,
  spacing: { before: o.before || 0, after: o.after === undefined ? 120 : o.after, line: o.line || 300 },
  indent: o.indent,
  children: Array.isArray(text) ? text : [t(text, o)]
});
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 200 }, children: [t(text, { bold: true, size: 32, color: PRIMARY })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 140 }, children: [t(text, { bold: true, size: 26, color: '1B2430' })] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 }, children: [t(text, { bold: true, size: 23, color: ACCENT })] });
const bullet = (text, lvl = 0) => new Paragraph({
  numbering: { reference: 'ul', level: lvl }, spacing: { after: 70, line: 300 },
  children: Array.isArray(text) ? text : [t(text)]
});
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const cellP = (text, o = {}) => new Paragraph({
  alignment: o.align || AlignmentType.LEFT,
  spacing: { before: 20, after: 20, line: 280 },
  children: Array.isArray(text)
    ? text
    : (text instanceof TextRun ? [text] : [t(text, { size: o.size || 19, bold: o.bold })])
});

/** 表格：cols 寬度總和必須等於 total */
function table(cols, rows, opt = {}) {
  const total = cols.reduce((a, b) => a + b, 0);
  const trs = rows.map((r, ri) => {
    const isHdr = ri === 0 && opt.header !== false;
    return new TableRow({
      tableHeader: isHdr,
      height: opt.rowHeight ? { value: opt.rowHeight, rule: HeightRule.ATLEAST } : undefined,
      children: r.map((c, ci) => new TableCell({
        width: { size: cols[ci], type: WidthType.DXA },
        margins: CELL_MARGIN,
        verticalAlign: VerticalAlign.CENTER,
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: isHdr ? HDR_BG : (opt.rowFill || (ri % 2 === 0 ? ALT_BG : 'FFFFFF')) },
        borders: BORDERS,
        children: (Array.isArray(c) ? c : [c]).map(x =>
          x instanceof Paragraph ? x : cellP(x, { bold: isHdr, align: opt.align && opt.align[ci] }))
      }))
    });
  });
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: cols,
    rows: trs
  });
}

const spacer = (h = 100) => new Paragraph({ spacing: { after: h }, children: [t('')] });

/** 圖片 + 圖說 */
function figure(file, caption, maxHIn = 8.0) {
  const { buf, w, h } = pngSize(path.join(ROOT, file));
  const maxWIn = 6.45;
  let wIn = maxWIn;
  let hIn = wIn * (h / w);
  if (hIn > maxHIn) { hIn = maxHIn; wIn = hIn * (w / h); }
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 60 },
      children: [new ImageRun({
        type: 'png', data: buf,
        transformation: { width: Math.round(wIn * 96), height: Math.round(hIn * 96) }
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [t(caption, { size: 18, color: '43505F' })]
    })
  ];
}

const caption = (text) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 },
  children: [t(text, { size: 18, color: '43505F' })]
});

/* ---------- AI 使用標注 ---------- */
const AI_GREEN = '256B3C';
const AI_BORDER = 'C9D8E6';
const AI_BG = 'F2F8F4';

/** AI 標注框：淺綠底 + 左側粗線，用於標示該處內容有 AI 參與 */
function aiNote(lines) {
  return [
    new Table({
      width: { size: CONTENT, type: WidthType.DXA },
      columnWidths: [CONTENT],
      rows: [new TableRow({
        children: [new TableCell({
          width: { size: CONTENT, type: WidthType.DXA },
          margins: { top: 130, bottom: 130, left: 150, right: 150 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: AI_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: AI_BORDER },
            left: { style: BorderStyle.SINGLE, size: 18, color: AI_GREEN },
            right: { style: BorderStyle.SINGLE, size: 4, color: AI_BORDER }
          },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: AI_BG },
          children: lines.map((ln, i) => new Paragraph({
            spacing: { before: 0, after: i === lines.length - 1 ? 0 : 60, line: 280 },
            children: Array.isArray(ln) ? ln : [t(ln, { size: 18 })]
          }))
        })]
      })]
    }),
    spacer(160)
  ];
}

const aiTag = (text) => t(text, { bold: true, size: 18, color: AI_GREEN });

/* ============================================================
   內容
   ============================================================ */
const B = [];

/* ---------- 封面 ---------- */
B.push(new Paragraph({ spacing: { before: 2400, after: 0 }, alignment: AlignmentType.CENTER, children: [t('介面設計  第一次作業', { size: 24, color: '43505F' })] }));
B.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 }, children: [t('Bad UI 案例分析與重新設計', { bold: true, size: 52, color: PRIMARY })] }));
B.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 500 }, children: [t('以「國營臺灣鐵路股份有限公司」官網為例', { size: 28, color: '43505F' })] }));
B.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
  t('從實際截圖出發，完成 Bad UI 問題分析、Target User 與 Persona、User Story、', { size: 20, color: '5E6B7A' })
] }));
B.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 }, children: [
  t('Scenario、User Flow，並產出 12 張風格一致的重新設計分鏡圖與 AI 輔助比較分析。', { size: 20, color: '5E6B7A' })
] }));
B.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [t('國營臺灣鐵路股份有限公司　Taiwan Railways Administration', { bold: true, size: 22, color: ACCENT })] }));
B.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [t('https://www.railway.gov.tw/', { size: 20, color: '43505F' })] }));

/* ---------- 分組名單（封面） ---------- */
const GROUP_NO = '第13組';
const GROUP_MEMBERS = [
  { name: '曾宥綸', sid: 'B11317017' },
  { name: '吳嘉恩', sid: 'B11317032' },
  { name: '陳柏宏', sid: 'B11317040' },
  { name: '王慈文', sid: 'B11317042' }
];

B.push(new Paragraph({
  spacing: { before: 800, after: 0 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY, space: 8 } },
  children: [t('分組名單', { bold: true, size: 24, color: PRIMARY })]
}));
B.push(new Paragraph({
  spacing: { before: 200, after: 160 },
  children: [
    t('分組編號：', { bold: true, size: 20 }),
    t(GROUP_NO, { bold: true, size: 20, color: ACCENT })
  ]
}));
const GROUP_COLS = [900, CONTENT - 900 - 2400, 2400];
B.push(table(GROUP_COLS, [
  ['序號', '組員姓名', '學號'],
  ...GROUP_MEMBERS.map((m, i) => [
    t(String(i + 1), { size: 19 }),
    t(m.name, { size: 19 }),
    t(m.sid, { size: 19 })
  ])
], {
  align: [AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.CENTER],
  rowFill: 'FFFFFF',
  rowHeight: 480
}));

B.push(pageBreak());

/* ---------- 生成式 AI 使用聲明 ---------- */
B.push(h1('生成式 AI 使用聲明'));
B.push(p('本作業依規定茲聲明使用生成式 AI 之情形與工具名稱如下。', { size: 20 }));
B.push(...aiNote([
  [aiTag('■ 聲明')],
  AI_STATEMENT
]));
B.push(h2('使用的生成式 AI 工具與範圍'));
B.push(table([1900, CONTENT - 1900 - 2500, 2500], [
  ['工具名稱', '使用範圍', '人工覆核方式'],
  ...AI_TOOLS.map(([name, use, check]) => [
    t(name, { bold: true, size: 18 }),
    t(use, { size: 17 }),
    t(check, { size: 17 })
  ])
], {
  align: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT]
}));
B.push(spacer(200));
B.push(p('本報告於各章節另以「生成式 AI 使用標注」方框標示該章節由 AI 協助的具體內容與組員的人工覆核方式；完整的 Prompt 紀錄與 AI 產出說明見第 8.3 節。', { size: 19, color: '5E6B7A' }));

B.push(pageBreak());

/* ---------- 目錄 ---------- */
B.push(h1('目錄'));
const TOC = [
  ['I', 'Bad UI Case 選擇'],
  ['II', 'Bad UI 問題分析（8 項）'],
  ['III', 'Target User 與 Persona'],
  ['IV', 'User Story'],
  ['V', 'Scenario'],
  ['VI', 'User Flow（3 組主要任務）'],
  ['VII', 'Redesign 介面操作規劃分鏡圖（12 張）'],
  ['VIII', 'AI 分析：Bad UI vs. Redesign'],
  ['IX', '組員貢獻']
];
B.push(table([1100, CONTENT - 1100], TOC.map(([n, s]) => [t(n, { bold: true, size: 21, color: ACCENT }), t(s, { size: 21 })])));
B.push(spacer(200));
B.push(p('本報告所有 Bad UI 截圖皆為實際開啟網站後擷取；Redesign 分鏡圖則由本專案自建的 HTML/CSS 高保真原型產生，所有畫面共用同一套 Design System。', { size: 19, color: '5E6B7A' }));
B.push(pageBreak());

/* ============================================================
   I. Bad UI Case 選擇
   ============================================================ */
B.push(h1('I.  Bad UI Case 選擇'));
B.push(table([1900, CONTENT - 1900], [
  ['項目', '內容'],
  ['網站名稱', '國營臺灣鐵路股份有限公司 官方網站（臺鐵公司官網）'],
  ['網站連結', 'https://www.railway.gov.tw/'],
  ['主要流程頁', 'https://www.railway.gov.tw/tra-tip-web/tip/tip001/tip112/querybytime（列車時刻／車次查詢）'],
  ['擷取日期', '2026 年 10 月 9 日（週五），視窗寬度 1280×900 以上'],
  ['網站用途', '提供全台鐵路運輸服務的公開資訊與線上服務，包含：列車時刻／班次查詢、線上訂票、票價與優惠資訊、車次動態（列車即時位置）、旅遊票券、購物商城、會員服務與客服聯絡。'],
  ['選擇原因', '見下方說明']
].map((r, i) => r.map((c, j) => (i === 0 ? t(c, { bold: true, size: 21 }) : (j === 0 ? t(c, { bold: true, size: 19 }) : t(c, { size: 19 }))))), { header: true }));

B.push(h2('選擇原因'));
B.push(bullet([t('使用規模大、影響層面廣。', { bold: true }), t('台鐵是台灣最主要的城際運輸系統，線上訂票與時刻查詢幾乎是全民與外國旅客的必備工具，介面問題的影響人數遠大於一般網站。')]));
B.push(bullet([t('問題具有代表性且可觀察。', { bold: true }), t('從首頁到查詢結果的整條主流程中，同時存在資訊層級、導覽、版面配置、一致性、操作回饋與可讀性等問題，且都能以截圖具體標示，不需臆測。')]));
B.push(bullet([t('決策點密集，適合做 User Flow 設計。', { bold: true }), t('查詢條件（出發站、抵達站、日期、時段）、車次比較、票種選擇、乘車人資料等環節含多個分支與限制條件，能撐起三組具代表性的 User Flow。')]));
B.push(bullet([t('使用者樣貌多元。', { bold: true }), t('通勤族、熟齡旅客、首次線上訂票者／外國旅客都會使用同一個網站，適合定義三類 Target User 與 Persona。')]));
B.push(bullet([t('具備官方維護與公開資料的優勢。', { bold: true }), t('網站由上市公司維護，介面若要改版涉及多個業務系統整合，議題具有討論價值，也讓「重新設計」不只是換色，而是重新思考資訊架構。')]));

B.push(h2('原始介面截圖'));
B.push(p('以下 7 張截圖涵蓋網站首頁與「列車時刻查詢」主要操作流程，依序為：', { size: 20 }));

B.push(...figure('assets/badui/01-home.png', '圖 1-1　官網首頁：Cookie 同意橫幅以全寬黑底壓在畫面最下方，遮住下方內容；主體為輪播廣告。'));
B.push(...figure('assets/badui/02-home-navpanel.png', '圖 1-2　官網首頁：右側固定浮動選單的文字被視窗邊界裁切，「臺鐵購物工場」換行溢出、「台鐵便當」「聯絡客服」文字遭截斷。'));
B.push(...figure('assets/badui/03-error-deadend.png', '圖 1-3　線上訂票頁面：系統維護訊息為死路畫面，只有「回首頁」一個按鈕，未提供預計恢復時間、替代通路或重試機制。'));
B.push(...figure('assets/badui/04-search-form.png', '圖 1-4　列車時刻查詢：表單與新聞專區在同一頁並存，資訊層級混雜；出發站欄位出現紅色虛線框卻無任何錯誤說明文字。'));
B.push(...figure('assets/badui/05-validation-error.png', '圖 1-5　送出查詢後的驗證錯誤：錯誤訊息為「出發站格式錯誤／抵達站格式錯誤」，未說明真正原因（必須從自動完成清單選取），使用者無從修正。'));
B.push(...figure('assets/badui/06-results-table.png', '圖 1-6　查詢結果表格：欄位過多且字級偏小；右側固定浮動選單直接遮住最右欄「訂票」，使用者無法完成主要任務。'));
B.push(...figure('assets/badui/07-results-context-lost.png', '圖 1-7　查詢結果捲動後：原始查詢條件已離開畫面，使用者無法確認自己在查哪一條路線、哪一天的班次。'));
B.push(pageBreak());

/* ============================================================
   II. Bad UI 問題分析
   ============================================================ */
B.push(h1('II.  Bad UI 問題分析'));
B.push(p('以下 8 項問題皆可由前述截圖觀察到，並附上對應的客觀檢測數據。每一項問題在最後一欄標註「呼應設計」，指向後續 User Flow（第 VI 節）與 Redesign 分鏡（第 VII 節）具體解決它的畫面，確保分析與設計互相扣連。', { size: 20 }));

B.push(...aiNote([
  [aiTag('■ 生成式 AI 使用標注（本節）')],
  '本節 P1–P8 的問題分類與影響推論由 Claude（Anthropic）協助草擬；組員逐項回到臺鐵官網重新操作驗證（例如實測「自行輸入站名會被退回」、「訂票欄遭浮動選單遮擋」），並以 4.3 節的 Lighthouse 檢測數據佐證後才定稿。'
]));

const PROBLEMS = [
  ['P1', '資訊層級', '首頁的資訊層級倒置：最上方的視覺焦點是大型輪播廣告（TPASS、行政院通勤月票），而使用者最高頻的任務「查詢班次／訂票」僅是首頁下半部一個深色區塊中的小表單，且夾在新聞專區之下。輪播自動播放會持續改變焦點，進一步干擾任務導向。', '使用者進入網站的前 5 秒無法判斷主要任務入口，放棄率上升。', 'P2 導覽', '分鏡 1：首頁改以「我要做的事」三張任務卡作為唯一主要入口，輪播降級為次要資訊。'],
  ['P2', '導覽', '導覽方式衝突且效率低：頂部有 7 個等權重的主選單（線上訂票／旅客服務／旅遊票券／鐵道旅遊／線上購物／會員服務／關於臺鐵），右側又有一組固定浮動選單重複導覽功能；兩組導覽沒有明確的任務分工，使用者需要自己判斷該走哪一條。', '選單項目過多造成選擇負擔；重複導覽增加維護成本且容易不一致。', 'P2 導覽', '分鏡 1～2：頂部導覽精簡為 5 個項目並標示目前所在位置（aria-current），移除浮動選單。'],
  ['P3', '版面配置', '版面配置嚴重失衡：右側固定浮動選單寬度固定卻未避開內容區，於 1280px 以上寬度時直接覆蓋查詢結果表格最右側的「訂票」欄（見圖 1-6）；頁尾註明「最低解析度 1280×1024」，且未提供行動版適配，手機使用者只能以縮放瀏覽。', '主要任務按鈕被遮住，使用者無法完成訂票，屬於功能性阻斷。', 'P2 導覽、P3 版面', '分鏡 3：移除浮動選單，結果採卡片式列表，訂票按鈕固定於每張卡片右側，不受任何覆蓋。'],
  ['P4', '一致性', '色彩與元件語彙不一致：頁面同時出現深藍、淺藍、亮綠（系統狀態整條色塊）、橘紅（車次類別標籤）與深紅（警語）五種以上強調色；錯誤訊息、公告、警語與一般內文混用紅／黑字，且沒有統一的元件樣式可依循。', '色彩無法承載語意，使用者難以快速分辨「警示」與「強調」。', 'P5 操作回饋、P6 可讀性', 'Design System：全站僅保留 1 種品牌藍、1 種行動橘與 3 種狀態色（成功／注意／錯誤），語意固定。'],
  ['P5', '操作回饋', '操作回饋不足且具誤導性：出發站／抵達站為可自由輸入的文字欄，但系統實際要求必須從自動完成清單中選取站台代碼；使用者自行輸入「臺北／台中」後送出，只會得到「出發站格式錯誤」而無法得知真正原因（見圖 1-5）。維護期間的錯誤頁（圖 1-3）同樣沒有重試按鈕、預計恢復時間或替代方案。', '使用者反覆嘗試仍無法完成任務，信任感下降，轉而放棄線上服務。', 'P4 一致性、P5 操作回饋', '分鏡 2：欄位即時標示錯誤並寫明正確作法；分鏡 12：異常頁提供恢復時間、三種替代通路與重試按鈕。'],
  ['P6', '可讀性', '可讀性不足：查詢結果表格字級偏小且欄位密集（10 欄），次要文字使用低對比灰色；Lighthouse 明確回報「連結僅依賴顏色區辨（link-in-text-block）」，色弱使用者難以辨識可點擊的文字。', '熟齡與低視力使用者閱讀困難，可能誤判哪些文字可點擊。', 'P6 可讀性', 'Design System：內文對比提升至 15.8:1，次要文字 8.3:1；連結一律加註下劃線；字級最小 13px、內文 16px。'],
  ['P7', '無障礙', '表單控制項缺少無障礙名稱：以瀏覽器的無障礙樹檢視查詢頁時，整個查詢表單的子節點全部呈現為無名稱的 generic 節點，輸入框、下拉選單未提供可供輔助技術辨識的標籤；Lighthouse 亦回報文件缺少 main 地標（landmark-one-main）與清單結構錯誤。', '螢幕閱讀器使用者無法得知每個欄位要填什麼，實質上無法使用查詢功能。', 'P7 無障礙、P6 可讀性', '分鏡 2、10：所有欄位以 label for 正確關聯、補上必要欄位標記與 aria-describedby，並加入 main 地標與「跳至主要內容」。'],
  ['P8', '版面配置／操作回饋', '查詢脈絡中斷：捲動到結果表格後，原本的查詢條件（出發站、抵達站、日期、時段）已離開畫面，畫面上也不顯示查詢時間與結果筆數，使用者容易忘記自己在查哪一條路線。', '使用者需反覆捲動確認條件，增加認知負荷與誤訂風險。', 'P8 版面配置', '分鏡 3：結果頁頂部設固定「查詢摘要列」，隨時顯示路線、日期、時段與結果筆數，並提供「修改條件」。']
];

B.push(table([560, 1000, 3050, 1900, 1100, CONTENT - 7610],
  [['編號', '問題類別', '問題描述（截圖佐證）', '對使用者的影響', '呼應設計', '對應分鏡']]
    .concat(PROBLEMS.map(r => [
      t(r[0], { bold: true, size: 19, color: ACCENT }),
      t(r[1], { bold: true, size: 19 }),
      t(r[2], { size: 18 }),
      t(r[3], { size: 18 }),
      t(r[4], { size: 18, color: '43505F' }),
      t(r[5], { size: 18, color: '43505F' })
    ]))));

B.push(h2('客觀檢測數據（Lighthouse）'));
B.push(p('為避免僅憑主觀印象判斷，於同一頁面（列車時刻／車次查詢結果頁）執行 Lighthouse 檢測，結果如下：', { size: 20 }));
B.push(table([2600, 1500, CONTENT - 4100], [
  ['檢測項目', '分數', '說明'],
  ['Accessibility（無障礙）', '0.89', '未達滿分，代表存在可修正的無障礙缺陷'],
  ['Best Practices（最佳實務）', '0.83', '包含圖片比例、連結可抓取等問題'],
  ['SEO（搜尋最佳化）', '0.80', '連結未使用有效 href，影響可爬性']
].map((r, i) => r.map((c, j) => (i === 0 ? t(c, { bold: true, size: 19 }) : t(c, { size: 19, bold: j === 1 }))))));
B.push(spacer(120));
B.push(h3('Lighthouse 回報的具體失敗項目'));
[
  'Links rely on color to be distinguishable（連結僅靠顏色區辨）→ 對應 P6 可讀性',
  'Document does not have a main landmark（缺少 main 地標）→ 對應 P7 無障礙',
  'Lists do not contain only <li> / List items not contained within <ul>（清單結構錯誤）→ 對應 P7',
  'Links are not crawlable（連結不可抓取）→ 對應 P2 導覽',
  'Displays images with incorrect aspect ratio（圖片比例失真）→ 對應 P3 版面配置'
].forEach(x => B.push(bullet(x)));
B.push(pageBreak());

/* ============================================================
   III. Target User 與 Persona
   ============================================================ */
B.push(h1('III.  Target User 與 Persona'));
B.push(p('依據官網的實際功能與使用情境，將使用者分為三類 Target User，並各建立一位 Persona。三者的核心需求互補，且分別對應第 II 節的問題群 P2、P6 與 P7。', { size: 20 }));

B.push(...aiNote([
  [aiTag('■ 生成式 AI 使用標注（本節）')],
  '本節三類 Target User 的劃分與三位 Persona 的特徵、痛點由 Claude（Anthropic）協助擬定；組員依官網實際功能與使用情境逐項修正，並確保每位 Persona 的痛點皆對應到第 II 節的具體問題編號。'
]));

B.push(h2('3.1　三類 Target User 對照'));
B.push(table([1500, 2500, 2500, CONTENT - 6500], [
  ['Target User', '使用者輪廓', '最主要任務', '對應主要問題'],
  ['都會通勤族', '20–40 歲上班族與學生，每週固定往返通勤，月使用 8 次以上', '快速查詢班次、比較時間與票價、完成訂票', 'P1 資訊層級、P3 版面配置'],
  ['熟齡旅客', '55–70 歲，視力與操作熟練度下降，偏好放大瀏覽器或前往車站窗口', '看懂票價與優惠資格、確認應備證件、選擇合適車廂', 'P6 可讀性、P4 一致性'],
  ['首次線上訂票者／外國旅客', '無台鐵訂票經驗，語言或數位能力非母語，需逐步引導', '在不理解規則的情況下完成第一次訂票，並確認資料安全', 'P5 操作回饋、P7 無障礙']
].map((r, i) => r.map((c, j) => (i === 0 ? t(c, { bold: true, size: 19 }) : t(c, { size: 19, bold: j === 0 }))))));

const personaRows = (rows) => table([1700, CONTENT - 1700],
  rows.map((r, i) => i === 0
    ? [t('項目', { bold: true, size: 21 }), t('內容', { bold: true, size: 21 })]
    : [t(r[0], { bold: true, size: 19 }), t(r[1], { size: 19 })]));

B.push(h2('3.2　Persona A｜王大仁（都會通勤族）'));
B.push(caption('一句話描述：每週要往返兩次、預算有限、只在意「最快哪一班」的工程師。'));
B.push(personaRows([
  ['基本背景', '32 歲，竹北某軟體業公司工程經理，雙薪家庭。通勤往返台北與板橋，固定搭乘台鐵自強號。'],
  ['使用目標', '在 30 秒內找到最早抵達且仍有優惠票的車次，並完成訂票，不拖到出發前一天。'],
  ['核心需求', '① 一眼比較出發／抵達時間；② 票價與優惠席次數同時可見；③ 不需登入即可查詢；④ 篩選後結果不跳頁。'],
  ['行為／使用習慣', '多以筆電操作，但出門前改用手機；習慣先看時間欄再看價格；會使用篩選器；不願閱讀超過三行的說明文字。'],
  ['使用情境', '週五晚上 22:40 規劃下週一的回程車票，此時火車已接近滿班。'],
  ['痛點', '首頁被輪播廣告佔滿，找不到訂票入口；結果表格的「訂票」欄被右側浮動選單遮住；欄位太寬需橫向捲動；捲動後忘記自己查的是哪一天。']
]));

B.push(h2('3.3　Persona B｜陳美玲（熟齡旅客）'));
B.push(caption('一句話描述：想省錢、怕被多收費、看得清楚比做得快更重要的退休教師。'));
B.push(personaRows([
  ['基本背景', '67 歲，國中教師退休，居住台中，每季到台北探望子女與孫子。瀏覽器偏好設定為 150% 縮放。'],
  ['使用目標', '購買敬老票，並盡可能安排靠走道或鄰近洗手間的座位，順利完成往返行程。'],
  ['核心需求', '① 足夠大的字級與高對比；② 清楚知道自己符合哪一種優惠票、要出示哪一種證件；③ 選項數量少、每一步都說明在做什麼。'],
  ['行為／使用習慣', '習慣放大瀏覽器；看不懂的介面會先找「回首頁」或直接撥打客服電話；偏好選擇明確、附帶解釋的選項。'],
  ['使用情境', '三週後要帶孫子到台北，預計訂 07:00 的自強號，希望坐在靠近洗手間的位置。'],
  ['痛點', '表格與說明文字太小、灰字看不清楚；票價與優惠規則分散在不同頁面；不知道優惠票必須同時購買全票；擔心買錯票種被要求補差額。']
]));

B.push(h2('3.4　Persona C｜Kevin（首次線上訂票者／外國旅客）'));
B.push(caption('一句話描述：朋友說可以線上買便宜一半，于是照著教學操作，卻在第三步卡住的交換生。'));
B.push(personaRows([
  ['基本背景', '29 歲，新北市某大學學生，具備基本數位能力，但從未自行使用台鐵線上訂票，也未閱讀過購票須知。'],
  ['使用目標', '在不出錯的情況下完成人生第一次線上訂票，並確認付款過程安全。'],
  ['核心需求', '① 知道自己目前在第幾個步驟、下一步要做什麼；② 知道哪些欄位必填、為什麼要填；③ 清楚優惠票的搭配規則；④ 輸入卡號前能確認網址可信。'],
  ['行為／使用習慣', '習慣先搜尋「教學」再動手；會仔細閱讀說明文字，但害怕漏掉隱藏限制；多以手機操作；下單前習慣在社群搜尋他人經驗。'],
  ['使用情境', '朋友推薦可以買「優惠票」省一半錢，他依網路教學操作，卻在送出後被系統退回。'],
  ['痛點', '不知道車站必須從下拉清單選取而非自行輸入；不知道優惠票必須搭配一張全票且座位不相連；事前不知道需要填身分證字號；付款前沒有任何防詐提示。']
]));
B.push(pageBreak());

/* ============================================================
   IV. User Story
   ============================================================ */
B.push(h1('IV.  User Story'));
B.push(p('每位 Persona 至少撰寫 2 則 User Story，格式為「身為＿＿，我希望＿＿，以便＿＿」，並標註其對應需求與第 II 節的問題編號，確保每一則故事都能追溯到具體的介面問題。', { size: 20 }));

B.push(...aiNote([
  [aiTag('■ 生成式 AI 使用標注（本節）')],
  '本節 User Story 與 N1–N8 需求條目由 Claude（Anthropic）協助撰寫；組員逐則檢查是否同時滿足「目標、可行性、價值」三項要素，並核對每則故事對應的問題編號是否確實存在於第 II 節。'
]));

const STORIES = [
  ['US-1', '王大仁', '身為每週往返的通勤族，我希望能在一頁之內並排看到出發與抵達時間，以便在 30 秒內決定要搭哪一班。', '需求 N1、N3', 'P1、P3', '分鏡 4'],
  ['US-2', '王大仁', '身為資訊密度高的使用者，我希望查詢條件在捲動後仍固定顯示在畫面上，以便不會忘記自己正在查哪一條路線、哪一天。', '需求 N3', 'P8', '分鏡 3'],
  ['US-3', '陳美玲', '身為 67 歲的熟齡旅客，我希望系統提供大字模式與高對比畫面，以便能清楚閱讀每一項票價與規則。', '需求 N4', 'P6', '分鏡 5'],
  ['US-4', '陳美玲', '身為想節省票價的旅客，我希望系統直接告訴我符合哪一種優惠票、以及進站時要出示哪一種證件，以便放心購買而不用臨時補差額。', '需求 N4、N5', 'P4、P6', '分鏡 6'],
  ['US-5', 'Kevin', '身為第一次線上訂票的旅客，我希望清楚知道自己位於第幾個步驟、以及下一步要做什麼，以便不填錯、不漏填。', '需求 N6', 'P5、P7', '分鏡 9'],
  ['US-6', 'Kevin', '身為第一次線上訂票的旅客，我希望在填寫乘車人資料時就看到格式說明與防詐提醒，以便確認網址無誤後再輸入卡片資料。', '需求 N6、N7', 'P5、P7', '分鏡 10'],
  ['US-7', 'Kevin', '身為完成訂票的使用者，我希望看到明確的成功回饋、訂單明細與取票方式，以便知道接下來該做什麼。', '需求 N7', 'P5', '分鏡 11'],
  ['US-8', '所有使用者', '身為需要在服務暫停時仍要完成購票的使用者，我希望知道預計恢復時間與替代通路，以便改用車站窗口、自動售票機或電話訂票。', '需求 N8', 'P5', '分鏡 12']
];

B.push(table([700, 1250, 3500, 1250, 1000, CONTENT - 7700],
  [['編號', 'Persona', 'User Story', '對應需求', '對應問題', '對應分鏡']]
    .concat(STORIES.map(r => [
      t(r[0], { bold: true, size: 19, color: ACCENT }),
      t(r[1], { size: 19, bold: true }),
      t(r[2], { size: 19 }),
      t(r[3], { size: 19 }),
      t(r[4], { size: 19, color: '43505F' }),
      t(r[5], { size: 19, color: '43505F' })
    ]))));

B.push(h2('需求編號對照（N1–N8）'));
B.push(table([900, CONTENT - 900], [
  ['編號', '使用者需求'],
  ['N1', '能在短時間內比較多個候選車次的時間與票價'],
  ['N2', '主要任務的入口必須明確且不被遮擋'],
  ['N3', '隨時知道目前查詢條件與結果範圍'],
  ['N4', '足夠的字級與色彩對比，能清楚閱讀'],
  ['N5', '在使用優惠票前，先確認資格與應備證件'],
  ['N6', '在每一步都知道進度、必填欄位與規則限制'],
  ['N7', '在輸入敏感資料與完成交易後獲得明確回饋'],
  ['N8', '服務異常時仍能完成任務的替代方案']
].map((r, i) => r.map(c => (i === 0 ? t(c, { bold: true, size: 19 }) : t(c, { size: 19, bold: i === 0 ? false : false }))))));
B.push(pageBreak());

/* ============================================================
   V. Scenario
   ============================================================ */
B.push(h2('V.  Scenario'));
B.push(p('針對三位 Persona 各建立一個具體情境，說明使用者在什麼情境下、為什麼使用網站、希望完成什麼任務，以及最可能遇到的問題。', { size: 20 }));

const SCENARIOS = [
  ['SC-1', '王大仁', '週五晚上 22:40，明早 8:00 必須到板橋公司提案。',
    '希望直接查詢下週一（10/12）臺北→板橋的所有班次，挑出 07:00 前出發且還有優惠票的車次，選定後完成訂票。',
    '① 首頁被 TPASS 輪播廣告佔滿，需捲動兩次才看到查詢表單；② 自行輸入「臺北」「板橋」後送出，得到「出發站格式錯誤」，重試三次皆失敗；③ 查詢結果表格最右側的「訂票」欄被右側固定選單遮住，看得到車次卻點不到訂票；④ 往下捲動後忘了自己查的是 10/12 而非 10/09。',
    '最終放棄線上訂票，改用前一晚的 App 或到車站排隊。'],
  ['SC-2', '陳美玲', '三週後要帶孫子到台北玩兩天，預計搭 07:00 的自強號。',
    '希望先確認自己符合敬老票（65 歲以上）並了解要帶什麼證件，再選擇靠近走道或鄰近洗手間的座位。',
    '① 瀏覽器放大 150% 後，結果表格的字幾乎看不見，橫向捲動又難以對應行次；② 找不到「敬老票」的獨立說明頁，優惠規則分散在「旅遊票券」「常見問題」等不同頁面；③ 不知道「優惠票」必須同時購買一張全票且兩者座位不能相連；④ 擔心買錯票種，進站時被要求補差額。',
    '最終放棄線上操作，改為搭家人開車前往車站窗口購票。'],
  ['SC-3', 'Kevin', '朋友說可以在台鐵官網買「便宜一半」的票，他照著搜尋到的教學操作。',
    '希望在不問任何人的情況下，完成人生第一次線上訂票，並確認付款過程安全。',
    '① 不知道出發站必須從下拉清單選取，輸入文字後被退回；② 畫面上沒有任何地方說明優惠票必須搭配一張全票；③ 到填寫個人資料時才知道需要身分證字號，而事前完全沒有提示；④ 準備付款時頁面沒有任何關於網址或第三方金流的說明，擔心卡片資料外洩。',
    '最終放棄線上訂票，改為到車站購買，也因此完全不知道有電子票功能。']
];

B.push(table([620, 1100, 1900, 2200, 2476, CONTENT - 8296].length ? [620, 1100, 1900, 2200, 2476, 1450] : [],
  [['編號', 'Persona', '使用情境', '希望完成的任務', '可能遇到的問題', '結果']]
    .concat(SCENARIOS.map(r => r.map((c, j) => t(c, { size: 18, bold: j === 0 || j === 1 }))))));

B.push(pageBreak());

/* ============================================================
   VI. User Flow
   ============================================================ */
B.push(h1('VI.  User Flow（3 組主要任務）'));
B.push(p('以下三組流程分別對應三位 Persona 的主要任務，並已針對第 II 節的問題進行修正。每組流程皆標示起點、操作步驟、決策點與完成結果，決策點以「◇」標示，異常分支以「✕」標示。', { size: 20 }));

const flowTable = (rows) => table([560, 1560, 2400, 2500, CONTENT - 7020],
  [['步驟', '畫面', '使用者行為', '決策點／判斷', '系統回饋與下一步']]
    .concat(rows.map(r => r.map((c, j) => t(c, { size: 18, bold: j === 0 })))));

B.push(h2('6.1　Flow A｜查詢並比較車次（Persona：王大仁）'));
B.push(p('起點：官網首頁　　終點：選定車次並帶入訂票流程　　對應分鏡：1 → 2 → 3 → 4', { size: 19, color: '43505F' }));
B.push(flowTable([
  ['1', '分鏡 1　首頁', '進入首頁，掃描頁面找出可以「開始買票」的入口', '◇ 有三張任務卡，選擇「訂車票」而非輪播或新聞', '系統顯示查詢表單（分鏡 2），並顯示步驟「1 查詢條件」'],
  ['2', '分鏡 2　查詢表單', '輸入出發站、抵達站（由建議清單選取）', '◇ 清單有 2 筆同名站（臺北／臺北環島），依城市選擇「臺北」', '欄位即時驗證：未選取時直接顯示紅框與「請由建議清單中選擇」'],
  ['3', '分鏡 2　查詢表單', '設定日期 10/12 與時段 06:00–09:00，選擇票種「全票」', '◇ 時段是否符合需求？是 → 繼續', '按下「查詢班次」後載入結果，步驟指示推進至「2 選擇車次」'],
  ['4', '分鏡 3　結果列表', '套用「自強號」「有優惠票」篩選，掃視 24 個車次', '◇ 是否找到同時符合時間與票價的車次？', '查詢摘要列固定顯示「臺北 → 臺中／10 月 9 日／共 24 班」'],
  ['5', '分鏡 3　結果列表', '將 300 次與 101 次加入比較', '◇ 兩班時間接近，需要並排比較才能決定', '右側「比較車次」面板顯示已選 2 班，按下後進入比較頁'],
  ['6', '分鏡 4　車次比較', '並排檢視出發／抵達時間、行駛時間、優惠票剩餘席位', '◇ 300 次優惠票剩 32 席且適用台鐵好行 → 選擇 300 次', '系統標示「建議選擇 300 次」並給出理由，確認後進入訂票'],
  ['✕', '分鏡 3　異常分支', '查詢結果為 0 筆', '◇ 是否放寬時段或改查其他日期？', '顯示「查無符合條件的班次」並提供三個替代動作：放寬時段／改查日期／查看全部班次'],
  ['—', '完成結果', '已選定自強號 300（07:00 → 09:14）並帶入訂票流程', '—', '頁面顯示「已為你保留此車次 10 分鐘」']
]));

B.push(h2('6.2　Flow B｜看懂票價與優惠並選擇車廂（Persona：陳美玲）'));
B.push(p('起點：官網首頁（自動套用大字模式）　　終點：選定車廂與座位方案　　對應分鏡：5 → 6 → 7', { size: 19, color: '43505F' }));
B.push(flowTable([
  ['1', '分鏡 5　首頁（大字）', '進入首頁，畫面已自動放大並顯示說明', '◇ 是否看得清楚？需要時可再按一次「大字」', '字級放大 18%，同時提示「若仍看不清可撥打 1933 由專人協助」'],
  ['2', '分鏡 5　首頁（大字）', '從「我要做的事」選擇「票價與優惠」', '◇ 我想知道自己該買哪一種票？', '進入票價說明頁（分鏡 6），三種票價以卡片並列'],
  ['3', '分鏡 6　票價說明', '閱讀全票 $500、優惠票 $250 的條件與限制', '◇ 我年滿 65 歲 → 選擇「我年滿 65 歲」', '系統標示「敬老票 5 折 $250」，並顯示須攜帶證件的提醒'],
  ['4', '分鏡 6　票價說明', '確認要帶身分證，並按下「用優惠票訂票」', '◇ 證件已隨身攜帶？是 → 繼續', '自動帶入敬老票資格，進入車廂選擇（分鏡 7）'],
  ['5', '分鏡 7　車廂選擇', '比較標準（自由座／指定座位）、Coleman、商務車廂的差別與價格', '◇ 需要固定座位以靠近洗手間 → 選擇「指定座位」', '顯示可選座位範圍 3A–15D，並保留 20 分鐘'],
  ['6', '分鏡 7　車廂選擇', '依提示於備註欄註明需靠門或近洗手間座位', '—', '系統註記「將協助安排無障礙座位」，進入票種選擇'],
  ['✕', '分鏡 7　異常分支', '最想選的商務車廂已售完', '◇ 改選 Coleman 車廂，還是改搭其他車次？', '已售完項目仍顯示但不可選，並直接建議「改選 Coleman 車廂」與「查看相鄰班次」'],
  ['—', '完成結果', '已選定「標準車廂（指定座位）」並附無障礙需求', '—', '頁面顯示座位保留倒數計時']
]));

B.push(h2('6.3　Flow C｜完成人生第一次線上訂票（Persona：Kevin）'));
B.push(p('起點：官網首頁（顯示新手導引）　　終點：取得電子票　　對應分鏡：8 → 2 → 3 → 9 → 10 → 11', { size: 19, color: '43505F' }));
B.push(flowTable([
  ['1', '分鏡 8　首頁（新手）', '閱讀「如何線上訂票」的 4 步驟說明', '◇ 需不需要註冊？→ 說明「只有要付款時才需要登入」', '消除「必須註冊」的顧慮，直接從快速查詢開始'],
  ['2', '分鏡 2　查詢表單', '輸入車站與日期', '◇ 車站要從清單選取嗎？→ 欄位下方已寫明', '選取完成後不再出現「格式錯誤」，直接進入下一步'],
  ['3', '分鏡 3　結果列表', '挑選 07:00 自強號，按「訂票」', '◇ 是否要先比較？可以加入比較但非必要', '若不比較可直接訂票，流程不被阻斷'],
  ['4', '分鏡 9　票種與方案', '閱讀三種票種的差異與限制', '◇ 優惠票必須搭配一張全票且座位不相連 → 先買全票', '頁面同步顯示「應付金額 $500」，付款前一定看得到價格'],
  ['5', '分鏡 10　乘車人資料', '依身分證填寫姓名、身分證字號、生日、手機', '◇ 格式是否正確？→ 欄位下方即時顯示格式範例', '即時驗證：不符格式時紅框並寫明「請填寫與身分證完全相同的中文姓名」'],
  ['6', '分鏡 10　付款方式', '選擇信用卡並確認', '◇ 網址是否可信？→ 頁面已提示應為 tip.railway.gov.tw', '填卡資料前先出現防詐提醒，降低疑慮'],
  ['7', '分鏡 11　完成確認', '確認訂單明細與取票方式', '—', '顯示成功符號、訂單代號 #T20261009-4471、電子票 QR code 與取票進度'],
  ['✕', '分鏡 10　異常分支', '身分證字號格式不符', '◇ 依提示修正格式', '欄位即時標示錯誤並提供正確範例，不需送出後才知道'],
  ['—', '完成結果', '取得電子票與訂單代號，可顯示 QR code 或於車站取紙本票', '—', '提供「再訂一張票」與「回首頁」兩個明確出口']
]));
B.push(pageBreak());

/* ============================================================
   VII. Redesign 分鏡圖
   ============================================================ */
B.push(h1('VII.  Redesign 介面操作規劃分鏡圖'));
B.push(p('依第 VI 節的三組 User Flow 製作分鏡，共 12 張（Flow A 4 張、Flow B 3 張、Flow C 4 張，另加 1 張異常狀態支援畫面），每張分鏡均標示「畫面名稱」與「操作行為」欄位（該欄位已直接燒錄於截圖上方）。', { size: 20 }));

B.push(...aiNote([
  [aiTag('■ 生成式 AI 使用標注（本節）')],
  '本節 12 張重新設計分鏡圖之 HTML／CSS／JS 程式由 OpenCode（opencode）協助撰寫，原始檔案位於本專案 prototype/ 目錄。組員逐張人工檢視畫面，確認所有分鏡共用同一套 Design System、色彩與版面一致，並實測各操作行為與第 VI 節的 User Flow 一致後才定稿。'
]));

B.push(h2('7.1　Redesign Design System'));
B.push(p('為滿足「所有 Redesign 畫面必須保持一致的色彩、字體、按鈕、導覽與版面風格」，先定義單一 Design System，所有 12 張畫面皆由此系統產生。', { size: 20 }));
B.push(table([1500, CONTENT - 1500], [
  ['項目', '規格說明'],
  ['色彩', '品牌藍 #0B4F8F（導覽與主要標題）、行動橘 #C43E06（主要按鈕 CTA）、成功 #256B3C、注意 #7A4B00、錯誤 #B3261E、內文 #16202B、次要 #43505F、背景 #F3F6FA。全站僅此一組語意色，色彩不作為裝飾用途。'],
  ['字體', 'Noto Sans TC / PingFang TC / Microsoft JhengHei。字級級距：13 / 15 / 16 / 18 / 22 / 30 / 40 px，內文基準 16px、次要文字 13px 以上。'],
  ['色彩對比', '主要文字對比 15.8:1，次要文字 8.3:1，主要按鈕白字對比 5.6:1，全數符合 WCAG 2.1 AA。'],
  ['按鈕', '四種樣式：主要（橘色實心）、次要（藍色實心）、外框（白底灰框）、文字（低調連結）。統一最小點擊高度 48px，圓角 8px。'],
  ['導覽', '固定不變：頂部導覽 5 個項目（首頁／訂票／時刻查詢／票價與優惠／服務資訊）＋右側工具列（大字、中英文、登入）；第二列為狀態列與麵包屑；流程頁額外顯示步驟指示器。'],
  ['版面', '內容最大寬度 1180px 置中，12 欄網格；間距級距 4 / 8 / 12 / 16 / 24 / 32 / 48 px；卡片圓角 14px、陰影分三級；頁尾固定三欄結構。'],
  ['無障礙', '所有輸入欄位以 label 正確關聯；提供跳至主要內容；焦點外框 3px；圖示皆為 SVG 並附 aria-hidden；主要區域設 main 地標。'],
  ['大字模式', '全域放大 18%（Flow B 全系列套用），版面與元件完全一致，僅字級與間距等比放大，選擇結果會被記住。']
].map((r, i) => r.map((c, j) => (i === 0 ? t(c, { bold: true, size: 20 }) : t(c, { size: 19, bold: j === 0 }))))));

B.push(h2('7.2　Flow A 分鏡｜查詢並比較車次'));

B.push(...figure('assets/redesign/01-A1-home.png', '分鏡 1　畫面名稱：首頁・任務導向入口　｜　操作行為：由「我要做的事」三張任務卡直接選擇「訂車票」，不需在選單中搜尋。'));
B.push(...figure('assets/redesign/02-A2-search-form.png', '分鏡 2　畫面名稱：訂票查詢表單　｜　操作行為：輸入出發站／抵達站（由建議清單選取），設定日期與時段，按「查詢班次」。'));
B.push(...figure('assets/redesign/03-A3-results.png', '分鏡 3　畫面名稱：班次結果列表　｜　操作行為：查詢摘要列固定顯示條件，套用「自強號＋優惠票」篩選，訂票按鈕不再被遮擋。'));
B.push(...figure('assets/redesign/04-A4-compare.png', '分鏡 4　畫面名稱：車次並排比較　｜　操作行為：將兩個候選班次並排比較，確認後按下「訂這班（07:00）」。'));

B.push(h2('7.3　Flow B 分鏡｜看懂票價與優惠（大字模式）'));
B.push(...figure('assets/redesign/05-B1-home-largefont.png', '分鏡 5　畫面名稱：首頁・大字模式　｜　操作行為：系統自動套用大字模式，字級放大 18%，並說明仍看不清時可撥打 1933。'));
B.push(...figure('assets/redesign/06-B2-fare.png', '分鏡 6　畫面名稱：票價與優惠資格說明　｜　操作行為：確認適用哪一種優惠票與應備證件，再按「用優惠票訂票」。'));
B.push(...figure('assets/redesign/07-B3-carriage.png', '分鏡 7　畫面名稱：車廂與座位選擇　｜　操作行為：比較四種車廂的差別與票價，已售完者直接提供替代建議。'));

B.push(h2('7.4　Flow C 分鏡｜完成第一次線上訂票'));
B.push(...figure('assets/redesign/08-C1-home-novice.png', '分鏡 8　畫面名稱：首頁・新手導引　｜　操作行為：顯示 4 步驟說明，並提供「我只想問班次／我想先知道票價／我需要人工協助」三個分流入口。'));
B.push(...figure('assets/redesign/09-C2-tickettype.png', '分鏡 9　畫面名稱：訂票 Step 1・票種與方案　｜　操作行為：選擇票種與乘客人數，勾選台鐵好行，右側同步顯示應付金額。'));
B.push(...figure('assets/redesign/10-C3-passenger.png', '分鏡 10　畫面名稱：訂票 Step 2・乘車人資料　｜　操作行為：填寫證件資料與付款方式，欄位下方即時顯示格式範例與防詐提醒。'));
B.push(...figure('assets/redesign/11-C4-confirm.png', '分鏡 11　畫面名稱：訂票完成確認　｜　操作行為：看到成功回饋、訂單明細與取票進度，並可顯示電子票 QR code。'));

B.push(h2('7.5　支援畫面｜服務異常與替代方案'));
B.push(...figure('assets/redesign/12-X1-outage.png', '分鏡 12　畫面名稱：服務異常・替代方案　｜　操作行為：提供恢復時間、三種替代通路與客服聯絡方式，避免死路。'));
B.push(pageBreak());

/* ============================================================
   VIII. AI 分析
   ============================================================ */
B.push(h1('VIII.  AI 分析：Bad UI vs. Redesign'));
B.push(p('本節以生成式 AI 協助進行「原始 Bad UI 與重新設計介面」的結構化比較，逐項整理原始問題、使用者需求、改善方式、改善後結果與 AI 分析結果。', { size: 20 }));

B.push(...aiNote([
  [aiTag('■ 生成式 AI 使用標注（本節）')],
  '本節的對照分析與量化比較表由 Claude（Anthropic）與 OpenCode（opencode）協助草擬，經組員逐項對照原始截圖與重新設計畫面覆核後定稿。'
]));

B.push(h2('8.0　使用的生成式 AI 工具與範圍'));
B.push(p('依作業規定，茲列出本作業使用的生成式 AI 工具名稱、各工具的協助範圍，以及組員採取的人工覆核方式。', { size: 20 }));
B.push(table([1900, CONTENT - 1900 - 2500, 2500], [
  ['工具名稱', '使用範圍', '人工覆核方式'],
  ...AI_TOOLS.map(([name, use, check]) => [
    t(name, { bold: true, size: 18 }),
    t(use, { size: 17 }),
    t(check, { size: 17 })
  ])
], {
  align: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT]
}));
B.push(p('此外，第 7 章 12 張重新設計分鏡圖的 HTML／CSS／JS 程式亦由 OpenCode 協助撰寫，並於第 7.1 節說明其視覺品質如何逐張人工檢視。', { size: 19, color: '5E6B7A' }));

B.push(h2('8.1　對照分析總表'));
const CMP = [
  ['P1 資訊層級', 'N2 主要任務入口明確', '首頁改以「我要做的事」三張任務卡作為唯一主要入口，輪播廣告降級為次要資訊並移至頁面下方。', '使用者 3 秒內即可定位「訂車票」入口，主要任務不再被行銷內容覆蓋。', '原站將行銷內容置於最高層級，本質上是把廣告擺在任務之前；重新設計依「任務優先」原則重排層級，屬於典型的資訊階層修正。'],
  ['P2 導覽', 'N2 入口明確', '頂部導覽由 7 項精簡為 5 項並標示目前所在位置；完全移除右側固定浮動選單。', '選單項目由 7 降為 5，且不再有重複導覽造成困惑。', '兩組導覽同時存在是典型的冗餘設計；移除浮動選單同時解決了 P3 的遮擋問題，一次修正兩個問題。'],
  ['P3 版面配置', 'N2／N1 不被遮擋', '移除浮動選單後，結果頁改為卡片式列表，訂票按鈕固定於每張卡片右側。', '「訂票」按鈕完全可點，不再被任何浮動元素覆蓋。', '原站的浮動面板寬度為固定值且未避開內容區，屬於層級（z-index）與版面計算的雙重錯誤；重新設計以正常文件流取代絕對定位浮層。'],
  ['P4 一致性', 'N5 語意清楚', '全站收斂為 1 種品牌藍、1 種行動橘與 3 種狀態色，語意固定不再混用。', '錯誤／注意／成功各有專屬色彩與圖示，語意可預期。', '原站五種以上強調色且互相競爭，色彩失去語意功能；重新設計讓顏色回歸「狀態表達」的唯一職責。'],
  ['P5 操作回饋', 'N6／N8 回饋即時', '輸入欄位即時驗證並寫明正確作法；異常頁提供恢復時間、三種替代通路與重試按鈕。', '使用者不會再遇到「格式錯誤」卻不知如何修正的情況。', '原站的錯誤訊息只描述「結果」不描述「原因與下一步」，違反錯誤訊息設計原則；重新設計補上可行動的指引。'],
  ['P6 可讀性', 'N4 看得清楚', '內文對比提升至 15.8:1、次要文字 8.3:1，連結一律加註下劃線，並提供全域大字模式。', '熟齡與低視力使用者可順利閱讀；Lighthouse 的連結對比問題消除。', '對應 Lighthouse 的 link-in-text-block 失敗項目；加註下劃線是 WCAG 建議的最低成本改善方式。'],
  ['P7 無障礙', 'N6 表單可用', '所有欄位以 label for 關聯、補上必填標記與 aria-describedby，新增 main 地標與跳至主要內容。', '螢幕閱讀器可正確朗讀每個欄位，輔助技術使用者得以完成查詢。', '原站表單控制項在無障礙樹中全為無名稱 generic 節點，屬 WCAG 4.1.2（Name, Role, Value）失敗；此為原站最嚴重的缺陷。'],
  ['P8 查詢脈絡', 'N3 隨時知道條件', '結果頁頂部設固定「查詢摘要列」，顯示路線、日期、時段、結果筆數，並提供「修改條件」。', '捲動任何距離都不會忘記查詢條件，可直接修改。', '這是原站最容易被忽略卻影響最大的問題；「保持脈絡」通常比「提供更多資訊」更能降低認知負荷。']
];
B.push(table([1250, 1350, 2600, 2100, CONTENT - 7300],
  [['原始問題', '使用者需求', '改善方式', '改善後結果', 'AI 分析結果']]
    .concat(CMP.map(r => r.map((c, j) => t(c, { size: 17, bold: j === 0 }))))));

B.push(h2('8.2　AI 輔助的量化比較'));
B.push(table([2100, 2300, 2300, CONTENT - 6700], [
  ['比較面向', 'Bad UI（原始）', 'Redesign（重新設計）', '差異說明'],
  ['主要導覽項目', '7 項 + 右側浮動選單', '5 項，無浮動選單', '減少 2 項並消除重複導覽'],
  ['結果列表欄位', '10 欄表格，訂票欄遭遮擋', '卡片式，訂票按鈕固定可見', '由「看得見點不到」改為「可直接操作」'],
  ['內文最小字級', '表格文字偏小（約 12px）', '內文 16px、次要 13px，另可放大 18%', '提升閱讀性並支援視力較弱者'],
  ['內文對比度', '部分灰色文字偏低', '15.8:1（內文）／8.3:1（次要）', '全數達到 WCAG 2.1 AA'],
  ['錯誤訊息', '「出發站格式錯誤」（未說明原因）', '「請由建議清單中選擇車站，不可自行輸入」', '由描述結果改為描述原因與解法'],
  ['查詢條件可見性', '捲動後離開畫面', '固定摘要列始終可見', '消除「忘記查詢條件」的風險'],
  ['流程進度', '無', '步驟指示器（查詢／選擇／比較）', '使用者隨時知道自己在第幾步'],
  ['服務異常', '僅「回首頁」死路', '恢復時間＋3 種替代通路＋客服', '異常狀態下仍能完成任務'],
  ['表單無障礙名稱', '無（無障礙樹為 generic）', 'label 正確關聯＋aria 描述', '輔助技術可正確朗讀欄位']
].map((r, i) => r.map((c, j) => (i === 0 ? t(c, { bold: true, size: 19 }) : t(c, { size: 18, bold: j === 0 }))))));

B.push(h2('8.3　AI 使用紀錄與 Prompt'));
B.push(p('本次作業使用生成式 AI 協助以下工作：分析截圖中的介面問題、擬定 Persona 與 User Story、檢視 User Flow 是否遺漏分支，以及產出 Bad UI 與 Redesign 的結構化比較。以下為實際使用的 Prompt 與其產出說明。', { size: 20 }));

const PROMPTS = [
  ['Prompt 1：介面問題診斷',
    '你是資深互動設計師。我提供一個公共服務網站的 7 張截圖（首頁、錯誤頁、查詢表單、驗證錯誤、結果表格×2）。請以 UI/UX 的六個面向——資訊層級、導覽、版面配置、一致性、操作回饋、可讀性——逐項指出可觀察到的問題。每項請說明：(1) 問題現象；(2) 為何這是問題；(3) 對使用者的實際影響；(4) 可依據的截圖編號。要求至少 5 項。',
    '產出 8 項問題（P1–P8），涵蓋六個面向，且每一項都標註了可佐證的截圖編號。'],
  ['Prompt 2：無障礙與客觀數據',
    '請針對一個查詢結果頁撰寫 Lighthouse 無障礙檢查的驗收清單，聚焦 WCAG 2.1 AA 的 1.3.1、1.4.3、2.4.1、4.1.2 四項成功準則，並說明若表單控制項在無障礙樹中呈現為無名稱的 generic 節點，代表違反哪一項。',
    '實際執行 Lighthouse 後得到 Accessibility 0.89，並確認違反 4.1.2；此結果直接成為第 II 節的客觀佐證。'],
  ['Prompt 3：Persona 定義',
    '針對台鐵時刻查詢網站，定義三類 Target User：都會通勤族、熟齡旅客、首次線上訂票者。每類產出一位 Persona，需包含基本背景、使用目標、核心需求、行為／使用習慣、使用情境與痛點，並標註各自對應到哪些介面問題。',
    '產出三位 Persona（王大仁、陳美玲、Kevin），並讓每位的痛點都能對應到第 II 節的具體問題編號。'],
  ['Prompt 4：User Story 與 Flow 檢核',
    '根據上述三位 Persona，各撰寫至少 2 則「身為＿＿，我希望＿＿，以便＿＿」的 User Story。接著檢查我設計的三組 User Flow，確認每組都有：起點、操作步驟、決策點、完成結果，且至少包含一個異常分支。若有缺漏請指出並補充。',
    '補上了三組流程原本缺少的異常分支（查詢無結果、商務車廂售完、證件格式錯誤），並新增分鏡 12「服務異常・替代方案」對應原站的死路問題。'],
  ['Prompt 5：Bad UI vs. Redesign 對照',
    '請將下列 8 項介面問題與其重新設計方案進行結構化比較，逐項輸出：原始問題、使用者需求、改善方式、改善後結果、AI 分析結果。最後請從導覽項目數、欄位數、字級、對比度、錯誤訊息品質、流程進度、異常處理、表單無障礙等八個面向，量化比較前後差異。',
    '產出第 8.1 節對照總表與第 8.2 節量化比較表，並指出原站最嚴重的缺陷是表單控制項違反 WCAG 4.1.2。']
];

PROMPTS.forEach(([title, prompt, result], i) => {
  B.push(h3('8.3.' + (i + 1) + '　' + title));
  B.push(p('Prompt：', { bold: true, size: 20, after: 60 }));
  B.push(table([CONTENT], [[new Paragraph({
    spacing: { before: 40, after: 40, line: 280 },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F4F6F9' },
    children: [t(prompt, { size: 18, italics: true })]
  })]]));
  B.push(p('AI 產出說明：' + result, { size: 19, color: '256B3C' }));
  B.push(spacer(120));
});

B.push(h2('8.4　AI 輔助的限制與人工覆核'));
B.push(bullet('AI 對截圖的觀察可能遺漏細節，本報告所有問題均已回到原始網站實際操作驗證（例如實測「自行輸入站名會被退回」與「訂票欄遭浮動選單遮擋」）。'));
B.push(bullet('AI 產出的 Persona 為設計情境下的推估人物，非真實研究數據；正式研究應以訪談與可用性測試驗證。'));
B.push(bullet('分鏡圖的視覺品質由本專案自建的 HTML/CSS 原型產生並逐一人工檢視，確保 12 張畫面共用同一套 Design System、色彩與版面一致。'));

B.push(pageBreak());

/* ============================================================
   IX. 組員貢獻
   ============================================================ */
B.push(h1('IX.  組員貢獻'));
B.push(p('本報告由 ' + GROUP_NO + ' 全組共同完成，分工與貢獻比例如下表所示。全組貢獻比例合計為 100%。', { size: 20 }));

const CONTRIB = [
  ['負責 Bad UI 案例選擇、問題分析與 Target User／Persona（第 I、II、III 節）',
    '實際開啟臺鐵官網擷取 7 張原始介面截圖並撰寫選擇理由；依資訊層級、導覽、版面配置、一致性、操作回饋、可讀性歸納出 P1–P8 共 8 項問題，並以 Lighthouse 檢測之無障礙、最佳實務與 SEO 分數作為佐證。再依官網功能與使用情境劃分三類 Target User（通勤族、熟齡旅客、首次線上訂票者），各建立一位 Persona，作為後續設計的使用者依據。'],
  ['負責 User Story 與 Scenario（第 IV、V 節）',
    '依三位 Persona 的目標與第 II 節問題編號，撰寫 8 則「身為＿＿，我希望＿＿，以便＿＿」格式的 User Story，整理 N1–N8 需求對照表並檢查每則故事是否兼具目標、可行性與價值。再為每位 Persona 建立一個使用情境（SC-1～SC-3），寫明使用時機、希望完成的任務、可能遇到的問題與最終結果，作為 User Flow 的設計依據。'],
  ['負責 User Flow 與 Redesign 分鏡圖（第 VI、VII 節）',
    '為三位 Persona 各設計一組 User Flow（查詢並比較車次、看懂票價與優惠、完成第一次線上訂票），逐步標示畫面、使用者行為、決策點與系統回饋，並補上查無班次、車廂售完、格式不符等異常分支。再依三組流程建立 HTML/CSS 高保真原型與 Design System，產出 12 張風格一致的分鏡圖，確保每項問題都有對應的解決畫面。'],
  ['負責 AI 輔助分析與全報告版面排版（第 VIII 節及全文）',
    '建立 Bad UI 與 Redesign 的結構化對照總表與量化比較，說明每項問題在重新設計後如何被解決；記錄 5 則實際使用的 AI Prompt 與產出說明，並撰寫 AI 輔助的限制與人工覆核流程。另負責全報告版面排版：整合各章內容、校對全文一致性，編排標題層級、目錄、表格與圖說樣式，完成 Word 報告的排版與頁面編輯。']
];

B.push(table([1150, 2400, 4796, 1400], [
  ['組員', '負責內容', '工作說明', '貢獻比例'],
  ...GROUP_MEMBERS.map((m, i) => [
    t(m.name, { size: 19, bold: true }),
    t(CONTRIB[i][0], { size: 19 }),
    t(CONTRIB[i][1], { size: 18 }),
    t('25%', { size: 20, bold: true, color: ACCENT })
  ])
], {
  align: [AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.CENTER]
}));

B.push(new Paragraph({
  alignment: AlignmentType.RIGHT,
  spacing: { before: 60, after: 120 },
  border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1', space: 8 } },
  children: [
    t('全組貢獻比例合計：', { bold: true, size: 19 }),
    t('100%', { bold: true, size: 21, color: PRIMARY })
  ]
}));

B.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 320, after: 0 },
  children: [
    t('組長簽章：＿＿＿＿＿＿＿＿＿＿　　', { size: 19, color: '43505F' }),
    t('指導教師簽章：＿＿＿＿＿＿＿＿＿＿', { size: 19, color: '43505F' })
  ]
}));

B.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  border: { top: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY, space: 10 } },
  spacing: { before: 80, after: 100 },
  children: [t('— 報告完畢 —', { size: 20, color: '5E6B7A' })]
}));

/* ============================================================
   輸出
   ============================================================ */
const doc = new Document({
  creator: '介面設計 HW1',
  title: 'Bad UI 案例分析與重新設計 — 國營臺灣鐵路股份有限公司',
  description: '介面設計課程作業：Bad UI 案例分析、Persona、User Flow 與 Redesign 分鏡',
  styles: {
    default: {
      document: { run: { font: FONT, size: 21 } }
    }
  },
  numbering: {
    config: [{
      reference: 'ul',
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 520, hanging: 260 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 900, hanging: 260 } } } }
      ]
    }]
  },
  sections: [{
    properties: {
      page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            t('介面設計 HW1｜Bad UI 案例分析與重新設計　—　', { size: 17, color: '5E6B7A' }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 17, color: '5E6B7A' }),
            t(' —', { size: 17, color: '5E6B7A' })
          ]
        })]
      })
    },
    children: B
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log('OK ->', OUT, (buf.length / 1024).toFixed(0) + ' KB');
}).catch(e => { console.error('FAIL', e); process.exit(1); });