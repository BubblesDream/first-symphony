// 演出效果：訪客或 NPC 演出時，每隔幾秒呼叫一次 playEffect，畫一點小動畫（音符、火花、羊毛…）。
// 全部用 Phaser 的圖形與文字物件＋tween，不需要圖片。
// 新增效果＝在下面寫一個函式，並在檔案最後的 EFFECTS 表加一行；actions.js 的動作寫 effect: '<名稱>'。
//
// 效果函式拿到 fx（見 playEffect）：
//   x, y      演出者腳底位置        facing  面向       spot  演出點（格子）
//   who       演出者（Player 或 Npc）  isPlayer  是不是訪客（NPC 的效果要簡化）
//   memo      這一次演出專用的小筆記（例如連擊數）
// 效果函式可以回傳數字＝下次觸發前要等幾秒（不回傳就用預設節奏）。
import { TILE, FONT, MAX_FX } from './config.js';

// ---------- 可調整的小表 ----------

/** 羊毛顏色與機率（weight 越大越常見）。stars：落地時閃幾顆星星 */
export const WOOL_COLORS = [
  { name: '白色', color: 0xf7f4ec, weight: 30, stars: 1 },
  { name: '米色', color: 0xeadcbc, weight: 14, stars: 1 },
  { name: '灰色', color: 0xb9b6b0, weight: 12, stars: 1 },
  { name: '粉紅色', color: 0xf4b6c8, weight: 9, stars: 2 },
  { name: '水藍色', color: 0xa9d6ee, weight: 9, stars: 2 },
  { name: '淡黃色', color: 0xf6e7a1, weight: 9, stars: 2 },
  { name: '薄荷綠色', color: 0xb5e3cc, weight: 6, stars: 2 },
  { name: '薰衣草紫色', color: 0xcdb8ea, weight: 5, stars: 3 },
  { name: '金色', color: 0xf2c94c, weight: 4, stars: 5, note: '（稀有！）' },
  { name: '彩虹色', color: 0xf4b6c8, weight: 1, stars: 7, rainbow: true, note: '（超級稀有！）' },
];

/** 坐在噴泉邊丟硬幣時的祝福 */
const BLESSINGS = [
  '願你今天也順順利利。',
  '願大家都平平安安、健健康康。',
  '希望下次合奏不走音。',
  '願你抽卡都有好運氣。',
  '願公會的大家常常相聚。',
  '希望明天也是好天氣。',
  '願你找到想找的東西。',
  '願每一首歌都有人一起唱。',
];

const SPARK_COLORS = [0xffb347, 0xffd166, 0xff8c42, 0xfff0a8];
const WATER_COLORS = [0xbfe4f5, 0x8fc9e6, 0xe6f6ff];
const FLOWER_COLORS = ['#f29bb8', '#f6d55c', '#ffffff', '#c7a6f0', '#ff9f80'];
const NOTE_COLORS = ['#3a2a1f', '#2f4a86', '#7a3b5a'];

// ---------- 對外介面 ----------

/** 預設節奏（秒）：訪客、NPC */
export function nextDelay(isPlayer) {
  return isPlayer ? 2.4 + Math.random() * 1.2 : 5 + Math.random() * 5;
}

/**
 * 播放一個效果。回傳下次觸發前要等的秒數。
 * NPC 的效果只在畫面上看得到時才畫（省效能）。
 */
export function playEffect(scene, name, fx) {
  const fn = EFFECTS[name];
  if (!fn) return nextDelay(fx.isPlayer);
  if (!fx.isPlayer && !onScreen(scene, fx.x, fx.y)) return nextDelay(false);
  fx.memo = fx.memo || {};
  const delay = fn(scene, fx);
  return typeof delay === 'number' ? delay : nextDelay(fx.isPlayer);
}

/** 本次遊玩收集到的東西（只放記憶體，重新整理就沒了） */
export function inventoryOf(scene) {
  const { ctx } = scene;
  if (!ctx.inventory) ctx.inventory = { wool: [], woolCollected: 0, yarn: [] };
  return ctx.inventory;
}

/** 依機率抽一種羊毛顏色 */
export function rollWool(random = Math.random) {
  const total = WOOL_COLORS.reduce((sum, w) => sum + w.weight, 0);
  let r = random() * total;
  for (const w of WOOL_COLORS) {
    r -= w.weight;
    if (r < 0) return w;
  }
  return WOOL_COLORS[0];
}

/** 目前畫面上的效果物件數量（除錯用） */
export function effectCount(scene) {
  return scene.__fx ? scene.__fx.size : 0;
}

// ---------- 小工具 ----------

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function onScreen(scene, x, y) {
  const v = scene.cameras.main.worldView;
  return x > v.x - TILE && x < v.right + TILE && y > v.y - TILE && y < v.bottom + TILE * 2;
}

/** 效果物件的登記處：有上限、時間到自動清掉、換房間時全部清掉 */
function live(scene) {
  if (!scene.__fx) {
    scene.__fx = new Set();
    scene.events.once('shutdown', () => {
      const list = [...scene.__fx];
      scene.__fx = null;
      for (const o of list) o.destroy();
    });
  }
  return scene.__fx;
}

