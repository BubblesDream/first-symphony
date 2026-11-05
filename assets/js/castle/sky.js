// 真實月相（純計算，不連網路、不碰畫面）。
// 用「平均朔望月」從一個已知的新月往後推算，誤差大約在半天以內，看月亮形狀綽綽有餘。

export const SYNODIC_MONTH = 29.530588853; // 朔望月（天）
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 18:14 UTC 的新月
const DAY_MS = 86400000;

const PHASE_NAMES = ['新月', '眉月', '上弦月', '盈凸月', '滿月', '虧凸月', '下弦月', '殘月'];

/** 某個時間的月齡（0～29.53 天） */
export function moonAgeAt(date = new Date()) {
  const days = (date.getTime() - REF_NEW_MOON) / DAY_MS;
  return ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
}

/** 網址參數 ?moon= 的值整理成月齡；不合法就回傳 null */
export function parseMoonAge(text) {
  if (text === null || text === undefined || !/^\d+(\.\d+)?$/.test(String(text).trim())) return null;
  const age = Number(text);
  return age >= 0 && age <= SYNODIC_MONTH ? age % SYNODIC_MONTH : null;
}

/**
 * 月相資訊。override：指定月齡（測試用），沒有就依 date 計算。
 * 回傳 { age, fraction（0～1 照亮比例）, waxing, name, daysToFull, daysToNew }
 */
export function moonPhase(date = new Date(), override = null) {
  const age = Number.isFinite(override) ? override : moonAgeAt(date);
  const angle = (2 * Math.PI * age) / SYNODIC_MONTH;
  const fraction = (1 - Math.cos(angle)) / 2;
  const index = Math.floor((age / SYNODIC_MONTH) * 8 + 0.5) % 8;
  const half = SYNODIC_MONTH / 2;
  return {
    age,
    fraction,
    waxing: age < half,
    name: PHASE_NAMES[index],
    daysToFull: (half - age + SYNODIC_MONTH) % SYNODIC_MONTH,
    daysToNew: SYNODIC_MONTH - age,
  };
}

/** 當地時間 6～18 點算白天 */
export function isDaytime(date = new Date()) {
  const h = date.getHours();
  return h >= 6 && h < 18;
}

/** 當地 18 點到隔天 6 點前算晚上（酒館的夜晚限定飲料） */
export const isNight = (date = new Date()) => !isDaytime(date);

/**
 * 月亮亮面的形狀：把半徑 1 的圓切成一條一條橫線，回傳每條亮的範圍 [y, x0, x1]（-1～1）。
 * 北半球（台灣）看到的方向：漸盈亮右邊、漸虧亮左邊。steps：切幾條。
 */
export function moonRows(age, steps = 64) {
  const c = Math.cos((2 * Math.PI * age) / SYNODIC_MONTH);
  const waxing = age < SYNODIC_MONTH / 2;
  const rows = [];
  for (let i = 0; i < steps; i++) {
    const y = -1 + (2 * (i + 0.5)) / steps;
    const s = Math.sqrt(Math.max(0, 1 - y * y));
    const x0 = waxing ? c * s : -s;
    const x1 = waxing ? s : -c * s;
    if (x1 > x0) rows.push([y, x0, x1]);
  }
  return rows;
}
