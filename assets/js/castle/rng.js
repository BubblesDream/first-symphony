// 可指定種子的亂數。同一個種子每次產生同樣的結果，方便測試與比對畫面。

export function createRng(seed) {
  let s = Number.isFinite(seed) ? seed >>> 0 : (Math.random() * 2 ** 32) >>> 0;
  // mulberry32
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** min～max 之間的整數（含兩端） */
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    /** min～max 之間的小數 */
    range: (min, max) => min + next() * (max - min),
    pick: (list) => list[Math.floor(next() * list.length)],
    /** 回傳洗牌後的新陣列 */
    shuffle(list) {
      const out = list.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

/** 把字串轉成固定的數字（同一個 id 永遠得到同一個數字） */
export function hashString(text) {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
