// 像素小人的部件圖樣（紙娃娃）。一個部件＝三個方向（down 正面、up 背面、side 朝右；朝左由程式左右翻轉）。
// 每張圖樣寬 16 格，y 是第一列在 16×24 畫布上的位置。字元代表「用哪個顏色」，由程式換成每個人的顏色：
//   s 膚色  h 髮色  t 上衣  b 下身  f 鞋子  a 配件  m 金屬（輕鎧甲）  w 白（領口）  e 眼睛（深色）
//   大寫＝同一個顏色的陰影（程式自動調暗）  . 透明
// 外框（深色描邊）由程式自動加，圖樣不用畫。
// 新增款式：在對應的表加一項（三個方向都要有），再到 roster.js 的中文對照加一行。

export const W = 16;
export const H = 24;

// 身體（頭、手、腿）。眼睛在第 6、7 列。
export const BODY = {
  y: 2,
  down: [
    '....ssssssss....',
    '...ssssssssss...',
    '...ssssssssss...',
    '...ssssssssss...',
    '...ssessssess...',
    '...ssessssess...',
    '...ssssssssss...',
    '....ssssssss....',
    '.....SSSSSS.....',
    '......ssss......',
    '...ssssssssss...',
    '...ssssssssss...',
    '...ssssssssss...',
    '...s.ssssss.s...',
    '...s.ssssss.s...',
    '.....ssssss.....',
    '.....ss..ss.....',
    '.....ss..ss.....',
    '.....ss..ss.....',
    '.....ss..ss.....',
    '.....SS..SS.....',
    '.....ss..ss.....',
  ],
  up: [
    '....ssssssss....',
    '...ssssssssss...',
    '...ssssssssss...',
    '...ssssssssss...',
    '...ssssssssss...',
    '...ssssssssss...',
    '...ssssssssss...',
    '....ssssssss....',
    '.....SSSSSS.....',
    '......ssss......',
    '...ssssssssss...',
    '...ssssssssss...',
    '...ssssssssss...',
    '...s.ssssss.s...',
    '...s.ssssss.s...',
    '.....ssssss.....',
    '.....ss..ss.....',
    '.....ss..ss.....',
    '.....ss..ss.....',
    '.....ss..ss.....',
    '.....SS..SS.....',
    '.....ss..ss.....',
  ],
  side: [
    '.....sssssss....',
    '....sssssssss...',
    '....sssssssss...',
    '....sssssssss...',
    '....ssssssess...',
    '....ssssssess...',
    '....sssssssss...',
    '.....ssssssss...',
    '......SSSSSS....',
    '......ssss......',
    '.....ssssss.....',
    '.....ssssss.....',
    '.....ssssss.....',
    '.....ssssss.....',
    '.....ssssss.....',
    '.....ssssss.....',
    '......ss..ss....',
    '......ss..ss....',
    '......ss..ss....',
    '......ss..ss....',
    '......SS..SS....',
    '......ss..ss....',
  ],
};

// 髮型（畫在最上層，可以蓋住臉的兩側）
const SHORT = {
  y: 1,
  down: [
    '.....hhhhhh.....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '..hHhhhhhhhhHh..',
    '..hh........hh..',
    '..hh........hh..',
    '..H..........H..',
  ],
  up: [
    '.....hhhhhh.....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '...hhhhhhhhhh...',
    '....HHHHHHHH....',
  ],
  side: [
    '......hhhhhh....',
    '....hhhhhhhhh...',
    '...hhhhhhhhhhh..',
    '...hhhhhhhhhhh..',
    '...hhhhhhhhhhH..',
    '...hhhhh........',
    '...hhhh.........',
    '...hhh..........',
    '....H...........',
  ],
};

/**
 * 在某個髮型上再疊幾列（例如長髮多出來的部分）。
 * extra：{ down: [[y, 列], ...], up, side }；要往上多畫（包包頭）時給 y 與 downTop／upTop／sideTop。
 */
function extend(base, extra) {
  const y0 = Math.min(base.y, extra.y ?? base.y);
  const out = { y: y0 };
  for (const dir of ['down', 'up', 'side']) {
    const top = [...(extra[`${dir}Top`] || [])];
    while (top.length < base.y - y0) top.push(BLANK);
    const list = [...top, ...base[dir]];
    for (const [y, row] of extra[dir] || []) {
      const i = y - y0;
      while (list.length <= i) list.push(BLANK);
      list[i] = merge(list[i], row);
    }
    out[dir] = list;
  }
  return out;
}

const BLANK = '................';

/** 兩列疊在一起：後面那列不是 . 的地方蓋過去 */
function merge(a, b) {
  let s = '';
  for (let i = 0; i < 16; i++) s += b[i] && b[i] !== '.' ? b[i] : a[i];
  return s;
}

const rows = (from, to, row) => Array.from({ length: to - from + 1 }, (_, i) => [from + i, row]);