function room(scene, n = 1) {
  return live(scene).size + n <= MAX_FX;
}

/** 登記一個物件；lifeMs 後一定會被清掉（就算 tween 中斷） */
function track(scene, obj, depth, lifeMs = 3000) {
  const set = live(scene);
  set.add(obj);
  obj.setDepth(depth);
  obj.once('destroy', () => { if (scene.__fx) scene.__fx.delete(obj); });
  scene.time.delayedCall(lifeMs, () => obj.destroy());
  return obj;
}

function dot(scene, x, y, r, color, depth, lifeMs) {
  if (!room(scene)) return null;
  return track(scene, scene.add.circle(x, y, r, color), depth, lifeMs);
}

function label(scene, x, y, text, style, depth, lifeMs) {
  if (!room(scene)) return null;
  const t = scene.add.text(x, y, text, {
    fontFamily: FONT, fontSize: '10px', color: '#3a2a1f', ...style,
  }).setOrigin(0.5, 1).setResolution(3);
  return track(scene, t, depth, lifeMs);
}

/** 小小的四角星：放大、轉一下、淡出 */
function twinkle(scene, x, y, { color = 0xfff3b0, size = 4, delay = 0, depth = y + 40 } = {}) {
  if (!room(scene)) return null;
  const s = track(scene, scene.add.star(x, y, 4, size * 0.3, size, color), depth, 1500 + delay);
  s.setScale(0).setAngle(rand(0, 45));
  scene.tweens.add({
    targets: s, scale: 1, angle: s.angle + 45, duration: 220, delay, yoyo: true, hold: 120, ease: 'Sine.easeOut',
    onComplete: () => s.destroy(),
  });
  return s;
}

function sparkles(scene, x, y, n, options = {}) {
  for (let i = 0; i < n; i++) {
    twinkle(scene, x + rand(-10, 10), y + rand(-10, 4), { ...options, delay: i * 90 });
  }
}

/** 往上飄、左右搖、淡出（音符、Zzz、火星…） */
function floatUp(scene, obj, { rise = 26, sway = 6, duration = 1400, delay = 0 } = {}) {
  if (!obj) return;
  const x0 = obj.x;
  obj.setAlpha(0);
  scene.tweens.add({ targets: obj, alpha: 1, duration: 200, delay });
  scene.tweens.add({
    targets: obj, y: obj.y - rise, duration, delay, ease: 'Sine.easeOut',
    onUpdate: (tw) => { obj.x = x0 + Math.sin(tw.progress * Math.PI * 2) * sway; },
  });
  scene.tweens.add({ targets: obj, alpha: 0, duration: 400, delay: delay + duration - 400, onComplete: () => obj.destroy() });
}

/** 拋物線：vx、vy（像素／秒）、g（重力）；落到 floorY 就停 */
function fling(scene, obj, { vx, vy, g = 380, duration = 600, floorY = Infinity, fade = true, onLand } = {}) {
  if (!obj) return;
  const x0 = obj.x;
  const y0 = obj.y;
  const counter = { t: 0 };
  scene.tweens.add({
    targets: counter, t: duration / 1000, duration,
    onUpdate: () => {
      const t = counter.t;
      obj.x = x0 + vx * t;
      obj.y = Math.min(floorY, y0 + vy * t + 0.5 * g * t * t);
    },
    onComplete: () => {
      if (onLand) onLand();
      else if (fade) scene.tweens.add({ targets: obj, alpha: 0, duration: 250, onComplete: () => obj.destroy() });
    },
  });
}

/** 從 (x0,y0) 以拋物線飛到 (x1,y1)，最高點高出 arc 像素 */
function arcTo(scene, obj, x1, y1, { arc = 20, duration = 500, onDone } = {}) {
  const x0 = obj.x;
  const y0 = obj.y;
  const counter = { p: 0 };
  scene.tweens.add({
    targets: counter, p: 1, duration,
    onUpdate: () => {
      const p = counter.p;
      obj.x = x0 + (x1 - x0) * p;
      obj.y = y0 + (y1 - y0) * p - Math.sin(p * Math.PI) * arc;
    },
    onComplete: () => onDone && onDone(),
  });
}

/** 頭頂的高度（坐著時低一點） */
function headY(fx) {
  return fx.y - (fx.who?.avatar?.seated ? 38 : 44);
}

