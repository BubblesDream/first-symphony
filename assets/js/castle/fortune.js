import { createRng, hashString } from './rng.js';

const MONTH = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const PHASES = ['新月', '眉月', '上弦月', '盈凸月', '滿月', '虧凸月', '下弦月', '殘月'];

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function moonPhase(date = new Date()) {
  const days = (date.getTime() - NEW_MOON) / 86400000;
  const age = ((days % MONTH) + MONTH) % MONTH;
  return { age, fraction: (1 - Math.cos(2 * Math.PI * age / MONTH)) / 2,
    waxing: age < MONTH / 2, name: PHASES[Math.floor(age / MONTH * 8 + 0.5) % 8] };
}

export function drawMoon(ctx, cx, cy, r, phase) {
  const angle = 2 * Math.PI * phase.age / MONTH;
  const terminator = Math.cos(angle);
  ctx.save();
  ctx.fillStyle = '#b9c1ca';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // 先畫亮的半圓，再用橢圓補上或遮住明暗交界。
  ctx.fillStyle = '#eee2b9';
  ctx.beginPath();
  ctx.arc(cx, cy, r, phase.waxing ? -Math.PI / 2 : Math.PI / 2, phase.waxing ? Math.PI / 2 : Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = terminator > 0 ? '#b9c1ca' : '#eee2b9';
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.abs(terminator) * r, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const ADVICE = [
  '今天適合把沒練完的曲子拿出來再彈一次。', '合奏前先聽聽彼此的節拍，默契會慢慢長出來。',
  '帶上一首喜歡的歌，陪你走一段新的路。', '路過大廳時，向熟悉的人打聲招呼吧。',
  '練習累了就喝口水，休息也是樂章的一部分。', '今天不妨試試平常很少碰的樂器。',
  '把新學會的小段旋律分享給公會夥伴吧。', '冒險前整理行囊，也留個位置裝回憶。',
  '慢一點彈，會聽見藏在音符間的小驚喜。', '邀一位夥伴散步，沿路的話題就是伴奏。',
  '今天適合替自己的練習取個有趣的名字。', '聽完夥伴的演奏，送上一句真心的稱讚。',
  '窗邊的位置正好，坐下來想一段新旋律吧。', '把熟悉的曲子換個速度，或許會有新的風景。',
  '今天的冒險可以從一個小小的好奇開始。', '替下一次合奏記下一首想一起演出的歌。',
  '偶爾讓別人領奏，也能找到新的節奏。', '在公會的日常裡，收集一件值得微笑的小事。',
  '替忙碌的一天留一段安靜的前奏。', '不用急著奏完，享受大家一起練習的時光。',
];
const COLORS = [['磚紅', '#a64d3d'], ['麥黃', '#d8bc78'], ['鼠尾草綠', '#849879'], ['霧藍', '#839bad'],
  ['丁香紫', '#a390ad'], ['奶油白', '#eee3cf'], ['栗棕', '#906b50'], ['珊瑚粉', '#cf9588']];

export function dailyFortune({ visitorId, date = new Date(), nicknames = [] }) {
  const rng = createRng(hashString(visitorId + '|' + todayKey(date)));
  const overall = rng.pick(['大吉', '中吉', '中吉', '吉', '吉', '吉', '小吉', '小吉', '末吉']);
  const stars = {};
  for (const label of ['演奏運', '冒險運', '生活運']) {
    const n = rng.int(1, 5);
    stars[label] = '★'.repeat(n) + '☆'.repeat(5 - n);
  }
  const instrument = rng.pick(['魯特琴', '長笛', '小提琴', '大提琴', '曼陀林', '豎琴', '木琴', '鋼琴', '蕭姆管', '手鼓']);
  const room = rng.pick(['公會大廳', '演奏室', '交流廳', '戰鬥練習室', '鍛造工坊', '城堡外庭', '公會客房', '魔法圖書館', '觀星台']);
  const [name, hex] = rng.pick(COLORS);
  const advice = rng.pick(ADVICE);
  return { overall, stars, instrument, room, color: { name, hex }, advice,
    ...(nicknames.length ? { partner: rng.pick(nicknames) } : {}) };
}

let pageVisitor;
export function visitorId() {
  if (pageVisitor) return pageVisitor;
  try { pageVisitor = localStorage.getItem('castle-visitor'); } catch { /* 無法儲存時沿用本頁的值 */ }
  if (!pageVisitor) {
    pageVisitor = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    try { localStorage.setItem('castle-visitor', pageVisitor); } catch { /* 私密瀏覽也能使用 */ }
  }
  return pageVisitor;
}
