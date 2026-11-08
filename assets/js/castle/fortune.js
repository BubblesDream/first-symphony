// 觀星台：月相計算與畫月亮、每日抽牌（純函式；visitorId 會讀寫 localStorage）。
import { createRng, hashString } from './rng.js';

export const MONTH = 29.530588853;
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
  // 外框：新月前後幾乎全暗時，還看得出是一個月亮
  ctx.strokeStyle = '#8f98a3';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export const DECK = [
  { no: 0, name: '旅人', glyph: '旅', keyword: '新的開始', messages: [
    '帶著喜歡的旋律走進城堡，先向門邊的夥伴打聲招呼吧。',
    '今天可以試走一條不同的樓梯，順便收集沿途的小小聲音。',
    '行囊不必塞得太滿，留一點空間裝下公會裡的新鮮故事。',
  ] },
  { no: 1, name: '新手樂手', glyph: '奏', keyword: '放心嘗試', messages: [
    '第一個音彈歪也沒關係，公會的練習室總有再來一次的位置。',
    '挑一小段喜歡的旋律慢慢練，讓手指先認識今天的節拍。',
    '把不熟的曲子帶來合奏吧，大家也曾經在同一小節迷路。',
  ] },
  { no: 2, name: '領奏者', glyph: '拍', keyword: '聆聽彼此', messages: [
    '舉起手之前先聽聽大家的呼吸，合奏的起點可以很輕很輕。',
    '今天輪到你帶一小段旋律，也別忘了替夥伴留出接話的空拍。',
    '指揮棒暫時用鉛筆代替也行，重要的是看見每位夥伴的節奏。',
  ] },
  { no: 3, name: '合奏', glyph: '和', keyword: '一起前進', messages: [
    '一個人想不到的伴奏，或許就在隔壁夥伴隨手哼出的兩個音裡。',
    '把音量稍微放輕一些，聽聽大家的旋律怎麼在大廳相遇。',
    '今天邀個夥伴一起練習吧，連數錯拍子都能變成共同的笑話。',
  ] },
  { no: 4, name: '休止符', glyph: '歇', keyword: '留點空白', messages: [
    '把樂譜翻到下一頁之前，先喝口水，讓耳朵也坐下來休息。',
    '窗邊的椅子還空著，休息一小段也是公會日常裡的好節奏。',
    '今天不必把每個空拍填滿，留點安靜給剛剛那段喜歡的旋律。',
  ] },
  { no: 5, name: '豎琴', glyph: '弦', keyword: '輕輕回應', messages: [
    '輕撥一根琴弦，聽它慢慢安靜下來，再決定下一個音要去哪裡。',
    '替熟悉的曲子添一小段柔和伴奏，像替夥伴留一盞窗邊的燈。',
    '琴弦不必每根都響，挑幾個喜歡的音就能陪今天走一小段路。',
  ] },
  { no: 6, name: '鐵匠', glyph: '鍛', keyword: '耐心打磨', messages: [
    '工坊傳來叮叮的節拍，提醒你一點一點調整也算是在前進。',
    '把手邊的小事慢慢磨好，完成後再到大廳分享今天的新發現。',
    '練習和敲鐵都有自己的節奏，手忙腳亂時不妨先放慢半拍。',
  ] },
  { no: 7, name: '小羊', glyph: '羊', keyword: '悠閒散步', messages: [
    '跟著庭院的小羊散步一圈吧，牠對草地的研究比樂譜還認真。',
    '今天可以把步子放小一點，看看平常匆匆經過的城堡角落。',
    '如果練習卡住了，就去看看小羊，回來再替旋律換個開頭。',
  ] },
  { no: 8, name: '噴泉', glyph: '泉', keyword: '小小心願', messages: [
    '把今天想練好的那一小節記下來，讓噴泉的水聲替你打拍子。',
    '在噴泉旁坐一會兒，試著從水聲裡找出一段不急不慢的節奏。',
    '許個能親手完成的小心願吧，例如今天多向一位夥伴問聲好。',
  ] },
  { no: 9, name: '圖書館', glyph: '書', keyword: '好奇翻頁', messages: [
    '隨手翻開一本舊樂譜，先看看頁角有沒有前人留下的有趣筆記。',
    '今天挑一個不熟的音樂詞慢慢認識，查完也可以拿去考考夥伴。',
    '圖書館裡不只有答案，偶爾也藏著讓下一次冒險開始的小問題。',
  ] },
  { no: 10, name: '月光', glyph: '月', keyword: '安靜陪伴', messages: [
    '把喜歡的旋律彈輕一點，讓窗邊的月光陪你聽完最後一個音。',
    '今晚適合留一段安靜的時間，回想公會裡讓你微笑的小事情。',
    '不急著替每段旋律取名字，先讓它像月光一樣停在窗邊就好。',
  ] },
  { no: 11, name: '星點', glyph: '星', keyword: '發現亮點', messages: [
    '找找今天練習裡最喜歡的一個音，小小的進步也值得圈起來。',
    '星圖上有許多小點，公會的回憶也是一件一件慢慢連成的。',
    '替夥伴留下一句具體的稱讚吧，讓那段用心練過的旋律被聽見。',
  ] },
  { no: 12, name: '營火', glyph: '火', keyword: '分享溫暖', messages: [
    '搬張椅子靠近營火，輪流說說今天冒險路上最有趣的一件事。',
    '帶一首大家會哼的歌來吧，忘記歌詞時就讓笑聲接著唱下去。',
    '合奏散場後再坐一會兒，日常的閒聊也能替回憶添一點溫度。',
  ] },
  { no: 13, name: '信件', glyph: '信', keyword: '傳遞心意', messages: [
    '把想說的謝謝寫成一小句，放在公會夥伴容易看見的地方吧。',
    '今天可以問候一位好久沒合奏的朋友，先從分享一首歌開始。',
    '不用寫滿整張信紙，一句記得你上次的演奏就已經很溫暖。',
  ] },
  { no: 14, name: '地圖', glyph: '圖', keyword: '換個方向', messages: [
    '在城堡地圖上挑個少去的房間，帶著好奇走過去看看今天的日常。',
    '原本的練習方法不順手時，換個速度試試，也是一條可走的路。',
    '冒險前和夥伴一起看張地圖，連討論要在哪裡休息都很有趣。',
  ] },
  { no: 15, name: '鐘聲', glyph: '鐘', keyword: '掌握步調', messages: [
    '聽見城堡的鐘聲時伸個懶腰，替手邊的練習留一個舒服的段落。',
    '今天可以約個短短的合奏時間，不必很長，只要大家都自在。',
    '用自己的步調走過這一天吧，鐘聲提醒時間，也提醒該吃點心了。',
  ] },
  { no: 16, name: '調音', glyph: '調', keyword: '細心傾聽', messages: [
    '開始演奏之前先調好一根弦，也順便問問自己今天想聽什麼聲音。',
    '和夥伴的節奏有點不同時，先停下來聽聽，再一起找舒服的速度。',
    '把不太順耳的那一小節拆開練，細小的調整也能帶來新的樂趣。',
  ] },
  { no: 17, name: '安可', glyph: '再', keyword: '重溫喜歡', messages: [
    '把上次最喜歡的曲子再彈一遍，熟悉的段落也可以有今天的表情。',
    '合奏結束後如果還有精神，就邀大家再來一小段輕鬆的旋律吧。',
    '翻翻公會的舊照片，挑一段想重溫的回憶，當作今天的小安可。',
  ] },
  { no: 18, name: '晨光', glyph: '晨', keyword: '舒展心情', messages: [
    '拉開練習室的窗簾，讓晨光和第一個音一起慢慢走進房間。',
    '今天先完成一件小事吧，像整理樂譜，讓接下來的練習更舒服。',
    '到外庭走一小圈再回來，替耳朵收集幾種樂器以外的日常聲音。',
  ] },
  { no: 19, name: '城堡', glyph: '堡', keyword: '安心停靠', messages: [
    '不管今天練了多少，城堡裡總有一張椅子可以坐下來聊聊天。',
    '把冒險帶回來的小故事留在大廳，讓晚到的夥伴也能一起笑。',
    '今天幫忙收好一份樂譜吧，舒服的公會角落是大家慢慢照顧的。',
  ] },
  { no: 20, name: '公會旗', glyph: '旗', keyword: '共同記號', messages: [
    '看到公會旗就想起一起合奏的人，今天也替大家留個問候吧。',
    '每個人的音色都不一樣，正好讓公會的旋律多出幾種有趣表情。',
    '替下一次聚會提個小點子吧，從一首想一起演奏的曲子開始。',
  ] },
  { no: 21, name: '鑰匙', glyph: '鑰', keyword: '開啟好奇', messages: [
    '挑一件一直想試的小事當作鑰匙，輕輕打開今天的練習時間。',
    '不用一次走遍城堡，先推開一扇熟悉的門，看看夥伴正在忙什麼。',
    '把學會的小技巧分享出去吧，或許它正好能替夥伴打開新的旋律。',
  ] },
];