/** 面向的方向 → 位移 */
function dirOf(facing) {
  return { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[facing] || [0, 1];
}

/**
 * 在演出點附近找符合條件的格子（例如羊、稻草人）。優先找面向的那格。
 * test(def, cell)：def 是 legend 定義。回傳 { tx, ty, cx, cy, bottom } 或 null。
 */
function findNear(scene, fx, test, radius = 2) {
  const { grid } = scene;
  const sx = fx.spot ? fx.spot.x : Math.floor(fx.x / TILE);
  const sy = fx.spot ? fx.spot.y : Math.floor(fx.y / TILE);
  const [dx, dy] = dirOf(fx.facing);
  let best = null;
  let bestD = Infinity;
  for (let y = sy - radius; y <= sy + radius; y++) {
    for (let x = sx - radius; x <= sx + radius; x++) {
      const c = grid.cell(x, y);
      if (!c || !test(grid.legend[c.ch] || {}, c)) continue;
      let d = Math.abs(x - sx) + Math.abs(y - sy);
      if (x === sx + dx && y === sy + dy) d -= 0.5; // 正前方優先
      if (d < bestD) {
        bestD = d;
        best = { tx: x, ty: y };
      }
    }
  }
  if (!best) return null;
  return { ...best, cx: (best.tx + 0.5) * TILE, cy: (best.ty + 0.5) * TILE, bottom: (best.ty + 1) * TILE };
}

const bySprite = (...names) => (def) => names.includes(def.sprite);

/** 整個房間裡最近的某種格子（箭靶這種比較遠的東西） */
function findInRoom(scene, fx, test) {
  const { grid } = scene;
  let best = null;
  let bestD = Infinity;
  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      const c = grid.cells[y][x];
      if (!test(grid.legend[c.ch] || {}, c)) continue;
      const d = Math.hypot((x + 0.5) * TILE - fx.x, (y + 0.5) * TILE - fx.y);
      if (d < bestD) {
        bestD = d;
        best = { tx: x, ty: y, cx: (x + 0.5) * TILE, cy: (y + 0.5) * TILE, bottom: (y + 1) * TILE };
      }
    }
  }
  return best;
}

/** roomView 畫好的家具圖片（有圖時才有）；沒有就回傳 null */
function propAt(scene, tx, ty) {
  return (scene.roomProps || []).find((p) => tx >= p.x0 && tx <= p.x1 && ty >= p.y0 && ty <= p.y1) || null;
}

/** 家具輕輕抖一下：有圖就抖圖片；沒圖（色塊）就在那格畫一團小毛球／閃一下代替 */
function shakeProp(scene, target, { angle = 0, squash = 0.06, flash = false, fluff = 0 } = {}) {
  const prop = propAt(scene, target.tx, target.ty);
  if (prop) {
    const img = prop.image;
    if (!img.__base) img.__base = { x: img.x, scaleX: img.scaleX, scaleY: img.scaleY, angle: img.angle };
    const b = img.__base;
    scene.tweens.killTweensOf(img);
    img.setPosition(b.x, img.y).setScale(b.scaleX, b.scaleY).setAngle(b.angle);
    scene.tweens.add({
      targets: img, scaleY: b.scaleY * (1 - squash), scaleX: b.scaleX * (1 + squash / 2), angle: b.angle + angle,
      duration: 70, yoyo: true, repeat: 1, ease: 'Sine.easeInOut',
      onComplete: () => img.setScale(b.scaleX, b.scaleY).setAngle(b.angle),
    });
    if (flash) {
      img.setTintFill(0xffffff);
      scene.time.delayedCall(60, () => { if (img.active) img.clearTint(); });
    }
    return;
  }
  // 色塊：閃白一下
  if (flash && room(scene)) {
    const r = track(scene, scene.add.rectangle(target.cx, target.cy, TILE - 4, TILE - 4, 0xffffff, 0.75), target.bottom + 1, 400);
    scene.tweens.add({ targets: r, alpha: 0, duration: 160, onComplete: () => r.destroy() });
  }
  // 色塊：一團小毛球蓬一下
  for (let i = 0; i < fluff; i++) {
    const d = dot(scene, target.cx + rand(-9, 9), target.cy + rand(-8, 6), rand(3, 5), 0xfbf8f0, target.bottom + 1, 900);
    if (!d) break;
    d.setScale(0.4);
    scene.tweens.add({
      targets: d, scale: 1.1, duration: 140, yoyo: true, hold: 80, delay: i * 40,
      onComplete: () => scene.tweens.add({ targets: d, alpha: 0, duration: 200, onComplete: () => d.destroy() }),
    });
  }
}

function toast(scene, text) {
  scene.ctx.ui.toast(text, 2.8);
}

/** 彩虹：一直換顏色 */
function rainbow(scene, obj) {
  const counter = { h: Math.random() };
  scene.tweens.add({
    targets: counter, h: counter.h + 3, duration: 3000,
    onUpdate: () => { if (obj.active) obj.setFillStyle(Phaser.Display.Color.HSVToRGB(counter.h % 1, 0.45, 1).color); },
  });
}

/** 一團羊毛（或毛線球）：小圓＋高光 */
function woolBall(scene, x, y, wool, depth, { yarn = false } = {}) {
  if (!room(scene, 2)) return null;
  const ball = track(scene, scene.add.circle(x, y, yarn ? 4 : 5, wool.color).setStrokeStyle(1, 0x8a7a66, 0.6), depth, 4500);
  if (wool.rainbow) rainbow(scene, ball);
  return ball;
}

// ---------- 效果 ----------

