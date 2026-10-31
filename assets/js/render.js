// 共用的安全 DOM 產生工具：外部資料一律以 textContent / 屬性設定，不使用 innerHTML。

import { GAMES } from './config.js';
import { safeImageUrl, parseDate } from './validate.js';

/**
 * 建立元素。
 * el('a', { className: 'link', text: '文字', attrs: { href: 'x.html' } }, [子元素...])
 */
export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  const { className, text, attrs } = options;
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, value === true ? '' : String(value));
    });
  }
  children.forEach((child) => {
    if (child !== undefined && child !== null && child !== false) node.append(child);
  });
  return node;
}

/** 建立已驗證網址的圖片；載入失敗時換成佔位圖。 */
export function image(src, alt, fallback, options = {}) {
  const img = el('img', {
    className: options.className,
    attrs: {
      src: safeImageUrl(src, fallback),
      alt: alt || '',
      loading: options.eager ? 'eager' : 'lazy',
      decoding: 'async',
      width: options.width,
      height: options.height,
    },
  });
  img.addEventListener('error', () => {
    if (img.getAttribute('src') !== fallback) img.setAttribute('src', fallback);
  }, { once: true });
  return img;
}

export function gameLabel(game) {
  return GAMES[game] || '';
}

export function gameTag(game) {
  const label = gameLabel(game);
  return label ? el('span', { className: `tag tag--${game}`, text: label }) : null;
}

export function demoBadge(isDemo) {
  return isDemo ? el('span', { className: 'demo-badge', text: '示範資料' }) : null;
}

/** 依精度顯示日期：2023 年／2023 年 5 月／2023 年 5 月 12 日。 */
export function formatDate(value) {
  const d = parseDate(value);
  if (!d) return '';
  let text = `${d.year} 年`;
  if (d.month) text += ` ${d.month} 月`;
  if (d.day) text += ` ${d.day} 日`;
  return text;
}

/** 較短的日期格式：2023.05.12 */
export function formatShortDate(value) {
  const d = parseDate(value);
  if (!d) return '';
  return [d.year, d.month, d.day].filter(Boolean)
    .map((n, i) => (i === 0 ? String(n) : String(n).padStart(2, '0'))).join('.');
}

export function dateYear(value) {
  const d = parseDate(value);
  return d ? String(d.year) : '';
}

/** 日期字串排序用（缺少的部分補 00）。 */
export function dateKey(value) {
  const d = parseDate(value);
  if (!d) return '';
  return `${d.year}-${String(d.month || 0).padStart(2, '0')}-${String(d.day || 0).padStart(2, '0')}`;
}

export function bySortOrder(a, b) {
  return (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
}

/** 在容器中顯示友善訊息（讀取失敗、查無資料等）。 */
export function showMessage(container, text, link) {
  const box = el('div', { className: 'notice', attrs: { role: 'status' } }, [
    el('p', { text }),
  ]);
  if (link) box.append(el('p', {}, [el('a', { text: link.text, attrs: { href: link.href } })]));
  container.replaceChildren(box);
}

export const LOAD_ERROR = '資料暫時無法讀取，請稍後重新整理頁面。';
