// 手上的道具：指揮棒、鐵鎚、羊毛剪、水桶、澆水壺、木劍、弓、酒杯、樂器……
// 道具圖不用圖檔，在這裡用小方塊畫成像素圖（自動描深色外框），第一次用到時做成貼圖。
// 每個道具有自己的「怎麼動」（motion），例如鐵鎚舉起再敲下、剪刀開合、澆水壺傾斜。
// actions.js 的動作寫 prop: '道具名'；合奏座位依樂器名稱挑（INSTRUMENT_PROPS）。
// 新增道具＝在 PROPS 加一項（形狀、握點、拿的位置、動法）。

const PX = 0.75; // 道具圖一個像素＝0.75 個遊戲單位（角色是大頭比例，道具畫大一點才看得出來）

const C = {
  line: '#2e2420',
  wood: '#8a5a2b', woodLight: '#b07a45', woodDark: '#5e3b1c',
  steel: '#8f98a1', steelLight: '#d4dae0', steelDark: '#5c636b',
  gold: '#d9a441', copper: '#b8733a', copperLight: '#dc9a5c',
  white: '#f5f0e6', foam: '#fbf6ea', red: '#b0403a', violin: '#9a4a22', lute: '#c08a4a',
};

/*
 * 形狀：rects 是 [x, y, 寬, 高, 顏色]，lines 是 [x0, y0, x1, y1, 顏色, 粗細]（由先到後畫）。
 * grip：握點（道具圖上的像素座標），旋轉也繞著它。
 * at：拿在哪裡（相對角色腳底、朝右時；沒寫就是腰側 [8, -12]）。angle：平常的角度。
 * motion：見 MOTIONS。behind：一律畫在身體後面（平常只有朝上、背對時才畫在後面）。
 */
export const PROPS = {
  baton: {
    rects: [[1, 0, 1, 13, 'white'], [0, 13, 3, 5, 'woodLight']],
    grip: [1, 16], motion: 'wave',
  },
  hammer: {
    rects: [[5, 6, 2, 16, 'wood'], [5, 6, 1, 16, 'woodLight'],
      [0, 0, 12, 6, 'steel'], [0, 0, 12, 2, 'steelLight'], [0, 5, 12, 1, 'steelDark']],
    grip: [6, 19], motion: 'swing',
  },
  shears: {
    lines: [[0, 0, 3, 9, 'steelLight', 2], [8, 0, 5, 9, 'steelLight', 2]],
    rects: [[2, 10, 6, 2, 'gold'], [2, 12, 2, 4, 'gold'], [6, 12, 2, 4, 'gold'], [2, 15, 6, 1, 'gold']],
    grip: [5, 13], at: [9, -14], angle: 20, motion: 'snip',
  },
  bucket: {
    lines: [[1, 4, 4, 1, 'steelDark', 1], [4, 1, 6, 1, 'steelDark', 1], [6, 1, 9, 4, 'steelDark', 1]],
    rects: [[0, 5, 10, 8, 'wood'], [0, 5, 10, 1, 'woodLight'], [0, 9, 10, 1, 'steelDark']],
    grip: [5, 1], at: [9, -16], motion: 'pull',
  },
  can: {
    lines: [[9, 8, 15, 3, 'copper', 2]],
    rects: [[0, 4, 10, 7, 'copper'], [0, 4, 10, 1, 'copperLight'], [15, 1, 2, 3, 'copper'],
      [3, 0, 5, 1, 'copper'], [2, 1, 1, 3, 'copper'], [8, 1, 1, 3, 'copper']],
    grip: [5, 1], at: [8, -16], motion: 'pour',
  },
  swordWood: {
    rects: [[1, 0, 3, 17, 'woodLight'], [0, 17, 5, 2, 'wood'], [1, 19, 3, 5, 'woodDark']],
    grip: [2, 21], motion: 'swing',
  },
  swordSteel: {
    rects: [[1, 0, 3, 17, 'steelLight'], [2, 0, 1, 17, 'steel'], [0, 17, 5, 2, 'gold'], [1, 19, 3, 5, 'woodDark']],
    grip: [2, 21], at: [8, -14], angle: 80, motion: 'rub',
  },
  bow: {
    lines: [[3, 0, 6, 5, 'wood', 2], [6, 5, 6, 19, 'wood', 2], [6, 19, 3, 24, 'wood', 2], [2, 0, 2, 24, 'white', 1]],
    grip: [6, 12], at: [9, -18], motion: 'hold',
  },
  mug: { // 把手在靠身體那一側，杯身朝前
    rects: [[2, 3, 7, 8, 'woodLight'], [2, 6, 7, 1, 'woodDark'], [2, 0, 7, 3, 'foam'],
      [0, 4, 2, 1, 'woodLight'], [0, 4, 1, 4, 'woodLight'], [0, 7, 2, 1, 'woodLight']],
    grip: [0, 6], at: [7, -14], motion: 'sip',
  },
  mugUp: { // 乾杯：手伸直、杯子舉過頭（不要停在臉旁邊）
    same: 'mug', at: [11, -38], angle: 15, motion: 'toast',
  },
  tray: { // 端酒：拿著杯子
    same: 'mug', at: [9, -16], motion: 'hold',
  },
  poker: {
    rects: [[0, 0, 2, 4, 'gold'], [0, 4, 2, 18, 'steelDark'], [2, 20, 2, 2, 'steelDark']],
    grip: [1, 3], at: [8, -16], angle: 120, motion: 'poke',
  },
  quill: {
    rects: [[2, 0, 3, 8, 'white'], [1, 2, 1, 5, 'white'], [3, 8, 1, 4, 'line']],
    grip: [3, 10], at: [6, -12], angle: 20, motion: 'rub',
  },
  mallet: {
    rects: [[1, 4, 1, 14, 'wood'], [0, 0, 3, 4, 'red']],
    grip: [1, 16], motion: 'drum',
  },
  violin: {
    rects: [[1, 7, 5, 12, 'violin'], [0, 9, 7, 3, 'violin'], [0, 14, 7, 4, 'violin'], [3, 9, 1, 8, 'woodDark'],
      [3, 0, 2, 8, 'woodDark'], [2, 0, 3, 2, 'woodDark']],
    grip: [3, 15], at: [5, -22], angle: -60, motion: 'strum',
  },
  flute: {
    rects: [[0, 0, 18, 2, 'steel'], [0, 0, 18, 1, 'steelLight'], [7, 1, 1, 1, 'steelDark'], [10, 1, 1, 1, 'steelDark'], [13, 1, 1, 1, 'steelDark']],
    grip: [2, 1], at: [2, -27], angle: 8, motion: 'strum',
  },
  shawm: {
    rects: [[1, 0, 2, 13, 'woodDark'], [0, 13, 4, 2, 'woodDark'], [-1, 15, 6, 2, 'woodDark'], [1, 0, 1, 13, 'wood']],
    grip: [2, 0], at: [2, -26], angle: -25, motion: 'strum',
  },
  lute: {
    rects: [[1, 6, 7, 10, 'lute'], [0, 8, 9, 6, 'lute'], [4, 9, 2, 2, 'woodDark'], [4, 0, 2, 6, 'woodDark'], [3, 0, 4, 2, 'woodDark']],
    grip: [4, 11], at: [3, -13], angle: -45, motion: 'strum',
  },
  cello: {
    rects: [[1, 7, 9, 17, 'violin'], [0, 9, 11, 5, 'violin'], [0, 17, 11, 6, 'violin'], [5, 9, 1, 13, 'woodDark'],
      [4, 0, 3, 8, 'woodDark'], [5, 24, 1, 3, 'steel']],
    grip: [5, 27], at: [10, -4], angle: -8, motion: 'strum',
  },
};

