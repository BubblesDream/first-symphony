import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el, image, clear, showError, filterSelect, yearOf, compareDate, formatDate, demoBadge, gameTag, statusMessage, sectionHead } from '../render.js';
import { safeImageUrl } from '../validate.js';

initLayout();

const photosBox = document.getElementById('gallery-content');
const quotesBox = document.getElementById('quotes-content');

async function renderPhotos() {
  try {
    const photos = (await loadTable('gallery')).sort((a, b) => compareDate(b.date, a.date));
    const state = { year: 'all', category: 'all' };
    let visible = [];
    const grid = el('ul', { className: 'photo-grid', attrs: { role: 'list' } });
    const count = el('p', { className: 'result-count', attrs: { 'aria-live': 'polite' } });
    const lightbox = createLightbox();

    const update = () => {
      visible = photos.filter((p) =>
        (state.year === 'all' || yearOf(p.date) === state.year)
        && (state.category === 'all' || p.category === state.category));
      grid.replaceChildren(...visible.map((photo, index) => el('li', { className: 'card' }, [
        el('button', {
          className: 'photo-btn',
          attrs: { type: 'button', 'aria-label': `放大檢視：${photo.title}`, id: `photo-${photo.id}` },
          on: { click: (event) => lightbox.open(visible, index, event.currentTarget) },
        }, [el('div', { className: 'photo' }, [image(safeImageUrl(photo.thumb || photo.image, 'photo'), photo.title, { width: 800, height: 600 })])]),
        el('p', { className: 'photo-item__title', text: photo.title }),
        el('div', { className: 'meta' }, [el('span', { text: formatDate(photo.date) }), el('span', { text: photo.category }), demoBadge(photo.is_demo)]),
      ])));
      count.textContent = `共 ${visible.length} 張照片`;
      if (!visible.length) grid.append(el('li', {}, [statusMessage('沒有符合條件的照片。')]));
    };

    const years = [...new Set(photos.map((p) => yearOf(p.date)).filter(Boolean))].sort().reverse();
    const categories = [...new Set(photos.map((p) => p.category).filter(Boolean))];
    clear(photosBox);
    photosBox.append(
      el('div', { className: 'filters' }, [
        filterSelect('年份', 'filter-year', [{ value: 'all', label: '全部年份' }, ...years.map((y) => ({ value: y, label: `${y} 年` }))], (v) => { state.year = v; update(); }),
        filterSelect('分類', 'filter-category', [{ value: 'all', label: '全部分類' }, ...categories.map((c) => ({ value: c, label: c }))], (v) => { state.category = v; update(); }),
        count,
      ]),
      grid,
    );
    update();

    // 從首頁點進來（gallery.html#照片id）時，直接打開那張照片
    const target = decodeURIComponent(location.hash.slice(1));
    const index = visible.findIndex((p) => p.id === target);
    if (index >= 0) {
      const button = document.getElementById(`photo-${target}`);
      button.scrollIntoView({ block: 'center' });
      lightbox.open(visible, index, button);
    }
  } catch (error) {
    showError(photosBox, error);
  }
}

// 燈箱：Esc 關閉、左右鍵切換、點背景關閉；開啟時鎖定捲動，關閉後焦點回到原本的縮圖。
function createLightbox() {
  const img = image('assets/images/placeholders/photo.svg', '', { eager: true });
  const title = el('h2', { attrs: { id: 'lightbox-title' } });
  const meta = el('div', { className: 'meta' });
  const caption = el('p');
  const position = el('span', { className: 'result-count' });
  const prevBtn = el('button', { className: 'lightbox__btn', text: '← 上一張', attrs: { type: 'button' }, on: { click: () => show(current - 1) } });
  const nextBtn = el('button', { className: 'lightbox__btn', text: '下一張 →', attrs: { type: 'button' }, on: { click: () => show(current + 1) } });
  const closeBtn = el('button', { className: 'lightbox__btn', text: '關閉', attrs: { type: 'button' }, on: { click: () => close() } });

  const figure = el('figure', { className: 'lightbox__figure' }, [
    img,
    el('figcaption', { className: 'lightbox__caption' }, [title, meta, caption]),
    el('div', { className: 'lightbox__controls' }, [prevBtn, position, nextBtn, closeBtn]),
  ]);
  const root = el('div', {
    className: 'lightbox',
    attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'lightbox-title', hidden: true },
    on: { click: (event) => { if (event.target === root) close(); } },
  }, [figure]);
  document.body.append(root);

  let list = [];
  let current = 0;
  let opener = null;

  function show(index) {
    current = (index + list.length) % list.length;
    const photo = list[current];
    img.src = safeImageUrl(photo.image, 'photo');
    img.alt = photo.title;
    title.textContent = photo.title;
    meta.replaceChildren(el('span', { text: formatDate(photo.date) }), gameTag(photo.game) || '', el('span', { text: photo.category || '' }), demoBadge(photo.is_demo) || '');
    caption.textContent = photo.caption || '';
    position.textContent = `${current + 1} / ${list.length}`;
    const single = list.length < 2;
    prevBtn.hidden = single;
    nextBtn.hidden = single;
  }

  function onKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    else if (event.key === 'Tab') {
      // 焦點留在燈箱內
      const focusable = [prevBtn, nextBtn, closeBtn].filter((b) => !b.hidden);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      else if (!focusable.includes(document.activeElement)) { event.preventDefault(); first.focus(); }
    }
  }

  function open(photos, index, trigger) {
    list = photos;
    opener = trigger;
    show(index);
    root.hidden = false;
    document.body.classList.add('is-locked');
    document.addEventListener('keydown', onKey);
    closeBtn.focus();
  }

  function close() {
    root.hidden = true;
    document.body.classList.remove('is-locked');
    document.removeEventListener('keydown', onKey);
    if (opener && document.contains(opener)) opener.focus();
  }

  return { open };
}

async function renderQuotes() {
  try {
    const quotes = await loadTable('quotes');
    clear(quotesBox);
    quotesBox.append(sectionHead('經典語錄', { id: 'quotes-title', eyebrow: 'QUOTES' }));
    if (!quotes.length) {
      quotesBox.append(statusMessage('還沒有收錄語錄。'));
      return;
    }
    quotesBox.append(el('div', { className: 'quotes' }, quotes.map((q) => el('figure', { className: 'quote' }, [
      el('blockquote', { className: 'pre-line', text: q.text }),
      el('figcaption', { className: 'meta' }, [
        el('span', { text: `— ${q.speaker || '佚名'}` }),
        q.date ? el('span', { text: formatDate(q.date) }) : null,
        q.context ? el('span', { text: q.context }) : null,
        demoBadge(q.is_demo),
      ]),
    ]))));
  } catch (error) {
    showError(quotesBox, error);
  }
}

renderPhotos();
renderQuotes();
