// 物件的面板清單：房間物件寫 show: '名稱'，看完說明後打開這裡登記的面板。
// 新增面板＝寫一個建立函式（收到 ctx 與 env，回傳 { title, body, onClose }），在這裡加一行。
//   build(ctx, env)：env = { obj（被查看的物件）, close()（關閉面板）, play()（訪客到 obj.play 的演出點演出） }
//   order：物件同時有 play 時的順序
//     'play-first'（預設）：先走過去演出，到了再打開面板（望遠鏡、占卜桌、鐵砧）
//     'panel-first'：先打開面板，由面板決定什麼時候呼叫 env.play()（酒館點飲料）
import { buildMoonPanel } from './moonPanel.js';
import { buildTarotPanel } from './tarotPanel.js';
import { buildForgePanel } from './forgePanel.js';
import { buildDrinkPanel } from './drinkPanel.js';

export const PANELS = {
  moon: { build: buildMoonPanel },                          // 望遠鏡畫面：今天的真實月相
  tarot: { build: buildTarotPanel },                        // 塔羅占卜
  forge: { build: buildForgePanel },                        // 鍛造轉蛋
  drink: { build: buildDrinkPanel, order: 'panel-first' },  // 酒館菜單
};

export const panelOrder = (name) => PANELS[name]?.order || 'play-first';

/** 打開面板；名稱沒登記就回傳 false */
export function openPanel(ctx, name, env) {
  const entry = PANELS[name];
  if (!entry) return false;
  ctx.ui.panel.open(name, entry.build(ctx, env));
  return true;
}
