// 今日運勢來源：文字與紀念卡共用本次日期；新增來源請依 index.js 介面登記。
import { moonPhase, dailyCard, todayKey, visitorId, roman, drawTarot } from '../fortune.js';

export function fortuneToday() {
  const date = new Date();
  return { now: date, date: todayKey(date), phase: moonPhase(date), draw: dailyCard({ visitorId: visitorId(), date }) };
}

export function lines(scene, obj, state) {
  const { draw: { card, message } } = state.fortune ||= fortuneToday();
  return [`你抽到了：${roman(card.no)}．${card.name}`, card.keyword, message,
    '（卡片可以存成圖片，留作紀念）'].map((text) => ({ text }));
}

export function card(scene, obj, state) {
  const { date, draw: { card, message } } = state.fortune ||= fortuneToday();
  return {
    filename: `card-${date}.png`,
    spec: {
      kicker: '觀星台｜今日之牌', title: card.name, subtitle: `${roman(card.no)} · ${card.keyword}`,
      art: (ctx, x, y, w, h) => drawTarot(ctx, x, y, w, h, card), artHeight: 600,
      rows: [], note: message, date,
    },
  };
}
