// 鍛造轉蛋（面板 forge，1F 鍛造工坊的鐵砧）：隨機組合「材質＋武器 +強化值」與稀有度。
// 材料清單在 data/castle_forge.json（kind：material／weapon／rarity／comment），讀不到就用下面的內建預設。
import { el } from '../render.js';
import { createRng } from './rng.js';
import { createNameField, createShareButton } from './shareImage.js';
import { quotaText, OUT_OF_QUOTA } from './quota.js';

const HIT_GAP = 500;        // 「鏗！」出現的間隔（毫秒），三下約 1.5 秒
const SPOON_CHANCE = 0.004; // 彩蛋：做出湯匙的機率

// 讀不到資料表時的內建預設（和 data/castle_forge.json 同樣的欄位）
const DEFAULT_ROWS = [
  ...['木', '鐵', '銅', '銀', '秘銀', '星鐵'].map((name) => ({ kind: 'material', name, weight: 1 })),
  ...['劍', '斧', '槍', '弓', '杖', '盾', '鐵鎚', '豎琴', '長笛'].map((name) => ({ kind: 'weapon', name, weight: 1 })),
  { kind: 'rarity', name: '普通', weight: 50, plus_min: 0, plus_max: 2 },
  { kind: 'rarity', name: '精良', weight: 30, plus_min: 2, plus_max: 4 },
  { kind: 'rarity', name: '稀有', weight: 14, plus_min: 4, plus_max: 6 },
  { kind: 'rarity', name: '傳說', weight: 5, plus_min: 6, plus_max: 8 },
  { kind: 'rarity', name: '神兵利器', weight: 1, plus_min: 8, plus_max: 10 },
  { kind: 'comment', name: '敲得很用心，拿起來剛剛好。', weight: 1 },
  { kind: 'comment', name: '鍛造師傅點了點頭。', weight: 1 },
];

/** 依 weight 抽一個 */
function weighted(rng, list) {
  const total = list.reduce((sum, r) => sum + r.weight, 0);
  let n = rng.next() * total;
  for (const r of list) {
    n -= r.weight;
    if (n < 0) return r;
  }
  return list[list.length - 1];
}

/** 整理資料表：每一種都至少要有一列，否則整份改用預設 */
function toPools(rows) {
  const pools = { material: [], weapon: [], rarity: [], comment: [] };
  for (const r of rows) {
    if (!pools[r.kind] || !r.name) continue;
    const weight = Number.isFinite(r.weight) && r.weight > 0 ? r.weight : 1;
    pools[r.kind].push({ ...r, weight });
  }
  return Object.values(pools).every((list) => list.length) ? pools : null;
}

/** 鍛造一次的結果 */
export function forgeOnce(pools, rng = createRng()) {
  if (rng.next() < SPOON_CHANCE) {
    return { spoon: true, rarity: '失敗作', item: '湯匙', plus: 0, comment: '下次一定會成功的！' };
  }
  const rarity = weighted(rng, pools.rarity);
  const lo = Number.isFinite(rarity.plus_min) ? rarity.plus_min : 0;
  const hi = Number.isFinite(rarity.plus_max) ? Math.max(lo, rarity.plus_max) : lo;
  return {
    spoon: false,
    rarity: rarity.name,
    item: weighted(rng, pools.material).name + weighted(rng, pools.weapon).name,
    plus: Math.min(10, Math.max(0, rng.int(lo, hi))),
    comment: weighted(rng, pools.comment).name,
  };
}

export function buildForgePanel(ctx) {
  let timers = [];
  let last = null;
  let pools = null;
  const name = createNameField('鍛造人');
  const hits = el('p', { className: 'castle-forge__hits', 'aria-live': 'polite' });
  const result = el('div', { className: 'castle-forge__result', hidden: true });
  const status = el('p', { className: 'castle-panel__status', 'aria-live': 'polite' });
  const quota = el('p', { className: 'castle-panel__small', text: quotaText(ctx.quota) });
  const share = createShareButton(() => shareCard(last, name.value()));
  share.hidden = true;
  const start = el('button', { type: 'button', className: 'btn', text: '開始鍛造' });

  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  async function loadPools() {
    if (pools) return pools;
    try {
      pools = toPools(await ctx.load('castle_forge'));
    } catch (error) {
      console.warn(error);
    }
    if (!pools) pools = toPools(DEFAULT_ROWS);
    return pools;
  }

  start.addEventListener('click', async () => {
    clearTimers();
    share.hidden = true;
    result.hidden = true;
    last = null;
    status.textContent = '';
    if (!ctx.quota.use()) {
      hits.textContent = '';
      status.textContent = OUT_OF_QUOTA;
      return;
    }
    quota.textContent = quotaText(ctx.quota);
    start.disabled = true;
    const outcome = forgeOnce(await loadPools());
    hits.textContent = '';
    ['鏗！', '鏗！', '鏗！'].forEach((word, i) => {
      timers.push(setTimeout(() => { hits.textContent += (i ? '　' : '') + word; }, i * HIT_GAP));
    });
    timers.push(setTimeout(() => {
      start.disabled = false;
      last = outcome;
      showResult(result, outcome);
      share.hidden = false;
    }, 3 * HIT_GAP + 200));
  });

  const body = el('div', { className: 'castle-forge' },
    el('p', { className: 'castle-panel__lead', text: '爐火正旺，鐵砧上擺好了材料。敲三下，看看會做出什麼。' }),
    name.node,
    el('div', { className: 'castle-panel__actions' }, start),
    quota,
    status,
    hits,
    result,
    share,
    el('p', { className: 'castle-panel__small castle-panel__foot', text: '每次鍛造用 1 次靈感。做出來的東西只是好玩，不會放進背包。' }),
  );
  return { title: '鍛造台', body, onClose: clearTimers };
}

function showResult(box, r) {
  const head = r.spoon ? '失敗了…' : `恭喜你做出${r.rarity}！`;
  const item = r.spoon ? '做出一根湯匙 +0' : `${r.item} +${r.plus}`;
  box.replaceChildren(
    el('p', { className: 'castle-forge__head', text: head }),
    el('p', { className: 'castle-forge__item', text: item }),
    el('p', { className: 'castle-panel__small', text: `稀有度：${r.rarity}　${r.comment}` }),
  );
  box.dataset.rarity = r.rarity;
  box.hidden = false;
}

function shareCard(r, name) {
  if (!r) throw new Error('還沒有鍛造');
  return {
    kind: 'forge',
    title: '鍛造工坊',
    headline: r.spoon ? '失敗了…' : `恭喜你做出${r.rarity}！`,
    sub: r.spoon ? '湯匙 +0' : `${r.item} +${r.plus}`,
    lines: [`稀有度：${r.rarity}`, r.comment],
    signLabel: '鍛造人',
    name,
  };
}
