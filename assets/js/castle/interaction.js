// 家具範圍與腳底到最近格子邊緣的距離，鍵盤、點擊與檢查共用。
import { TILE } from './config.js';

export function furnitureTiles(grid, obj) {
  const sx = Math.floor(obj.x);
  const sy = Math.floor(obj.y);
  const start = grid.cell(sx, sy);
  let tiles = new Set([`${sx},${sy}`]);
  if (start && start.rule !== 'walk' && start.rule !== 'door' && start.ch !== '#') {
    const queue = [[sx, sy]];
    while (queue.length && tiles.size <= 16) {
      const [x, y] = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx},${y + dy}`;
        if (!tiles.has(k) && grid.cell(x + dx, y + dy)?.ch === start.ch) {
          tiles.add(k);
          queue.push([x + dx, y + dy]);
        }
      }
    }
    if (tiles.size > 16) tiles = new Set([`${sx},${sy}`]);
  }
  return tiles;
}

export function furnitureReach(grid, obj, x, y, tiles = furnitureTiles(grid, obj)) {
  let best = { x, y, distance: Infinity };
  for (const key of tiles) {
    const [tx, ty] = key.split(',').map(Number);
    const px = Math.max(tx * TILE, Math.min(x, (tx + 1) * TILE));
    const py = Math.max(ty * TILE, Math.min(y, (ty + 1) * TILE));
    const distance = Math.hypot(px - x, py - y);
    if (distance < best.distance) best = { x: px, y: py, distance };
  }
  return best;
}
