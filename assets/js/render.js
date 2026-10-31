// 共用的安全 DOM 產生工具。資料一律透過 textContent／屬性設定，不使用 innerHTML。
import { GAME_LABELS } from './config.js';

// el('p', { className: 'x', text: '內容', attrs: { href: '...' } }, [子元素...])
export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  const { className, text, attrs, dataset, on } = options;
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  if (attrs) {
    for (const [name, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      node.setAttribute(name, value === true ? '' : String(value));
    }
  }
  if (dataset) Object.assign(node.dataset, dataset);
  if (on) for (const [type, handler] of Object.entries(on)) node.addEventListener(type, handler);
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.firstChild.remove();
}

export function image(src, alt, options = {}) {
  return el('img', {
    className: options.className,
    attrs: { src, alt: alt || '', loading: options.eager ? null : 'lazy', decoding: 'async', width: options.width, height: options.height },
  });
}

export function demoBadge(isDemo) {
  return isDemo ? el('span', { className: 'badge-demo', text: '示範資料' }) : null;
}

export function gameLabel(game) {
  return GAME_LABELS[game] || '';
}

export function gameTag(game) {
  const label = gameLabel(game);
  return label ? el('span', { className: 'tag', text: label }) : null;
}

// 日期字串依精度格式化：YYYY → 2021 年、YYYY-MM → 2021 年 3 月、YYYY-MM-DD → 2021 年 3 月 5 日
export function formatDate(value) {
  if (!value) return '';
  const match = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(String(value).trim());
  if (!match) return String(value);
  const [, y, m, d] = match;
  let text = `${y} 年`;
  if (m) text += ` ${Number(m)} 月`;
  if (m && d) text += ` ${Number(d)} 日`;
  return text;
}

export function yearOf(value) {
  const match = /^(\d{4})/.exec(String(value || ''));
  return match ? match[1] : '';
}

// 日期字串排序用（精度不同時，年在前）。
export function compareDate(a, b) {
  return String(a || '').localeCompare(String(b || ''));
}

export function bySortOrder(a, b) {
  return (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
}

export function statusMessage(text, link) {
  const box = el('div', { className: 'status', attrs: { role: 'status' } }, [el('p', { text })]);
  if (link) box.append(el('p', {}, [el('a', { text: link.label, attrs: { href: link.href } })]));
  return box;
}

export function showError(container, error) {
  console.error(error);
  clear(container);
  container.append(statusMessage('資料暫時無法讀取，請稍後重新整理頁面。若一直出現這個訊息，請通知網站管理員。'));
}

export function showLoading(container) {
  clear(container);
  container.append(el('p', { className: 'result-count', text: '讀取中…' }));
}

// 區塊標題（含小字與「查看全部」連結）
export function sectionHead(title, options = {}) {
  const heading = el(options.level || 'h2', { attrs: { id: options.id } }, [
    options.eyebrow ? el('span', { className: 'section-head__eyebrow', text: options.eyebrow }) : null,
    title,
  ]);
  const head = el('div', { className: 'section-head' }, [heading]);
  if (options.more) head.append(el('a', { className: 'more-link', text: options.more.label, attrs: { href: options.more.href } }));
  return head;
}

// 一組可切換的篩選按鈕；回傳容器，選擇變更時呼叫 onChange(value)
export function filterButtons(label, choices, current, onChange) {
  const group = el('div', { className: 'filter-group', attrs: { role: 'group', 'aria-label': label } }, [
    el('span', { className: 'filter-group__label', text: label, attrs: { 'aria-hidden': 'true' } }),
  ]);
  const buttons = choices.map(({ value, label: text }) => el('button', {
    className: 'filter-btn',
    text,
    attrs: { type: 'button', 'aria-pressed': String(value === current) },
    on: {
      click: () => {
        buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        buttons[choices.findIndex((c) => c.value === value)].setAttribute('aria-pressed', 'true');
        onChange(value);
      },
    },
  }));
  group.append(...buttons);
  return group;
}

// 下拉式篩選
export function filterSelect(label, id, choices, onChange) {
  const select = el('select', { className: 'filter-select', attrs: { id }, on: { change: () => onChange(select.value) } },
    choices.map(({ value, label: text }) => el('option', { text, attrs: { value } })));
  return el('div', { className: 'filter-group' }, [
    el('label', { className: 'filter-group__label', text: label, attrs: { for: id } }),
    select,
  ]);
}
