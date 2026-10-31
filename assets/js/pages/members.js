import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { bySortOrder, gameLabel, showMessage, LOAD_ERROR } from '../render.js';
import { memberCard } from '../components.js';

initLayout();

const list = document.getElementById('member-list');
const filter = document.getElementById('member-filter');
const count = document.getElementById('member-count');

document.querySelectorAll('#member-filter option[data-game]').forEach((opt) => {
  opt.textContent = gameLabel(opt.value);
});

async function init() {
  try {
    const rows = (await loadTable('members')).sort(bySortOrder);
    const draw = () => {
      const game = filter.value;
      const items = rows.filter((m) => game === 'all' || m.game === game || m.game === 'both');
      count.textContent = `共 ${items.length} 位`;
      if (!items.length) return showMessage(list, '這個遊戲目前還沒有成員資料。');
      list.replaceChildren(...items.map((m) => memberCard(m)));
    };
    filter.addEventListener('change', draw);
    draw();
  } catch {
    showMessage(list, LOAD_ERROR);
  }
}

init();
