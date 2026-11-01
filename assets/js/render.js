// 共用的安全 DOM 產生工具。
// 外部資料一律透過 textContent / setAttribute 放進畫面，不使用 innerHTML。
import { GAME_LABELS } from './config.js';
import { safeImageUrl, PLACEHOLDERS } from './validate.js';

/**
 * 建立元素。
 * el('a', { className: 'btn', href: 'story.html', text: '閱讀' }, child1, child2)
 * - text：用 textContent 填入
 * - on：{ click: fn }
 * - dataset：{ id: '...' }
 * - 其他屬性用 setAttribute（值為 null / undefined / false 時略過）
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'on') {
      for (const [type, handler] of Object.entries(value)) node.addEventListener(type, handler);
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }
  append(node, children);
  return node;
}

export function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

/** 安全的圖片：網址先驗證，載入失敗時改用佔位圖。 */
export function img(src, alt, { fallback = PLACEHOLDERS.image, className, lazy = true, width, height } = {}) {
  const node = el('img', {
    src: safeImageUrl(src, fallback),
    alt: alt || '',
    className,
    loading: lazy ? 'lazy' : null,
    decoding: 'async',
    width,
    height,
  });
  node.addEventListener('error', () => {
    if (!node.src.endsWith(fallback)) node.src = fallback;
  }, { once: true });
  return node;
}

// 模糊寫法：「2008 左右」「約 2008」「2008 前後」
const FUZZY_PREFIX = /^約\s*/;
const FUZZY_SUFFIX = /\s*(?:左右|前後)$/;

/**
 * 依精度格式化日期：YYYY、YYYY-MM、YYYY-MM-DD。
 * 模糊寫法（2008 左右／約 2008／2008 前後）一律顯示成「約 2008 年」。
 */
export function formatDate(value) {
  if (!value) return '';
  const raw = String(value).trim();
  const fuzzy = FUZZY_PREFIX.test(raw) || FUZZY_SUFFIX.test(raw);
  const core = raw.replace(FUZZY_PREFIX, '').replace(FUZZY_SUFFIX, '');
  const m = core.match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/);
  if (!m) return raw;
  const [, y, mo, d] = m;
  let text = `${y} 年`;
  if (mo) text += ` ${Number(mo)} 月`;
  if (d) text += ` ${Number(d)} 日`;
  return fuzzy ? `約 ${text}` : text;
}

/** 是不是精確的日期寫法（可放進 <time datetime>） */
export function isExactDate(value) {
  return /^\d{4}(?:-\d{1,2}){0,2}$/.test(String(value || '').trim());
}

/** 日期字串補齊成可排序的格式（模糊寫法只看開頭的年月） */
export function dateKey(value) {
  const m = String(value || '').trim().replace(FUZZY_PREFIX, '').match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/);
  if (!m) return '0000-00-00';
  return `${m[1]}-${(m[2] || '0').padStart(2, '0')}-${(m[3] || '0').padStart(2, '0')}`;
}

export function yearOf(value) {
  const m = String(value || '').trim().replace(FUZZY_PREFIX, '').match(/^(\d{4})/);
  return m ? m[1] : '';
}

export function gameLabel(game) {
  return GAME_LABELS[game] || '';
}

/** 篩選用：both 代表兩邊都算 */
export function matchesGame(itemGame, filter) {
  if (!filter || filter === 'all') return true;
  return itemGame === filter || itemGame === 'both';
}

/** 讀取網址參數 */
export function queryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
