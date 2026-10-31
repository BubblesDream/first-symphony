import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el, clear, showError, filterSelect, yearOf, compareDate, statusMessage } from '../render.js';
import { videoCard } from '../cards.js';
import { GAME_LABELS } from '../config.js';

initLayout();

const main = document.getElementById('videos-content');

async function render() {
  try {
    const videos = (await loadTable('videos')).sort((a, b) => compareDate(b.published, a.published));
    const cards = videos.map((video) => ({ video, card: videoCard(video) })).filter((c) => c.card);
    const state = { year: 'all', game: 'all' };
    const grid = el('div', { className: 'grid grid--wide' });
    const count = el('p', { className: 'result-count', attrs: { 'aria-live': 'polite' } });

    const update = () => {
      const list = cards.filter(({ video }) =>
        (state.year === 'all' || yearOf(video.published) === state.year)
        && (state.game === 'all' || video.game === state.game || video.game === 'both'));
      grid.replaceChildren(...list.map((c) => c.card));
      count.textContent = `共 ${list.length} 支影片`;
      if (!list.length) grid.append(statusMessage('沒有符合條件的影片。'));
    };

    const years = [...new Set(videos.map((v) => yearOf(v.published)).filter(Boolean))].sort().reverse();
    clear(main);
    main.append(
      el('div', { className: 'filters' }, [
        filterSelect('年份', 'filter-year', [{ value: 'all', label: '全部年份' }, ...years.map((y) => ({ value: y, label: `${y} 年` }))], (v) => { state.year = v; update(); }),
        filterSelect('遊戲', 'filter-game', [
          { value: 'all', label: '全部遊戲' },
          { value: 'mabinogi_m', label: GAME_LABELS.mabinogi_m },
          { value: 'mabinogi_pc', label: GAME_LABELS.mabinogi_pc },
        ], (v) => { state.game = v; update(); }),
        count,
      ]),
      grid,
    );
    update();
  } catch (error) {
    showError(main, error);
  }
}

render();