/** 剪羊毛：羊抖一下 → 羊毛彈出、落地、閃星星 → （訪客）飛到頭上拿著 */
function shearSheep(scene, fx) {
  const sheep = findNear(scene, fx, (def) => def.sprite === 'sheep' || def.color === 'sheep');
  const from = sheep || { cx: fx.x + dirOf(fx.facing)[0] * TILE, cy: fx.y - 10, bottom: fx.y, tx: 0, ty: 0 };
  if (sheep) shakeProp(scene, sheep, { squash: 0.08, fluff: fx.isPlayer ? 4 : 2 });
  const wool = rollWool();
  const depth = Math.max(from.bottom, fx.y) + 2;
  const ball = woolBall(scene, from.cx, from.cy - 6, wool, depth);
  if (!ball) return undefined;
  // 落在羊和演出者之間
  const landX = (from.cx + fx.x) / 2 + rand(-6, 6);
  const landY = Math.max(from.cy, fx.y - 4) + rand(-2, 4);
  const t = 0.55;
  const vx = (landX - ball.x) / t;
  const vy = (landY - ball.y - 0.5 * 380 * t * t) / t;
  fling(scene, ball, {
    vx, vy, g: 380, duration: t * 1000, floorY: landY,
    onLand: () => {
      sparkles(scene, ball.x, ball.y - 2, wool.stars, { color: wool.rainbow ? 0xffffff : 0xfff3b0, depth: depth + 1 });
      if (!fx.isPlayer) {
        scene.tweens.add({ targets: ball, alpha: 0, delay: 700, duration: 300, onComplete: () => ball.destroy() });
        return;
      }
      // 訪客：撿起來舉在頭上
      scene.time.delayedCall(250, () => {
        if (!ball.active) return;
        ball.setDepth(fx.y + 1);
        arcTo(scene, ball, fx.x, headY(fx) - 8, {
          arc: 14, duration: 380,
          onDone: () => {
            const inv = inventoryOf(scene);
            inv.wool.push(wool.name);
            inv.woolCollected += 1;
            ball.setScale(1.3);
            sparkles(scene, ball.x, ball.y, Math.min(3, wool.stars), { depth: fx.y + 2 });
            toast(scene, `獲得${wool.name}的羊毛！${wool.note || ''}（今天收集了 ${inv.woolCollected} 團）`);
            scene.tweens.add({ targets: ball, y: ball.y - 3, duration: 300, yoyo: true, repeat: 1 });
            scene.tweens.add({ targets: ball, alpha: 0, delay: 1300, duration: 300, onComplete: () => ball.destroy() });
          },
        });
      });
    },
  });
  return fx.isPlayer ? 2.8 + Math.random() : undefined;
}

/** 紡車：身上有羊毛就紡成毛線，毛線球從紡車滾出來 */
function spinWool(scene, fx) {
  const wheel = findNear(scene, fx, bySprite('spinning_wheel'));
  const at = wheel || { cx: fx.x + 16, cy: fx.y - 8, bottom: fx.y };
  let wool = { color: 0xf7f4ec, stars: 1 };
  if (fx.isPlayer) {
    const inv = inventoryOf(scene);
    if (!inv.wool.length) {
      if (!fx.memo.hinted) toast(scene, '手上沒有羊毛，先去羊圈剪點羊毛吧。');
      fx.memo.hinted = true;
      return undefined;
    }
    const name = inv.wool.shift();
    wool = WOOL_COLORS.find((w) => w.name === name) || WOOL_COLORS[0];
    inv.yarn.push(name);
    toast(scene, `紡出了${wool.name}的毛線！（羊毛還剩 ${inv.wool.length} 團）`);
  }
  const depth = at.bottom + 2;
  const ball = woolBall(scene, at.cx, at.cy, wool, depth, { yarn: true });
  if (!ball) return undefined;
  // 毛線球的紋路：轉起來才看得出在滾
  const line = room(scene) ? track(scene, scene.add.rectangle(at.cx, at.cy, 7, 1, 0x8a7a66, 0.7), depth + 0.5, 4500) : null;
  const dir = fx.x < at.cx ? 1 : -1;
  const endX = at.cx + dir * rand(14, 22);
  const endY = at.bottom + 4;
  scene.tweens.add({
    targets: line ? [ball, line] : ball, x: endX, y: endY, angle: dir * 540, duration: 700, ease: 'Quad.easeOut',
    onComplete: () => {
      sparkles(scene, endX, endY - 4, Math.max(2, wool.stars), { depth: depth + 1 });
      scene.tweens.add({
        targets: line ? [ball, line] : ball, alpha: 0, delay: 900, duration: 300,
        onComplete: () => { ball.destroy(); if (line) line.destroy(); },
      });
    },
  });
  return undefined;
}

/** 樂器：音符從演奏者往上飄 */
function notes(scene, fx) {
  const n = fx.isPlayer ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const t = label(scene, fx.x + rand(-10, 10), headY(fx) + 6, pick(['♪', '♫', '♬']), {
      fontSize: `${Math.round(rand(10, 13))}px`, color: pick(NOTE_COLORS),
    }, fx.y + 30, 2200);
    floatUp(scene, t, { rise: rand(20, 30), sway: rand(4, 8), duration: 1500, delay: i * 450 });
  }
  return fx.isPlayer ? 1.6 + Math.random() : undefined;
}

