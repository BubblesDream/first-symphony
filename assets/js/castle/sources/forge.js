// 打造來源：每次互動重新抽武器，同次文字與卡片共用結果；新增來源請依 index.js 介面登記。
import { createRng } from '../rng.js';
import { forgeWeapon, drawWeapon, forgeFilename } from '../forge.js';
import { todayKey } from '../fortune.js';

export function lines(scene, obj, state) {
  const weapon = state.weapon = forgeWeapon(createRng());
  return [`打造完成！${weapon.stars} ${weapon.rarityName}`, weapon.name, weapon.skill,
    `鐵匠：「${weapon.comment}」`, '（卡片可以存成圖片，留作紀念）'].map((text) => ({ text }));
}

export function card(scene, obj, state) {
  const weapon = state.weapon;
  const date = new Date();
  return {
    filename: forgeFilename(date),
    spec: {
      kicker: '鍛造工坊｜隨機打造', title: weapon.name, subtitle: `${weapon.stars} ${weapon.rarityName}`,
      art: (ctx, x, y, w, h) => drawWeapon(ctx, x, y, w, h, weapon),
      rows: [['種類', weapon.type], ['材料', weapon.material], ['攻擊力', weapon.attack],
        ['音感', weapon.music], ['可愛度', weapon.cute], ['特殊效果', weapon.skill]]
        .map(([label, value]) => ({ label, value })),
      note: `鐵匠：「${weapon.comment}」`, date: todayKey(date),
    },
  };
}
