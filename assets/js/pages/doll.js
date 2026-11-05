// 捏娃娃頁：成員自己挑城堡角色的款式與顏色，即時預覽，輸出一段 JSON 交給管理員。
// 組合與染色和城堡共用 paperdoll.js 的 composeDoll，捏出來的樣子和遊戲裡一樣。這一頁不用 Phaser。
// 輸出的欄位就是 data/castle_looks.json 與 data/castle_lines.json 的欄位（docs/問卷-城堡成員外觀.md）。
import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el } from '../render.js';
import { TILE, ZOOM } from '../castle/config.js';
import { CHAR_H, DOLL_CELL, DOLL_PARTS, TILE_ART, KIND_TILES, dollSrc } from '../castle/art.js';
import { composeDoll, dollParts, imagePixels } from '../castle/paperdoll.js';
import { HEIGHT_SCALE } from '../castle/imageAvatar.js';
import {
  autoLook, resolveLook, HAIR_STYLE, FACE_STYLE, HEIGHT, TOP_STYLE, ONE_PIECE, BOTTOM_STYLE, ACCESSORY_MARK,
  PALETTE, SKIN_TONES, INSTRUMENTS, ROOM_CHOICES, FAVORITE_ROOM,
} from '../castle/roster.js';

initLayout();

const { w: CW, h: CH, body: BODY } = DOLL_CELL;
const GAME_SCALE = (CHAR_H * TILE * ZOOM) / BODY; // 城堡裡（放大 2 倍）一個部件像素等於幾個螢幕像素
const BIG = 2; // 放大預覽的倍數
const LINES = 3;
const NEW = '__new__';

const status = document.getElementById('doll-status');
const memberSelect = document.getElementById('doll-member');
const newNameField = document.getElementById('doll-newname-field');
const newName = document.getElementById('doll-newname');
const output = document.getElementById('doll-output');
const copied = document.getElementById('doll-copied');

const pixels = new Map(); // 部件名稱 → 像素
let members = [];
let looksById = new Map();
let row = {}; // 目前的外觀（資料表欄位：中文選項＋色碼）
const lines = Array.from({ length: LINES }, () => ({ text: '', room: '' }));
const refresh = []; // 外觀變了要重畫的東西

// ---------- 資料 ----------

const invert = (map, value) => Object.keys(map).find((k) => map[k] === value) || '';

/** 外觀（resolveLook 的格式）→ 資料表的一列 */
function lookToRow(look, old = {}) {
  const top = invert(TOP_STYLE, look.topStyle);
  const onePiece = ONE_PIECE.includes(top);
  return {
    hair_style: invert(HAIR_STYLE, look.hairStyle),
    hair: look.hair,
    skin: look.skin,
    face: invert(FACE_STYLE, look.face),
    eyes: look.eyes || '#6b4a2e',
    height: invert(HEIGHT, look.height) || '中',
    top_style: top,
    top: look.outfit,
    bottom_style: onePiece ? '' : invert(BOTTOM_STYLE, look.bottomStyle) || '長褲',
    bottom: onePiece ? '' : look.bottom,
    shoes: look.shoes || '#4a3426',
    accessory: invert(ACCESSORY_MARK, look.mark) || '無',
    accent: look.accent,
    instrument: old.instrument || '',
    favorite_room: old.favorite_room || '',
  };
}

/** 換成員：從他現在在城堡裡的樣子開始捏 */
function startFrom(id) {
  const old = looksById.get(id);
  const look = old ? resolveLook(id, { ...old, is_demo: false }) : autoLook(id || 'new-member');
  row = lookToRow(look, old);
  for (const line of lines) Object.assign(line, { text: '', room: '' });
  update();
}

function currentLook(r = row) {
  return resolveLook(memberSelect.value || 'new-member', { ...r, is_demo: false });
}

// ---------- 畫圖 ----------

function loadParts() {
  return Promise.all(DOLL_PARTS.map((name) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { pixels.set(name, imagePixels(img)); resolve(); };
    img.onerror = () => reject(new Error(`部件圖片載入失敗：${name}`));
    img.src = dollSrc(name);
  })));
}

/** 組出三格一列的角色（canvas，寬 CW×3） */
function compose(look) {
  const canvas = document.createElement('canvas');
  canvas.width = CW * 3;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(CW * 3, CH);
  if (dollParts(look).every((name) => pixels.has(name))) composeDoll(image.data, look, (name) => pixels.get(name));
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** 把第 view 格（0 正面、1 背面、2 側面）的 crop 範圍畫到 target，縮放 scale */
function drawView(target, sheet, view, scale, crop = [0, 0, CW, CH]) {
  const [x, y, w, h] = crop;
  target.width = Math.round(w * scale);
  target.height = Math.round(h * scale);
  const ctx = target.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sheet, view * CW + x, y, w, h, 0, 0, target.width, target.height);
}