// 合奏座位的樂器名稱（music.js 的 parts）→ 道具。依序比對「名稱裡有這幾個字」。
const INSTRUMENT_PROPS = [
  ['大提琴', 'cello'], ['小提琴', 'violin'], ['魯特琴', 'lute'], ['曼陀林', 'lute'],
  ['長笛', 'flute'], ['蕭姆管', 'shawm'], ['木琴', 'mallet'], ['鼓', 'mallet'],
];

/** 這個動作在這個演出點要拿什麼（沒有就是 null） */
export function propFor(action, spot) {
  if (action?.prop) return action.prop;
  const name = spot?.instrument;
  if (!name) return null;
  return INSTRUMENT_PROPS.find(([word]) => name.includes(word))?.[1] || null;
}

/*
 * 動法：回傳要加的 tween 設定（都會 yoyo、無限重複）。img 是道具圖，base 是平常的角度。
 * 鐵鎚類「舉起慢、敲下快」：from 是敲下（往前平放）、to 是舉起（Sine.easeOut），yoyo 回來時反過來就是越敲越快。
 * 角度：0＝道具朝上，正的往角色面前倒（朝左時整隻手翻過來，不用另外算）。
 */
const MOTIONS = {
  hold: () => [],
  swing: (img, base) => [{ targets: img, angle: { from: base + 80, to: base - 20 }, duration: 320, ease: 'Sine.easeOut', hold: 140, repeatDelay: 260 }],
  wave: (img, base) => [
    { targets: img, angle: { from: base - 40, to: base + 35 }, duration: 380, ease: 'Sine.easeInOut' },
    { targets: img, y: img.y - 2, duration: 190, ease: 'Sine.easeInOut' },
  ],
  snip: (img) => [{ targets: img, scaleX: { from: img.scaleX, to: img.scaleX * 0.3 }, duration: 130, repeatDelay: 160 }],
  pour: (img, base) => [{ targets: img, angle: { from: base, to: base + 45 }, duration: 600, ease: 'Sine.easeInOut', hold: 1000, repeatDelay: 600 }],
  pull: (img) => [{ targets: img, y: img.y - 6, duration: 520, ease: 'Sine.easeInOut' }],
  rub: (img) => [{ targets: img, x: { from: img.x - 3, to: img.x + 3 }, duration: 220, ease: 'Sine.easeInOut' }],
  poke: (img, base) => [{ targets: img, angle: { from: base, to: base + 15 }, x: img.x + 3, duration: 300, ease: 'Sine.easeInOut', repeatDelay: 300 }],
  sip: (img, base) => [{ targets: img, angle: { from: base, to: base - 40 }, y: img.y - 7, duration: 450, ease: 'Sine.easeInOut', hold: 700, repeatDelay: 1800 }],
  toast: (img, base) => [{ targets: img, angle: { from: base, to: base + 12 }, duration: 200, ease: 'Sine.easeOut', repeatDelay: 700 }],
  drum: (img, base) => [{ targets: img, angle: { from: base + 60, to: base - 5 }, duration: 160, ease: 'Sine.easeOut', repeatDelay: 90 }],
  strum: (img, base) => [{ targets: img, angle: { from: base - 3, to: base + 3 }, duration: 420, ease: 'Sine.easeInOut' }],
};

