// 觀星台（3F 塔樓，候選房間）。上方大片星空窗與望遠鏡，左邊星圖桌，
// 兩側窗邊長椅，右邊有占卜桌；下方樓梯回 2F 客房。
// 星空大窗上會畫出今天的真實月亮（sky），望遠鏡可以看月相（show: 'moon'），占卜桌可以抽塔羅牌（show: 'tarot'）。
// 配置參考 docs/reference/castle-layout.png 右下的 3F。

export default {
  id: 'observatory',
  name: '觀星台',
  capacity: 3,
  map: [
    '##################', // 0  牆頂
    '##ww###XXXX###ww##', // 1  牆面：w 窗戶  XXXX 星空大窗
    '#.bb....TT....bb.#', // 2  b 窗邊長椅  TT 望遠鏡（2×2）
    '#.......TT.......#', // 3
    '#................#', // 4
    '#................#', // 5
    '#..MM.......YY.Z.#', // 6  MM 星圖桌  YY 占卜桌  Z 天球儀
    '#..cc.......c....#', // 7  c 圓凳
    '#......rrrr......#', // 8
    '#p.....rrrr.....p#', // 9
    '#######VVVV#######', // 10 VVVV 往 2F 的樓梯
    '#######VVVV#######', // 11
  ],
  legend: {
    w: { kind: 'wall', color: 'windowGlass', sprite: 'window_arch' },
    X: { kind: 'wall', color: 'starWindow', sprite: 'window_stars' },
    b: { kind: 'seat', color: 'seat', sprite: 'bench' },
    T: { kind: 'furniture', color: 'telescope', sprite: 'telescope' },
    M: { kind: 'furniture', color: 'starMap', sprite: 'star_table' },
    c: { kind: 'seat', color: 'seat', sprite: 'stool' },
    Z: { kind: 'furniture', color: 'telescope', sprite: 'armillary' },
    Y: { kind: 'furniture', color: 'tarotTable', sprite: 'tarot_table' },
    p: { kind: 'furniture', color: 'plant', sprite: 'plant' },
  },
  sky: 'X', // 在星空大窗畫今天的月亮
  doors: {
    V: { to: 'guest', spawn: 'from_observatory', label: '往 2F', sprite: 'stairs_down', under: 'wall' },
  },
  spawns: {
    start: [8, 9],
    from_guest: [8, 9],
  },
  spots: [
    { action: 'look_telescope', x: 9, y: 4, facing: 'up' },
    { action: 'read_starmap', x: 3, y: 7, facing: 'up' },
    { action: 'read_starmap', x: 4, y: 7, facing: 'up' },
    { action: 'read_tarot', x: 12, y: 7, facing: 'up' },
    { action: 'stargaze', x: 2, y: 2, facing: 'up' },
    { action: 'stargaze', x: 3, y: 2, facing: 'up' },
    { action: 'stargaze', x: 14, y: 2, facing: 'up' },
    { action: 'stargaze', x: 15, y: 2, facing: 'up' },
  ],
  objects: [
    { x: 8.5, y: 3, name: '望遠鏡', text: ['黃銅望遠鏡對著天空。', '鏡筒上貼著一張紙：「看完記得蓋鏡頭蓋。」'], demo: true, play: 'look_telescope', show: 'moon' },
    { x: 3.5, y: 6, name: '星圖', text: ['攤開的星圖上，有人把幾顆星連成了高音譜記號的形狀。'], demo: true, play: 'read_starmap' },
    { x: 12.5, y: 6, name: '占卜桌', text: ['深藍色的桌巾上放著一副塔羅牌。', '旁邊的小卡片寫著：「一天一張，心情好就好。」'], demo: true, play: 'read_tarot', show: 'tarot' },
    { x: 15, y: 6, name: '天球儀', text: ['一圈一圈的金屬環，輕輕一碰就慢慢轉起來。'], demo: true },
    { x: 2.5, y: 2, name: '窗邊長椅', text: ['坐在這裡抬頭，就能從小窗看到星星。'], demo: true, play: 'stargaze' },
    { x: 8.5, y: 1, name: '星空大窗', text: ['窗外是滿天星斗，今晚很適合許願。', '窗角的月亮，和現實世界今天的月相一樣。'], demo: true },
  ],
  labels: [
    { x: 8.5, y: 9.2, text: '往 2F' },
  ],
};
