// 交流廳（酒館，1F 左上）。左上是吧台與酒桶，右邊是圓桌區，左下是長桌與長椅，上方牆上有壁爐。
// 配置參考 docs/reference/castle-layout.png。家具還沒有圖時自動畫色塊。

export default {
  id: 'tavern',
  name: '交流廳',
  capacity: 8,
  map: [
    '########################', // 0  牆頂
    '###WWWW#MM####EE###f####', // 1  牆面：W 酒瓶架  M 菜單板  E 壁爐  f 公會旗幟
    '#KK..........L..L.....p#', // 2  K 酒桶  L 燭台（壁爐兩側）
    '#KK....................#', // 3  吧台後面（酒保站的地方）
    '#.QQQQQQ...............#', // 4  Q 吧台
    '#.b.b.b................#', // 5  b 吧台高腳椅
    '#...........hRRj.hRRj..#', // 6  R 圓桌（2×2）  h／j 椅子
    '#...........hRRj.hRRj..#', // 7
    '#......................H', // 8  H 回大廳
    '#..nnnnnn..............#', // 9  n 長椅
    '#..TTTTTT..............#', // 10 T 長桌
    '#..nnnnnn...hRRj.hRRj..#', // 11
    '#...........hRRj.hRRj..#', // 12
    '#......................#', // 13
    '#p....................p#', // 14
    '########################', // 15
  ],
  legend: {
    W: { kind: 'wall', color: 'bar', sprite: 'bottle_shelf' },
    M: { kind: 'wall', color: 'notice', sprite: 'menu_board' },
    E: { kind: 'wall', color: 'fire', sprite: 'fireplace' },
    f: { kind: 'wall', color: 'banner', sprite: 'banner' },
    K: { kind: 'furniture', color: 'barrel', sprite: 'barrel' },
    L: { kind: 'furniture', color: 'stand', sprite: 'candle_stand' },
    Q: { kind: 'furniture', color: 'bar', sprite: 'bar_counter' },
    b: { kind: 'seat', color: 'seat', sprite: 'stool' },
    R: { kind: 'furniture', color: 'furniture', sprite: 'table_round' },
    h: { kind: 'seat', color: 'seat', sprite: 'chair_side' },
    j: { kind: 'seat', color: 'seat', sprite: 'chair_side', flipX: true },
    n: { kind: 'seat', color: 'seat', sprite: 'bench' },
    T: { kind: 'furniture', color: 'furniture', sprite: 'long_table' },
    p: { kind: 'furniture', color: 'plant', sprite: 'plant' },
  },
  doors: {
    H: { to: 'hall', spawn: 'from_tavern', label: '大廳', sprite: 'door_side_open', flipX: true },
  },
  spawns: {
    start: [22, 8],
    from_hall: [22, 8],
  },
  spots: [
    { action: 'serve_drink', x: 4, y: 3, facing: 'down' },
    { action: 'serve_drink', x: 6, y: 3, facing: 'down' },
    ...[2, 4, 6].map((x) => ({ action: 'drink', x, y: 5, facing: 'up' })),
    ...[3, 4, 5, 6, 7, 8].flatMap((x) => [
      { action: 'drink', x, y: 9, facing: 'down' },
      { action: 'drink', x, y: 11, facing: 'up' },
    ]),
    ...[6, 7, 11, 12].flatMap((y) => [
      { action: 'cheers', x: 12, y, facing: 'right' },
      { action: 'cheers', x: 15, y, facing: 'left' },
      { action: 'cheers', x: 17, y, facing: 'right' },
      { action: 'cheers', x: 20, y, facing: 'left' },
    ]),
    { action: 'warm_hands', x: 14, y: 2, facing: 'up' },
    { action: 'warm_hands', x: 15, y: 2, facing: 'up' },
  ],
  // 多人演出（groups.js）：同一張圓桌湊到 2 位以上就一起乾杯
  groups: [[12, 6], [17, 6], [12, 11], [17, 11]].map(([x, y]) => ({
    name: '乾杯', spots: [[x, y], [x + 3, y], [x, y + 1], [x + 3, y + 1]], min: 2, every: [25, 55], duration: [12, 20],
    bubbles: ['來，舉杯！', '乾杯！', '哈哈哈', '敬第一交響樂團！'], finale: '乾——杯！',
  })),
  objects: [
    { x: 4.5, y: 4, name: '吧台', text: ['擦得發亮的木頭吧台，上面留著幾圈杯子的水痕。'], demo: true, play: 'drink' },
    { x: 1.5, y: 3, name: '酒桶', text: ['桶子上用粉筆寫著「蘋果酒」。'], demo: true },
    { x: 14.5, y: 1, name: '壁爐', text: ['柴火劈啪作響，整間酒館都暖暖的。'], demo: true, play: 'warm_hands' },
    { x: 13.5, y: 6.5, name: '圓桌', text: ['桌上擺著幾杯還在冒泡的飲料。'], demo: true, play: 'cheers' },
    { x: 8.5, y: 1, name: '菜單板', text: ['【今日菜單】蘋果酒、熱牛奶、烤麵包。'], demo: true },
  ],
  labels: [
    { x: 21.4, y: 7.2, text: '往大廳' },
    { x: 4.5, y: 5.9, text: '吧台' },
    { x: 14.5, y: 3.2, text: '壁爐' },
  ],
};