export function dailyCard({ visitorId, date = new Date() }) {
  const rng = createRng(hashString(visitorId + '|' + todayKey(date)));
  const card = rng.pick(DECK);
  return { card, message: rng.pick(card.messages) };
}

export function nextPhaseDate(date, targetAge) {
  const age = moonPhase(date).age;
  const remaining = ((targetAge - age) % MONTH + MONTH) % MONTH;
  return new Date(date.getTime() + (remaining || MONTH) * 86400000);
}

export function roman(n) {
  if (n === 0) return '0';
  let text = '';
  for (const [value, symbol] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) {
    while (n >= value) { text += symbol; n -= value; }
  }
  return text;
}

const FONT = '"LXGW WenKai TC", "Noto Serif TC", "PingFang TC", "Microsoft JhengHei", serif';

export function drawTarot(ctx, x, y, w, h, card) {
  const height = Math.min(h, w * 1.5);
  const width = height * 2 / 3;
  const left = x + (w - width) / 2;
  const top = y + (h - height) / 2;
  ctx.save();
  ctx.fillStyle = '#fbf7ef';
  ctx.fillRect(left, top, width, height);
  ctx.strokeStyle = '#3a2a1f';
  ctx.lineWidth = 3;
  ctx.strokeRect(left + 2, top + 2, width - 4, height - 4);
  ctx.strokeStyle = '#8a4528';
  ctx.lineWidth = 1;
  const inset = height * 0.04;
  ctx.strokeRect(left + inset, top + inset, width - inset * 2, height - inset * 2);
  ctx.fillStyle = '#3a2a1f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const center = left + width / 2;
  ctx.font = `${height * 0.065}px ${FONT}`;
  ctx.fillText(roman(card.no), center, top + height * 0.13);
  ctx.font = `${height * 0.34}px ${FONT}`;
  ctx.fillText(card.glyph, center, top + height * 0.49);
  ctx.font = `${height * 0.085}px ${FONT}`;
  ctx.fillText(card.name, center, top + height * 0.83);
  ctx.restore();
}

export function drawNightMoon(ctx, x, y, w, h, phase) {
  const side = Math.min(w, h);
  const left = x + (w - side) / 2;
  const top = y + (h - side) / 2;
  ctx.save();
  ctx.fillStyle = '#2e3a4f';
  ctx.fillRect(left, top, side, side);
  ctx.fillStyle = '#eee2b9';
  for (const [sx, sy] of [[0.12, 0.18], [0.8, 0.12], [0.91, 0.4], [0.16, 0.79], [0.76, 0.88], [0.08, 0.48]]) {
    ctx.beginPath();
    ctx.arc(left + sx * side, top + sy * side, side * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
  drawMoon(ctx, left + side / 2, top + side / 2, side * 0.36, phase);
  ctx.restore();
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