/** 指揮：指揮棒尖端畫一道小弧線＋音符 */
function conduct(scene, fx) {
  const side = fx.facing === 'left' ? -1 : 1;
  const tipX = fx.x + 8 * side;
  const tipY = fx.y - 26;
  if (room(scene)) {
    const g = track(scene, scene.add.graphics(), fx.y + 30, 1200);
    g.lineStyle(1.5, 0xfffaf0, 0.9);
    g.beginPath();
    g.arc(tipX, tipY + 6, 9, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340));
    g.strokePath();
    scene.tweens.add({ targets: g, alpha: 0, duration: 600, delay: 150, onComplete: () => g.destroy() });
  }
  twinkle(scene, tipX + 8 * side, tipY, { size: 3, depth: fx.y + 31 });
  const t = label(scene, tipX, tipY - 4, pick(['♪', '♫']), { fontSize: '11px', color: pick(NOTE_COLORS) }, fx.y + 30, 2200);
  floatUp(scene, t, { rise: 22, duration: 1400 });
  return fx.isPlayer ? 1.4 + Math.random() * 0.8 : undefined;
}

/** 刀光：一道白色細弧線快速掃過再淡出 */
function slash(scene, x, y, side, big, depth) {
  if (!room(scene)) return;
  const g = track(scene, scene.add.graphics(), depth, 800);
  const r = big ? 17 : 12;
  const start = side > 0 ? -150 : -30;
  const sweep = side > 0 ? 130 : -130;
  const counter = { p: 0 };
  scene.tweens.add({
    targets: counter, p: 1, duration: 110,
    onUpdate: () => {
      g.clear();
      const a0 = Phaser.Math.DegToRad(start + sweep * Math.max(0, counter.p - 0.55));
      const a1 = Phaser.Math.DegToRad(start + sweep * counter.p);
      g.lineStyle(big ? 3 : 2, 0xffffff, 0.95);
      g.beginPath();
      g.arc(x, y, r, Math.min(a0, a1), Math.max(a0, a1));
      g.strokePath();
      g.lineStyle(1, 0xdfefff, 0.6);
      g.beginPath();
      g.arc(x, y, r - 3, Math.min(a0, a1), Math.max(a0, a1));
      g.strokePath();
    },
    onComplete: () => scene.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() }),
  });
}

/** 稻草人：刀光 → 命中晃一下、閃白、畫面小震動 → 傷害數字、稻草往反方向飛 */
function hitDummy(scene, fx) {
  const dummy = findNear(scene, fx, (def) => def.sprite === 'training_dummy' || def.color === 'straw');
  const at = dummy || { cx: fx.x, cy: fx.y - TILE, bottom: fx.y - TILE / 2, tx: 0, ty: 0 };
  // 從演出者指向稻草人的方向（稻草往這個方向飛）
  const awayX = Math.sign(at.cx - fx.x) || (Math.random() < 0.5 ? -1 : 1) * 0.6;
  const awayY = Math.sign(at.cy - fx.y);
  const crit = fx.isPlayer && Math.random() < 0.1;
  const side = fx.facing === 'left' ? -1 : 1;
  const depth = Math.max(at.bottom, fx.y) + 20;
  slash(scene, at.cx, at.cy - 2, side, crit, depth);

  scene.time.delayedCall(90, () => {
    if (dummy) shakeProp(scene, dummy, { angle: 8 * (awayX || 1), squash: 0.05, flash: fx.isPlayer });
    if (!fx.isPlayer) return;
    scene.cameras.main.shake(80, crit ? 0.005 : 0.003);
    // 傷害數字
    const dmg = crit ? 99 : Math.floor(rand(8, 26));
    const t = label(scene, at.cx + rand(-6, 6), at.cy - 12, crit ? `暴擊！-${dmg}` : `-${dmg}`, {
      fontSize: crit ? '14px' : '11px', fontStyle: 'bold', color: crit ? '#e0592a' : '#c0392b',
      stroke: '#fffaf0', strokeThickness: 3,
    }, depth + 1, 1600);
    if (t) {
      t.setScale(crit ? 1.5 : 1.2);
      scene.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.easeOut' });
      floatUp(scene, t, { rise: 18, sway: 2, duration: 1000 });
    }
    if (crit) sparkles(scene, at.cx, at.cy - 8, 4, { color: 0xffe08a, depth: depth + 1 });
    // 連擊
    fx.memo.combo = (fx.memo.combo || 0) + 1;
    if (fx.memo.combo >= 2) {
      const c = label(scene, at.cx + 26, at.cy + 2, `連擊 x${fx.memo.combo}`, {
        fontSize: '8px', color: '#3a2a1f', backgroundColor: '#ffe08a', padding: { x: 2, y: 0 },
      }, depth + 2, 1200);
      floatUp(scene, c, { rise: 8, sway: 0, duration: 800 });
    }
    // 稻草與木屑往被砍的反方向飛
    const n = crit ? 6 : 4;
    for (let i = 0; i < n && room(scene); i++) {
      const bit = track(scene, scene.add.rectangle(at.cx, at.cy - 4, rand(3, 6), 1.5, pick([0xd9b55a, 0xcfb15a, 0x9a7650])),
        depth, 1400);
      bit.setAngle(rand(0, 180));
      fling(scene, bit, {
        vx: awayX * rand(30, 70) + rand(-15, 15), vy: awayY * rand(10, 30) - rand(60, 110), g: 420,
        duration: 650, floorY: at.bottom + rand(2, 10),
      });
      scene.tweens.add({ targets: bit, angle: bit.angle + rand(-200, 200), duration: 650 });
    }
  });
  return fx.isPlayer ? 1.1 + Math.random() * 0.6 : undefined;
}

