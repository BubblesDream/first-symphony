// 魔法圖書館（2F 中央，候選房間）。上方一整排書架、中間公會歷史展示櫃，
// 兩側閱讀桌，中央地球儀；下方的門回 2F 客房走廊。
// 配置參考 docs/reference/castle-layout.png 右上的 2F（客房中間那一間）。
import { row } from './seats.js';

export default {
  id: 'library',
  name: '魔法圖書館',
  capacity: 4,
  map: [
    '####################', // 0  牆頂
    '#######f####f#######', // 1  牆面，f 公會旗幟
    '#SSSSSS..HH..SSSSSS#', // 2  S 書架（一座 2 格寬）  H 公會歷史展示櫃
    '#..................#', // 3
    '#..................#', // 4
    '#..TTT........TTT..#', // 5  T 閱讀桌（3 格寬）
    '#..ccc........ccc..#', // 6  c 椅子
    '#........G.........#', // 7  G 地球儀
    '#........rr........#', // 8
    '#SSSS....rr....SSSS#', // 9  下方的書架
    '#........rr........#', // 10
    '#p.......rr.......p#', // 11
    '#........rr........#', // 12
    '#########DD#########', // 13 DD 回 2F 客房
  ],
  legend: {
    f: { kind: 'wall', color: 'banner', sprite: 'banner' },
    S: { kind: 'furniture', color: 'bookshelf', sprite: 'bookshelf' },
    H: { kind: 'furniture', color: 'display', sprite: 'history_case' },
    T: { kind: 'furniture', color: 'furniture', sprite: 'table_long' },
    c: { kind: 'seat', color: 'seat', sprite: 'chair_back' },
    G: { kind: 'furniture', color: 'globe', sprite: 'globe' },
    p: { kind: 'furniture', color: 'plant', sprite: 'plant' },
  },
  doors: {
    D: { to: 'guest', spawn: 'from_library', label: '客房', sprite: 'door_double', under: 'wall' },
  },
  spawns: {
    start: [9, 12],
    from_guest: [9, 12],
  },
  objects: [
    { x: 9.5, y: 2, name: '公會歷史展示櫃', text: ['玻璃櫃裡放著公會的紀念品與照片，旁邊夾著一本年表，一頁一頁翻……'], demo: true, play: 'view_history', source: 'history', seats: [{ x: 9, y: 3, facing: 'up' }, { x: 10, y: 3, facing: 'up' }] },
    { x: 9, y: 7, name: '地球儀', text: ['畫著奇幻大陸的地球儀，有人在上面用鉛筆圈了幾個釣魚點。'], demo: true, play: 'spin_globe', seats: [{ x: 9, y: 8, facing: 'up' }] },
    { x: 3.5, y: 2, name: '書架', text: ['書架上的書依樂器分類：魯特琴、長笛、小提琴……', '最下層塞滿了沒歸位的樂譜。'], demo: true, play: 'tidy_shelf', seats: [{ x: 2, y: 3, facing: 'up' }, { x: 5, y: 3, facing: 'up' }] },
    { x: 15.5, y: 2, name: '書架', text: ['《合奏入門》、《如何在副本裡不迷路》、《羊毛的一百種用法》。'], demo: true, play: 'tidy_shelf', seats: [{ x: 14, y: 3, facing: 'up' }, { x: 17, y: 3, facing: 'up' }] },
    { x: 4, y: 5, name: '閱讀桌', text: ['桌上攤著幾本翻到一半的書，書籤夾在最精彩的地方。'], demo: true, play: 'read_book', seats: row(3, 5, 6, 'up') },
    { x: 15, y: 5, name: '閱讀桌', text: ['桌上攤著幾本翻到一半的書，書籤夾在最精彩的地方。'], demo: true, play: 'read_book', seats: row(14, 16, 6, 'up') },
    { x: 2, y: 9, name: '書架', text: ['翻完記得把書放回去。'], demo: true, play: 'tidy_shelf', seats: [{ x: 2, y: 10, facing: 'up' }] },
    { x: 17, y: 9, name: '書架', text: ['翻完記得把書放回去。'], demo: true, play: 'tidy_shelf', seats: [{ x: 17, y: 10, facing: 'up' }] },
  ],
  labels: [
    { x: 9.5, y: 3.2, text: '公會歷史' },
    { x: 9.5, y: 12.2, text: '往客房' },
  ],
};
