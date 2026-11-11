// 戰鬥練習室（1F 右下）。上方是武器架，中間一排稻草人，右邊用繩子圍出射箭區，左下是休息長椅。
// 配置參考 docs/reference/castle-layout.png。家具還沒有圖時自動畫色塊。
import { row } from './seats.js';

export default {
  id: 'training',
  name: '戰鬥練習室',
  capacity: 5,
  map: [
    '######################', // 0  牆頂
    '###f##############f###', // 1  牆面，f 公會旗幟
    '#p...AA.....AA......p#', // 2  A 武器架
    '#....................#', // 3
    '#...Y...Y...Y........#', // 4  Y 稻草人
    '#....................#', // 5
    '#....................#', // 6
    'H....................#', // 7  H 回大廳
    '#..............ggggg.#', // 8  g 繩子圍欄（射箭區）
    '#...................O#', // 9  O 箭靶
    '#....................#', // 10
    '#...................O#', // 11
    '#.nnnn.........ggggg.#', // 12 n 休息長椅
    '######################', // 13
  ],
  legend: {
    f: { kind: 'wall', color: 'banner', sprite: 'banner' },
    A: { kind: 'furniture', color: 'iron', sprite: 'weapon_rack' },
    Y: { kind: 'furniture', color: 'straw', sprite: 'training_dummy' },
    O: { kind: 'furniture', color: 'target', sprite: 'archery_target' },
    g: { kind: 'furniture', color: 'rope', sprite: 'rope_fence' },
    n: { kind: 'seat', color: 'seat', sprite: 'bench' },
    p: { kind: 'furniture', color: 'plant', sprite: 'plant' },
  },
  doors: {
    H: { to: 'hall', spawn: 'from_training', label: '大廳', sprite: 'door_side_open' },
  },
  spawns: {
    start: [1, 7],
    from_hall: [1, 7],
  },
  objects: [
    { x: 8, y: 4, name: '稻草人', text: ['被打得有點歪的稻草人，肚子上補了好幾塊布。'], demo: true, play: 'hit_dummy', seats: [{ x: 8, y: 5, facing: 'up', target: [8, 4] }] },
    { x: 20, y: 9, name: '箭靶', text: ['靶心附近插滿了箭孔。'], demo: true, play: 'shoot_arrow', seats: [{ x: 14, y: 9, facing: 'right', target: [20, 9] }] },
    { x: 5.5, y: 2, name: '武器架', text: ['木劍、木盾和練習用的弓，都是給大家練習用的。'], demo: true, play: 'pick_weapon', seats: [{ x: 5, y: 3, facing: 'up' }] },
    { x: 4, y: 4, name: '稻草人', text: ['來練練手感吧。'], demo: true, play: 'hit_dummy', seats: [{ x: 4, y: 5, facing: 'up', target: [4, 4] }] },
    { x: 12, y: 4, name: '稻草人', text: ['來練練手感吧。'], demo: true, play: 'hit_dummy', seats: [{ x: 12, y: 5, facing: 'up', target: [12, 4] }] },
    { x: 20, y: 11, name: '箭靶', text: ['瞄準，再放箭。'], demo: true, play: 'shoot_arrow', seats: [{ x: 14, y: 11, facing: 'right', target: [20, 11] }] },
    { x: 13.5, y: 2, name: '武器架', text: ['另一個武器架，練習用的長槍和木盾靠在一起。'], demo: true, play: 'pick_weapon', seats: [{ x: 13, y: 3, facing: 'up' }] },
    { x: 3.5, y: 12, name: '休息長椅', text: ['練累了就坐下來喝口水。'], demo: true, play: 'sit_rest', seats: row(2, 5, 12, 'up') },
  ],
  labels: [
    { x: 1.6, y: 6.2, text: '往大廳' },
    { x: 17, y: 10, text: '射箭區' },
    { x: 8, y: 6.2, text: '稻草人' },
  ],
};