/** 射箭：小箭飛向最近的箭靶，隨機命中 */
function shootArrow(scene, fx) {
  const target = findInRoom(scene, fx, (def) => def.sprite === 'archery_target');
  if (!target || !room(scene, 2)) return undefined;
  const sx = fx.x + 6;
  const sy = fx.y - 18;
  const roll = Math.random();
  const result = roll < 0.35 ? 'hit' : roll < 0.75 ? 'graze' : 'miss';
  let ex = target.cx - 4;
  let ey = target.cy - 6;
  if (result === 'graze') ey += pick([-1, 1]) * rand(6, 9);
  if (result === 'miss') { ex += rand(4, 12); ey += pick([-1, 1]) * rand(14, 20); }
  const depth = Math.max(target.bottom, fx.y) + 20;
  const arrow = track(scene, scene.add.rectangle(sx, sy, 12, 1.5, 0x6b4a2a), depth, 2600);
  const tip = track(scene, scene.add.triangle(sx, sy, 0, 0, 0, 4, 4, 2, 0xd9d9d9), depth, 2600);
  const angle = Phaser.Math.RadToDeg(Math.atan2(ey - sy, ex - sx));
  arrow.setAngle(angle);
  tip.setAngle(angle);
  const dx = Math.cos(Phaser.Math.DegToRad(angle)) * 7;
  const dy = Math.sin(Phaser.Math.DegToRad(angle)) * 7;
  tip.setPosition(sx + dx, sy + dy);
  const dur = Math.min(450, Math.hypot(ex - sx, ey - sy) * 1.6);
  scene.tweens.add({ targets: arrow, x: ex, y: ey, duration: dur, ease: 'Linear' });
  scene.tweens.add({
    targets: tip, x: ex + dx, y: ey + dy, duration: dur, ease: 'Linear',
    onComplete: () => {
      if (result === 'hit') {
        shakeProp(scene, target, { squash: 0.04 });
        sparkles(scene, target.cx, target.cy - 6, fx.isPlayer ? 3 : 1, { depth: depth + 1 });
      }
      if (fx.isPlayer) {
        const text = { hit: '正中紅心！', graze: '擦邊', miss: '沒中…' }[result];
        const t = label(scene, target.cx - 4, target.cy - 18, text, {
          fontSize: '10px', color: result === 'hit' ? '#c0392b' : '#3a2a1f', stroke: '#fffaf0', strokeThickness: 3,
        }, depth + 2, 1800);
        floatUp(scene, t, { rise: 12, sway: 0, duration: 1100 });
      }
      scene.tweens.add({
        targets: [arrow, tip], alpha: 0, delay: 700, duration: 300,
        onComplete: () => { arrow.destroy(); tip.destroy(); },
      });
    },
  });
  return fx.isPlayer ? 2 + Math.random() : undefined;
}

/** 噴火花（打鐵、磨刀）；dirX：往哪一側噴（0＝往上散開） */
function sparks(scene, x, y, n, dirX, depth) {
  for (let i = 0; i < n; i++) {
    const s = dot(scene, x, y, rand(0.8, 1.6), pick(SPARK_COLORS), depth, 900);
    if (!s) return;
    const vx = dirX ? dirX * rand(50, 110) : rand(-60, 60);
    fling(scene, s, { vx, vy: -rand(50, 110), g: 420, duration: rand(300, 500) });
  }
}

/** 打鐵：鐵砧上噴小火花＋「鏗！」 */
function hammer(scene, fx) {
  const anvil = findNear(scene, fx, bySprite('anvil'));
  const at = anvil || { cx: fx.x + dirOf(fx.facing)[0] * 14, cy: fx.y - 14, bottom: fx.y };
  const depth = Math.max(at.bottom, fx.y) + 20;
  sparks(scene, at.cx, at.cy - 6, fx.isPlayer ? 6 : 3, 0, depth);
  if (fx.isPlayer) {
    const t = label(scene, at.cx + rand(-6, 6), at.cy - 12, '鏗！', {
      fontSize: '10px', fontStyle: 'bold', color: '#3a2a1f', stroke: '#fffaf0', strokeThickness: 3,
    }, depth + 1, 1200);
    floatUp(scene, t, { rise: 10, sway: 0, duration: 700 });
  }
  return fx.isPlayer ? 1.2 + Math.random() * 0.6 : undefined;
}

/** 火星往上飄（添柴、烤火） */
function embers(scene, fx) {
  const fire = findNear(scene, fx, (def) => ['forge_furnace', 'fireplace'].includes(def.sprite) || def.color === 'fire');
  const at = fire || { cx: fx.x + dirOf(fx.facing)[0] * TILE, cy: fx.y - 16, bottom: fx.y };
  const n = fx.isPlayer ? 5 : 2;
  for (let i = 0; i < n; i++) {
    const e = dot(scene, at.cx + rand(-8, 8), at.cy + rand(-2, 6), rand(0.8, 1.5), pick(SPARK_COLORS), Math.max(at.bottom, fx.y) + 20, 2200);
    floatUp(scene, e, { rise: rand(18, 30), sway: rand(2, 5), duration: rand(900, 1400), delay: i * 140 });
  }
  return fx.isPlayer ? 1.5 + Math.random() : undefined;
}

