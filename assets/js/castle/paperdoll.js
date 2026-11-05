// 紙娃娃：依成員的款式挑部件（頭＝髮型＋頭上配件、衣服＝上衣＋下身、臉、眼鏡、披風），
// 每個部件的可染色區換成這個人挑的顏色，疊成一張三格（正面、背面、朝右側面）的貼圖，
// 交給 ImageAvatar 顯示。部件圖與格子大小在 art.js（DOLL_PARTS、DOLL_CELL）。
// 染色：部件只存明暗（OKLab 明度和鍵色的差＋0.5），這裡換成目標色的明度＋色度。
import { DOLL_CELL, DOLL_PARTS, dollPartKey } from './art.js';

// 每個部件由上往下排的層：固定色、頭髮、皮膚、上衣、下身、鞋子、配件（臉部疊圖多一層眼睛）
const SHADE = 0.9; // 明暗保留幾成
const HEAD_MARKS = new Set(['hat', 'ribbon', 'headband']);
const DEFAULTS = { bottom: '#2e2420', shoes: '#4a3426', accent: '#a8323a', eyes: '#6b4a2e' };
const BASE_HEAD = 'head_short_none'; // 母版的頭：臉部疊圖照它畫

/** 這個外觀要用哪些部件（由下往上疊） */
export function dollParts(look) {
  const hair = look.hairStyle || 'short';
  const mark = look.mark || 'none';
  const top = look.topStyle || 'shirt';
  const outfit = top === 'robe' || top === 'dress' ? `outfit_${top}` : `outfit_${top}_${look.bottomStyle || 'pants'}`;
  const parts = [outfit];
  if (mark === 'cape') parts.push('over_cape');
  parts.push(`head_${hair}_${HEAD_MARKS.has(mark) ? mark : 'none'}`);
  parts.push(`face_${look.face || 'base'}`);
  if (mark === 'glasses') parts.push('over_glasses');
  return parts;
}

/**
 * 產生（或沿用）這個人的紙娃娃貼圖，回傳貼圖名稱；部件不齊時回傳 null（改畫色塊）。
 * 貼圖名稱用成員 id，同一個遊戲裡只做一次。
 */
export function dollTexture(scene, id, look) {
  if (!id || scene.registry.get('noArt')) return null;
  const key = `castle:dollchar:${id}`;
  if (scene.textures.exists(key)) return key;
  const loaded = (name) => DOLL_PARTS.includes(name) && scene.textures.exists(dollPartKey(name));
  if (!dollParts(look).every(loaded) || !loaded(BASE_HEAD)) return null;

  const { w, h } = DOLL_CELL;
  const canvas = document.createElement('canvas');
  canvas.width = w * 3;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const out = ctx.createImageData(w * 3, h);
  composeDoll(out.data, look, (name) => partPixels(scene, name));
  ctx.putImageData(out, 0, 0);
  const texture = scene.textures.addCanvas(key, canvas);
  for (let i = 0; i < 3; i += 1) texture.add(i, 0, i * w, 0, w, h);
  return key;
}

/**
 * 把這個外觀疊進 dst（三格一列，寬 DOLL_CELL.w×3、高 DOLL_CELL.h 的 RGBA）。不用 Phaser，捏娃娃頁也用這支。
 * pixelsOf(名稱)：部件圖的像素（Uint8ClampedArray，整張部件圖）。
 */
export function composeDoll(dst, look, pixelsOf) {
  const { w, h } = DOLL_CELL;
  const parts = dollParts(look);
  const colors = [null, look.hair, look.skin, look.outfit, look.bottom || DEFAULTS.bottom,
    look.shoes || DEFAULTS.shoes, look.accent || DEFAULTS.accent, look.eyes || DEFAULTS.eyes].map((c) => c && lut(c));
  const size = w * 3 * h;
  const stride = w * 3 * 4;
  const head = parts.find((name) => name.startsWith('head_'));
  for (const name of parts) {
    const src = pixelsOf(name);
    // 臉部疊圖照母版的短髮畫：這個髮型的瀏海、帽沿比母版多蓋到臉的地方，臉不能畫上去
    const covered = name.startsWith('face_') ? hairOnly(head, pixelsOf, size) : null;
    const layers = Math.round(src.length / stride / h);
    for (let layer = 0; layer < layers; layer += 1) {
      const table = colors[layer];
      const base = layer * h * stride;
      for (let i = 0; i < size; i += 1) {
        const s = base + i * 4;
        const a = src[s + 3];
        if (!a || (covered && covered[i])) continue;
        let r = src[s];
        let g = src[s + 1];
        let b = src[s + 2];
        if (table) {
          const t = src[s] * 3; // 可染色層：灰階＝明暗
          r = table[t]; g = table[t + 1]; b = table[t + 2];
        }
        over(dst, i * 4, r, g, b, a);
      }
    }
  }
  return dst;
}

/** 頭部件裡「頭髮或頭上配件」蓋住、母版沒有頭髮的像素（每個頭只算一次） */
const coverCache = new Map();
function hairOnly(head, pixelsOf, size) {
  if (!coverCache.has(head)) {
    const mine = pixelsOf(head);
    const base = pixelsOf(BASE_HEAD);
    const alpha = (src, layer, i) => src[(layer * size + i) * 4 + 3];
    const covered = new Uint8Array(size);
    for (let i = 0; i < size; i += 1) {
      covered[i] = Math.max(alpha(mine, 1, i), alpha(mine, 6, i)) > 128 && alpha(base, 1, i) < 64 ? 1 : 0;
    }
    coverCache.set(head, covered);
  }
  return coverCache.get(head);
}

/** 疊上一個像素（一般的 source-over，未預乘） */
function over(dst, o, r, g, b, a) {
  const sa = a / 255;
  const da = dst[o + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  const k = da * (1 - sa);
  dst[o] = (r * sa + dst[o] * k) / oa;
  dst[o + 1] = (g * sa + dst[o + 1] * k) / oa;
  dst[o + 2] = (b * sa + dst[o + 2] * k) / oa;
  dst[o + 3] = oa * 255;
}

const pixelCache = new Map();
/** 部件圖的像素（每個部件只讀一次） */
function partPixels(scene, name) {
  if (!pixelCache.has(name)) pixelCache.set(name, imagePixels(scene.textures.get(dollPartKey(name)).getSourceImage()));
  return pixelCache.get(name);
}

/** 圖片（已載入的 <img>）的像素 */
export function imagePixels(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  return cx.getImageData(0, 0, c.width, c.height).data;
}

// ---------- 顏色（OKLab） ----------

const lutCache = new Map();
/** 目標色的對照表：明暗 0～255 → RGB */
function lut(hex) {
  if (lutCache.has(hex)) return lutCache.get(hex);
  const [L0, A, B] = toLab(hex);
  const table = new Uint8ClampedArray(256 * 3);
  for (let v = 0; v < 256; v += 1) {
    const L = Math.min(1, Math.max(0, L0 + (v / 255 - 0.5) * SHADE));
    const rgb = fromLab(L, A, B);
    table.set(rgb, v * 3);
  }
  lutCache.set(hex, table);
  return table;
}

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055);

function toLab(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => toLin(c / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromLab(L, A, B) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.round(Math.min(1, Math.max(0, toSrgb(c))) * 255));
}
