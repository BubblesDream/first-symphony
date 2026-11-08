// 通用紀念卡：只接收文字、列資料與繪圖函式，不依賴房間或 Phaser。
import { el } from '../render.js';

const FONT = '"LXGW WenKai TC", "Noto Serif TC", "PingFang TC", "Microsoft JhengHei", serif';

function wrap(ctx, text, width) {
  const lines = [];
  for (const paragraph of String(text ?? '').split('\n')) {
    let line = '';
    for (const ch of paragraph) {
      if (line && ctx.measureText(line + ch).width > width) { lines.push(line); line = ''; }
      line += ch;
    }
    lines.push(line);
  }
  return lines;
}

export function drawCard(spec) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f4ede1';
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = '#fbf7ef';
  ctx.fillRect(44, 44, 992, 1262);
  ctx.strokeStyle = '#dccfb9';
  ctx.strokeRect(44, 44, 992, 1262);
  ctx.fillStyle = 'rgba(212,188,146,0.72)';
  ctx.fillRect(400, 26, 280, 48);
  let y = 110;
  const text = (value, size, color, width = 880, lineHeight = size * 1.35, x = 100) => {
    ctx.font = `${size}px ${FONT}`;
    ctx.fillStyle = color;
    for (const line of wrap(ctx, value, width)) { ctx.fillText(line, x, y); y += lineHeight; }
  };
  text(spec.kicker, 30, '#725f4e');
  y += 12;
  text(spec.title, 60, '#8a4528');
  if (spec.subtitle) text(spec.subtitle, 32, '#5c4a3c');
  y += 12;
  if (spec.art) { spec.art(ctx, 100, y, 880, 360); y += 375; }

  // 列資料與備註共用剩餘空間，長暱稱也逐字換行。
  const start = y;
  let size = 40; // 放不下時逐步縮小
  let layouts;
  let notes;
  let height;
  do {
    ctx.font = `${size}px ${FONT}`;
    layouts = (spec.rows || []).map(({ label, value, color }) => ({
      color, labels: wrap(ctx, label, 235), values: wrap(ctx, value, color ? 570 : 620),
    }));
    notes = spec.note ? wrap(ctx, spec.note, 880) : [];
    height = layouts.reduce((sum, row) => sum + Math.max(row.labels.length, row.values.length) * size * 1.35 + 10, 0)
      + (notes.length ? 20 + notes.length * size * 1.35 : 0);
    if (start + height <= 1140 || size <= 14) break;
    size -= 1;
  } while (true);
  ctx.font = `${size}px ${FONT}`;
  for (const row of layouts) {
    ctx.fillStyle = '#725f4e';
    row.labels.forEach((line, i) => ctx.fillText(line, 100, y + i * size * 1.35));
    // color：值的前面畫一個小色塊（例如幸運色）
    if (row.color) {
      ctx.fillStyle = row.color;
      ctx.fillRect(360, y - size * 0.8, size * 0.85, size * 0.85);
      ctx.strokeRect(360, y - size * 0.8, size * 0.85, size * 0.85);
    }
    ctx.fillStyle = '#3a2a1f';
    row.values.forEach((line, i) => ctx.fillText(line, row.color ? 360 + size * 1.25 : 360, y + i * size * 1.35));
    y += Math.max(row.labels.length, row.values.length) * size * 1.35 + 10;
  }
  if (notes.length) { y += 20; text(spec.note, size, '#5c4a3c'); }
  ctx.beginPath();
  ctx.moveTo(100, 1160); ctx.lineTo(980, 1160); ctx.stroke();
  y = 1198;
  text(spec.name ? `${spec.name} 的卡片` : '今日的紀念卡', 25, '#5c4a3c', 650);
  ctx.font = `25px ${FONT}`;
  ctx.fillText(String(spec.date), 795, 1198);
  y = 1245;
  text('第一交響樂團｜虛擬公會城堡', 25, '#725f4e');
  text('bubblesdream.github.io/first-symphony', 22, '#725f4e');
  return canvas;
}

