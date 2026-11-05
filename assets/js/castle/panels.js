// 物件的面板清單：房間物件寫 show: '名稱'，看完說明後打開這裡登記的面板。
// 新增面板＝寫一個建立函式（收到 ctx，回傳 { title, body, onClose }），在這裡加一行。
import { buildMoonPanel } from './moonPanel.js';
import { buildTarotPanel } from './tarotPanel.js';

export const PANELS = {
  moon: buildMoonPanel,   // 望遠鏡畫面：今天的真實月相
  tarot: buildTarotPanel, // 塔羅占卜
};

/** 打開面板；名稱沒登記就回傳 false */
export function openPanel(ctx, name) {
  const build = PANELS[name];
  if (!build) return false;
  ctx.ui.panel.open(name, build(ctx));
  return true;
}
