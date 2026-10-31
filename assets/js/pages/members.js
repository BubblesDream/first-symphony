import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el, img, clear, matchesGame } from '../render.js';
import { gameTag, demoBadge, filterGroup, errorBox, showStatus, tiltClass } from '../ui.js';
import { PLACEHOLDERS } from '../validate.js';

initLayout();

const filters = document.getElementById('filters');
const list = document.getElementById('member-list');
const status = document.getElementById('status');

function memberCard(m, index) {
  return el('li', {},
    el('a', { className: `member-card ${tiltClass(index)}`, href: `member.html?id=${encodeURIComponent(m.id)}` },
      el('span', { className: 'member-card__photo' }, img(m.avatar, `${m.nickname || '成員'}的頭像`, { fallback: PLACEHOLDERS.avatar })),
      el('span', { className: 'member-card__name', text: m.nickname || '（未命名）' }),
      m.role ? el('span', { className: 'member-card__role', text: m.role }) : null,
      el('span', { className: 'member-card__tags' }, gameTag(m.game), demoBadge(m)),
    ),
  );
}

async function main() {
  try {
    const members = (await loadTable('members'))
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

    const draw = (game) => {
      const shown = members.filter((m) => matchesGame(m.game, game));
      list.replaceChildren(...shown.map(memberCard));
      showStatus(status, shown.length ? `共 ${shown.length} 位成員` : '這個遊戲目前沒有成員資料。');
    };

    filters.replaceChildren(filterGroup('遊戲', [
      { value: 'all', label: '全部' },
      { value: 'mabinogi_m', label: '瑪奇 M' },
      { value: 'mabinogi_pc', label: '瑪奇 PC' },
    ], 'all', draw));
    draw('all');
  } catch (error) {
    console.warn(error);
    showStatus(status, '');
    clear(list);
    list.after(errorBox());
  }
}

main();