export const HAIR = {
  short: SHORT,
  medium: extend(SHORT, {
    down: [...rows(9, 10, '..hh........hh..'), [11, '..HH........HH..']],
    up: [...rows(10, 11, '...hhhhhhhhhh...'), [12, '...HHHHHHHHHH...']],
    side: [[8, '...hhh..........'], [9, '...hhh..........'], [10, '...hHH..........']],
  }),
  long: extend(SHORT, {
    down: [...rows(9, 14, '..hh........hh..'), [15, '..HH........HH..']],
    up: [...rows(10, 15, '...hhhhhhhhhh...'), [16, '...HHHHHHHHHH...']],
    side: [...rows(8, 13, '...hhhh.........'), [14, '...HHHH.........']],
  }),
  ponytail: extend(SHORT, {
    down: [[3, '.............hh.'], [4, '.............hh.'], [5, '.............hh.'], [6, '..............h.']],
    up: [...rows(10, 13, '.......hh.......'), [14, '.......HH.......']],
    side: [[3, '..h.............'], [4, '.hh.............'], [5, '.hh.............'], [6, '.hh.............'], [7, '.hh.............'], [8, '.hH.............'], [9, '..H.............']],
  }),
  twintails: extend(SHORT, {
    down: [...rows(4, 10, 'hh............hh'), [11, 'HH............HH']],
    up: [...rows(4, 10, 'hh............hh'), [11, 'HH............HH']],
    side: [...rows(4, 9, '.hh.............'), [10, '.HH.............']],
  }),
  bun: extend(SHORT, {
    y: 0,
    downTop: ['......hhhh......'],
    upTop: ['......hhhh......'],
    sideTop: ['...hhh..........'],
    side: [[1, '..hhhh..........'], [2, '...hh...........']],
  }),
};

// 上衣（畫在下身與鞋子上面，外套下擺會蓋住褲子）
export const TOP = {
  shirt: {
    y: 11,
    down: [
      '......wwww......',
      '...tttwwwwttt...',
      '...ttttwwtttt...',
      '...tttttttttt...',
      '.....tttttt.....',
      '.....tttttt.....',
      '.....TTTTTT.....',
    ],
    up: [
      '......tttt......',
      '...tttttttttt...',
      '...tttttttttt...',
      '...tttttttttt...',
      '.....tttttt.....',
      '.....tttttt.....',
      '.....TTTTTT.....',
    ],
    side: [
      '......ww........',
      '.....ttTTttt....',
      '.....ttTTtt.....',
      '.....ttTTtt.....',
      '.....ttTTtt.....',
      '.....tt..tt.....',
      '.....TTTTTT.....',
    ],
  },
  jacket: {
    y: 11,
    down: [
      '......wwww......',
      '...ttwwwwwwtt...',
      '...tttwwwwttt...',
      '...tttTwwTttt...',
      '.....ttwwtt.....',
      '.....ttwwtt.....',
      '....tTTwwTTt....',
      '....tt....tt....',
    ],
    up: [
      '......tttt......',
      '...tttttttttt...',
      '...tttttttttt...',
      '...tttttttttt...',
      '.....tttttt.....',
      '.....tttttt.....',
      '....tttttttt....',
      '....TTTTTTTT....',
    ],
    side: [
      '......ww........',
      '.....ttTTwtt....',
      '.....ttTTwt.....',
      '.....ttTTwt.....',
      '.....ttTTwt.....',
      '.....tt..wt.....',
      '....ttttttt.....',
      '....TTTTTTT.....',
    ],
  },
  dress: {
    y: 11,
    down: [
      '................',
      '...ttttsstttt...',
      '...tttttttttt...',
      '...tttttttttt...',
      '.....tttttt.....',
      '.....aaaaaa.....',
      '.....tttttt.....',
    ],
    up: [
      '................',
      '...tttttttttt...',
      '...tttttttttt...',
      '...tttttttttt...',
      '.....tttttt.....',
      '.....aaaaaa.....',
      '.....tttttt.....',
    ],
    side: [
      '................',
      '.....ttTTtts....',
      '.....ttTTtt.....',
      '.....ttTTtt.....',
      '.....ttTTtt.....',
      '.....aaaaaa.....',
      '.....tttttt.....',
    ],
  },
  robe: {
    y: 11,
    down: [
      '......wwww......',
      '..tttttwwttttt..',
      '..tttttaattttt..',
      '..tttttaattttt..',
      '..TT.ttaatt.TT..',
      '.....ttaatt.....',
      '.....ttaatt.....',
      '....tttaattt....',
      '....tttaattt....',
      '...ttttaatttt...',
      '...ttttaatttt...',
      '...TTTTTTTTTT...',
    ],
    up: [
      '......tttt......',
      '..tttttttttttt..',
      '..tttttttttttt..',
      '..tttttttttttt..',
      '..TT.tttttt.TT..',
      '.....tttttt.....',
      '.....tttttt.....',
      '....tttttttt....',
      '....tttttttt....',
      '...tttttttttt...',
      '...tttttttttt...',
      '...TTTTTTTTTT...',
    ],
    side: [
      '......ww........',
      '.....tTTTTtt....',
      '.....tTTTTta....',
      '.....tTTTTta....',
      '.....tTTTTta....',
      '.....tt..tta....',
      '.....tttttta....',
      '....ttttttta....',
      '....ttttttta....',
      '....tttttttta...',
      '....tttttttta...',
      '....TTTTTTTTT...',
    ],
  },
  armor: {
    y: 11,
    down: [
      '......mmmm......',
      '...mmmttttmmm...',
      '...MmmttttmmM...',
      '...mmmttttmmm...',
      '.....mttttm.....',
      '.....mttttm.....',
      '.....MaaaaM.....',
      '.......tt.......',
    ],
    up: [
      '......mmmm......',
      '...mmmmmmmmmm...',
      '...Mmmmmmmmmm...',
      '...mmmmmmmmmm...',
      '.....mmmmmm.....',
      '.....mmmmmm.....',
      '.....MaaaaM.....',
      '................',
    ],
    side: [
      '......mm........',
      '.....mmMMttt....',
      '.....mmMMtt.....',
      '.....mmMMtt.....',
      '.....mmMMtt.....',
      '.....mm..tt.....',
      '.....MaaaaM.....',
      '.........t......',
    ],
  },
};

