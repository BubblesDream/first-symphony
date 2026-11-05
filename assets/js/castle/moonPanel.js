// 望遠鏡畫面（面板 moon）：圓形視野裡畫出今天的真實月相，下方是文字說明。
import { el } from '../render.js';
import { moonPhase, moonRows, isDaytime } from './sky.js';

// 望遠鏡畫面的顏色（只用在這張小畫布上）
const SKY = '#121a3a';
const STAR = '#f4f1e6';
const MOON_DARK = '#262d4a';
const MOON_LIT = '#f1ead2';
const SIZE = 220; // 畫面上的寬高（CSS 像素）

export function buildMoonPanel(ctx) {
  const now = new Date();
  const moon = moonPhase(now, ctx.moonAge);
  const daytime = isDaytime(now);

  const canvas = el('canvas', {
    className: 'castle-moon__view',
    role: 'img',
    'aria-label': `望遠鏡裡的月亮：${moon.name}`,
  });
  drawView(canvas, moon, daytime);

  const days = (n) => Math.max(1, Math.round(n));
  const fullText = moon.daysToFull < 0.5 || moon.daysToFull > 29 ? '今天就是滿月附近！' : `距離下次滿月還有 ${days(moon.daysToFull)} 天`;
  const newText = moon.daysToNew < 0.5 || moon.age < 0.5 ? '今天就是新月附近，月亮幾乎看不到。' : `距離下次新月還有 ${days(moon.daysToNew)} 天`;

  const body = el('div', { className: 'castle-moon' },
    canvas,
    el('div', { className: 'castle-moon__text' },
      el('p', { className: 'castle-moon__name', text: `今天是${moon.name}（月齡 ${moon.age.toFixed(1)} 天）` }),
      el('p', { text: fullText }),
      el('p', { className: 'castle-panel__small', text: `${newText}　亮面約 ${Math.round(moon.fraction * 100)}%` }),
      daytime ? el('p', { className: 'castle-panel__small', text: '白天的月亮比較淡，晚上再來看更清楚。' }) : null,
      Number.isFinite(ctx.moonAge) ? el('p', { className: 'castle-panel__small', text: '（測試中：月齡由網址指定）' }) : null,
    ),
  );
  return { title: '望遠鏡', body };
}

function drawView(canvas, moon, daytime) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  const g = canvas.getContext('2d');
  if (!g) return;
  g.scale(dpr, dpr);
  const c = SIZE / 2;

  // 圓形視野
  g.save();
  g.beginPath();
  g.arc(c, c, c, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = SKY;
  g.fillRect(0, 0, SIZE, SIZE);
  // 隨機小星星
  g.fillStyle = STAR;
  for (let i = 0; i < 45; i++) {
    g.globalAlpha = (daytime ? 0.25 : 0.4) + Math.random() * 0.5;
    const s = Math.random() < 0.15 ? 2 : 1;
    g.fillRect(Math.random() * SIZE, Math.random() * SIZE, s, s);
  }
  g.globalAlpha = 1;

  // 月亮：先畫暗的整個圓，再一條一條畫亮面
  const r = SIZE * 0.27;
  g.fillStyle = MOON_DARK;
  g.beginPath();
  g.arc(c, c, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = MOON_LIT;
  g.globalAlpha = daytime ? 0.75 : 1;
  const steps = Math.round(r * 2 * dpr);
  const h = (2 * r) / steps;
  for (const [y, x0, x1] of moonRows(moon.age, steps)) {
    g.fillRect(c + x0 * r, c + y * r - h / 2, (x1 - x0) * r, h + 0.3);
  }
  g.restore();
}