/** 磨刀：小火花往一側噴 */
function sharpen(scene, fx) {
  const stone = findNear(scene, fx, bySprite('grindstone'));
  const at = stone || { cx: fx.x + dirOf(fx.facing)[0] * 14, cy: fx.y - 12, bottom: fx.y };
  const dirX = Math.sign(at.cx - fx.x) || 1; // 往演出者的另一側噴
  sparks(scene, at.cx + dirX * 4, at.cy - 4, fx.isPlayer ? 6 : 3, dirX, Math.max(at.bottom, fx.y) + 20);
  return fx.isPlayer ? 1.2 + Math.random() * 0.6 : undefined;
}

/** 水花：淡藍小點往上噴再落下 */
function splash(scene, x, y, n, depth) {
  for (let i = 0; i < n; i++) {
    const d = dot(scene, x + rand(-4, 4), y, rand(1, 1.8), pick(WATER_COLORS), depth, 1000);
    if (!d) return;
    fling(scene, d, { vx: rand(-40, 40), vy: -rand(50, 100), g: 400, duration: 450, floorY: y + 6 });
  }
}

/** 打水：水井冒水花＋「嘩啦」 */
function drawWater(scene, fx) {
  const well = findNear(scene, fx, bySprite('well'));
  const at = well || { cx: fx.x, cy: fx.y - 16, bottom: fx.y };
  const depth = Math.max(at.bottom, fx.y) + 20;
  splash(scene, at.cx, at.cy - 4, fx.isPlayer ? 7 : 3, depth);
  if (fx.isPlayer) {
    const t = label(scene, at.cx, at.cy - 14, '嘩啦', { fontSize: '10px', color: '#2f5f86', stroke: '#fffaf0', strokeThickness: 3 },
      depth + 1, 1400);
    floatUp(scene, t, { rise: 10, sway: 0, duration: 900 });
  }
  return undefined;
}

/** 澆花：水滴落下，花圃冒出 ✿ 小花閃一下 */
function waterPlants(scene, fx) {
  const bed = findNear(scene, fx, bySprite('flower_bed', 'crop'));
  const at = bed || { cx: fx.x + dirOf(fx.facing)[0] * TILE, cy: fx.y - 8, bottom: fx.y };
  const depth = Math.max(at.bottom, fx.y) + 20;
  for (let i = 0; i < 3; i++) {
    const d = dot(scene, at.cx + rand(-8, 8), at.cy - 16, 1.2, pick(WATER_COLORS), depth, 900);
    if (d) scene.tweens.add({ targets: d, y: at.cy, alpha: 0.4, duration: 350, delay: i * 90, onComplete: () => d.destroy() });
  }
  const n = fx.isPlayer ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const x = at.cx + rand(-10, 10);
    const y = at.cy + rand(-4, 6);
    const f = label(scene, x, y, '✿', { fontSize: '11px', color: pick(FLOWER_COLORS), stroke: '#5f8a4a', strokeThickness: 1 },
      depth, 2000);
    if (!f) break;
    f.setScale(0);
    scene.tweens.add({
      targets: f, scale: 1, duration: 260, delay: 400 + i * 200, ease: 'Back.easeOut',
      onComplete: () => {
        twinkle(scene, x + 5, y - 8, { size: 3, depth: depth + 1 });
        scene.tweens.add({ targets: f, alpha: 0, delay: 800, duration: 300, onComplete: () => f.destroy() });
      },
    });
  }
  return undefined;
}

/** 噴泉邊：偶爾丟一枚硬幣進噴泉，濺起水花，說一句祝福 */
function tossCoin(scene, fx) {
  if (Math.random() > (fx.isPlayer ? 0.6 : 0.3)) return undefined;
  const fountain = findInRoom(scene, fx, bySprite('fountain'));
  if (!fountain || !room(scene, 3)) return undefined;
  // 噴泉是一大塊，丟到中間附近
  const cells = [];
  scene.grid.cells.forEach((row, y) => row.forEach((c, x) => {
    if (scene.grid.legend[c.ch]?.sprite === 'fountain') cells.push([x, y]);
  }));
  const cx = (cells.reduce((s, [x]) => s + x, 0) / cells.length + 0.5) * TILE + rand(-12, 12);
  const cy = (cells.reduce((s, [, y]) => s + y, 0) / cells.length + 0.5) * TILE + rand(-8, 8);
  const coin = dot(scene, fx.x, headY(fx) + 10, 2.5, 0xf2c94c, 99990, 2500);
  coin.setStrokeStyle(1, 0xb08d2a);
  twinkle(scene, fx.x, headY(fx) + 6, { size: 3, depth: 99991 });
  arcTo(scene, coin, cx, cy, {
    arc: 30, duration: 650,
    onDone: () => {
      coin.destroy();
      splash(scene, cx, cy, fx.isPlayer ? 6 : 3, 99990);
      if (fx.isPlayer) {
        sparkles(scene, cx, cy - 6, 2, { depth: 99991 });
        toast(scene, `你丟了一枚硬幣：「${pick(BLESSINGS)}」`);
      }
    },
  });
  return fx.isPlayer ? 4 + Math.random() * 2 : undefined;
}

