// 演奏室（1F 右上）。上半部是木頭舞台，下半部是觀眾席（中間留走道）。
// 配置參考 docs/reference/castle-layout.png。

export default {
  id: 'music',
  name: '演奏室',
  capacity: 8,
  map: [
    '######################', // 0  牆頂
    '###f#w#n#WWWW#n#w#f###', // 1  牆面，f 公會旗幟  W 舞台布幕＋徽章  n 窗戶  w 壁燈
    '#CPPPsssssssssssssssC#', // 2  舞台；PPP 鋼琴（3×2）  C 燭台
    '#sPPPsbsssbsssbssbYss#', // 3  b 樂手椅（6、10、14 拉琴吹笛，17 彈豎琴）  Y 豎琴
    '#ssBssAsssAsssAssssss#', // 4  B 琴椅  A 譜架（在樂手前面）
    '#ssssssssssssssssssss#', // 5
    '#sssssssssDssssssssss#', // 6  D 指揮台（對齊中間走道）
    '#....................#', // 7
    'H..ccccccc..ccccccc..#', // 8  H 回大廳；c 觀眾席座椅（中間是走道）
    '#....................#', // 9
    '#..ccccccc..ccccccc..#', // 10
    '#L..................L#', // 11 L 燭台
    '#..ccccccc..ccccccc..#', // 12
    '#p..................p#', // 13
    '######################', // 14
  ],
  // under：家具底下鋪什麼（舞台上的家具鋪木地板）
  legend: {
    f: { kind: 'wall', color: 'banner', sprite: 'banner' },
    W: { kind: 'wall', color: 'carpet', sprite: 'curtain_stage', behind: 'wall_emblem' },
    n: { kind: 'wall', color: 'wallTop', sprite: 'window_arch' },
    w: { kind: 'wall', color: 'notice', sprite: 'wall_lamp' },
    P: { kind: 'furniture', color: 'piano', sprite: 'piano', under: 'stage' },
    B: { kind: 'seat', color: 'seat', sprite: 'piano_bench', under: 'stage' },
    A: { kind: 'furniture', color: 'stand', sprite: 'music_stand', under: 'stage' },
    b: { kind: 'seat', color: 'seat', sprite: 'stool', under: 'stage' },
    D: { kind: 'seat', color: 'notice', sprite: 'podium', under: 'stage' },
    Y: { kind: 'furniture', color: 'notice', sprite: 'harp', under: 'stage' },
    C: { kind: 'furniture', color: 'stand', sprite: 'candle_stand', under: 'stage' },
    L: { kind: 'furniture', color: 'stand', sprite: 'candle_stand' },
    c: { kind: 'seat', color: 'seat', sprite: 'chair_back' },
    p: { kind: 'furniture', color: 'plant', sprite: 'plant' },
  },
  doors: {
    H: { to: 'hall', spawn: 'from_music', label: '大廳' },
  },
  spawns: {
    start: [1, 8],
    from_hall: [1, 8],
  },
  spots: [
    { action: 'play_piano', x: 3, y: 4, facing: 'up' },
    { action: 'play_violin', x: 6, y: 3, facing: 'down' },
    { action: 'play_flute', x: 10, y: 3, facing: 'down' },
    { action: 'play_violin', x: 14, y: 3, facing: 'down' },
    { action: 'play_harp', x: 17, y: 3, facing: 'right' }, // 坐在豎琴左邊
    { action: 'conduct', x: 10, y: 6, facing: 'up' },
    ...[3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18].flatMap((x) => [8, 10, 12].map((y) => (
      { action: 'sit_watch', x, y, facing: 'up' }
    ))),
  ],
  objects: [
    // play：訪客按 E 看完文字後，會走過去自己演出（動作見 actions.js）
    { x: 3, y: 2.5, name: '鋼琴', text: ['一架擦得發亮的鋼琴。要坐下來彈一曲嗎？'], demo: false, play: 'play_piano' },
    { x: 10, y: 5, name: '指揮台', text: ['站上指揮台，帶大家合奏吧！'], demo: false, play: 'conduct' },
    { x: 6, y: 3.5, name: '譜架', text: ['譜架上放著公會歌的樂譜。拿起小提琴試試看？'], demo: false, play: 'play_violin' },
    { x: 10, y: 3.5, name: '譜架', text: ['這份樂譜寫的是長笛的旋律。要吹吹看嗎？'], demo: false, play: 'play_flute' },
    { x: 14, y: 3.5, name: '譜架', text: ['第二小提琴的分譜，旁邊有人用鉛筆畫了記號。'], demo: false, play: 'play_violin' },
    { x: 18, y: 3, name: '豎琴', text: ['一架木製豎琴，琴弦調得很準。'], demo: false, play: 'play_harp' },
    { x: 10.5, y: 1, name: '舞台布幕', text: ['紅色布幕中間掛著公會的徽章。'], demo: false },
    { x: 3, y: 1, name: '公會旗幟', text: ['深藍色的旗幟上繡著高音譜記號。'], demo: true },
    { x: 18, y: 1, name: '公會旗幟', text: ['深藍色的旗幟上繡著高音譜記號。'], demo: true },
    // 觀眾席：靠走道的兩側各一個查看點，看完會找空位坐下
    { x: 9, y: 8, name: '觀眾席', text: ['找個位子坐下來，聽大家演奏吧。'], demo: false, play: 'sit_watch' },
    { x: 12, y: 10, name: '觀眾席', text: ['找個位子坐下來，聽大家演奏吧。'], demo: false, play: 'sit_watch' },
  ],
  labels: [
    { x: 1.4, y: 9.2, text: '往大廳' }, // 寫在門下方，不擋住出生點的訪客
    { x: 10.5, y: 13.2, text: '觀眾席' },
  ],
};
