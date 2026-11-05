// 公會大廳（1F 中央）。地圖一個字元＝一格（32×32）。
// 共用字元：# 牆  . 地板  r 地毯  s 舞台（見 grid.js）

export default {
  id: 'hall',
  name: '公會大廳',
  capacity: 8,
  map: [
    '#####f######UUUU######f#####', // 0  上方：往 2F 的樓梯（整修中）
    '#p.........rrrrrr.........p#', // 1
    '#..NN......rrrrrr..........#', // 2  NN 公告板
    'T..........rrrrrr..........M', // 3  T 交流廳（整修中）  M 演奏室
    '#..........rrrrrr..........#', // 4
    '#..I.......rrrrrr.......I..#', // 5
    '#..........rrrrrr..........#', // 6
    '#...hRRh...rrrrrr...hRRh...#', // 7  討論桌與椅子
    '#...hRRh...rrrrrr...hRRh...#', // 8
    '#..........rrrrrr..........#', // 9
    '#..I.......rrrrrr.......I..#', // 10
    '#..........rrrrrr..........#', // 11
    'F..........rrrrrr..........K', // 12 F 鍛造工坊（候選）  K 練習室
    '#..........rrrrrr..........#', // 13
    '#.L........rrrrrr........L.#', // 14
    '#p.........rrrrrr.........p#', // 15
    '#..........rrrrrr..........#', // 16
    '#####f#####OOOOOO#####f#####', // 17 下方：正門，通往城堡外庭
  ],
  // 家具字元 → 種類與顏色（kind：furniture 不能走、seat 椅子）
  legend: {
    f: { kind: 'wall', color: 'banner' },
    N: { kind: 'furniture', color: 'notice' },
    I: { kind: 'furniture', color: 'wallTop' },
    R: { kind: 'furniture', color: 'furniture' },
    h: { kind: 'seat', color: 'seat' },
    p: { kind: 'furniture', color: 'plant' },
    L: { kind: 'furniture', color: 'notice' },
  },
  // 門：to＝通往的房間，spawn＝到達後出現的位置；沒有 to 的門顯示 locked 訊息
  doors: {
    M: { to: 'music', spawn: 'from_hall', label: '演奏室' },
    T: { locked: '交流廳（酒館）還在整修中，敬請期待。', label: '交流廳' },
    K: { locked: '戰鬥練習室還在整修中，敬請期待。', label: '練習室' },
    F: { locked: '鍛造工坊還在規劃中。', label: '鍛造工坊' },
    U: { locked: '2F 公會客房還在整修中，樓梯暫時封起來了。', label: '往 2F' },
    O: { locked: '城堡外庭還在整理中，先在城堡裡逛逛吧。', label: '往外庭' },
  },
  spawns: {
    start: [13, 14],
    from_music: [26, 3],
  },
  // 演出點：x、y 是格子座標，facing 是演出時面向的方向
  spots: [
    { action: 'sit_chat', x: 4, y: 7, facing: 'right' },
    { action: 'sit_chat', x: 7, y: 7, facing: 'left' },
    { action: 'sit_chat', x: 4, y: 8, facing: 'right' },
    { action: 'sit_chat', x: 7, y: 8, facing: 'left' },
    { action: 'sit_chat', x: 20, y: 7, facing: 'right' },
    { action: 'sit_chat', x: 23, y: 7, facing: 'left' },
    { action: 'sit_chat', x: 20, y: 8, facing: 'right' },
    { action: 'sit_chat', x: 23, y: 8, facing: 'left' },
    { action: 'read_notice', x: 3, y: 3, facing: 'up' },
    { action: 'read_notice', x: 4, y: 3, facing: 'up' },
    { action: 'stand_guard', x: 10, y: 16, facing: 'down' },
    { action: 'stand_guard', x: 17, y: 16, facing: 'down' },
  ],
  // 訪客可以按 E 查看的物件（文字是網站自己寫的固定內容）
  objects: [
    { x: 3.5, y: 2, name: '公告板', text: ['【公告】歡迎來到第一交響樂團的公會城堡！', '城堡還在整修中，目前開放公會大廳與演奏室。'], demo: true },
    { x: 5, y: 0, name: '公會旗幟', text: ['深藍色的旗幟上繡著高音譜記號。'], demo: true },
    { x: 22, y: 0, name: '公會旗幟', text: ['深藍色的旗幟上繡著高音譜記號。'], demo: true },
  ],
  labels: [
    { x: 3.5, y: 2, text: '公告板' },
    { x: 5.5, y: 7.5, text: '討論桌' },
    { x: 21.5, y: 7.5, text: '討論桌' },
    { x: 13.5, y: 1, text: '往 2F（整修中）' },
    { x: 13.5, y: 16, text: '正門（往外庭）' },
    { x: 2, y: 3, text: '交流廳' },
    { x: 25, y: 3, text: '演奏室' },
    { x: 2.4, y: 12, text: '鍛造工坊' },
    { x: 25, y: 12, text: '練習室' },
  ],
};
