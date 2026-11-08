// 鍛造工坊的隨機打造：種類、材料、前綴與稀有度隨機組合（純函式，不碰 DOM、不用 Phaser）。
// 內容規則：不用任何真實遊戲的官方道具、技能或地名。
const TYPES = [['長劍', 'blade'], ['短劍', 'blade'], ['大劍', 'blade'], ['長弓', 'bow'], ['法杖', 'staff'],
  ['長槍', 'spear'], ['戰斧', 'axe'], ['盾牌', 'shield'], ['魯特琴', 'lute'], ['長笛', 'flute'],
  ['指揮棒', 'baton'], ['平底鍋', 'pan'], ['木湯匙', 'spoon'], ['雨傘', 'staff']];
const MATERIALS = [['蘋果木', '#b87b58'], ['橡木', '#99704a'], ['黃銅', '#c8ab61'], ['青銅', '#8e9970'],
  ['鐵', '#8b9299'], ['銀', '#c3c8ce'], ['月光石', '#c5bfdb'], ['星砂', '#d5bd83'],
  ['羊毛', '#e7ddce'], ['乾草', '#bdad64'], ['法國麵包', '#ce9654'], ['冰糖', '#d4e5e4']];
const PREFIXES = ['會唱歌的', '有點歪的', '剛出爐的', '被羊咬過的', '半夜會發光的', '很有禮貌的',
  '總是走音的', '睡不醒的', '超重的', '輕飄飄的', '暖呼呼的', '祖傳的', '愛打拍子的',
  '偷偷跳舞的', '忘記調音的', '自帶掌聲的', '怕癢的', '喜歡曬太陽的'];
const LEGENDARY = ['傳說中的', '被星星祝福的', '讓月亮安可的', '全公會都在找的', '連鐵匠都想留的'];
const SKILLS = ['揮動時會發出 Do-Re-Mi 的聲音。', '每揮三下就會想吃點心。', '拿著它演奏，旁邊的羊會跟著搖擺。',
  '放在桌上會自己打四拍。', '下雨時會提醒你收衣服。', '聽到掌聲就會重複最後一個音。',
  '練習太久會建議你喝水。', '每到中午就散發麵包香。', '拿反時音感會特別好。',
  '只要有人走音，它就假裝沒聽見。', '揮動十次可以換來自己的掌聲。', '收進背包後會輕輕哼歌。',
  '對著它說謝謝，手感會變好一點。', '遇到枕頭就想休息。', '合奏前會偷偷數一二三四。',
  '每次出場都想先鞠躬。', '放在陽光下會想起野餐。', '打完節拍就會期待晚餐。'];
const COMMENTS = [
  ['嗯……至少是把武器。', '敲起來聲音不錯，先拿去試試吧。', '歪一點比較有個性。', '我有認真打，材料也有自己的想法。'],
  ['這手感，值得配一首新曲子。', '今天的爐火很懂音樂。', '不錯不錯，連羊都點頭了。', '這把拿去合奏一定很有話題。'],
  ['我打鐵三十年，第一次看到這種東西！', '先別走，讓我再欣賞一下！', '這下連鐵砧都想要簽名了。', '今天可以提早收工慶祝了！'],
];

export function forgeWeapon(rng) {
  const roll = rng.next();
  const rarity = roll < 0.45 ? 1 : roll < 0.75 ? 2 : roll < 0.90 ? 3 : roll < 0.98 ? 4 : 5;
  const [type, kind] = rng.pick(TYPES);
  const [material, materialColor] = rng.pick(MATERIALS);
  const prefix = rng.pick(rarity === 5 ? LEGENDARY : PREFIXES);
  const [min, max] = [[1, 20], [15, 40], [35, 65], [55, 95], [80, 120]][rarity - 1];
  return { rarity, rarityName: ['普通', '精良', '稀有', '史詩', '傳說'][rarity - 1],
    stars: '★'.repeat(rarity) + '☆'.repeat(5 - rarity), type, kind, material, materialColor, prefix,
    name: prefix + material + type + (rarity === 5 ? '・極' : rarity === 4 ? '・改' : ''),
    attack: rng.int(min, max), music: rng.int(min, max), cute: rng.int(min, max),
    skill: rng.pick(SKILLS), comment: rng.pick(COMMENTS[rarity <= 2 ? 0 : rarity === 3 ? 1 : 2]) };
}

// 用固定大小的幾何圖形繪製，再縮放到卡片的插圖區域。
export function drawWeapon(ctx, x, y, w, h, weapon) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  const scale = Math.min(w, h) / 220;
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#3a2a1f';
  ctx.fillStyle = weapon.materialColor;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  const polygon = (points) => {
    ctx.beginPath();
    points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
    ctx.closePath(); ctx.fill(); ctx.stroke();
  };
  const rect = (px, py, width, height) => { ctx.fillRect(px, py, width, height); ctx.strokeRect(px, py, width, height); };
  const circle = (px, py, r) => { ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
  const line = (ax, ay, bx, by) => { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); };
  switch (weapon.kind) {
    case 'blade':
      rect(-8, 25, 16, 55); polygon([[-17, 25], [-17, -55], [0, -85], [17, -55], [17, 25]]); rect(-32, 22, 64, 10); break;
    case 'bow':
      // 弓身：先畫粗的深色描邊，再疊一層材料色；弦是細線
      line(7.5, -73.6, 7.5, 73.6);
      ctx.lineCap = 'round';
      ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(-35, 0, 85, -Math.PI / 3, Math.PI / 3); ctx.stroke();
      ctx.strokeStyle = weapon.materialColor; ctx.lineWidth = 10; ctx.stroke();
      break;
    case 'staff': rect(-7, -55, 14, 140); circle(0, -65, 23); break;
    case 'spear': rect(-6, -30, 12, 120); polygon([[0, -90], [-20, -30], [20, -30]]); break;
    case 'axe': rect(-7, -70, 14, 155); polygon([[5, -65], [52, -80], [65, -15], [5, -25]]); break;
    case 'shield': polygon([[-60, -65], [60, -65], [52, 30], [0, 85], [-52, 30]]); line(0, -45, 0, 55); line(-35, -5, 35, -5); break;
    case 'lute': rect(-8, -85, 16, 100); circle(0, 35, 45); circle(0, 20, 12); line(-3, -75, -3, 65); line(4, -75, 4, 65); break;
    case 'flute': rect(-12, -85, 24, 170); for (let py = -40; py <= 50; py += 22) circle(0, py, 4); break;
    case 'baton': polygon([[-4, -90], [4, -90], [9, 45], [-9, 45]]); rect(-10, 45, 20, 40); break;
    case 'pan': rect(-10, 30, 20, 60); circle(0, -25, 55); circle(0, -25, 42); break;
    case 'spoon': rect(-6, -10, 12, 100); ctx.beginPath(); ctx.ellipse(0, -43, 28, 43, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break;
  }
  if (weapon.rarity >= 4) {
    ctx.fillStyle = '#d5b55c';
    for (const [sx, sy] of [[-78, -65], [78, 50], [70, -60]]) {
      polygon(Array.from({ length: 10 }, (_, i) => {
        const angle = i * Math.PI / 5 - Math.PI / 2;
        const radius = i % 2 ? 5 : 12;
        return [sx + Math.cos(angle) * radius, sy + Math.sin(angle) * radius];
      }));
    }
  }
  ctx.restore();
}

export function forgeFilename(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `forge-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.png`;
}
