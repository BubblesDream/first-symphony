// 城堡自動檢查（手動執行，網站本身不會用到）。不需要安裝任何套件，只要 Node.js：
//   node tools/check_castle.mjs
// 全部通過印「檢查通過」、結束碼 0；有問題逐條列出、結束碼 1。
// 檢查的都是「要記得同步兩個地方」的規則：
//   1. 房間定義：每列等寬、字元有定義、演出點與出生點合理、門有接好（和遊戲 ?debug=1 用同一支 checkRoom）
//   2. 房間之間：門通往的房間存在、到達的出生點存在，每個房間都登記在 OPEN_ROOMS
//   3. 圖片：art.js 登記的圖（含角色圖、紙娃娃部件）都有成品與原圖；房間用到的名稱不是已登記就是在 WANTED_ART；
//      WANTED_ART 沒有和已登記重複、也沒有房間已經不用的名稱
//   4. 資料：data/castle_*.json 是平面表、member_id 對得到成員、顏色是 #rrggbb；
//      data/updates.json 是平面表、id 不重複、日期是 YYYY-MM-DD、文字不空白
//   5. 網站規則：城堡程式沒有以 / 開頭的路徑、沒有 innerHTML
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => path.join(ROOT, ...p);
const load = (p) => import(new URL(`file:///${at(p).replace(/\\/g, '/')}`).href);

const { ROOMS, OPEN_ROOMS } = await load('assets/js/castle/rooms/index.js');
const { buildGrid } = await load('assets/js/castle/grid.js');
const { checkRoom } = await load('assets/js/castle/debug.js');
const { TILE_ART, SPRITE_ART, WANTED_ART, CHAR_ART, DOLL_PARTS } = await load('assets/js/castle/art.js');
const { dollParts } = await load('assets/js/castle/paperdoll.js');
const { FACE_STYLE } = await load('assets/js/castle/roster.js');

const problems = [];
const fail = (msg) => problems.push(msg);

// 1、2. 房間
const usedNames = new Set();
for (const [id, room] of Object.entries(ROOMS)) {
  if (room.id !== id) fail(`房間 ${id}：定義裡的 id 是「${room.id}」`);
  if (!OPEN_ROOMS.includes(id)) fail(`房間 ${id}：沒有登記在 OPEN_ROOMS`);
  const grid = buildGrid(room);
  for (const p of checkRoom({ grid, room })) fail(`房間 ${id}：${p}`);
  for (const [ch, door] of Object.entries(room.doors || {})) {
    if (!door.to) continue;
    const dest = ROOMS[door.to];
    if (!dest) fail(`房間 ${id}：門「${ch}」通往不存在的房間 ${door.to}`);
    else if (!dest.spawns?.[door.spawn]) fail(`房間 ${id}：門「${ch}」到 ${door.to} 的出生點 ${door.spawn} 不存在`);
  }
  const names = [
    ...Object.values(room.legend || {}).flatMap((d) => [d.sprite, d.behind]),
    ...Object.values(room.doors || {}).map((d) => d.sprite),
    ...Object.values(room.tiles || {}),
    ...(room.critters || []).map((c) => c.sprite),
  ];
  for (const n of names) if (n) usedNames.add(n);
}
for (const id of OPEN_ROOMS) if (!ROOMS[id]) fail(`OPEN_ROOMS 裡的 ${id} 沒有房間定義`);

// 合奏曲目與座位共用同一份聲部數，檔案必須齊全。
const { ENSEMBLE_SONGS } = await load('assets/js/castle/music.js');
for (const room of Object.values(ROOMS).filter((r) => r.ensemble)) {
  const { parts, conductor } = room.ensemble;
  for (const [x, y] of parts) {
    if (!room.spots.some((s) => s.x === x && s.y === y && s.action === 'play_part')) fail(`合奏座位 (${x},${y}) 沒有 play_part 演出點`);
  }
  if (!room.spots.some((s) => s.x === conductor[0] && s.y === conductor[1] && s.action === 'conduct')) fail('合奏指揮台沒有 conduct 演出點');
  for (const song of ENSEMBLE_SONGS) {
    if (song.parts.length !== parts.length) fail(`曲目 ${song.title} 的聲部數與座位數不同`);
    for (let i = 1; i <= parts.length; i++) if (!existsSync(at(song.dir, `part${i}.mp3`))) fail(`曲目 ${song.title} 缺少 part${i}.mp3`);
  }
}

