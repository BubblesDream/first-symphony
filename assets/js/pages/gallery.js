import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el, image, dateYear, dateKey, formatDate, gameLabel, demoBadge, showMessage, LOAD_ERROR } from '../render.js';
import { photoFigure } from '../components.js';
import { PLACEHOLDERS } from '../config.js';

initLayout();

const grid = document.getElementById('photo-list');
const yearSelect = document.getElementById('photo-year');
const categorySelect = document.getElementById('photo-category');
const count = document.getElementById('photo-count');

// ---- 燈箱 ----
const lightbox = document.getElementById('lightbox');
const lbFigure = document.getElementById('lightbox-figure');
const lbClose = document.getElementById('lightbox-close');
const lbPrev = document.getElementById('lightbox-prev');
const lbNext = document.getElementById('lightbox-next');

let current = [];      // 目前篩選後的照片
let index = 0;
let opener = null;     // 開啟燈箱的縮圖按鈕，關閉後把焦點還給它

function showPhoto(i) {
  index = (i + current.length) % current.length;
  const item = current[index];
  const meta = [formatDate(item.date), gameLabel(item.game), item.category].filter(Boolean).join('・');
  lbFigure.replaceChildren(
    image(item.image, item.title || '相簿照片', PLACEHOLDERS.photo, { eager: true }),
    el('figcaption', { className: 'lightbox__caption' }, [
      el('h2', { className: 'lightbox__title', text: item.title, attrs: { id: 'lightbox-title' } }),
      el('p', { className: 'lightbox__meta' }, [meta, demoBadge(item.is_demo)]),
      item.caption ? el('p', { className: 'lightbox__text', text: item.caption }) : null,
      el('p', { className: 'lightbox__count', text: `${index + 1} / ${current.length}` }),
    ]),
  );
  const single = current.length < 2;
  lbPrev.hidden = single;
  lbNext.hidden = single;
}

function openLightbox(i, button) {
  opener = button;
  showPhoto(i);
  lightbox.hidden = false;
  document.body.classList.add('is-locked');
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.classList.remove('is-locked');
  lbFigure.replaceChildren();
  if (opener) opener.focus();
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => showPhoto(index - 1));
lbNext.addEventListener('click', () => showPhoto(index + 1));
// 點擊背景（照片與按鈕以外的地方）關閉
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox || event.target.classList.contains('lightbox__stage')) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (lightbox.hidden) return;
  if (event.key === 'Escape') closeLightbox();
  else if (event.key === 'ArrowLeft' && current.length > 1) showPhoto(index - 1);
  else if (event.key === 'ArrowRight' && current.length > 1) showPhoto(index + 1);
  else if (event.key === 'Tab') {
    // 把焦點留在燈箱內
    const focusables = [lbClose, lbPrev, lbNext].filter((b) => !b.hidden);
    const pos = focusables.indexOf(document.activeElement);
    event.preventDefault();
    const next = event.shiftKey ? pos - 1 : pos + 1;
    focusables[(next + focusables.length) % focusables.length].focus();
  }
});

// ---- 相簿列表 ----
async function renderGallery() {
  try {
    const rows = (await loadTable('gallery')).sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)));
    const years = [...new Set(rows.map((r) => dateYear(r.date)).filter(Boolean))].sort().reverse();
    const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))];
    yearSelect.append(...years.map((y) => el('option', { text: `${y} 年`, attrs: { value: y } })));
    categorySelect.append(...categories.map((c) => el('option', { text: c, attrs: { value: c } })));

    const draw = () => {
      const year = yearSelect.value;
      const category = categorySelect.value;
      current = rows.filter((r) => (year === 'all' || dateYear(r.date) === year)
        && (category === 'all' || r.category === category));
      count.textContent = `共 ${current.length} 張`;
      if (!current.length) return showMessage(grid, '沒有符合條件的照片。');
      grid.replaceChildren(...current.map((item, i) => {
        const button = el('button', {
          className: 'photo-grid__item',
          attrs: { type: 'button', 'aria-label': `放大照片：${item.title}` },
        }, [photoFigure(item)]);
        button.addEventListener('click', () => openLightbox(i, button));
        return button;
      }));
    };
    yearSelect.addEventListener('change', draw);
    categorySelect.addEventListener('change', draw);
    draw();
  } catch {
    showMessage(grid, LOAD_ERROR);
  }
}

// ---- 經典語錄 ----
async function renderQuotes() {
  const list = document.getElementById('quote-list');
  try {
    const rows = await loadTable('quotes');
    if (!rows.length) return showMessage(list, '目前還沒有語錄。');
    list.replaceChildren(...rows.map((q) => el('li', { className: 'quote' }, [
      el('blockquote', { className: 'quote__text' }, [el('p', { text: `「${q.text}」` })]),
      el('p', { className: 'quote__by' }, [
        `—— ${q.speaker || '某位團員'}`,
        q.date ? `，${formatDate(q.date)}` : '',
        ' ',
        demoBadge(q.is_demo),
      ]),
      q.context ? el('p', { className: 'quote__context', text: q.context }) : null,
    ])));
  } catch {
    showMessage(list, LOAD_ERROR);
  }
}

renderGallery();
renderQuotes();
