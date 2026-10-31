import { initLayout } from '../layout.js';
import { loadSite, loadTable } from '../data.js';
import { el, image, gameTag, gameLabel, demoBadge, formatDate, dateKey, showMessage, LOAD_ERROR } from '../render.js';
import { youtubeId, youtubeWatch, isValidId } from '../validate.js';

initLayout();

const $ = (id) => document.getElementById(id);
const HISTORY_FALLBACK = 'assets/images/placeholders/history-1.svg';

async function renderSiteText() {
  try {
    const site = await loadSite();
    const fill = (id, value) => { $(id).textContent = value || '（尚未填寫）'; };
    fill('story-origin', site.story_origin);
    fill('story-name', site.story_name);
    fill('era-pc', site.era_mabinogi_pc);
    fill('era-m', site.era_mabinogi_m);
    if (site.is_demo) document.querySelectorAll('.js-site-demo').forEach((n) => n.replaceChildren(demoBadge(true)));
  } catch {
    $('story-origin').textContent = LOAD_ERROR;
  }
}

function historyItem(event) {
  const video = youtubeId(event.video_url);
  const hasImage = Boolean(event.image);
  return el('li', { className: `timeline__item${hasImage ? ' timeline__item--photo' : ''}`, attrs: { 'data-game': event.game } }, [
    el('p', { className: 'timeline__date' }, [
      el('time', { text: formatDate(event.date), attrs: { datetime: event.date } }),
    ]),
    el('article', { className: 'timeline__card' }, [
      el('h3', { className: 'timeline__title', text: event.title }),
      el('p', { className: 'timeline__tags' }, [gameTag(event.game), demoBadge(event.is_demo)]),
      hasImage ? el('figure', { className: 'polaroid polaroid--inline' }, [
        el('div', { className: 'polaroid__frame' }, [image(event.image, event.title, HISTORY_FALLBACK, { width: 1200, height: 900 })]),
      ]) : null,
      el('p', { className: 'prose-text', text: event.body }),
      video ? el('p', {}, [el('a', {
        className: 'text-link',
        text: '觀看相關影片（YouTube）',
        attrs: { href: youtubeWatch(video), target: '_blank', rel: 'noopener noreferrer' },
      })]) : null,
    ]),
  ]);
}

async function renderTimeline() {
  const list = $('timeline');
  const filter = $('timeline-filter');
  try {
    const rows = (await loadTable('history')).sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)));
    if (!rows.length) return showMessage(list, '目前還沒有歷史紀錄。');
    const draw = (game) => {
      const items = rows.filter((r) => game === 'all' || r.game === game || r.game === 'both');
      if (!items.length) return showMessage(list, '這個時期還沒有紀錄。');
      list.replaceChildren(...items.map(historyItem));
    };
    filter.addEventListener('change', () => draw(filter.value));
    draw(filter.value);
  } catch {
    showMessage(list, LOAD_ERROR);
  }
}

async function renderLeaders() {
  const list = $('leaders');
  try {
    const rows = (await loadTable('leaders')).sort((a, b) => dateKey(a.term_start).localeCompare(dateKey(b.term_start)));
    if (!rows.length) return showMessage(list, '目前還沒有歷任會長資料。');
    list.replaceChildren(...rows.map((leader) => {
      const term = `${formatDate(leader.term_start)} – ${leader.term_end ? formatDate(leader.term_end) : '現任'}`;
      const name = leader.member_id && isValidId(leader.member_id)
        ? el('a', { text: leader.nickname, attrs: { href: `member.html?id=${encodeURIComponent(leader.member_id)}` } })
        : el('span', { text: leader.nickname });
      return el('li', { className: 'leader' }, [
        el('span', { className: 'leader__name' }, [name]),
        el('span', { className: 'leader__term', text: term }),
        leader.note ? el('span', { className: 'leader__note', text: leader.note }) : null,
        demoBadge(leader.is_demo),
      ]);
    }));
  } catch {
    showMessage(list, LOAD_ERROR);
  }
}

// 篩選選項文字也從集中定義的遊戲名稱取得
document.querySelectorAll('#timeline-filter option[data-game]').forEach((opt) => {
  opt.textContent = gameLabel(opt.value);
});

renderSiteText();
renderTimeline();
renderLeaders();
