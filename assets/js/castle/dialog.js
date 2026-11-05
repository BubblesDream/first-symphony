// 遊戲下方的對話框與提示訊息（一般網頁元素，不畫在畫布上）。
// 名字與台詞都是外部資料，一律用 textContent 顯示。
import { el } from '../render.js';

export function createDialog(stage) {
  const name = el('p', { className: 'castle-dialog__name' });
  const role = el('span', { className: 'castle-dialog__role' });
  const demo = el('span', { className: 'demo-badge castle-dialog__demo', text: '示範資料' });
  const text = el('p', { className: 'castle-dialog__text' });
  const hint = el('p', { className: 'castle-dialog__hint' });
  const box = el('div', { className: 'castle-dialog', hidden: true, 'aria-live': 'polite' },
    el('div', { className: 'castle-dialog__head' }, name, role, demo),
    text,
    hint,
  );
  stage.append(box);

  let lines = [];
  let index = 0;
  let onClose = null;

  function show() {
    const line = lines[index];
    text.textContent = line.text;
    demo.hidden = !line.is_demo;
    hint.textContent = index < lines.length - 1 ? '按 E、空白鍵或點這裡：下一句' : '按 E、空白鍵或點這裡：結束';
  }

  const api = {
    get isOpen() { return !box.hidden; },
    /** 開啟對話。lines：[{ text, is_demo }] */
    open({ title, subtitle = '', lines: list, onClose: done }) {
      lines = list;
      index = 0;
      onClose = done || null;
      name.textContent = title;
      role.textContent = subtitle;
      role.hidden = !subtitle;
      box.hidden = false;
      show();
    },
    next() {
      if (index < lines.length - 1) {
        index += 1;
        show();
      } else {
        api.close();
      }
    },
    close() {
      if (box.hidden) return;
      box.hidden = true;
      const done = onClose;
      onClose = null;
      if (done) done();
    },
  };
  box.addEventListener('click', () => api.next());
  return api;
}

/** 短暫顯示一行提示（例如「這裡還在整修中」） */
export function createToast(stage) {
  const box = el('p', { className: 'castle-toast', hidden: true, role: 'status' });
  stage.append(box);
  let timer = null;
  return (message, seconds = 2.5) => {
    box.textContent = message;
    box.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { box.hidden = true; }, seconds * 1000);
  };
}
