// 演奏室（1F 右上）。上半部是舞台，下半部是觀眾席。

export default {
  id: 'music',
  name: '演奏室',
  capacity: 8,
  map: [
    '####f#########f#######', // 0
    '#ssssssssssssssssssss#', // 1  舞台
    '#sPPPsssbsssbsssbssss#', // 2  PPP 鋼琴  b 樂手椅
    '#ssbssssAsssAsssAssss#', // 3  b 琴椅  A 譜架
    '#ssssssssssssssssssss#', // 4
    '#ssssssssssssssssssss#', // 5  指揮站在 (10,5)
    '#....................#', // 6
    'H....................#', // 7  H 回大廳
    '#..hhhh..hhhh..hhhh..#', // 8  觀眾席
    '#....................#', // 9
    '#..hhhh..hhhh..hhhh..#', // 10
    '#....................#', // 11
    '#p..................p#', // 12
    '######################', // 13
  ],
  legend: {
    f: { kind: 'wall', color: 'banner' },
    P: { kind: 'furniture', color: 'piano' },
    A: { kind: 'furniture', color: 'stand' },
    b: { kind: 'seat', color: 'seat' },
    h: { kind: 'seat', color: 'seat' },
    p: { kind: 'furniture', color: 'plant' },
  },
  doors: {
    H: { to: 'hall', spawn: 'from_music', label: '大廳' },
  },
  spawns: {
    start: [1, 7],
    from_hall: [1, 7],
  },
  spots: [
    { action: 'play_piano', x: 3, y: 3, facing: 'up' },
    { action: 'play_violin', x: 8, y: 2, facing: 'down' },
    { action: 'play_flute', x: 12, y: 2, facing: 'down' },
    { action: 'play_harp', x: 16, y: 2, facing: 'down' },
    { action: 'conduct', x: 10, y: 5, facing: 'up' },
    ...[3, 4, 5, 6, 9, 10, 11, 12, 15, 16, 17, 18].flatMap((x) => [
      { action: 'sit_watch', x, y: 8, facing: 'up' },
      { action: 'sit_watch', x, y: 10, facing: 'up' },
    ]),
  ],
  objects: [
    { x: 3, y: 2, name: '鋼琴', text: ['一架擦得發亮的鋼琴。', '（第一版還沒有聲音，之後會加入。）'], demo: false },
    { x: 4, y: 0, name: '公會旗幟', text: ['深藍色的旗幟上繡著高音譜記號。'], demo: true },
  ],
  labels: [
    { x: 3, y: 2, text: '鋼琴' },
    { x: 12, y: 1, text: '舞台' },
    { x: 1.6, y: 6.4, text: '往大廳' },
    { x: 10.5, y: 11, text: '觀眾席' },
  ],
};