export const PROP_MOTIONS = Object.keys(MOTIONS);

function shapeOf(name) {
  const def = PROPS[name];
  return def?.same ? PROPS[def.same] : def;
}

/** 把形狀畫成像素陣列並自動加外框，做成貼圖；回傳貼圖名稱 */
function propTexture(scene, name) {
  const shape = shapeOf(name);
  const key = `castle:prop:${shape === PROPS[name] ? name : PROPS[name].same}`;
  if (scene.textures.exists(key)) return key;
  const cells = new Map(); // "x,y" → 顏色
  const put = (x, y, color) => cells.set(`${x},${y}`, C[color] || color);
  for (const [x0, y0, x1, y1, color, thick = 1] of shape.lines || []) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i += 1) {
      const x = Math.round(x0 + ((x1 - x0) * i) / steps);
      const y = Math.round(y0 + ((y1 - y0) * i) / steps);
      for (let t = 0; t < thick; t += 1) put(x + t, y, color);
    }
  }
  for (const [x, y, w, h, color] of shape.rects || []) {
    for (let dy = 0; dy < h; dy += 1) for (let dx = 0; dx < w; dx += 1) put(x + dx, y + dy, color);
  }
  const points = [...cells.keys()].map((k) => k.split(',').map(Number));
  const minX = Math.min(...points.map((p) => p[0])) - 1;
  const minY = Math.min(...points.map((p) => p[1])) - 1;
  const width = Math.max(...points.map((p) => p[0])) - minX + 2;
  const height = Math.max(...points.map((p) => p[1])) - minY + 2;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // 外框：空格子只要上下左右有東西就畫深色
  ctx.fillStyle = C.line;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const wx = x + minX;
      const wy = y + minY;
      if (cells.has(`${wx},${wy}`)) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cells.has(`${wx + dx},${wy + dy}`))) ctx.fillRect(x, y, 1, 1);
    }
  }
  for (const [k, color] of cells) {
    const [x, y] = k.split(',').map(Number);
    ctx.fillStyle = color;
    ctx.fillRect(x - minX, y - minY, 1, 1);
  }
  const texture = scene.textures.addCanvas(key, canvas);
  texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  texture.customData.origin = [(shape.grip[0] - minX + 0.5) / width, (shape.grip[1] - minY + 0.5) / height];
  return key;
}

/**
 * 角色的手：放在外觀的 rig 裡，負責顯示道具和它的動作。
 * 朝左時整隻手左右翻；朝上（背對）時道具畫在身體後面。
 */
export class Hand {
  constructor(scene, rig) {
    this.scene = scene;
    this.rig = rig;
    this.container = scene.add.container(0, 0);
    rig.add(this.container);
    this.name = null;
    this.tweens = [];
    this.facing = 'down';
  }

  /** name：道具名（null＝空手）；still：只拿著不動（例如合奏前等人到齊） */
  hold(name, { still = false } = {}) {
    this.clear();
    const def = PROPS[name];
    if (!def) return;
    this.name = name;
    const key = propTexture(this.scene, name);
    const origin = this.scene.textures.get(key).customData.origin;
    const angle = def.angle || 0;
    this.image = this.scene.add.image(0, 0, key).setOrigin(...origin).setScale(PX).setAngle(angle);
    this.container.add(this.image);
    this.place();
    if (still) return;
    const make = MOTIONS[def.motion] || MOTIONS.hold;
    for (const config of make(this.image, angle)) {
      this.tweens.push(this.scene.tweens.add({ yoyo: true, repeat: -1, ...config }));
    }
  }

  setFacing(dir) {
    this.facing = dir;
    this.place();
  }

  place() {
    const def = PROPS[this.name];
    const [x, y] = def?.at || [8, -12];
    const side = this.facing === 'left' ? -1 : 1;
    this.container.setPosition(x * side, y).setScale(side, 1);
    if (this.facing === 'up' || def?.behind) this.rig.sendToBack(this.container);
    else this.rig.bringToTop(this.container);
  }

  clear() {
    for (const t of this.tweens) t.remove();
    this.tweens = [];
    this.image?.destroy();
    this.image = null;
    this.name = null;
  }
}
