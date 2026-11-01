import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { clear, dateKey, yearOf, matchesGame } from '../render.js';
import { videoCard, filterGroup, errorBox, showStatus } from '../ui.js';

initLayout();

const filters = document.getElementById('filters');
const list = document.getElementById('video-list');
const status = document.getElementById('status');

async function main() {
  try {
    const videos = (await loadTable('videos'))
      .sort((a, b) => dateKey(b.published).localeCompare(dateKey(a.published)));

    // 先建好卡片（不合法的網址會回傳 null，直接略過）
    const cards = videos
      .map((v) => ({ video: v, node: videoCard(v) }))
      .filter((c) => c.node);

    const state = { year: 'all', game: 'all' };
    const draw = () => {
      const shown = cards.filter(({ video }) =>
        (state.year === 'all' || yearOf(video.published) === state.year) && matchesGame(video.game, state.game));
      list.replaceChildren(...shown.map((c) => c.node));
      showStatus(status, shown.length ? `共 ${shown.length} 支影片` : '沒有符合條件的影片。');
    };

    const years = [...new Set(cards.map((c) => yearOf(c.video.published)).filter(Boolean))].sort().reverse();
    filters.replaceChildren(
      filterGroup('年份', [{ value: 'all', label: '全部' }, ...years.map((y) => ({ value: y, label: y }))], 'all',
        (v) => { state.year = v; draw(); }),
      filterGroup('遊戲', [
        { value: 'all', label: '全部' },
        { value: 'mabinogi_m', label: '瑪奇 M' },
        { value: 'mabinogi_pc', label: '瑪奇 PC' },
      ], 'all', (v) => { state.game = v; draw(); }),
    );
    draw();
  } catch (error) {
    console.warn(error);
    showStatus(status, '');
    clear(list);
    list.after(errorBox());
  }
}

main();
