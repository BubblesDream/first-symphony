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
  ground_grass: { src: `${DIR}ground_grass.webp`, cols: 2, rows: 2 },
  ground_path: { src: `${DIR}ground_path.webp`, cols: 2, rows: 2 },
  ground_dirt: { src: `${DIR}ground_dirt.webp`, cols: 2, rows: 2 },
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
  chair_side: { src: `${DIR}chair_side.webp`, w: 1, h: 1 },
  curtain_stage: { src: `${DIR}curtain_stage.webp`, w: 4, h: 2 },
  wall_emblem: { src: `${DIR}wall_emblem.webp`, w: 1.5, h: 1.5 }, // 掛在布幕中間（布幕的 behind）
  window_arch: { src: `${DIR}window_arch.webp`, w: 1, h: 2 },
  wall_lamp: { src: `${DIR}wall_lamp.webp`, w: 1, h: 1 },
  door_side_open: { src: `${DIR}door_side_open.webp`, w: 1, h: 2 }, // 左牆的門；右牆由門的 flipX 翻轉
  door_side_locked: { src: `${DIR}door_side_locked.webp`, w: 1, h: 2 },
  // 第三批：外庭
  fountain: { src: `${DIR}fountain.webp`, foot: 3, w: 4, h: 3.5 },
  sheep: { src: `${DIR}sheep.webp`, w: 1, h: 1 },
  well: { src: `${DIR}well.webp`, foot: 2, w: 2, h: 2 },
  spinning_wheel: { src: `${DIR}spinning_wheel.webp`, w: 1, h: 1.5 },
  tree: { src: `${DIR}tree.webp`, w: 2, h: 3 },
  fence: { src: `${DIR}fence.webp`, w: 1, h: 1 },
  hedge: { src: `${DIR}hedge.webp`, w: 1, h: 1 },
  sheep_shed: { src: `${DIR}sheep_shed.webp`, foot: 2, w: 3, h: 3 },
  haystack: { src: `${DIR}haystack.webp`, w: 1, h: 1 },
  laundry_line: { src: `${DIR}laundry_line.webp`, w: 3, h: 2 },
  workbench: { src: `${DIR}workbench.webp`, w: 3, h: 1.5 },
  crop: { src: `${DIR}crop.webp`, w: 1, h: 1 },
  flower_bed: { src: `${DIR}flower_bed.webp`, w: 2, h: 1 },
  lamp_post: { src: `${DIR}lamp_post.webp`, w: 1, h: 2 },
  banner_pole: { src: `${DIR}banner_pole.webp`, w: 1, h: 2.5 },
  gate_outer: { src: `${DIR}gate_outer.webp`, foot: 2, w: 4, h: 2 },
  fence_side: { src: `${DIR}fence_side.webp`, w: 1, h: 1 },
  // 第三批：2F／3F
  bed: { src: `${DIR}bed.webp`, w: 2, h: 1.5 },
  bookshelf: { src: `${DIR}bookshelf.webp`, w: 2, h: 2 },
  history_case: { src: `${DIR}history_case.webp`, w: 2, h: 1.5 },
  telescope: { src: `${DIR}telescope.webp`, foot: 2, w: 2, h: 2.5 },
  window_stars: { src: `${DIR}window_stars.webp`, w: 4, h: 2 },
  nightstand: { src: `${DIR}nightstand.webp`, w: 1, h: 1 },
  wardrobe: { src: `${DIR}wardrobe.webp`, w: 2, h: 2 },
  desk: { src: `${DIR}desk.webp`, w: 2, h: 1.5 },
  stairs_down: { src: `${DIR}stairs_down.webp`, foot: 2, w: 4, h: 2 },
  door_double: { src: `${DIR}door_double.webp`, w: 2, h: 2 },
  table_long: { src: `${DIR}table_long.webp`, w: 3, h: 1.5 },
  globe: { src: `${DIR}globe.webp`, w: 1, h: 1.5 },
  star_table: { src: `${DIR}star_table.webp`, w: 2, h: 1.5 },
  bench: { src: `${DIR}bench.webp`, w: 2, h: 1 },
  armillary: { src: `${DIR}armillary.webp`, w: 1, h: 1.5 },
  // 第三批：1F 酒館、練習室、鍛造工坊
  bar_counter: { src: `${DIR}bar_counter.webp`, w: 3, h: 1.5 },
  barrel: { src: `${DIR}barrel.webp`, w: 1, h: 1.2 },
  fireplace: { src: `${DIR}fireplace.webp`, w: 2, h: 2 },
  training_dummy: { src: `${DIR}training_dummy.webp`, w: 1, h: 2 },
  archery_target: { src: `${DIR}archery_target.webp`, w: 1, h: 2 },
  forge_furnace: { src: `${DIR}forge_furnace.webp`, foot: 2, w: 2, h: 2.5 },
  anvil: { src: `${DIR}anvil.webp`, w: 1, h: 1 },
  bottle_shelf: { src: `${DIR}bottle_shelf.webp`, w: 2, h: 1.5 },
  menu_board: { src: `${DIR}menu_board.webp`, w: 2, h: 1.5 },
  long_table: { src: `${DIR}long_table.webp`, w: 6, h: 1.5 },
  weapon_rack: { src: `${DIR}weapon_rack.webp`, w: 2, h: 2 },
  rope_fence: { src: `${DIR}rope_fence.webp`, w: 1, h: 1 },
  tool_rack: { src: `${DIR}tool_rack.webp`, w: 2, h: 1.5 },
  water_bucket: { src: `${DIR}water_bucket.webp`, w: 1, h: 1 },
  grindstone: { src: `${DIR}grindstone.webp`, w: 1, h: 1.2 },
  ore_crate: { src: `${DIR}ore_crate.webp`, w: 1, h: 1 },
  coal_pile: { src: `${DIR}coal_pile.webp`, w: 1, h: 1 },
};

