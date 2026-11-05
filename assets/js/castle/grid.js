// 文字地圖：解析、判斷能不能走、格子尋路、格子預約（NPC 互相避讓用）。
import { TILE } from './config.js';

// 所有房間共用的地圖字元。房間可以在 legend 裡加自己的家具字元。
const BASE_LEGEND = {
  '#': { kind: 'wall' },
  '.': { kind: 'floor' },
  r: { kind: 'carpet' },
  s: { kind: 'stage' },
};

// kind → 誰可以走
//   walk：NPC 與訪客都能走
//   seat：只有把它當演出點目的地的 NPC 能進去（椅子、琴椅）；訪客不能走
//   solid：誰都不能走
const KIND_RULE = {
  wall: 'solid', floor: 'walk', carpet: 'walk', stage: 'walk',
  door: 'door', seat: 'seat',
};

export function buildGrid(room) {
  const legend = { ...BASE_LEGEND, ...room.legend };
  for (const ch of Object.keys(room.doors || {})) legend[ch] = { kind: 'door', label: room.doors[ch].label };
  const h = room.map.length;
  const w = room.map[0].length;
  const problems = [];
  room.map.forEach((row, y) => {
    if (row.length !== w) problems.push(`第 ${y} 列長度 ${row.length}，應為 ${w}`);
  });

  const cells = room.map.map((row, y) => Array.from(row).map((ch, x) => {
    const def = legend[ch];
    if (!def) problems.push(`(${x},${y}) 未定義的字元「${ch}」`);
    const kind = def ? def.kind : 'wall';
    return { ch, kind, rule: KIND_RULE[kind] || 'solid' };
  }));

  const occupied = new Map(); // "x,y" → 佔用者

  const cell = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? cells[y][x] : null);
  const key = (x, y) => `${x},${y}`;

  const grid = {
    w, h, cells, legend, problems,
    cell,
    /** NPC 平常能走的格子 */
    npcWalkable: (x, y) => cell(x, y)?.rule === 'walk',
    /** 訪客能走的格子（含門） */
    playerWalkable: (x, y) => {
      const r = cell(x, y)?.rule;
      return r === 'walk' || r === 'door';
    },
    /** 訪客會撞到的格子 */
    playerSolid: (x, y) => {
      const r = cell(x, y)?.rule;
      return r === 'solid' || r === 'seat' || r === undefined;
    },
    isDoor: (x, y) => cell(x, y)?.rule === 'door',

    occupant: (x, y) => occupied.get(key(x, y)),
    isFree: (x, y, who) => {
      const o = occupied.get(key(x, y));
      return !o || o === who;
    },
    reserve: (x, y, who) => occupied.set(key(x, y), who),
    release(x, y, who) {
      if (occupied.get(key(x, y)) === who) occupied.delete(key(x, y));
    },

    /**
     * 廣度優先尋路（上下左右）。回傳不含起點的格子陣列，走不到回傳 null。
     * passable(x, y)：這格能不能走；終點本身一律允許（例如椅子）。
     */
    findPath(sx, sy, gx, gy, passable, maxNodes = 2000) {
      if (sx === gx && sy === gy) return [];
      const prev = new Map([[key(sx, sy), null]]);
      const queue = [[sx, sy]];
      let count = 0;
      while (queue.length && count++ < maxNodes) {
        const [x, y] = queue.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          const k = key(nx, ny);
          if (prev.has(k)) continue;
          const isGoal = nx === gx && ny === gy;
          if (!cell(nx, ny)) continue;
          if (!isGoal && !passable(nx, ny)) continue;
          prev.set(k, [x, y]);
          if (isGoal) {
            const path = [];
            let cur = [nx, ny];
            while (cur && !(cur[0] === sx && cur[1] === sy)) {
              path.unshift(cur);
              cur = prev.get(key(cur[0], cur[1]));
            }
            return path;
          }
          queue.push([nx, ny]);
        }
      }
      return null;
    },
  };
  return grid;
}

/** 格子中心（站立時腳底位置） */
export function tileFeet(x, y) {
  return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 + 6 };
}

export function toTile(px, py) {
  return { x: Math.floor(px / TILE), y: Math.floor(py / TILE) };
}
