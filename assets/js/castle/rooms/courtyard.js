// 城堡外庭（戶外，大廳正門往下）。比畫面大，鏡頭跟著訪客。
// 配置參考 docs/reference/castle-layout.png 下半部：上方城堡正門、中央石板路與噴泉、下方外牆大門；
// 左側羊圈（柵欄、羊、乾草、小棚子），右側晾衣架、紡車、工作台、水井、農田、花圃（城堡花園併在這裡）。
//
// 戶外地面沿用共用字元，只換顏色與拼貼圖（groundColors、tiles）：
//   . 草地（floor）  s 石板路（stage）  r 泥土（carpet，農田的走道）  # 城牆與外牆（wall）

export default {
  id: 'courtyard',
  name: '城堡外庭',
  capacity: 10,
  map: [
    '#################OOOOOO#################', // 0  城牆；OOOOOO 正門（回大廳）
    '######W#####W##f#OOOOOO#f##W#####W######', // 1  W 窗戶  f 公會旗幟
    'H...............LssssssL............TT.H', // 2  H 樹籬  L 路燈  TT 樹
    'H................ssssss................H', // 3
    'H.FFFFFFFFFFFF....ssss....KKK...vZ.vZ..H', // 4  F 羊圈柵欄（G 直向）  KKK 晾衣架  v 小凳子  Z 紡車
    'H.GBBB.....YYG....ssss.................H', // 5  BBB 小棚子  Y 乾草
    'H.GBBB..e....G.TT.ssss.TT..............H', // 6  e 羊
    'H.G.......e..G....ssss.................H', // 7
    'H.G..e.......G....ssss....JJJ..........H', // 8  JJJ 工作台
    'H.G....e...e.G....ssss.........zzzzzzz.H', // 9  z 農作物
    'H.G..........G....ssss.........rrrrrrr.H', // 10 r 田間泥土小路
    'H.FFFFF..FFFFF.ssssssssss......zzzzzzz.H', // 11 羊圈入口在下方中間
    'H............wwssssssssssww....rrrrrrr.H', // 12 w 花圃
    'H........YY....sssQQQQsss..UU..zzzzzzz.H', // 13 QQQQ 噴泉（4×3）  UU 水井
    'HTT............sssQQQQsss..UU..........H', // 14
    'H..............sssQQQQsss..............H', // 15
    'H............wwssssssssssww............H', // 16
    'H..............ssssssssss......wwwwww..H', // 17
    'H..TT.............ssss.................H', // 18
    'H.................ssss.................H', // 19
    'H......TT.........ssss.............TT..H', // 20
    'H.................ssss.................H', // 21
    'H....P.........ww.ssss.ww.........P....H', // 22 P 旗桿
    'H.TT.......TT.....ssss.......TT.....TT.H', // 23
    'H.................ssss.................H', // 24
    'H.................ssss.................H', // 25
    '##################XXXX##################', // 26 XXXX 外牆大門（城外還沒開放）
    '##################XXXX##################', // 27
  ],
  // 戶外地面：共用字元換顏色（COLORS 的名稱，[一般, 交錯]）與拼貼圖（還沒有圖時畫色塊）
  groundColors: {
    floor: ['grass', 'grassAlt'],
    stage: ['path', 'pathAlt'],
    carpet: ['dirt', 'dirtAlt'],
  },
  tiles: { floor: 'ground_grass', stage: 'ground_path', carpet: 'ground_dirt' },
  legend: {
    f: { kind: 'wall', color: 'banner', sprite: 'banner' },
    W: { kind: 'wall', color: 'water', sprite: 'window_arch' },
    H: { kind: 'furniture', color: 'hedge', sprite: 'hedge' },
    L: { kind: 'furniture', color: 'stand', sprite: 'lamp_post', under: 'stage' },
    T: { kind: 'furniture', color: 'tree', sprite: 'tree' },
    F: { kind: 'furniture', color: 'fence', sprite: 'fence' },
    G: { kind: 'furniture', color: 'fence', sprite: 'fence_side' }, // 直向（左右兩側）的柵欄
    B: { kind: 'furniture', color: 'furniture', sprite: 'sheep_shed' },
    e: { kind: 'furniture', color: 'sheep', sprite: 'sheep' },
    Y: { kind: 'furniture', color: 'hay', sprite: 'haystack' },
    K: { kind: 'furniture', color: 'laundry', sprite: 'laundry_line' },
    v: { kind: 'seat', color: 'seat', sprite: 'stool' },
    Z: { kind: 'furniture', color: 'furniture', sprite: 'spinning_wheel' },
    J: { kind: 'furniture', color: 'furniture', sprite: 'workbench' },
    z: { kind: 'furniture', color: 'crop', sprite: 'crop', under: 'carpet' },
    w: { kind: 'furniture', color: 'flower', sprite: 'flower_bed' },
    Q: { kind: 'furniture', color: 'water', sprite: 'fountain', under: 'stage' },
    U: { kind: 'furniture', color: 'stand', sprite: 'well' },
    P: { kind: 'furniture', color: 'banner', sprite: 'banner_pole' },
  },
  doors: {
    O: { to: 'hall', spawn: 'from_courtyard', label: '大廳', sprite: 'gate_main', under: 'wall' },
    X: { locked: '城外還沒開放，先在外庭走走吧。', label: '城外', sprite: 'gate_outer', under: 'wall' },
  },
  spawns: {
    start: [19, 4],
    from_hall: [19, 3],
  },
  spots: [
    // 羊圈：站在羊旁邊剪羊毛
    { action: 'shear_sheep', x: 9, y: 6, facing: 'left' },
    { action: 'shear_sheep', x: 7, y: 8, facing: 'down' },
    { action: 'shear_sheep', x: 10, y: 9, facing: 'right' },
    // 紡車（坐在小凳子上）
    { action: 'spin_wool', x: 32, y: 4, facing: 'right' },
    { action: 'spin_wool', x: 35, y: 4, facing: 'right' },
    // 工作台
    { action: 'craft', x: 26, y: 9, facing: 'up' },
    { action: 'craft', x: 28, y: 9, facing: 'up' },
    // 水井
    { action: 'draw_water', x: 29, y: 13, facing: 'left' },
    { action: 'draw_water', x: 27, y: 15, facing: 'up' },
    // 澆花、澆菜
    { action: 'water_plants', x: 32, y: 10, facing: 'up' },
    { action: 'water_plants', x: 35, y: 12, facing: 'down' },
    { action: 'water_plants', x: 33, y: 18, facing: 'up' },
    { action: 'water_plants', x: 13, y: 13, facing: 'up' },
    // 坐在噴泉邊
    { action: 'sit_fountain', x: 17, y: 14, facing: 'left' },
    { action: 'sit_fountain', x: 22, y: 14, facing: 'right' },
    { action: 'sit_fountain', x: 19, y: 16, facing: 'down' },
    { action: 'sit_fountain', x: 20, y: 16, facing: 'down' },
  ],
  // play：訪客按 E 後，自己走到最近、沒人用的同動作演出點做這個動作（核心程式之後實作）
  objects: [
    { x: 19.5, y: 14, name: '噴泉', text: ['石砌的噴泉，中央立著一座豎琴形狀的雕像。', '水聲很好聽，常有人坐在旁邊休息。'], demo: true, play: 'sit_fountain' },
    { x: 27.5, y: 13, name: '水井', text: ['一口老水井，旁邊放著木桶。', '澆花、澆菜的水都從這裡打。'], demo: true, play: 'draw_water' },
    { x: 7, y: 7, name: '羊圈', text: ['幾隻羊在吃草，毛看起來很蓬鬆。', '剪下來的羊毛會拿去旁邊的紡車紡成毛線。'], demo: true, play: 'shear_sheep' },
    { x: 33, y: 4, name: '紡車', text: ['木頭紡車，踏板踩起來喀啦喀啦響。'], demo: true, play: 'spin_wool' },
    { x: 27, y: 8, name: '工作台', text: ['桌上散著布料、針線和還沒做完的小東西。'], demo: true },
    { x: 34, y: 11, name: '農田', text: ['一小塊菜園，種著一排一排的蔬菜。'], demo: true },
  ],
  labels: [
    { x: 19.5, y: 2.2, text: '正門（回大廳）' },
    { x: 7.5, y: 3.3, text: '羊圈' },
    { x: 27, y: 3.3, text: '晾衣架' },
    { x: 34, y: 3.3, text: '紡車' },
    { x: 27, y: 7.3, text: '工作台' },
    { x: 34, y: 8.3, text: '農田' },
    { x: 27.5, y: 12.3, text: '水井' },
    { x: 19.5, y: 12.3, text: '噴泉' },
    { x: 33.5, y: 16.3, text: '花圃' },
    { x: 19.5, y: 25.2, text: '外牆大門（城外未開放）' },
  ],
};
