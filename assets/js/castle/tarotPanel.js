// 塔羅占卜（面板 tarot）：「今日一張」（同一天固定）、「三張牌」（每次重抽，用 1 次靈感）。
// 牌的資料在 data/castle_tarot.json（透過 ctx.load 讀）；牌面先用 CSS 卡片，有圖後在 art.js 的 TAROT_ART 打開。
import { el } from '../render.js';
import { createRng, hashString } from './rng.js';
import { TAROT_ART } from './art.js';
import { createNameField, createShareButton, today } from './shareImage.js';
import { quotaText, OUT_OF_QUOTA } from './quota.js';

const FLIP_GAP = 650; // 每張牌翻開的間隔（毫秒）

function roman(n) {
  if (n === 0) return '0';
  const table = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
  return out;
}

const pad2 = (n) => String(n).padStart(2, '0');

export function buildTarotPanel(ctx) {
  let timers = [];
  let last = null; // 最近一次的結果（存成圖片用）
  const name = createNameField('占卜人');
  const status = el('p', { className: 'castle-panel__status', 'aria-live': 'polite' });
  const spread = el('div', { className: 'castle-tarot__spread' });
  const share = createShareButton(() => shareCard(last, name.value()));
  share.hidden = true;
  const btnToday = el('button', { type: 'button', className: 'btn', text: '今日一張' });
  const btnThree = el('button', { type: 'button', className: 'btn', text: '三張牌（過去・現在・未來）' });
  const quota = el('p', { className: 'castle-panel__small', text: quotaText(ctx.quota) });

  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  async function loadCards() {
    const rows = await ctx.load('castle_tarot');
    const cards = rows.filter((r) => r.name && Number.isInteger(r.number)).sort((a, b) => a.number - b.number);
    if (!cards.length) throw new Error('castle_tarot 沒有牌');
    return cards;
  }

  async function draw(kind) {
    clearTimers();
    share.hidden = true;
    last = null;
    let cards;
    try {
      cards = await loadCards();
    } catch (error) {
      console.warn(error);
      spread.replaceChildren();
      status.textContent = '占卜牌暫時找不到。';
      return;
    }
    if (kind === 'three' && !ctx.quota.use()) {
      status.textContent = OUT_OF_QUOTA;
      return;
    }
    quota.textContent = quotaText(ctx.quota);
    spread.replaceChildren();
    let picks;
    if (kind === 'today') {
      // 同一天抽到同一張：用當地日期當種子
      const rng = createRng(hashString(`tarot:${today().text}`));
      const card = rng.shuffle(cards)[0];
      picks = [{ card, reversed: rng.next() < 0.5, label: '今日一張' }];
    } else {
      const rng = createRng();
      picks = rng.shuffle(cards).slice(0, 3).map((card, i) => ({ card, reversed: rng.next() < 0.5, label: ['過去', '現在', '未來'][i] }));
    }
    status.textContent = kind === 'today' ? '今天的牌是…' : '過去・現在・未來，依序翻開…';
    spread.dataset.count = String(picks.length);
    const items = picks.map(renderPick);
    spread.replaceChildren(...items.map((it) => it.node));
    items.forEach((it, i) => {
      timers.push(setTimeout(() => {
        it.open();
        if (i === items.length - 1) {
          last = { kind, picks };
          share.hidden = false;
          status.textContent = '';
        }
      }, 250 + i * FLIP_GAP));
    });
  }

  btnToday.addEventListener('click', () => draw('today'));
  btnThree.addEventListener('click', () => draw('three'));

  const body = el('div', { className: 'castle-tarot' },
    el('p', { className: 'castle-panel__lead', text: '桌上鋪著深藍色的桌巾，一副牌安靜地等著。想抽哪一種？' }),
    name.node,
    el('div', { className: 'castle-panel__actions' }, btnToday, btnThree),
    quota,
    status,
    spread,
    share,
    el('p', { className: 'castle-panel__small castle-panel__foot', text: '占卜只是遊戲，好玩就好。「今日一張」每天固定；「三張牌」每次用 1 次靈感。' }),
  );
  return { title: '占卜桌', body, onClose: clearTimers };
}

/** 一張牌：先蓋著，open() 時翻開並顯示解讀 */
function renderPick({ card, reversed, label }) {
  const back = el('div', { className: 'castle-tarot__back' });
  withArt(back, TAROT_ART.back && `${TAROT_ART.dir}tarot_back.webp`, '', () => [el('span', { text: '☆' })]);
  const face = el('div', { className: 'castle-tarot__face' });
  withArt(face, TAROT_ART.faces && `${TAROT_ART.dir}tarot_${pad2(card.number)}.webp`, card.name, () => [
    el('span', { className: 'castle-tarot__num', text: roman(card.number) }),
    el('span', { className: 'castle-tarot__cardname', text: card.name }),
  ]);
  const inner = el('div', { className: 'castle-tarot__inner' }, back, face);
  const cardBox = el('div', { className: `castle-tarot__card${reversed ? ' is-reversed' : ''}`, 'aria-hidden': 'true' }, inner);
  const info = el('div', { className: 'castle-tarot__info', hidden: true },
    el('p', { className: 'castle-tarot__title', text: `${card.name}（${reversed ? '逆位' : '正位'}）` }),
    el('p', { className: 'castle-panel__small', text: `關鍵字：${card.keyword || ''}` }),
    el('p', { text: (reversed ? card.reversed : card.upright) || '' }),
  );
  const node = el('div', { className: 'castle-tarot__pick' },
    el('p', { className: 'castle-tarot__label', text: label }),
    cardBox,
    info,
  );
  return {
    node,
    open() {
      cardBox.classList.add('is-open');
      info.hidden = false;
    },
  };
}

/** 有圖就放圖，沒圖或載入失敗時改成 CSS 卡片的內容 */
function withArt(box, src, alt, fallback) {
  if (!src) {
    box.append(...fallback());
    return;
  }
  const img = el('img', { src, alt });
  img.addEventListener('error', () => img.replaceWith(...fallback()), { once: true });
  box.append(img);
}

/** 存成圖片的內容 */
function shareCard(result, name) {
  if (!result) throw new Error('還沒有抽牌');
  const tag = (p) => `${p.card.name}（${p.reversed ? '逆位' : '正位'}）`;
  if (result.kind === 'today') {
    const p = result.picks[0];
    return {
      kind: 'tarot',
      title: '今日一張',
      headline: tag(p),
      sub: '',
      lines: [`關鍵字：${p.card.keyword || ''}`, (p.reversed ? p.card.reversed : p.card.upright) || '', '占卜只是遊戲，好玩就好。'],
      signLabel: '占卜人',
      name,
    };
  }
  return {
    kind: 'tarot',
    title: '三張牌：過去・現在・未來',
    headline: '',
    sub: '',
    lines: result.picks.map((p) => `${p.label}｜${tag(p)}\n${p.card.keyword || ''}`).concat('占卜只是遊戲，好玩就好。'),
    signLabel: '占卜人',
    name,
  };
}
