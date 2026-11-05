// 演奏室（1F 右上）。上半部是木頭舞台，下半部是觀眾席（中間留走道）。
// 配置參考 docs/reference/castle-layout.png。

export default {
  id: 'music',
  name: '演奏室',
  capacity: 8,
  map: [
    '######################', // 0  牆頂
    '###f#w#n#WWWW#n#w#f###', // 1  牆面，f 公會旗幟  W 舞台布幕＋徽章  n 窗戶  w 壁燈
    '#sPPPssbssbsssbssbsss#', // 2 舞台
    '#sPPPssAssAsssAssAsYs#', // 3 舞台
    '#ssBsssssbsssssbsssss#', // 4 舞台
    '#ssssssssAsssssAsssss#', // 5 舞台
    '#sssssssssssDssssssss#', // 6  D 指揮台
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
    H: { to: 'hall', spawn: 'from_music', label: '大廳', sprite: 'door_side_open' },
  },
  spawns: {
    start: [1, 8],
    from_hall: [1, 8],
  },
  spots: [
    { action: 'play_piano', x: 3, y: 4, facing: 'up' },
    ...[[7, 2], [10, 2], [14, 2], [17, 2], [9, 4], [15, 4]].map(([x, y]) => ({ action: 'play_part', x, y, facing: 'down' })),
    { action: 'play_harp', x: 19, y: 4, facing: 'up' },
    { action: 'conduct', x: 12, y: 6, facing: 'up' },
    ...[3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18].flatMap((x) => [8, 10, 12].map((y) => (
      { action: 'sit_watch', x, y, facing: 'up' }
    ))),
  ],
  // 自動合奏只用六個聲部座位與指揮台，維持無聲；訪客召集時會取消。
  ensemble: { conductor: [12, 6], parts: [[7, 2], [10, 2], [14, 2], [17, 2], [9, 4], [15, 4]], entrance: 'from_hall' },
  groups: [
    { name: '合奏', spots: [[7, 2], [10, 2], [14, 2], [17, 2], [9, 4], [15, 4], [12, 6]], min: 2, every: [25, 50], duration: [18, 28],
      bubbles: ['預備——', '♪', '♫', '♬', '♪♫', '♬♪'], finale: '（掌聲）' },
  ],
  objects: [
    // play：訪客按 E 看完文字後，會走過去自己演出（動作見 actions.js）
    { x: 3, y: 2.5, name: '鋼琴', text: ['一架擦得發亮的鋼琴。要坐下來彈一曲嗎？'], demo: false, play: 'play_piano' },
    { x: 12, y: 5, name: '指揮台', text: ['站上指揮台，就會召集大家來合奏！'], demo: false, play: 'conduct' },
    ...[[7, 2], [10, 2], [14, 2], [17, 2], [9, 4], [15, 4]].map(([x, y]) => ({ x, y, name: '合奏座位', text: ['坐下來就會召集大家一起合奏'], demo: false, play: 'play_part' })),
    { x: 3, y: 1, name: '公會旗幟', text: ['深藍色的旗幟上繡著高音譜記號。'], demo: true },
    { x: 19, y: 3, name: '豎琴', text: ['一架木製豎琴，琴弦調得很準。'], demo: false, play: 'play_harp' },
  ],
  labels: [
    { x: 3, y: 2.5, text: '鋼琴' },
    { x: 1.6, y: 7.2, text: '往大廳' },
    { x: 10.5, y: 13.2, text: '觀眾席' },
  ],
};
