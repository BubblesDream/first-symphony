// 時間氛圍（規劃書 12.9）：依訪客電腦的時間，在畫面上蓋一層很淡的顏色。
// 戶外（房間定義 outdoor: true）明顯一點，室內只淡淡一層。網址加 ?hour=21 可以測試。

const MOODS = [
  // [從幾點, 到幾點（不含）, 名稱, 顏色, 戶外濃度]
  [5, 7, '清晨', 0xffc890, 0.10],
  [7, 17, '白天', 0x000000, 0],
  [17, 19, '黃昏', 0xff9a50, 0.14],
  [19, 24, '夜晚', 0x1a2550, 0.32],
  [0, 5, '深夜', 0x101838, 0.38],
];

/** 回傳 { name, color, alpha }；白天 alpha 是 0（不用蓋） */
export function moodAt(hour, outdoor) {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const [, , name, color, alpha] = MOODS.find(([from, to]) => h >= from && h < to);
  return { name, color, alpha: outdoor ? alpha : alpha * 0.45 };
}

/** 在房間上蓋一層顏色（固定在世界座標，蓋住整個房間） */
export function drawAmbience(scene, width, height, hour, outdoor) {
  const mood = moodAt(hour, outdoor);
  if (mood.alpha > 0) {
    scene.add.rectangle(-width, -height, width * 3, height * 3, mood.color, mood.alpha).setOrigin(0).setDepth(99500);
  }
  return mood;
}
