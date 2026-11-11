// 演奏室（1F 右上）。上半部是木頭舞台，下半部是觀眾席（中間留走道）。
// 配置參考 docs/reference/castle-layout.png。
import { row } from './seats.js';

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
  ensemble: { conductor: [12, 6], parts: [[7, 2], [10, 2], [14, 2], [17, 2], [9, 4], [15, 4]], entrance: 'from_hall' },
  groups: [
    { name: '合奏', spots: [[7, 2], [10, 2], [14, 2], [17, 2], [9, 4], [15, 4], [12, 6]], min: 2, every: [25, 50], duration: [18, 28], bubbles: ['預備——', '♪', '♫', '♬', '♪♫', '♬♪'], finale: '（掌聲）' },
  ],
  objects: [
    { x: 3, y: 2.5, name: '鋼琴', text: ['一架擦得發亮的鋼琴。要坐下來彈一曲嗎？'], demo: false, play: 'play_piano', seats: [{ x: 3, y: 4, facing: 'up' }] },
    { x: 12, y: 5, name: '指揮台', text: ['站上指揮台，就會召集大家來合奏！'], demo: false, play: 'conduct', seats: [{ x: 12, y: 6, facing: 'up' }] },
    { x: 7, y: 2, name: '合奏座位', text: ['坐下來就會召集大家一起合奏'], demo: false, play: 'play_part', seats: [{ x: 7, y: 2, facing: 'down' }] },
    { x: 10, y: 2, name: '合奏座位', text: ['坐下來就會召集大家一起合奏'], demo: false, play: 'play_part', seats: [{ x: 10, y: 2, facing: 'down' }] },
    { x: 14, y: 2, name: '合奏座位', text: ['坐下來就會召集大家一起合奏'], demo: false, play: 'play_part', seats: [{ x: 14, y: 2, facing: 'down' }] },
    { x: 17, y: 2, name: '合奏座位', text: ['坐下來就會召集大家一起合奏'], demo: false, play: 'play_part', seats: [{ x: 17, y: 2, facing: 'down' }] },
    { x: 9, y: 4, name: '合奏座位', text: ['坐下來就會召集大家一起合奏'], demo: false, play: 'play_part', seats: [{ x: 9, y: 4, facing: 'down' }] },
    { x: 15, y: 4, name: '合奏座位', text: ['坐下來就會召集大家一起合奏'], demo: false, play: 'play_part', seats: [{ x: 15, y: 4, facing: 'down' }] },
    { x: 18, y: 1, name: '公會旗幟', text: ['深藍色的旗幟上繡著高音譜記號。'], demo: true },
    { x: 19, y: 3, name: '豎琴', text: ['一架木製豎琴，琴弦調得很準。'], demo: false, play: 'play_harp', seats: [{ x: 19, y: 4, facing: 'up' }] },
    { x: 6, y: 8, name: '觀眾席', text: ['找個位子坐下，聽聽台上的演奏。'], demo: true, play: 'sit_watch', seats: row(3, 9, 8, 'up') },
    { x: 15, y: 8, name: '觀眾席', text: ['找個位子坐下，聽聽台上的演奏。'], demo: true, play: 'sit_watch', seats: row(12, 18, 8, 'up') },
    { x: 6, y: 10, name: '觀眾席', text: ['找個位子坐下，聽聽台上的演奏。'], demo: true, play: 'sit_watch', seats: row(3, 9, 10, 'up') },
    { x: 15, y: 10, name: '觀眾席', text: ['找個位子坐下，聽聽台上的演奏。'], demo: true, play: 'sit_watch', seats: row(12, 18, 10, 'up') },
    { x: 6, y: 12, name: '觀眾席', text: ['找個位子坐下，聽聽台上的演奏。'], demo: true, play: 'sit_watch', seats: row(3, 9, 12, 'up') },
    { x: 15, y: 12, name: '觀眾席', text: ['找個位子坐下，聽聽台上的演奏。'], demo: true, play: 'sit_watch', seats: row(12, 18, 12, 'up') },
  ],
  labels: [
    { x: 3, y: 2.5, text: '鋼琴' },
    { x: 1.6, y: 7.2, text: '往大廳' },
    { x: 10.5, y: 13.2, text: '觀眾席' },
  ],
};
