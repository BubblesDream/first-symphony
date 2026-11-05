// 「存成圖片」：把面板的結果畫成一張紀念卡（2D canvas），下載成 PNG。
// 另外提供面板共用的名字欄（署名用）。暱稱等外部資料只用 fillText 畫在畫布上，網頁部分只用 textContent。
import { el } from '../render.js';

const W = 720;
const H = 960;
const PAD = 56;
const NAME_KEY = 'castle.visitorName';
export const DEFAULT_NAME = '無名的旅人';
export const NAME_MAX = 12;

// 紀念卡的顏色（和網站紙張配色一致，只用在畫布上）
const PAPER = '#f4ede1';
const CARD = '#fbf7ef';
const INK = '#3a2a1f';
const INK_SOFT = '#5c4a3c';
const INK_FAINT = '#725f4e';
const LINE = '#dccfb9';
const ACCENT = '#8a4528';

/** 今天的日期：{ text: '2026-11-05', compact: '20261105' }（訪客電腦的當地時間） */
export function today(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return { text: `${y}-${m}-${d}`, compact: `${y}${m}${d}` };
}

function readName() {
  try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; }
}

function saveName(name) {
  try { localStorage.setItem(NAME_KEY, name); } catch { /* 無痕模式等情況存不了，不影響使用 */ }
}

/** 名字欄（各面板共用同一個名字）。回傳 { node, value() } */
export function createNameField(label) {
  const input = el('input', {
    className: 'castle-panel__input', type: 'text', maxlength: String(NAME_MAX),
    placeholder: DEFAULT_NAME, autocomplete: 'nickname',
  });
  input.value = readName().slice(0, NAME_MAX);
  input.addEventListener('change', () => saveName(input.value.trim().slice(0, NAME_MAX)));
  const node = el('label', { className: 'castle-panel__field' }, el('span', { text: label }), input);
  return { node, value: () => input.value.trim().slice(0, NAME_MAX) || DEFAULT_NAME };
}

/**
 * 「存成圖片」按鈕。getCard() 在按下時回傳卡片內容：
 * { kind（檔名用，例如 forge）, title, headline, sub, lines: [], signLabel, name }
 */
export function createShareButton(getCard) {
  const button = el('button', { type: 'button', className: 'btn castle-panel__share', text: '存成圖片' });
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const card = getCard();
      const canvas = await drawShareCard(card);
      await downloadCanvas(canvas, `castle-${card.kind}-${today().compact}.png`);
    } catch (error) {
      console.warn('存成圖片失敗', error);
    } finally {
      button.disabled = false;
    }
  });
  return button;
}

/** 頁面既有字型（tokens.css 的變數） */
function fonts() {
  const css = getComputedStyle(document.documentElement);
  return {
    title: css.getPropertyValue('--font-title').trim() || 'serif',
    body: css.getPropertyValue('--font-body').trim() || 'sans-serif',
    hand: css.getPropertyValue('--font-hand').trim() || 'sans-serif',
  };
}

/** 依寬度斷行（中文一個字一個字算） */
function wrap(g, text, width) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const ch of para) {
      if (line && g.measureText(line + ch).width > width) {
        out.push(line);
        line = ch.trim() ? ch : '';
      } else {
        line += ch;
      }
    }
    out.push(line);
  }
  return out;
}

export async function drawShareCard(card) {
  const f = fonts();
  const fontTitle = `700 40px ${f.title}`;
  const fontHead = `700 48px ${f.title}`;
  const fontBody = `26px ${f.body}`;
  const fontHand = `30px ${f.hand}`;
  const allText = [card.title, card.headline, card.sub, ...(card.lines || []), card.name, '第一交響樂團・虛擬公會城堡'].join('');
  // 等字型載好（只載用得到的字），載不到就用系統字型
  try {
    await Promise.all([fontTitle, fontHead, fontBody, fontHand].map((font) => document.fonts.load(font, allText)));
    await document.fonts.ready;
  } catch { /* 用系統字型 */ }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  g.fillStyle = PAPER;
  g.fillRect(0, 0, W, H);
  g.fillStyle = CARD;
  g.fillRect(28, 28, W - 56, H - 56);
  g.strokeStyle = LINE;
  g.lineWidth = 2;
  g.strokeRect(28, 28, W - 56, H - 56);
  g.strokeRect(40, 40, W - 80, H - 80);

  const inner = W - PAD * 2 - 16;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  let y = 130;

  g.fillStyle = INK_FAINT;
  g.font = fontTitle;
  g.fillText(card.title, W / 2, y);
  y += 30;
  g.strokeStyle = LINE;
  g.beginPath();
  g.moveTo(W / 2 - 80, y);
  g.lineTo(W / 2 + 80, y);
  g.stroke();
  y += 80;

  g.fillStyle = INK;
  g.font = fontHead;
  for (const line of wrap(g, card.headline, inner)) {
    g.fillText(line, W / 2, y);
    y += 64;
  }
  if (card.sub) {
    g.fillStyle = ACCENT;
    g.font = fontHead;
    for (const line of wrap(g, card.sub, inner)) {
      g.fillText(line, W / 2, y);
      y += 64;
    }
  }
  y += 24;

  g.fillStyle = INK_SOFT;
  g.font = fontBody;
  const bottomLimit = H - 250;
  for (const text of card.lines || []) {
    for (const line of wrap(g, text, inner)) {
      if (y > bottomLimit) break;
      g.fillText(line, W / 2, y);
      y += 40;
    }
    y += 12;
  }

  // 署名與日期
  g.fillStyle = INK;
  g.font = fontHand;
  g.fillText(`${card.signLabel || '署名'}：${card.name}`, W / 2, H - 190);
  g.fillStyle = INK_FAINT;
  g.font = fontBody;
  g.fillText(today().text, W / 2, H - 145);
  g.font = `20px ${f.body}`;
  g.fillText('第一交響樂團・虛擬公會城堡', W / 2, H - 76);
  return canvas;
}

/** 下載畫布：先用 toBlob，不支援或失敗時改用 toDataURL（部分手機瀏覽器） */
export function downloadCanvas(canvas, filename) {
  const save = (href, revoke) => {
    const a = el('a', { href, download: filename, hidden: true });
    document.body.append(a);
    a.click();
    a.remove();
    if (revoke) setTimeout(() => URL.revokeObjectURL(href), 10000);
  };
  return new Promise((resolve) => {
    const fallback = () => {
      save(canvas.toDataURL('image/png'), false);
      resolve();
    };
    try {
      canvas.toBlob((blob) => {
        if (!blob) return fallback();
        save(URL.createObjectURL(blob), true);
        resolve();
      }, 'image/png');
    } catch {
      fallback();
    }
  });
}
