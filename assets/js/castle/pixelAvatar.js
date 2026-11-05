// 把紙娃娃部件（pixelParts.js）依每個人的顏色疊成一張小圖，存成 Phaser 的貼圖。
// 一個人一張貼圖：3 個方向 × 4 張（站、走 1、走 2、坐），同樣的外觀只做一次（換房間也沿用）。
import { W, H, BODY, HAIR, TOP, BOTTOM, SHOES, ACCESSORY } from './pixelParts.js';

export const DIRS = ['down', 'up', 'side'];
export const FRAMES = ['stand', 'walk1', 'walk2', 'sit'];
export const SCALE = 2; // 16×24 的圖放大 2 倍＝32×48（遊戲世界單位）
const PAD = 1; // 四周留 1 格給外框
const CW = W + PAD * 2;
const CH = H + PAD * 2;

const OUTLINE = '#3a2a1f';
const FIXED = { m: '#aeb3bb', w: '#f5efe2', e: '#2e2420' };
const SHADE = 0.72;

/** look → 各字元的顏色 */
function palette(look) {
  const base = {
    s: look.skin,
    h: look.hair,
    t: look.outfit,
    b: look.bottom || darken(look.outfit, 0.55),
    f: look.shoes || '#4a3426',
    a: look.accent,
    ...FIXED,
  };
  const out = {};
  for (const [k, color] of Object.entries(base)) {
    out[k] = color;
    out[k.toUpperCase()] = darken(color, SHADE);
  }
  out.E = FIXED.e;
  return out;
}

function darken(color, f) {
  const n = Number.parseInt(String(color).slice(1), 16);
  const c = (shift) => Math.round(((n >> shift) & 255) * f);
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`;
}

/** 這個人要疊哪些部件（由下往上） */
export function partsOf(look) {
  const top = TOP[look.topStyle] || TOP.shirt;
  let bottom = BOTTOM[look.bottomStyle] || null;
  if (look.topStyle === 'robe') bottom = null; // 長袍蓋住下身
  else if (!bottom) bottom = look.topStyle === 'dress' ? BOTTOM.longskirt : BOTTOM.pants;
  const acc = ACCESSORY[look.mark] || null;
  return { top, bottom, hair: HAIR[look.hairStyle] || HAIR.short, acc };
}

/** 疊出一個方向的 16×24 字元格 */
function compose(look, dir) {
  const grid = Array.from({ length: H }, () => Array(W).fill('.'));
  const paint = (part) => {
    if (!part) return;
    part[dir].forEach((row, i) => {
      const y = part.y + i;
      if (y < 0 || y >= H) return;
      for (let x = 0; x < W; x++) if (row[x] !== '.') grid[y][x] = row[x];
    });
  };
  const { top, bottom, hair, acc } = partsOf(look);
  const back = acc?.back?.[dir];
  if (back) paint(acc);
  paint(BODY);
  paint(bottom);
  paint(SHOES);
  paint(top);
  paint(hair);
  if (acc && !back) paint(acc);
  return grid;
}

/** 走路：左半邊（或右半邊）的腿往上提 1 格 */
function walkFrame(grid, side) {
  const out = grid.map((row) => [...row]);
  const [x0, x1] = side === 0 ? [0, 7] : [8, 15];
  for (let y = 18; y < H; y++) {
    for (let x = x0; x <= x1; x++) out[y][x] = y + 1 < H ? grid[y + 1][x] : '.';
  }
  return out;
}

/** 坐著：只留到大腿（第 19 列），腳藏起來 */
function sitFrame(grid) {
  return grid.map((row, y) => (y >= 20 ? row.map(() => '.') : [...row]));
}

/** 產生（或沿用）這個外觀的貼圖，回傳貼圖名稱 */
export function avatarTexture(scene, look) {
  const key = `avatar:${[look.skin, look.hair, look.outfit, look.bottom, look.shoes, look.accent, look.hairStyle, look.topStyle, look.bottomStyle, look.mark].join('|')}`;
  if (scene.textures.exists(key)) return key;
  const colors = palette(look);
  const tex = scene.textures.createCanvas(key, CW * FRAMES.length, CH * DIRS.length);
  const ctx = tex.getContext();
  DIRS.forEach((dir, row) => {
    const grid = compose(look, dir);
    const frames = { stand: grid, walk1: walkFrame(grid, 0), walk2: walkFrame(grid, 1), sit: sitFrame(grid) };
    FRAMES.forEach((name, col) => {
      draw(ctx, frames[name], colors, col * CW + PAD, row * CH + PAD);
      tex.add(`${dir}-${name}`, 0, col * CW, row * CH, CW, CH);
    });
  });
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

function draw(ctx, grid, colors, ox, oy) {
  const filled = (x, y) => y >= 0 && y < H && x >= 0 && x < W && grid[y][x] !== '.';
  // 外框：透明格子旁邊有顏色就描深色
  ctx.fillStyle = OUTLINE;
  for (let y = -1; y <= H; y++) {
    for (let x = -1; x <= W; x++) {
      if (filled(x, y)) continue;
      if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = grid[y][x];
      if (ch === '.') continue;
      ctx.fillStyle = colors[ch] || OUTLINE;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

/** 圖的哪一列是腳底（設定顯示位置用） */
export const FOOT_ROW = PAD + H; // 從圖的上緣算起
export const CELL = { w: CW, h: CH };
