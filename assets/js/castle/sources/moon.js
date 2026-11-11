// 月相來源：月亮說明與紀念卡；新增來源請依 index.js 介面登記。
import { MONTH, nextPhaseDate, drawNightMoon } from '../fortune.js';
import { fortuneToday } from './fortune.js';

const MOON_DESCRIPTIONS = { 新月: '幾乎看不到亮面', 眉月: '右邊有一彎細細的亮面', 上弦月: '右半邊亮',
  盈凸月: '大部分都亮，左邊還留著暗面', 滿月: '整個圓都亮', 虧凸月: '大部分都亮，右邊開始變暗',
  下弦月: '左半邊亮', 殘月: '左邊有一彎細細的亮面' };
const moonDescription = (phase) => `從北半球看，${MOON_DESCRIPTIONS[phase.name]}。`;

export function lines(scene, obj, state) {
  const { phase } = state.fortune ||= fortuneToday();
  return [{ text: `今天的月亮是${phase.name}，月齡約 ${Math.round(phase.age)} 天。` },
    { text: moonDescription(phase) }, { text: '（卡片可以存成圖片，留作紀念）' }];
}

export function card(scene, obj, state) {
  const { now, date, phase } = state.fortune ||= fortuneToday();
  const phaseDate = (age) => {
    const next = nextPhaseDate(now, age);
    return `${next.getMonth() + 1} 月 ${next.getDate()} 日`;
  };
  return {
    filename: `moon-${date}.png`,
    spec: {
      kicker: '觀星台｜今天的月亮', title: `今天的月亮：${phase.name}`,
      subtitle: `月齡約 ${Math.round(phase.age)} 天 · 亮面約 ${Math.round(phase.fraction * 100)}%`,
      art: (ctx, x, y, w, h) => drawNightMoon(ctx, x, y, w, h, phase), artHeight: 540,
      rows: [{ label: '下一次滿月', value: phaseDate(MONTH / 2) }, { label: '下一次新月', value: phaseDate(0) }],
      note: moonDescription(phase), date,
    },
  };
}