// 3. 圖片（原圖資料夾 docs/ 只在管理員電腦上、不進 git；找不到 docs/ 時跳過原圖檢查，例如在 Codex 的工作資料夾）
const HAS_SOURCES = existsSync(at('docs/素材/城堡原圖'));
if (!HAS_SOURCES) console.log('（找不到 docs/素材/城堡原圖，跳過原圖檢查）');
const registered = { ...TILE_ART, ...SPRITE_ART };
for (const [name, art] of Object.entries(registered)) {
  if (!existsSync(at(art.src))) fail(`圖片 ${name}：成品 ${art.src} 不存在（執行 python tools/castle_images.py）`);
  if (HAS_SOURCES && !existsSync(at('docs/素材/城堡原圖', `${name}.png`))) fail(`圖片 ${name}：原圖 docs/素材/城堡原圖/${name}.png 不存在`);
}
// 預設拼貼圖（地板、牆）不寫在房間裡，另外算「有用到」
for (const n of ['floor_stone', 'floor_wood', 'carpet_red', 'wall_stone', 'door_open', 'door_locked']) usedNames.add(n);
for (const n of usedNames) {
  if (!registered[n] && !WANTED_ART.includes(n)) fail(`圖片名稱「${n}」房間有用，但 art.js 沒登記也不在 WANTED_ART（打錯字？）`);
}
for (const n of WANTED_ART) {
  if (registered[n]) fail(`圖片 ${n}：已經登記了，請從 WANTED_ART 移除`);
  if (!usedNames.has(n)) fail(`圖片 ${n}：在 WANTED_ART，但沒有房間用到`);
}
if (new Set(WANTED_ART).size !== WANTED_ART.length) fail('WANTED_ART 有重複的名稱');
const outDir = at('assets/images/castle');
for (const f of readdirSync(outDir, { withFileTypes: true })) {
  if (f.isDirectory()) continue;
  const name = f.name.replace(/\.webp$/, '');
  if (!registered[name]) fail(`成品 assets/images/castle/${f.name} 沒有在 art.js 登記（多餘的檔案？）`);
}

// 4. 資料
const readJson = (p) => JSON.parse(readFileSync(at(p), 'utf8'));
const memberIds = new Set(readJson('data/members.json').map((m) => m.id));