/**
 * 個人角色圖（Codex 依外觀生成，一人一張；目前只有訪客，成員改用下面的紙娃娃，想要特別造型的成員也可以放這裡）：原圖 docs/素材/城堡原圖/members/<id>.png
 * （正面、背面、朝右側面排成一列，透明背景）。成品是三格一列的 WebP，每格 CHAR_CELL 像素，
 * 腳底對齊每格下緣中央。名稱是成員 id；visitor 是訪客。沒有圖的人畫幾何色塊。
 */
export const CHAR_H = 1.25; // 角色在畫面上的高度（格）
export const CHAR_CELL = { w: 72, h: 120 }; // 成品每格像素（一格 96 像素，手機放大 3 倍也清楚）
export const CHAR_ART = {
  visitor: { src: `${DIR}members/visitor.webp` },
};

/**
 * 紙娃娃部件（成員沒有個人角色圖時用）：原圖 docs/素材/城堡原圖/紙娃娃/<名稱>.png（Codex 用鍵色畫），
 * tools/castle_paperdoll.py 產生 assets/images/castle/doll/<名稱>.webp：三個方向一列、七層由上往下
 * （固定色、頭髮、皮膚、上衣、下身、鞋子、配件；臉部疊圖 face_* 多一層眼睛）。paperdoll.js 依每個人的款式與顏色組合染色。
 * DOLL_CELL：每格 w×h 像素，母版角色身高 body 像素（上面留空給帽子、包包頭）。
 * 做法見 docs/研究-城堡紙娃娃.md；提示詞見 docs/提示詞-城堡紙娃娃.md。
 */
export const DOLL_CELL = { w: 80, h: 136, body: 120 };
export const DOLL_PARTS = [
  'head_short_none', 'head_short_hat', 'head_short_ribbon', 'head_short_headband',
  'head_medium_none', 'head_medium_hat', 'head_medium_ribbon', 'head_medium_headband',
  'head_long_none', 'head_long_hat', 'head_long_ribbon', 'head_long_headband',
  'head_ponytail_none', 'head_ponytail_hat', 'head_ponytail_ribbon', 'head_ponytail_headband',
  'head_twintails_none', 'head_twintails_hat', 'head_twintails_ribbon', 'head_twintails_headband',
  'head_bun_none', 'head_bun_hat', 'head_bun_ribbon', 'head_bun_headband',
  'outfit_shirt_pants', 'outfit_shirt_shorts', 'outfit_shirt_longskirt', 'outfit_shirt_skirt',
  'outfit_jacket_pants', 'outfit_jacket_shorts', 'outfit_jacket_longskirt', 'outfit_jacket_skirt',
  'outfit_armor_pants', 'outfit_armor_shorts', 'outfit_armor_longskirt', 'outfit_armor_skirt',
  'outfit_robe', 'outfit_dress',
  'face_base', 'face_smile', 'face_cool', 'face_sparkle', 'face_determined',
  'face_sleepy', 'face_closed', 'face_shy', 'face_mischief', 'face_wink',
  'over_glasses', 'over_cape',
];
export const dollPartKey = (name) => `${PREFIX}doll:${name}`;
const dollSrc = (name) => `${DIR}doll/${name}.webp`;

/** 房間已經指定、但還沒有成品的圖（先畫色塊）。有圖後移到上面的清單。 */
export const WANTED_ART = [];

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
  for (const [id, art] of Object.entries(CHAR_ART)) {
    const key = charKey(id);
    if (!scene.textures.exists(key)) scene.load.spritesheet(key, art.src, { frameWidth: CHAR_CELL.w, frameHeight: CHAR_CELL.h });
  }
  if (scene.registry.get('noArt')) return;
  for (const name of DOLL_PARTS) {
    if (!scene.textures.exists(dollPartKey(name))) scene.load.image(dollPartKey(name), dollSrc(name));
  }
}

export const charKey = (id) => `${PREFIX}char:${id}`;

/** 這個人有沒有角色圖（有登記、而且載入成功） */
export function hasCharArt(scene, id) {
  return Boolean(id) && !scene.registry.get('noArt') && Boolean(CHAR_ART[id]) && scene.textures.exists(charKey(id));
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