export async function renderCard(spec) {
  try {
    await document.fonts?.load(`32px ${FONT}`, ['第一交響樂團｜虛擬公會城堡 今日的紀念卡 的卡片 bubblesdream.github.io/first-symphony', spec.date, spec.kicker, spec.title, spec.subtitle, spec.note, spec.name,
      ...(spec.rows || []).flatMap((row) => [row.label, row.value])].filter(Boolean).join(''));
  } catch { /* 字型載入失敗仍使用系統字型 */ }
  return drawCard(spec);
}

export function createCardPanel(stage) {
  const preview = el('img', { className: 'castle-card__preview', alt: '紀念卡預覽', hidden: true });
  const input = el('input', { type: 'text', maxlength: 12, autocomplete: 'nickname' });
  const download = el('button', { type: 'button', className: 'btn', text: '下載圖片' });
  const share = el('button', { type: 'button', className: 'btn', text: '分享', hidden: true });
  const dismiss = el('button', { type: 'button', className: 'btn', text: '關閉' });
  const status = el('p', { className: 'castle-card__status', role: 'status' });
  const box = el('div', { className: 'castle-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': '紀念卡', hidden: true },
    preview, el('label', { className: 'castle-card__name' }, '名字（選填）', input),
    el('div', { className: 'castle-card__buttons' }, download, share, dismiss), status);
  stage.append(box);
  let options;
  let file;
  let version = 0;
  let timer;
  try { input.value = (localStorage.getItem('castle-card-name') || '').slice(0, 12); } catch { /* 名字可不儲存 */ }

  async function redraw() {
    const current = ++version;
    download.setAttribute('aria-disabled', 'true');
    share.hidden = true;
    file = null;
    status.textContent = '卡片製作中…';
    try {
      const canvas = await options.build(input.value.trim());
      const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('圖片轉換失敗')), 'image/png'));
      if (box.hidden || current !== version) return;
      const nextFile = new File([blob], options.filename, { type: 'image/png' });
      preview.src = canvas.toDataURL('image/png');
      preview.hidden = false;
      file = nextFile;
      download.setAttribute('aria-disabled', 'false');
      try { share.hidden = !navigator.canShare?.({ files: [file] }); } catch { share.hidden = true; }
      status.textContent = '';
    } catch {
      if (!box.hidden && current === version) status.textContent = '卡片製作失敗，請關閉後再試一次。';
    }
  }
  const api = {
    get isOpen() { return !box.hidden; },
    open(next) {
      if (!box.hidden) api.close();
      options = next;
      box.hidden = false;
      preview.hidden = true;
      download.setAttribute('aria-disabled', 'false');
      download.focus({ preventScroll: true });
      queueMicrotask(() => { if (!box.hidden) redraw(); });
    },
    close() {
      if (box.hidden) return;
      box.hidden = true;
      version += 1;
      clearTimeout(timer);
      file = null;
      const done = options?.onClose;
      options = null;
      stage.focus({ preventScroll: true });
      done?.();
    },
  };
  input.addEventListener('input', () => {
    version += 1;
    file = null;
    download.setAttribute('aria-disabled', 'true');
    share.hidden = true;
    try { localStorage.setItem('castle-card-name', input.value); } catch { /* 名字可不儲存 */ }
    clearTimeout(timer);
    timer = setTimeout(redraw, 250);
  });
  download.addEventListener('click', () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = el('a', { href: url, download: options.filename });
    box.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  share.addEventListener('click', async () => {
    if (!file) return;
    try { await navigator.share({ files: [file], title: '第一交響樂團｜紀念卡' }); }
    catch (error) { if (error.name !== 'AbortError' && !box.hidden) status.textContent = '分享失敗，可以改用下載圖片。'; }
  });
  dismiss.addEventListener('click', () => api.close());
  for (const type of ['keydown', 'keyup']) box.addEventListener(type, (event) => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); if (type === 'keydown') api.close(); }
    if (event.key === 'Tab' && type === 'keydown') {
      const buttons = [input, download, share, dismiss].filter((node) => !node.hidden && !node.disabled);
      const index = buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  });
  for (const type of ['pointerdown', 'pointerup', 'click']) box.addEventListener(type, (event) => event.stopPropagation());
  return api;
}
