// 鍛造工坊（1F 左下）。左上是火爐與水桶，旁邊是鐵砧，上方工作台，中間有磨刀石，右下是煤堆。
// 配置參考 docs/reference/castle-layout.png。家具還沒有圖時自動畫色塊。

export default {
  id: 'forge',
  name: '鍛造工坊',
  capacity: 3,
  map: [
    '##################', // 0  牆頂
    '###TT#######f#####', // 1  牆面：T 工具掛架  f 公會旗幟
    '#UU.B......WWW.XX#', // 2  U 火爐（2×2）  B 水桶  W 工作台  X 礦石木箱
    '#UU..............#', // 3
    '#....V...........#', // 4  V 鐵砧
    '#................H', // 5  H 回大廳
    '#.........G......#', // 6  G 磨刀石
    '#................#', // 7
    '#............CC..#', // 8  C 煤堆
    '#................#', // 9
    '#p..............p#', // 10
    '##################', // 11
  ],
  legend: {
    T: { kind: 'wall', color: 'iron', sprite: 'tool_rack' },
    f: { kind: 'wall', color: 'banner', sprite: 'banner' },
    U: { kind: 'furniture', color: 'fire', sprite: 'forge_furnace' },
    B: { kind: 'furniture', color: 'water', sprite: 'water_bucket' },
    W: { kind: 'furniture', color: 'furniture', sprite: 'workbench' },
    X: { kind: 'furniture', color: 'barrel', sprite: 'ore_crate' },
    V: { kind: 'furniture', color: 'iron', sprite: 'anvil' },
    G: { kind: 'furniture', color: 'stand', sprite: 'grindstone' },
    C: { kind: 'furniture', color: 'coal', sprite: 'coal_pile' },
    p: { kind: 'furniture', color: 'plant', sprite: 'plant' },
  },
  doors: {
    H: { to: 'hall', spawn: 'from_forge', label: '大廳', sprite: 'door_side_open', flipX: true },
  },
  spawns: {
    start: [16, 5],
    from_hall: [16, 5],
  },
  objects: [
    { x: 1.5, y: 3, name: '火爐', text: ['爐火燒得正旺，靠近就覺得臉頰發燙。'], demo: true, play: 'stoke_fire', seats: [{ x: 3, y: 3, facing: 'left' }] },
    { x: 5, y: 4, name: '鐵砧', text: ['你把材料放上鐵砧，拿起鐵鎚……', '叮、叮、噹！'], source: 'forge', demo: false, play: 'hammer', seats: [{ x: 5, y: 5, facing: 'up' }, { x: 6, y: 4, facing: 'left' }] },
    { x: 12, y: 2, name: '工作台', text: ['桌上散著鉗子、銼刀和還沒完成的劍柄。'], demo: true, play: 'craft', seats: [{ x: 12, y: 3, facing: 'up' }] },
    { x: 10, y: 6, name: '磨刀石', text: ['踩著踏板就會轉的磨刀石。'], demo: true, play: 'sharpen', seats: [{ x: 11, y: 6, facing: 'left' }] },
    { x: 4, y: 2, name: '水桶', text: ['淬火用的水，表面浮著一層薄薄的灰。'], demo: true },
  ],
  labels: [
    { x: 15.4, y: 4.2, text: '往大廳' },
    { x: 1.5, y: 4.2, text: '火爐' },
    { x: 5, y: 3.4, text: '鐵砧' },
  ],
};
