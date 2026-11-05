// 除錯圖層（網址加 ?debug=1）：標出不能走的格子、門、演出點，NPC 頭上顯示狀態，
// 並把目前狀態放在 window.__castle，讓自動檢查（Playwright）不用看截圖也能判斷。
import { TILE } from './config.js';
import { TILE_ART, SPRITE_ART, WANTED_ART } from './art.js';

export function drawDebug(scene) {
  const g = scene.add.graphics().setDepth(99999);
  const { grid } = scene;
  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      const c = grid.cells[y][x];
      if (c.rule === 'solid') g.lineStyle(1, 0xff4d4d, 0.5).strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
      if (c.rule === 'door') g.lineStyle(2, 0x4dff88, 0.9).strokeRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
    }
  }
  for (const s of scene.spots) {
    g.fillStyle(0x4da6ff, 0.8).fillCircle((s.x + 0.5) * TILE, (s.y + 0.5) * TILE, 3);
  }
  const problems = checkRoom(scene);
  if (problems.length) console.warn(`房間 ${scene.roomId} 的定義有問題：`, problems);
  scene.debugProblems = problems;
}

export function updateDebug(scene) {
  for (const npc of scene.npcs) npc.avatar.setTag(npc.state);
  window.__castle = {
    room: scene.roomId,
    problems: scene.debugProblems,
    player: { ...scene.player.tile },
    dialogOpen: scene.ctx.ui.dialog.isOpen,
    art: scene.artReport, // used：有用到的圖；missing：房間指定了、但還沒有圖（畫色塊）
    npcs: scene.npcs.map((npc) => ({
      id: npc.data.id,
      tx: npc.tx,
      ty: npc.ty,
      state: npc.state,
      // 站的格子是否合法（能走的格子，或自己正在使用的演出點）
      tileOk: scene.grid.npcWalkable(npc.tx, npc.ty) || (npc.spot && npc.spot.x === npc.tx && npc.spot.y === npc.ty)
        || scene.spots.some((s) => s.x === npc.tx && s.y === npc.ty),
    })),
    critters: (scene.critters || []).map((c) => ({ tx: c.tx, ty: c.ty })),
    groups: scene.groups?.report() || [],
    ensemble: scene.ensemble?.report() || null,
    mood: scene.mood?.name,
    roster: Object.fromEntries(Object.entries(scene.ctx.roster).map(([k, v]) => [k, v.map((p) => p.id)])),
  };
}

/** 檢查房間定義：每列等寬、字元都有定義、演出點與出生點位置合理、演出點走得到 */
export function checkRoom(scene) {
  const { grid, room } = scene;
  const problems = [...grid.problems];
  const reach = (x, y) => {
    const [sx, sy] = room.spawns.start;
    return grid.findPath(sx, sy, x, y, grid.npcWalkable, 5000) !== null;
  };
  for (const s of room.spots) {
    const c = grid.cell(s.x, s.y);
    if (!c || (c.rule !== 'walk' && c.rule !== 'seat')) problems.push(`演出點 (${s.x},${s.y}) 不在地板或椅子上`);
    else if (!reach(s.x, s.y)) problems.push(`演出點 (${s.x},${s.y}) 走不到`);
  }
  // 物件的 play：要有同動作的演出點
  for (const obj of room.objects || []) {
    if (obj.play && !room.spots.some((s) => s.action === obj.play)) problems.push(`物件「${obj.name}」的 play「${obj.play}」沒有演出點`);
  }
  // 演出效果的 target 要在房間範圍內
  for (const s of room.spots) {
    if (s.target && !grid.cell(...s.target)) problems.push(`演出點 (${s.x},${s.y}) 的 target 在房間外`);
  }
  // 多人演出：位置要對得到演出點，人數下限不能比位置多
  for (const g of room.groups || []) {
    for (const [x, y] of g.spots) {
      if (!room.spots.some((s) => s.x === x && s.y === y)) problems.push(`多人演出「${g.name}」的 (${x},${y}) 不是演出點`);
    }
    if ((g.min || 2) > g.spots.length) problems.push(`多人演出「${g.name}」的 min 比位置多`);
  }
  // 小動物：起始位置要在範圍內、是地板
  for (const c of room.critters || []) {
    const [x0, y0, x1, y1] = c.area;
    for (const [x, y] of c.at) {
      if (x < x0 || x > x1 || y < y0 || y > y1) problems.push(`${c.name} (${x},${y}) 不在 area 範圍內`);
      else if (!grid.npcWalkable(x, y)) problems.push(`${c.name} (${x},${y}) 不是地板`);
    }
  }
  for (const [id, [x, y]] of Object.entries(room.spawns)) {
    if (!grid.npcWalkable(x, y)) problems.push(`出生點 ${id} (${x},${y}) 不是地板`);
  }
  // 圖片名稱：沒登記、也不在待補清單裡，多半是打錯字
  const known = new Set([...Object.keys(TILE_ART), ...Object.keys(SPRITE_ART), ...WANTED_ART]);
  const names = [...Object.values(room.legend || {}).map((d) => d.sprite), ...Object.values(room.doors).map((d) => d.sprite),
    ...Object.values(room.tiles || {}), ...(room.critters || []).map((c) => c.sprite)];
  for (const name of names) if (name && !known.has(name)) problems.push(`圖片名稱「${name}」不在 art.js`);
  for (const [ch, door] of Object.entries(room.doors)) {
    if (!room.map.some((row) => row.includes(ch))) problems.push(`門「${ch}」沒有出現在地圖上`);
    if (door.to && !door.spawn) problems.push(`門「${ch}」缺少 spawn`);
  }
  return problems;
}