function buildPreview() {
  const big = [0, 1, 2].map(() => el('canvas', { className: 'doll__big' }));
  document.getElementById('doll-views').append(...big);

  const scene = document.getElementById('doll-scene');
  const floor = TILE_ART[KIND_TILES.floor];
  scene.style.backgroundImage = `url("${floor.src}")`;
  scene.style.backgroundSize = `${TILE * ZOOM * floor.cols}px`;
  const small = [0, 1, 2].map(() => el('canvas', { className: 'doll__small' }));
  const ref = el('canvas', { className: 'doll__small doll__small--ref' });
  scene.append(...small, ref);
  // 比身高用的人：中等身高
  drawView(ref, compose(resolveLook('reference', {
    hair_style: '短髮', top_style: '襯衫', bottom_style: '長褲', face: '溫和', height: '中', accessory: '無', is_demo: false,
  })), 0, GAME_SCALE);

  refresh.push(() => {
    const look = currentLook();
    const sheet = compose(look);
    big.forEach((c, i) => drawView(c, sheet, i, BIG));
    const s = GAME_SCALE * (HEIGHT_SCALE[look.height] || 1);
    small.forEach((c, i) => drawView(c, sheet, i, s));
  });
}

// ---------- 表單 ----------

/** 一組按鈕選項；field＝row 的欄位。thumb(canvas, 選項)：按鈕上的小圖 */
function choices(field, options, { label, hint, thumb } = {}) {
  const buttons = options.map((value) => {
    const button = el('button', { type: 'button', className: thumb ? 'chip doll-chip doll-chip--thumb' : 'chip doll-chip', 'aria-pressed': 'false' });
    if (thumb) button.append(el('canvas', { className: 'doll-chip__img', 'aria-hidden': 'true' }));
    button.append(el('span', { text: value }));
    button.addEventListener('click', () => { row[field] = value; update(); });
    return button;
  });
  const box = el('div', { className: 'doll-field' },
    el('p', { className: 'doll-field__label', text: label }),
    hint ? el('p', { className: 'doll-field__hint', text: hint }) : null,
    el('div', { className: 'doll-choices', role: 'group', 'aria-label': label }, buttons));
  refresh.push(() => {
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(row[field] === options[i])));
    if (thumb) buttons.forEach((b, i) => thumb(b.querySelector('canvas'), options[i]));
  });
  return box;
}

