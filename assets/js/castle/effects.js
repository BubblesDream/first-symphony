// 演出時的小效果：射箭、打鐵的火星、打稻草人掉下的稻草。
// actions.js 的動作寫 effect: { type, ... }；演出點寫 target: [x, y]（效果出現在哪一格，沒寫就是面向的那一格）。
// NPC 和訪客演出時，每次冒泡泡都會呼叫 playEffect；效果可以決定這次要說的話（例如射中或沒射中）。
// 只用小色塊與簡單的移動，不做發光特效。
import { TILE } from './config.js';

export const FACING = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** 效果出現的位置（格子中央，世界座標） */
function targetPoint(spot) {
  const [dx, dy] = FACING[spot.facing] || [0, 1];
  const [tx, ty] = spot.target || [spot.x + dx, spot.y + dy];
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}

/** 射箭：箭從演出者飛到箭靶，大多數會射中（插在靶上一下子），偶爾偏掉 */
function arrow(scene, from, spot, effect) {
  const to = targetPoint(spot);
  const hit = scene.rng.next() < (effect.hitRate ?? 0.7);
  // 箭靶的圖是 1×2 格、靶面在上半部，所以射中的位置往上抬
  const end = hit ? { x: to.x - 4, y: to.y - 24 } : { x: to.x - 2, y: to.y + scene.rng.pick([-44, 8]) };
  const startX = from.x + 6;
  const startY = from.y - 16;
  const angle = Math.atan2(end.y - startY, end.x - startX);
  const shaft = scene.add.rectangle(startX, startY, 12, 2, 0x6b4a2b).setRotation(angle).setDepth(end.y + 60);
  const tip = scene.add.rectangle(startX, startY, 3, 3, 0xd8d2c4).setRotation(angle).setDepth(end.y + 61);
  const parts = [shaft, tip];
  scene.tweens.add({
    targets: parts,
    x: (target) => (target === tip ? end.x + Math.cos(angle) * 6 : end.x),
    y: (target) => (target === tip ? end.y + Math.sin(angle) * 6 : end.y),
    duration: 280,
    onComplete: () => scene.tweens.add({ targets: parts, alpha: 0, delay: hit ? 900 : 300, duration: 300, onComplete: () => parts.forEach((p) => p.destroy()) }),
  });
  return hit ? effect.hitText : effect.missText;
}

/** 一小撮碎片往外噴再落下：打鐵的火星、稻草人的稻草、磨刀的火花 */
function bits(scene, _from, spot, effect) {
  const p = targetPoint(spot);
  const y = p.y - (effect.lift ?? 10);
  const count = effect.count ?? 5;
  for (let i = 0; i < count; i++) {
    const dot = scene.add.rectangle(p.x, y, 2, 2, effect.color ?? 0xf0a040).setDepth(p.y + 40);
    scene.tweens.add({
      targets: dot,
      x: p.x + scene.rng.range(-12, 12),
      y: y + scene.rng.range(-10, 6),
      alpha: 0,
      duration: scene.rng.range(260, 420),
      ease: 'Quad.easeOut',
      onComplete: () => dot.destroy(),
    });
  }
  return null;
}

export const EFFECTS = { arrow, bits };

/**
 * 播放動作的效果。from：演出者的腳底位置；spot：演出點。
 * 回傳這次要說的話（沒有就用動作原本的泡泡）。
 */
export function playEffect(scene, action, from, spot) {
  const run = action.effect && EFFECTS[action.effect.type];
  return run ? run(scene, from, spot, action.effect) : null;
}
