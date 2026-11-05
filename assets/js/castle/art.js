// 城堡圖片清單：名稱 → 檔案與大小。
// 只登記「已經有成品」的圖片。房間定義（rooms/*.js）用名稱指定圖片，
// 名稱沒登記、或圖片載入失敗時，遊戲自動畫原本的色塊，所以圖片可以一張一張補。
// 成品由 tools/castle_images.py 產生（一格 = 64 像素，畫面上顯示成 32 單位）。

const DIR = 'assets/images/castle/';

/**
 * 拼貼用的圖：cols×rows 是一張圖涵蓋幾格。
 * 會切成一格一格的小圖，依格子位置輪流使用。
 */
export const TILE_ART = {
  floor_stone: { src: `${DIR}floor_stone.webp`, cols: 2, rows: 2 },
  floor_wood: { src: `${DIR}floor_wood.webp`, cols: 2, rows: 2 },
  carpet_red: { src: `${DIR}carpet_red.webp`, cols: 6, rows: 6, edges: true }, // edges：左右滾邊依地毯寬度對齊
  wall_stone: { src: `${DIR}wall_stone.webp`, cols: 1, rows: 1 },
};

/**
 * 家具、門等單張圖：w×h 是畫面上的大小（格數），以「佔用格子的下緣中央」對齊。
 * 在地圖上佔的格數：寬＝w，高＝foot（沒寫就是 1 列）。同一個字元連成一排時，依這個大小一件一件放。
 * 比格子高的（柱子、燭台）會往上長，依下緣排前後，角色可以走到它後面。
 */
export const SPRITE_ART = {
  banner: { src: `${DIR}banner.webp`, w: 1, h: 2 },
  candle_stand: { src: `${DIR}candle_stand.webp`, w: 1, h: 2 },
  pillar: { src: `${DIR}pillar.webp`, w: 1, h: 2 },
  notice_board: { src: `${DIR}notice_board.webp`, w: 2, h: 1.5 },
  table_round: { src: `${DIR}table_round.webp`, foot: 2, w: 2, h: 2 },
  plant: { src: `${DIR}plant.webp`, w: 1, h: 1 },
  door_open: { src: `${DIR}door_open.webp`, w: 1, h: 1.5 },
  door_locked: { src: `${DIR}door_locked.webp`, w: 1, h: 1.5 },
  gate_main: { src: `${DIR}gate_main.webp`, foot: 2, w: 6, h: 2 },
  stairs_up: { src: `${DIR}stairs_up.webp`, foot: 2, w: 4, h: 2 },
  piano: { src: `${DIR}piano.webp`, foot: 2, w: 3, h: 2 },
  piano_bench: { src: `${DIR}piano_bench.webp`, w: 1, h: 1 },
  music_stand: { src: `${DIR}music_stand.webp`, w: 1, h: 1.5 },
  stool: { src: `${DIR}stool.webp`, w: 1, h: 1 },
  chair_back: { src: `${DIR}chair_back.webp`, w: 1, h: 1 },
  podium: { src: `${DIR}podium.webp`, w: 1, h: 1 },
  harp: { src: `${DIR}harp.webp`, w: 1, h: 2 },
};

/** 房間已經指定、但還沒有成品的圖（先畫色塊）。有圖後移到上面的清單。 */
export const WANTED_ART = ['chair_side'];

/** 地圖的基本種類預設用哪張拼貼圖 */
export const KIND_TILES = {
  floor: 'floor_stone',
  carpet: 'carpet_red',
  stage: 'floor_wood',
  wall: 'wall_stone',
};

const PREFIX = 'castle:';
export const artKey = (name) => PREFIX + name;

/** 在場景的 preload 呼叫：排入還沒載入的圖片 */
export function queueArt(scene) {
  for (const [name, art] of Object.entries({ ...TILE_ART, ...SPRITE_ART })) {
    if (!scene.textures.exists(artKey(name))) scene.load.image(artKey(name), art.src);
  }
}

/** 這張圖能不能用（有登記、而且載入成功） */
export function hasArt(scene, name) {
  return Boolean(name) && !scene.registry.get('noArt')
    && Boolean(TILE_ART[name] || SPRITE_ART[name]) && scene.textures.exists(artKey(name));
}

/** 拼貼圖切成一格一格（第一次用到時才切），回傳小圖名稱 */
export function tileFrame(scene, name, col, row) {
  const art = TILE_ART[name];
  const tex = scene.textures.get(artKey(name));
  const frame = `c${col}_${row}`;
  if (!tex.has(frame)) {
    const size = tex.getSourceImage().width / art.cols;
    tex.add(frame, 0, col * size, row * size, size, size);
  }
  return frame;
}