// 下身（長袍、洋裝不用填；洋裝沒填時用長裙）
export const BOTTOM = {
  pants: {
    y: 17,
    down: ['.....bbbbbb.....', '.....bb..bb.....', '.....bb..bb.....', '.....bb..bb.....', '.....bb..bb.....', '.....BB..BB.....'],
    up: ['.....bbbbbb.....', '.....bb..bb.....', '.....bb..bb.....', '.....bb..bb.....', '.....bb..bb.....', '.....BB..BB.....'],
    side: ['.....bbbbbb.....', '......bb..bb....', '......bb..bb....', '......bb..bb....', '......bb..bb....', '......BB..BB....'],
  },
  shorts: {
    y: 17,
    down: ['.....bbbbbb.....', '.....bb..bb.....', '.....BB..BB.....'],
    up: ['.....bbbbbb.....', '.....bb..bb.....', '.....BB..BB.....'],
    side: ['.....bbbbbb.....', '......bb..bb....', '......BB..BB....'],
  },
  longskirt: {
    y: 17,
    down: ['.....bbbbbb.....', '....bbbbbbbb....', '....bbbbbbbb....', '...bbbbbbbbbb...', '...bbbbbbbbbb...', '...BBBBBBBBBB...'],
    up: ['.....bbbbbb.....', '....bbbbbbbb....', '....bbbbbbbb....', '...bbbbbbbbbb...', '...bbbbbbbbbb...', '...BBBBBBBBBB...'],
    side: ['.....bbbbbb.....', '....bbbbbbbb....', '....bbbbbbbb....', '....bbbbbbbbb...', '....bbbbbbbbb...', '....BBBBBBBBB...'],
  },
  skirt: {
    y: 17,
    down: ['.....bbbbbb.....', '....bbbbbbbb....', '....BBBBBBBB....'],
    up: ['.....bbbbbb.....', '....bbbbbbbb....', '....BBBBBBBB....'],
    side: ['.....bbbbbb.....', '....bbbbbbbb....', '....BBBBBBBB....'],
  },
};

export const SHOES = {
  y: 23,
  down: ['....fff..fff....'],
  up: ['....fff..fff....'],
  side: ['......fff.fff...'],
};

// 配件。back：畫在身體後面（披風的正面與側面）
export const ACCESSORY = {
  hat: {
    y: 0,
    down: ['.....aaaaaa.....', '....aaaaaaaa....', '..AAAAAAAAAAAA..'],
    up: ['.....aaaaaa.....', '....aaaaaaaa....', '..AAAAAAAAAAAA..'],
    side: ['......aaaaa.....', '.....aaaaaaa....', '...AAAAAAAAAAAA.'],
  },
  ribbon: {
    y: 1,
    down: ['..........aaAaa.', '..........a...a.'],
    up: ['.aaAaa..........', '.a...a..........'],
    side: ['..aaAaa.........', '..a...a.........'],
  },
  glasses: {
    y: 6,
    down: ['....e.eeee.e....'],
    up: ['................'],
    side: ['.........e.ee...'],
  },
  headband: {
    y: 3,
    down: ['..aaaaaaaaaaaa..'],
    up: ['..aaaaaaaaaaaa..'],
    side: ['...aaaaaaaaaaa..'],
  },
  cape: {
    y: 12,
    back: { down: true, side: true },
    down: [...Array(9).fill('..aaaaaaaaaaaa..'), '..AAAAAAAAAAAA..'],
    up: [...Array(9).fill('...aaaaaaaaaa...'), '...AAAAAAAAAA...'],
    side: [...Array(9).fill('...aaaa.........'), '...AAAA.........'],
  },
};
