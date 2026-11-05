// 觀星台的星空大窗：用 Phaser graphics 畫出今天的真實月亮（沒有窗戶圖片時也看得到）。
// 房間定義寫 sky: '<地圖字元>'，就在那幾格窗戶上畫。
import { TILE, COLORS } from './config.js';
import { hasArt } from './art.js';
import { moonPhase, moonRows } from './sky.js';

export function drawSkyWindow(scene, moonAge = null) {
  const { grid, room } = scene;
  let box = null;
  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      if (grid.cells[y][x].ch !== room.sky) continue;
      box = box
        ? { x0: Math.min(box.x0, x), y0: Math.min(box.y0, y), x1: Math.max(box.x1, x), y1: Math.max(box.y1, y) }
        : { x0: x, y0: y, x1: x, y1: y };
    }
  }
  if (!box) return;
  const left = box.x0 * TILE;
  const top = box.y0 * TILE;
  const width = (box.x1 - box.x0 + 1) * TILE;
  const height = (box.y1 - box.y0 + 1) * TILE;
  const sprite = grid.legend[room.sky]?.sprite;
  const g = scene.add.graphics();

  if (!hasArt(scene, sprite)) {
    // 沒有窗戶圖：自己畫一片夜空與幾顆星星（同一個房間每次一樣）
    g.setDepth(-7.9);
    g.fillStyle(COLORS.starWindow).fillRect(left + 3, top + 3, width - 6, height - 5);
    g.lineStyle(2, COLORS.furnitureLine).strokeRect(left + 3, top + 3, width - 6, height - 5);
    g.fillStyle(0xf4f1e6, 0.8);
    for (let i = 0; i < 14; i++) {
      const sx = left + 6 + ((i * 37) % (width - 12));
      const sy = top + 6 + ((i * 23) % (height - 12));
      g.fillRect(sx, sy, 1, 1);
    }
  } else {
    g.setDepth(-3.9); // 窗戶圖（depth -4）上面
  }

  // 月亮：窗戶偏右上
  const moon = moonPhase(new Date(), moonAge);
  const r = Math.min(9, height / 2 - 6);
  const cx = left + width * 0.68;
  const cy = top + height * 0.45;
  g.fillStyle(COLORS.moonDark).fillCircle(cx, cy, r);
  g.fillStyle(COLORS.moonLit);
  const steps = Math.round(r * 4);
  const h = (2 * r) / steps;
  for (const [y, x0, x1] of moonRows(moon.age, steps)) {
    g.fillRect(cx + x0 * r, cy + y * r - h / 2, (x1 - x0) * r, h + 0.2);
  }
  scene.skyMoon = { name: moon.name, age: moon.age }; // 除錯用
}
