import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el, dateYear, dateKey, gameLabel, showMessage, LOAD_ERROR } from '../render.js';
import { videoCard } from '../components.js';

initLayout();

const list = document.getElementById('video-list');
const yearSelect = document.getElementById('video-year');
const gameSelect = document.getElementById('video-game');
const count = document.getElementById('video-count');

document.querySelectorAll('#video-game option[data-game]').forEach((opt) => {
  opt.textContent = gameLabel(opt.value);
});

async function init() {
  try {
    const rows = (await loadTable('videos'))
      .sort((a, b) => dateKey(b.published).localeCompare(dateKey(a.published)));
    const years = [...new Set(rows.map((v) => dateYear(v.published)).filter(Boolean))].sort().reverse();
    yearSelect.append(...years.map((y) => el('option', { text: `${y} 年`, attrs: { value: y } })));

    const draw = () => {
      const year = yearSelect.value;
      const game = gameSelect.value;
      const items = rows.filter((v) => (year === 'all' || dateYear(v.published) === year)
        && (game === 'all' || v.game === game || v.game === 'both'));
      count.textContent = `共 ${items.length} 部`;
      if (!items.length) return showMessage(list, '沒有符合條件的影片。');
      list.replaceChildren(...items.map((v) => videoCard(v, { headingLevel: 'h2' })));
    };
    yearSelect.addEventListener('change', draw);
    gameSelect.addEventListener('change', draw);
    draw();
  } catch {
    showMessage(list, LOAD_ERROR);
  }
}

init();
