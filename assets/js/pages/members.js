import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el, clear, showError, filterButtons, bySortOrder, statusMessage } from '../render.js';
import { memberCard } from '../cards.js';
import { GAME_LABELS } from '../config.js';

initLayout();

const main = document.getElementById('members-content');

async function render() {
  try {
    const members = (await loadTable('members')).sort(bySortOrder);
    const grid = el('div', { className: 'grid' });
    const count = el('p', { className: 'result-count', attrs: { 'aria-live': 'polite' } });

    const update = (game) => {
      const list = members.filter((m) => game === 'all' || m.game === game || m.game === 'both');
      grid.replaceChildren(...list.map(memberCard));
      count.textContent = `共 ${list.length} 位成員`;
      if (!list.length) grid.append(statusMessage('這個分類還沒有成員。'));
    };

    clear(main);
    main.append(
      el('div', { className: 'filters' }, [
        filterButtons('遊戲', [
          { value: 'all', label: '全部' },
          { value: 'mabinogi_m', label: GAME_LABELS.mabinogi_m },
          { value: 'mabinogi_pc', label: GAME_LABELS.mabinogi_pc },
        ], 'all', update),
        count,
      ]),
      grid,
    );
    update('all');
  } catch (error) {
    showError(main, error);
  }
}

render();