/** 顏色：色票＋自訂 */
function colorField(field, label, swatches = PALETTE) {
  const buttons = Object.entries(swatches).map(([name, hex]) => {
    const button = el('button', { type: 'button', className: 'doll-swatch', title: name, 'aria-label': name, 'aria-pressed': 'false' });
    button.style.backgroundColor = hex;
    button.addEventListener('click', () => { row[field] = hex; update(); });
    return [button, hex];
  });
  const id = `doll-color-${field}`;
  const custom = el('input', { type: 'color', id, className: 'doll-custom' });
  custom.addEventListener('input', () => { row[field] = custom.value; update(); });
  const customLabel = el('label', { className: 'doll-custom-label', for: id }, '自訂', custom);
  const box = el('div', { className: 'doll-field' },
    el('p', { className: 'doll-field__label', text: label }),
    el('div', { className: 'doll-swatches', role: 'group', 'aria-label': label }, buttons.map(([b]) => b), customLabel));
  refresh.push(() => {
    const value = (row[field] || '').toLowerCase();
    let matched = false;
    for (const [b, hex] of buttons) {
      const on = hex.toLowerCase() === value;
      matched ||= on;
      b.setAttribute('aria-pressed', String(on));
    }
    if (/^#[0-9a-f]{6}$/.test(value)) custom.value = value;
    customLabel.classList.toggle('is-on', !matched && Boolean(value));
  });
  return box;
}

function selectField(field, label, options, empty) {
  const id = `doll-${field}`;
  const select = el('select', { id }, el('option', { value: '', text: empty }), options.map((o) => el('option', { value: o, text: o })));
  select.addEventListener('change', () => { row[field] = select.value; update(); });
  refresh.push(() => {
    const value = row[field] || '';
    // 以前填過清單外的答案（例如「豎笛」）：照樣列出來，不要被清掉
    if (value && ![...select.options].some((o) => o.value === value)) select.append(el('option', { value, text: value }));
    select.value = value;
  });
  return el('div', { className: 'doll-field' }, el('label', { className: 'doll-field__label', for: id, text: label }), select);
}

/** 臉的小圖：目前的外觀換上這張臉，取正面的頭 */
function faceThumb(canvas, face) {
  const sheet = compose(currentLook({ ...row, face }));
  const size = Math.round(CW * 0.56);
  drawView(canvas, sheet, 0, 1.25, [Math.round((CW - size) / 2), CH - BODY + 2, size, size]);
}

function buildForm() {
  const bottom = choices('bottom_style', Object.keys(BOTTOM_STYLE), { label: '下身' });
  document.getElementById('doll-looks').append(
    choices('hair_style', Object.keys(HAIR_STYLE), { label: '髮型' }),
    choices('face', Object.keys(FACE_STYLE), { label: '臉', hint: '城堡裡的角色很小，表情明顯的臉比較看得出來。', thumb: faceThumb }),
    choices('height', Object.keys(HEIGHT), { label: '身高' }),
    choices('top_style', Object.keys(TOP_STYLE), { label: '上衣', hint: '長袍、洋裝是連身的，不用選下身。' }),
    bottom,
    choices('accessory', Object.keys(ACCESSORY_MARK), { label: '配件（選一個）' }),
  );

  const bottomColor = colorField('bottom', '下身');
  const accentColor = colorField('accent', '配件');
  document.getElementById('doll-colors').append(
    colorField('hair', '髮色'),
    colorField('skin', '膚色', SKIN_TONES),
    colorField('eyes', '眼睛'),
    colorField('top', '上衣'),
    bottomColor,
    colorField('shoes', '鞋子'),
    accentColor,
  );
  refresh.push(() => {
    const onePiece = ONE_PIECE.includes(row.top_style);
    bottom.hidden = onePiece;
    bottomColor.hidden = onePiece;
    accentColor.hidden = row.accessory === '無';
  });

  const lineInputs = lines.map((line, i) => {
    const text = el('input', { type: 'text', maxlength: '40', 'aria-label': `想說的話 ${i + 1}` });
    text.addEventListener('input', () => { line.text = text.value; writeOutput(); });
    const room = el('select', { 'aria-label': `想說的話 ${i + 1} 在哪個房間說` },
      el('option', { value: '', text: '任何房間' }), ROOM_CHOICES.map((r) => el('option', { value: r, text: r })));
    room.addEventListener('change', () => { line.room = room.value; writeOutput(); });
    refresh.push(() => { text.value = line.text; room.value = line.room; });
    return el('div', { className: 'doll-line' }, text, room);
  });
  document.getElementById('doll-extra').append(
    selectField('instrument', '拿手樂器', INSTRUMENTS, '（不填）'),
    selectField('favorite_room', '最喜歡待的房間（會比較常出現在那裡）', ROOM_CHOICES, '（不填）'),
    el('div', { className: 'doll-field' },
      el('p', { className: 'doll-field__label', text: '想說的話（1～3 句，在城堡裡和訪客聊天時會出現）' }),
      lineInputs),
  );
}

// ---------- 輸出 ----------

function writeOutput() {
  const id = memberSelect.value === NEW ? '' : memberSelect.value;
  const member = members.find((m) => m.id === id);
  const onePiece = ONE_PIECE.includes(row.top_style);
  const result = {
    nickname: member ? member.nickname : newName.value.trim(),
    castle_looks: {
      member_id: id, ...row,
      bottom_style: onePiece ? '' : row.bottom_style,
      bottom: onePiece ? '' : row.bottom,
      is_demo: false,
    },
    castle_lines: lines.filter((l) => l.text.trim()).map((l) => ({
      id: '', member_id: id, room: FAVORITE_ROOM[l.room] || '', text: l.text.trim(), is_demo: false,
    })),
  };
  output.value = JSON.stringify(result, null, 2);
}

let pending = false;
function update() {
  copied.textContent = '';
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    // 從長袍、洋裝換回一般上衣：補上下身
    if (!ONE_PIECE.includes(row.top_style)) {
      row.bottom_style ||= '長褲';
      row.bottom ||= PALETTE.黑;
    }
    for (const fn of refresh) fn();
    writeOutput();
  });
}

async function copyOutput() {
  if (!memberSelect.value || (memberSelect.value === NEW && !newName.value.trim())) {
    copied.textContent = '請先在最上面選你的遊戲暱稱。';
    memberSelect.focus();
    return;
  }
  try {
    await navigator.clipboard.writeText(output.value);
    copied.textContent = '已複製！貼到公會群組給管理員就完成了。';
  } catch {
    output.focus();
    output.select();
    copied.textContent = '請按 Ctrl＋C（手機長按選「複製」）複製選取的文字。';
  }
}

// ---------- 開始 ----------

async function main() {
  try {
    [members] = await Promise.all([loadTable('members'), loadParts()]);
  } catch (error) {
    console.error(error);
    status.textContent = '資料讀取失敗，請重新整理頁面再試一次。';
    return;
  }
  const looks = await loadTable('castle_looks').catch(() => []);
  looksById = new Map(looks.map((r) => [r.member_id, r]));
  members = members.filter((m) => m.id && m.nickname)
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  memberSelect.append(
    el('option', { value: '', text: '— 選擇你的遊戲暱稱 —' }),
    ...members.map((m) => el('option', { value: m.id, text: m.nickname })),
    el('option', { value: NEW, text: '名單上沒有我' }),
  );
  memberSelect.addEventListener('change', () => {
    newNameField.hidden = memberSelect.value !== NEW;
    startFrom(memberSelect.value === NEW ? '' : memberSelect.value);
  });
  newName.addEventListener('input', writeOutput);
  document.getElementById('doll-copy').addEventListener('click', copyOutput);
  document.getElementById('doll-form').addEventListener('submit', (e) => e.preventDefault());

  buildPreview();
  buildForm();
  status.hidden = true;
  document.getElementById('doll').hidden = false;
  startFrom('');
}

main();