// 3-1. 角色圖：成品、原圖都在；名稱是成員 id 或 visitor；members/ 底下沒有多餘的檔案
for (const [id, art] of Object.entries(CHAR_ART)) {
  if (id !== 'visitor' && !memberIds.has(id)) fail(`角色圖 ${id}：不是成員 id（也不是 visitor）`);
  if (!existsSync(at(art.src))) fail(`角色圖 ${id}：成品 ${art.src} 不存在（執行 python tools/castle_images.py）`);
  if (HAS_SOURCES && !existsSync(at('docs/素材/城堡原圖/members', `${id}.png`))) fail(`角色圖 ${id}：原圖 docs/素材/城堡原圖/members/${id}.png 不存在`);
}
// 3-2. 紙娃娃：部件有原圖與成品、doll/ 沒有多餘檔案；問卷每種款式組合用到的部件都有登記
for (const name of DOLL_PARTS) {
  if (!existsSync(at('assets/images/castle/doll', `${name}.webp`))) fail(`紙娃娃 ${name}：成品不存在（執行 python tools/castle_paperdoll.py ${name}）`);
  if (HAS_SOURCES && name !== 'head_short_none' && !existsSync(at('docs/素材/城堡原圖/紙娃娃', `${name}.png`))) fail(`紙娃娃 ${name}：原圖 docs/素材/城堡原圖/紙娃娃/${name}.png 不存在`);
}
const dollDir = at('assets/images/castle/doll');
if (existsSync(dollDir)) {
  for (const f of readdirSync(dollDir)) {
    if (!DOLL_PARTS.includes(f.replace(/\.webp$/, ''))) fail(`成品 assets/images/castle/doll/${f} 沒有在 art.js 的 DOLL_PARTS 登記`);
  }
}
for (const hairStyle of ['short', 'medium', 'long', 'ponytail', 'twintails', 'bun']) {
  for (const mark of ['none', 'hat', 'ribbon', 'glasses', 'cape', 'headband']) {
    for (const topStyle of ['shirt', 'jacket', 'armor', 'robe', 'dress']) {
      for (const bottomStyle of ['pants', 'shorts', 'longskirt', 'skirt', '']) {
        for (const part of dollParts({ hairStyle, mark, topStyle, bottomStyle })) {
          if (!DOLL_PARTS.includes(part)) fail(`紙娃娃：${hairStyle}／${mark}／${topStyle}／${bottomStyle || '（無）'} 要用的部件 ${part} 沒有登記`);
        }
      }
    }
  }
}
// 臉：問卷的臉（roster.js 的 FACE_STYLE）和登記的臉部疊圖 face_* 一一對應
const faceParts = DOLL_PARTS.filter((n) => n.startsWith('face_'));
for (const face of Object.values(FACE_STYLE)) {
  if (!faceParts.includes(`face_${face}`)) fail(`紙娃娃：roster.js 的臉 ${face} 沒有部件 face_${face}`);
}
for (const part of faceParts) {
  if (!Object.values(FACE_STYLE).includes(part.slice(5))) fail(`紙娃娃：部件 ${part} 沒有對應 roster.js 的 FACE_STYLE（問卷選不到）`);
}
const charDir = at('assets/images/castle/members');
if (existsSync(charDir)) {
  for (const f of readdirSync(charDir)) {
    if (!CHAR_ART[f.replace(/\.webp$/, '')]) fail(`成品 assets/images/castle/members/${f} 沒有在 art.js 的 CHAR_ART 登記`);
  }
}
for (const table of ['castle_looks', 'castle_lines']) {
  const rows = readJson(`data/${table}.json`);
  if (!Array.isArray(rows)) { fail(`${table}：不是陣列`); continue; }
  rows.forEach((row, i) => {
    for (const [k, v] of Object.entries(row)) {
      if (v !== null && typeof v === 'object') fail(`${table} 第 ${i + 1} 列：欄位 ${k} 是巢狀值`);
      if (typeof v === 'string' && v.startsWith('#') && !/^#[0-9a-fA-F]{6}$/.test(v)) fail(`${table} 第 ${i + 1} 列：${k} 不是 #rrggbb`);
    }
    if (row.member_id && !memberIds.has(row.member_id)) fail(`${table} 第 ${i + 1} 列：member_id ${row.member_id} 不在成員名單`);
    if (row.face && !FACE_STYLE[row.face]) fail(`${table} 第 ${i + 1} 列：臉「${row.face}」不是問卷的選項（${Object.keys(FACE_STYLE).join('／')}）`);
    if (row.height && !['矮', '中', '高'].includes(row.height)) fail(`${table} 第 ${i + 1} 列：身高「${row.height}」不是 矮／中／高`);
  });
}

const updates = readJson('data/updates.json');
if (!Array.isArray(updates)) fail('updates：不是陣列');
else {
  const ids = new Set();
  updates.forEach((row, i) => {
    const label = `updates 第 ${i + 1} 列`;
    if (!row || typeof row !== 'object' || Array.isArray(row)) { fail(`${label}：不是資料列物件`); return; }
    for (const [k, v] of Object.entries(row)) {
      if (v !== null && typeof v === 'object') fail(`${label}：欄位 ${k} 是巢狀值`);
    }
    if (typeof row.id !== 'string' || !row.id.trim()) fail(`${label}：缺少 id`);
    else if (ids.has(row.id)) fail(`${label}：id ${row.id} 重複`);
    else ids.add(row.id);
    if (typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) fail(`${label}：date 不是 YYYY-MM-DD`);
    if (typeof row.text !== 'string' || !row.text.trim()) fail(`${label}：text 不是非空白字串`);
  });
}

// 5. 網站規則
const jsFiles = ['assets/js/pages/hall.js', ...readdirSync(at('assets/js/castle')).filter((f) => f.endsWith('.js')).map((f) => `assets/js/castle/${f}`),
  ...readdirSync(at('assets/js/castle/rooms')).map((f) => `assets/js/castle/rooms/${f}`)];
for (const f of jsFiles) {
  const code = readFileSync(at(f), 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  if (/innerHTML/.test(code)) fail(`${f}：用了 innerHTML`);
  if (/['"`]\/(?!\/)[\w.]/.test(code)) fail(`${f}：有以 / 開頭的路徑（網站在子路徑下，要用相對路徑）`);
}

if (problems.length) {
  console.log(`發現 ${problems.length} 個問題：`);
  for (const p of problems) console.log(`- ${p}`);
  process.exit(1);
}
console.log(`檢查通過：${Object.keys(ROOMS).length} 間房、已登記圖片 ${Object.keys(registered).length} 張、待補 ${WANTED_ART.length} 張。`);
