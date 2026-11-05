// 公會大廳（1F 中央）。地圖一個字元＝一格（32×32）。
// 共用字元：# 牆  . 地板  r 地毯  s 舞台（見 grid.js）
// 配置參考 docs/reference/castle-layout.png：上方樓梯往 2F、中央紅地毯、兩側石柱與燭台、下方正門。
// 左上通交流廳、右上通演奏室、左下通鍛造工坊、右下通練習室。

export default {
  id: 'hall',
  name: '公會大廳',
  capacity: 8,
  map: [
    '############UUUU############', // 0  牆頂；UUUU 往 2F 的樓梯（整修中）
    '#####f######UUUU######f#####', // 1  牆面，f 公會旗幟
    '#p.NN....L.rrrrrr.L.......p#', // 2  NN 公告板  L 燭台
    '#..........rrrrrr..........#', // 3
    'T.........IrrrrrrI.........M', // 4  T 交流廳（整修中）  M 演奏室  I 石柱
    '#.......rr.rrrrrr.rr.......#', // 5  兩側細地毯
    '#.......rr.rrrrrr.rr.......#', // 6
    '#.......rrLrrrrrrLrr.......#', // 7
    '#.hRRj..rr.rrrrrr.rr.hRRj..#', // 8  討論桌（RR）與椅子（h 朝右、j 朝左）
    '#.hRRj..rr.rrrrrr.rr.hRRj..#', // 9
    '#.......rrIrrrrrrIrr.......#', // 10
    '#.......rr.rrrrrr.rr.......#', // 11
    '#.......rr.rrrrrr.rr.......#', // 12
    '#.hRRj..rrLrrrrrrLrr.hRRj..#', // 13 下方也有討論桌
    'F.hRRj..rr.rrrrrr.rr.hRRj..K', // 14 F 鍛造工坊（候選）  K 練習室
    '#.......rr.rrrrrr.rr.......#', // 15
    '#.......rrIrrrrrrIrr.......#', // 16
    '#p.......p.rrrrrr.p.......p#', // 17
    '###########OOOOOO###########', // 18 OOOOOO 正門，通往城堡外庭
    '#########f#OOOOOO#f#########', // 19
  ],
  // 家具字元 → 種類、色塊顏色、圖片（kind：furniture 不能走、seat 椅子、wall 牆上的東西）
  // sprite 是 art.js 的圖片名稱；還沒有圖時自動畫色塊。flipX：左右翻轉。
  legend: {
    f: { kind: 'wall', color: 'banner', sprite: 'banner' },
    N: { kind: 'furniture', color: 'notice', sprite: 'notice_board' },
    I: { kind: 'furniture', color: 'wallTop', sprite: 'pillar' },
    L: { kind: 'furniture', color: 'stand', sprite: 'candle_stand' },
    R: { kind: 'furniture', color: 'furniture', sprite: 'table_round' },
    h: { kind: 'seat', color: 'seat', sprite: 'chair_side' },
    j: { kind: 'seat', color: 'seat', sprite: 'chair_side', flipX: true },
    p: { kind: 'furniture', color: 'plant', sprite: 'plant' },
  },
  // 門：to＝通往的房間，spawn＝到達後出現的位置；沒有 to 的門顯示 locked 訊息
  // sprite：門的圖片（預設：能走的門 door_open、整修中 door_locked）；under：門底下鋪什麼
  doors: {
    M: { to: 'music', spawn: 'from_hall', label: '演奏室' },
    T: { locked: '交流廳（酒館）還在整修中，敬請期待。', label: '交流廳' },
    K: { locked: '戰鬥練習室還在整修中，敬請期待。', label: '練習室' },
    F: { locked: '鍛造工坊還在規劃中。', label: '鍛造工坊' },
    U: { locked: '2F 公會客房還在整修中，樓梯暫時封起來了。', label: '往 2F', sprite: 'stairs_up', under: 'wall' },
    O: { to: 'courtyard', spawn: 'from_hall', label: '往外庭', sprite: 'gate_main', under: 'wall' },
  },
  spawns: {
    start: [13, 16],
    from_music: [26, 4],
    from_courtyard: [13, 17],
  },
  // 演出點：x、y 是格子座標，facing 是演出時面向的方向
  spots: [
    { action: 'sit_chat', x: 2, y: 8, facing: 'right' },
    { action: 'sit_chat', x: 5, y: 8, facing: 'left' },
    { action: 'sit_chat', x: 2, y: 9, facing: 'right' },
    { action: 'sit_chat', x: 5, y: 9, facing: 'left' },
    { action: 'sit_chat', x: 21, y: 8, facing: 'right' },
    { action: 'sit_chat', x: 24, y: 8, facing: 'left' },
    { action: 'sit_chat', x: 21, y: 9, facing: 'right' },
    { action: 'sit_chat', x: 24, y: 9, facing: 'left' },
    ...[13, 14].flatMap((y) => [
      { action: 'sit_chat', x: 2, y, facing: 'right' },
      { action: 'sit_chat', x: 5, y, facing: 'left' },
      { action: 'sit_chat', x: 21, y, facing: 'right' },
      { action: 'sit_chat', x: 24, y, facing: 'left' },
    ]),
    { action: 'read_notice', x: 3, y: 3, facing: 'up' },
    { action: 'read_notice', x: 4, y: 3, facing: 'up' },
    { action: 'stand_guard', x: 10, y: 17, facing: 'down' },
    { action: 'stand_guard', x: 17, y: 17, facing: 'down' },
  ],
  // 訪客可以按 E 查看的物件（文字是網站自己寫的固定內容）
  objects: [
    { x: 3.5, y: 2, name: '公告板', text: ['【公告】歡迎來到第一交響樂團的公會城堡！', '城堡還在整修中，目前開放公會大廳與演奏室。'], demo: true },
    { x: 5, y: 1, name: '公會旗幟', text: ['深藍色的旗幟上繡著高音譜記號。'], demo: true },
    { x: 22, y: 1, name: '公會旗幟', text: ['深藍色的旗幟上繡著高音譜記號。'], demo: true },
  ],
  labels: [
    { x: 13.5, y: 2.2, text: '往 2F（整修中）' },
    { x: 13.5, y: 17.2, text: '正門（往外庭）' },
    { x: 1.6, y: 3.3, text: '交流廳' },
    { x: 25.4, y: 3.3, text: '演奏室' },
    { x: 1.9, y: 13.3, text: '鍛造工坊' },
    { x: 25.4, y: 13.3, text: '練習室' },
  ],
};