/** 乾杯：冒出「乾杯！」，訪客乾杯時附近坐著的 NPC 也一起喊 */
function cheers(scene, fx) {
  const t = label(scene, fx.x, headY(fx) - 2, '乾杯！', {
    fontSize: '10px', fontStyle: 'bold', color: '#8a4a1a', stroke: '#fffaf0', strokeThickness: 3,
  }, fx.y + 30, 1600);
  if (t) {
    t.setScale(0.6);
    scene.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.easeOut' });
    floatUp(scene, t, { rise: 10, sway: 0, duration: 1000 });
  }
  twinkle(scene, fx.x + 10, headY(fx) + 4, { size: 3, depth: fx.y + 31 });
  if (!fx.isPlayer) return undefined;
  const near = (scene.npcs || [])
    .filter((npc) => npc.state === 'perform' && npc.action?.seated && Math.hypot(npc.x - fx.x, npc.y - fx.y) < TILE * 5)
    .slice(0, 4);
  near.forEach((npc, i) => scene.time.delayedCall(250 + i * 200, () => {
    if (npc.state === 'perform') npc.avatar.say('乾杯！', 1.4);
  }));
  return 5 + Math.random() * 3;
}

/** 睡覺：Zzz 往上飄（睡姿頭在右邊） */
function sleepZ(scene, fx) {
  const n = fx.isPlayer ? 3 : 1;
  for (let i = 0; i < n; i++) {
    const t = label(scene, fx.x + 22 + i * 3, fx.y - 6, i % 2 ? 'z' : 'Z', {
      fontSize: `${9 + i * 2}px`, color: '#4a5a8a', stroke: '#fffaf0', strokeThickness: 2,
    }, fx.y + 30, 2600);
    floatUp(scene, t, { rise: 22, sway: 3, duration: 1500, delay: i * 400 });
  }
  return undefined;
}

/** 看書、整理書架、寫字：書頁小方塊飄一下，偶爾「靈感＋1」 */
function pages(scene, fx) {
  const n = fx.isPlayer ? 2 : 1;
  for (let i = 0; i < n && room(scene); i++) {
    const p = track(scene, scene.add.rectangle(fx.x + rand(-6, 6), fx.y - 16, 4, 5, 0xfffaf0).setStrokeStyle(0.5, 0x9a8a72),
      fx.y + 30, 2200);
    scene.tweens.add({ targets: p, angle: rand(-120, 120), duration: 1300, delay: i * 300 });
    floatUp(scene, p, { rise: 16, sway: 5, duration: 1300, delay: i * 300 });
  }
  if (fx.isPlayer && Math.random() < 0.35) {
    const t = label(scene, fx.x, headY(fx) - 2, '靈感＋1', {
      fontSize: '9px', color: '#5a3d8a', stroke: '#fffaf0', strokeThickness: 2,
    }, fx.y + 31, 1800);
    floatUp(scene, t, { rise: 12, sway: 0, duration: 1100, delay: 200 });
    twinkle(scene, fx.x + 18, headY(fx) - 6, { size: 3, delay: 300, depth: fx.y + 32 });
  }
  return undefined;
}

/** 看公告、看展示櫃：頭上冒小驚嘆號 */
function exclaim(scene, fx) {
  const t = label(scene, fx.x + 8, headY(fx) - 2, '！', {
    fontSize: '12px', fontStyle: 'bold', color: '#e0592a', stroke: '#fffaf0', strokeThickness: 3,
  }, fx.y + 30, 1400);
  if (!t) return undefined;
  t.setScale(0);
  scene.tweens.add({
    targets: t, scale: 1, duration: 200, ease: 'Back.easeOut',
    onComplete: () => scene.tweens.add({ targets: t, alpha: 0, delay: 600, duration: 250, onComplete: () => t.destroy() }),
  });
  return fx.isPlayer ? 3 + Math.random() * 2 : undefined;
}

/** 做手工、轉地球儀：手邊閃幾顆小星星 */
function sparkleHands(scene, fx) {
  const [dx, dy] = dirOf(fx.facing);
  sparkles(scene, fx.x + dx * 14, fx.y - 14 + dy * 6, fx.isPlayer ? 3 : 1, { size: 3, depth: fx.y + 30 });
  return undefined;
}

// ---------- 效果名稱 → 函式 ----------

export const EFFECTS = {
  shear_sheep: shearSheep,
  spin_wool: spinWool,
  notes,
  conduct,
  hit_dummy: hitDummy,
  shoot_arrow: shootArrow,
  hammer,
  embers,
  sharpen,
  draw_water: drawWater,
  water_plants: waterPlants,
  coin: tossCoin,
  cheers,
  zzz: sleepZ,
  pages,
  exclaim,
  sparkle: sparkleHands,
};
