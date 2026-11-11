// 公會客房（2F，成員房間區）。中間是走廊，左右兩間木地板臥房各 3 張床。
// 配置參考 docs/reference/castle-layout.png 右上的 2F：中央往上是圖書館，左右是客房。
// 下方樓梯回 1F 大廳；上方中央的門通往魔法圖書館；右上的樓梯往 3F 觀星台。

export default {
  id: 'guest',
  name: '公會客房',
  capacity: 6,
  map: [
    '##############UUUU########', // 0  牆頂；UUUU 往 3F 的樓梯
    '###w#w##f###DDUUUU##w#w###', // 1  牆面：w 窗戶  f 公會旗幟  DD 往圖書館的門
    '#WWsKKs#p..rrrr..p#sKKsWW#', // 2  W 衣櫃  K 書桌  p 盆栽
    '#sssCss#...rrrr...#ssCsss#', // 3  C 書桌椅
    '#nsssss#L..rrrr..L#sssssn#', // 4  n 床頭櫃  L 燭台
    '#BBssss#...rrrr...#ssssQQ#', // 5  B 床（床頭在左）  Q 床（床頭在右）
    '#ssssss#...rrrr...#ssssss#', // 6
    '#nsssss....rrrr....sssssn#', // 7  左右臥房的入口
    '#BBssss....rrrr....ssssQQ#', // 8
    '#ssssss#...rrrr...#ssssss#', // 9
    '#nsssss#...rrrr...#sssssn#', // 10
    '#BBssss#L..rrrr..L#ssssQQ#', // 11
    '#ssssss#...rrrr...#ssssss#', // 12
    '#psssss#...rrrr...#sssssp#', // 13
    '###########VVVV###########', // 14 VVVV 往 1F 大廳的樓梯
    '###########VVVV###########', // 15
  ],
  legend: {
    w: { kind: 'wall', color: 'windowGlass', sprite: 'window_arch' },
    f: { kind: 'wall', color: 'banner', sprite: 'banner' },
    W: { kind: 'furniture', color: 'wardrobe', sprite: 'wardrobe', under: 'stage' },
    K: { kind: 'furniture', color: 'furniture', sprite: 'desk', under: 'stage' },
    C: { kind: 'seat', color: 'seat', sprite: 'chair_back', under: 'stage' },
    n: { kind: 'furniture', color: 'furniture', sprite: 'nightstand', under: 'stage' },
    B: { kind: 'seat', color: 'bed', sprite: 'bed', under: 'stage' },
    Q: { kind: 'seat', color: 'bed', sprite: 'bed', flipX: true, under: 'stage' },
    L: { kind: 'furniture', color: 'stand', sprite: 'candle_stand' },
    p: { kind: 'furniture', color: 'plant', sprite: 'plant' },
  },
  doors: {
    V: { to: 'hall', spawn: 'from_guest', label: '往 1F', sprite: 'stairs_down', under: 'wall' },
    D: { to: 'library', spawn: 'from_guest', label: '圖書館', sprite: 'door_double', under: 'wall' },
    U: { to: 'observatory', spawn: 'from_guest', label: '往 3F', sprite: 'stairs_up', under: 'wall' },
  },
  spawns: {
    start: [12, 12],
    from_hall: [12, 13],
    from_library: [12, 2],
    from_observatory: [15, 2],
  },
  // 床是「椅子」類（只有要躺／坐的 NPC 會走上去）；演出點放在靠走道那一格
  objects: [
    { x: 1.5, y: 2, name: '衣櫃', text: ['木頭衣櫃裡掛著幾件演出服，還有一頂被壓扁的帽子。'], demo: true },
    { x: 1.5, y: 5, name: '客房的床', text: ['被子摺得整整齊齊，枕頭旁放著一張寫了「勿吵」的小紙條。'], demo: true, play: 'sleep_bed', seats: [{ x: 2, y: 5, facing: 'down' }] },
    { x: 4.5, y: 2, name: '書桌', text: ['桌上攤著一本冒險日誌，最後一頁寫著：「明天也要一起上線。」'], demo: true, play: 'write_desk', seats: [{ x: 4, y: 3, facing: 'up' }] },
    { x: 23.5, y: 2, name: '衣櫃', text: ['衣櫃門關不太緊，露出一角深藍色的披風。'], demo: true },
    { x: 8, y: 1, name: '公會旗幟', text: ['深藍色的旗幟上繡著高音譜記號。'], demo: true },
    { x: 1.5, y: 8, name: '客房的床', text: ['坐在床邊歇一下吧。'], demo: true, play: 'sit_bed', seats: [{ x: 2, y: 8, facing: 'right' }] },
    { x: 1.5, y: 11, name: '客房的床', text: ['躺一下，休息再出發。'], demo: true, play: 'sleep_bed', seats: [{ x: 2, y: 11, facing: 'down' }] },
    { x: 23.5, y: 5, name: '客房的床', text: ['坐在床邊歇一下吧。'], demo: true, play: 'sit_bed', seats: [{ x: 23, y: 5, facing: 'left' }] },
    { x: 23.5, y: 8, name: '客房的床', text: ['躺一下，休息再出發。'], demo: true, play: 'sleep_bed', seats: [{ x: 23, y: 8, facing: 'down' }] },
    { x: 23.5, y: 11, name: '客房的床', text: ['坐在床邊歇一下吧。'], demo: true, play: 'sit_bed', seats: [{ x: 23, y: 11, facing: 'left' }] },
    { x: 21.5, y: 2, name: '書桌', text: ['坐下來寫幾句話。'], demo: true, play: 'write_desk', seats: [{ x: 21, y: 3, facing: 'up' }] },
    { x: 3, y: 1, name: '客房窗戶', text: ['望向窗外，放空一下。'], demo: true, play: 'look_window', seats: [{ x: 3, y: 2, facing: 'up' }] },
    { x: 22, y: 1, name: '客房窗戶', text: ['望向窗外，放空一下。'], demo: true, play: 'look_window', seats: [{ x: 22, y: 2, facing: 'up' }] },
  ],
  labels: [
    { x: 12.5, y: 2.2, text: '圖書館' },
    { x: 15.5, y: 2.2, text: '往 3F' },
    { x: 12.5, y: 13.2, text: '往 1F 大廳' },
    { x: 3.5, y: 12.6, text: '客房' },
    { x: 21.5, y: 12.6, text: '客房' },
  ],
};
