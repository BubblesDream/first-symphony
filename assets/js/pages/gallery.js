import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el, img, clear, dateKey, yearOf, formatDate, gameLabel } from '../render.js';
import { filterGroup, errorBox, showStatus, demoBadge, tiltClass, pendingNote } from '../ui.js';
import { safeImageUrl, PLACEHOLDERS } from '../validate.js';

initLayout();

const filters = document.getElementById('filters');
const grid = document.getElementById('photo-grid');
const status = document.getElementById('status');
const quotesRoot = document.getElementById('quote-list');

// ---------- 燈箱 ----------
const lightbox = (() => {
  let items = [];
  let index = 0;
  let trigger = null;

  const image = el('img', { className: 'lightbox__img', alt: '' });
  const title = el('h2', { className: 'lightbox__title', id: 'lightbox-title' });
  const caption = el('p', { className: 'lightbox__caption pre-line' });
  const meta = el('p', { className: 'lightbox__meta' });
  const counter = el('p', { className: 'lightbox__counter', 'aria-live': 'polite' });
  const closeBtn = el('button', { type: 'button', className: 'lightbox__btn lightbox__close', 'aria-label': '關閉', text: '×' });
  const prevBtn = el('button', { type: 'button', className: 'lightbox__btn lightbox__prev', 'aria-label': '上一張', text: '‹' });
  const nextBtn = el('button', { type: 'button', className: 'lightbox__btn lightbox__next', 'aria-label': '下一張', text: '›' });
  const figure = el('figure', { className: 'lightbox__figure polaroid' },
    image, el('figcaption', {}, title, meta, caption, counter));
  const root = el('div', {
    className: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'lightbox-title', hidden: true,
  }, figure, prevBtn, nextBtn, closeBtn);

  image.addEventListener('error', () => { image.src = PLACEHOLDERS.image; });

  function show(i) {
    index = (i + items.length) % items.length;
    const p = items[index];
    image.src = safeImageUrl(p.image, PLACEHOLDERS.image);
    image.alt = p.title || '紀念館照片';
    title.textContent = p.title || '';
    caption.textContent = p.caption || '';
    meta.replaceChildren(
      ...[formatDate(p.date), gameLabel(p.game), p.category].filter(Boolean).map((t) => el('span', { text: t })),
    );
    const badge = demoBadge(p);
    if (badge) meta.append(badge);
    counter.textContent = `${index + 1} / ${items.length}`;
    const single = items.length < 2;
    prevBtn.hidden = single;
    nextBtn.hidden = single;
  }

  function open(list, i, from) {
    items = list;
    trigger = from;
    show(i);
    root.hidden = false;
    document.body.classList.add('is-locked');
    closeBtn.focus();
  }

  function close() {
    root.hidden = true;
    document.body.classList.remove('is-locked');
    if (trigger && document.contains(trigger)) trigger.focus();
  }

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));
  // 點背景或照片本身都會關閉（手機上方便點一下就關）
  root.addEventListener('click', (e) => {
    if (e.target === root || e.target === image) close();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft' && items.length > 1) { e.preventDefault(); show(index - 1); }
    else if (e.key === 'ArrowRight' && items.length > 1) { e.preventDefault(); show(index + 1); }
    else if (e.key === 'Tab') {
      // 焦點留在燈箱內
      const focusables = [prevBtn, nextBtn, closeBtn].filter((b) => !b.hidden);
      const pos = focusables.indexOf(document.activeElement);
      e.preventDefault();
      const next = e.shiftKey ? pos - 1 : pos + 1;
      focusables[(next + focusables.length) % focusables.length].focus();
    }
  });

  document.body.append(root);
  return { open };
})();

function photoItem(p, i, list) {
  const button = el('button', {
    type: 'button',
    className: `photo ${tiltClass(i)}`,
    'aria-label': `放大查看：${p.title || '照片'}`,
    dataset: { id: p.id || '' },
  },
  el('span', { className: 'photo__img' }, img(p.thumb || p.image, p.title || '')),
  el('span', { className: 'photo__caption', text: p.title || '' }),
  );
  button.addEventListener('click', () => lightbox.open(list, i, button));
  return el('li', {}, button);
}

/** 網址有 #照片id（例如從首頁點進來）就直接打開那張照片；對不到就忽略 */
function openFromHash(list) {
  let id = '';
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }
  if (!id) return;
  const index = list.findIndex((p) => p.id === id);
  if (index < 0) return;
  const button = [...grid.querySelectorAll('.photo')].find((b) => b.dataset.id === id);
  if (button) button.scrollIntoView({ block: 'center' });
  lightbox.open(list, index, button || null);
}

function quoteItem(q, i) {
  return el('li', { className: `quote ${tiltClass(i + 1)}` },
    el('blockquote', {}, el('p', { className: 'quote__text', text: q.text || '' })),
    el('p', { className: 'quote__by' },
      el('span', { text: `— ${q.speaker || '某位團員'}` }),
      q.date ? el('span', { className: 'quote__date', text: formatDate(q.date) }) : null,
    ),
    q.context ? el('p', { className: 'quote__context', text: q.context }) : null,
    demoBadge(q),
  );
}

async function main() {
  try {
    const [photos, quotes] = await Promise.all([loadTable('gallery'), loadTable('quotes')]);
    const sorted = [...photos].sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)));
    quotesRoot.replaceChildren(...quotes.map(quoteItem));
    if (!quotes.length) quotesRoot.after(pendingNote('經典語錄整理中，敬請期待。'));

    if (!sorted.length) {
      showStatus(status, '');
      grid.after(pendingNote('照片整理中，敬請期待。'));
      return;
    }

    const state = { year: 'all', category: 'all' };
    const draw = () => {
      const shown = sorted.filter((p) =>
        (state.year === 'all' || yearOf(p.date) === state.year)
        && (state.category === 'all' || p.category === state.category));
      grid.replaceChildren(...shown.map((p, i) => photoItem(p, i, shown)));
      showStatus(status, shown.length ? `共 ${shown.length} 張照片` : '沒有符合條件的照片。');
    };

    const years = [...new Set(sorted.map((p) => yearOf(p.date)).filter(Boolean))].sort().reverse();
    const categories = [...new Set(sorted.map((p) => p.category).filter(Boolean))];
    filters.replaceChildren(
      filterGroup('年份', [{ value: 'all', label: '全部' }, ...years.map((y) => ({ value: y, label: y }))], 'all',
        (v) => { state.year = v; draw(); }),
      filterGroup('分類', [{ value: 'all', label: '全部' }, ...categories.map((c) => ({ value: c, label: c }))], 'all',
        (v) => { state.category = v; draw(); }),
    );
    draw();
    openFromHash(sorted);
  } catch (error) {
    console.warn(error);
    showStatus(status, '');
    clear(grid);
    grid.after(errorBox());
  }
}

main();
