import { initLayout } from '../layout.js';
import { loadSite, loadTable } from '../data.js';
import { el, image, clear, demoBadge, gameTag, formatDate, compareDate, showError, sectionHead, filterButtons, statusMessage } from '../render.js';
import { safeImageUrl, youtubeId, youtubeWatchUrl } from '../validate.js';
import { GAME_LABELS } from '../config.js';

initLayout();

const main = document.getElementById('story-content');

async function render() {
  try {
    const [site, history, leaders, members] = await Promise.all([
      loadSite(), loadTable('history'), loadTable('leaders'), loadTable('members'),
    ]);
    clear(main);
    main.append(
      originSection(site),
      eraSection(site),
      timelineSection(history),
      leadersSection(leaders, members),
    );
  } catch (error) {
    showError(main, error);
  }
}

function originSection(site) {
  return el('section', { className: 'section', attrs: { 'aria-labelledby': 'story-origin' } }, [
    sectionHead('創立緣由與名稱由來', { id: 'story-origin', eyebrow: 'ORIGIN' }),
    el('div', { className: 'story-columns' }, [
      el('div', { className: 'prose' }, [el('h3', { text: '創立緣由' }), el('p', { text: site.founding_story || '' })]),
      el('div', { className: 'prose' }, [el('h3', { text: '名稱由來' }), el('p', { text: site.name_origin || '' })]),
    ]),
    site.is_demo ? el('p', {}, [demoBadge(true)]) : null,
  ]);
}

function eraSection(site) {
  const eras = [
    { game: 'mabinogi_m', text: site.era_mabinogi_m },
    { game: 'mabinogi_pc', text: site.era_mabinogi_pc },
  ].filter((e) => e.text);
  return el('section', { className: 'section', attrs: { 'aria-labelledby': 'story-eras' } }, [
    sectionHead('不同的遊戲時期', { id: 'story-eras', eyebrow: 'ERAS' }),
    el('div', { className: 'era-list' }, eras.map((era) => el('div', { className: 'era' }, [
      el('h3', { text: GAME_LABELS[era.game] }),
      el('p', { text: era.text }),
    ]))),
  ]);
}

function timelineSection(history) {
  const list = el('ol', { className: 'timeline' });
  const count = el('p', { className: 'result-count', attrs: { 'aria-live': 'polite' } });
  const sorted = [...history].sort((a, b) => compareDate(a.date, b.date));

  const update = (game) => {
    const items = sorted.filter((h) => game === 'all' || h.game === game || h.game === 'both');
    list.replaceChildren(...items.map(timelineItem));
    count.textContent = `共 ${items.length} 筆事件`;
    if (!items.length) list.append(el('li', {}, [statusMessage('這個時期還沒有紀錄。')]));
  };

  const filters = el('div', { className: 'filters' }, [
    filterButtons('遊戲時期', [
      { value: 'all', label: '全部' },
      { value: 'mabinogi_m', label: GAME_LABELS.mabinogi_m },
      { value: 'mabinogi_pc', label: GAME_LABELS.mabinogi_pc },
    ], 'all', update),
    count,
  ]);
  update('all');

  return el('section', { className: 'section', attrs: { 'aria-labelledby': 'story-timeline' } }, [
    sectionHead('時間軸', { id: 'story-timeline', eyebrow: 'TIMELINE' }),
    filters,
    list,
  ]);
}

function timelineItem(event) {
  const videoId = youtubeId(event.video_url);
  return el('li', { className: 'timeline__item' }, [
    el('div', { className: 'timeline__date' }, [el('time', { text: formatDate(event.date), attrs: { datetime: event.date } })]),
    el('div', { className: 'timeline__body' }, [
      el('h3', { text: event.title }),
      el('div', { className: 'meta' }, [gameTag(event.game), demoBadge(event.is_demo)]),
      event.body ? el('p', { text: event.body }) : null,
      event.image ? el('div', { className: 'photo' }, [image(safeImageUrl(event.image, 'history'), event.title, { width: 800, height: 600 })]) : null,
      videoId ? el('p', {}, [el('a', { text: '觀看相關影片（YouTube）', attrs: { href: youtubeWatchUrl(videoId), target: '_blank', rel: 'noopener noreferrer' } })]) : null,
    ]),
  ]);
}

function leadersSection(leaders, members) {
  const memberIds = new Set(members.map((m) => m.id));
  const sorted = [...leaders].sort((a, b) => compareDate(a.term_start, b.term_start));
  const rows = sorted.map((leader) => {
    const name = leader.member_id && memberIds.has(leader.member_id)
      ? el('a', { text: leader.nickname, attrs: { href: `member.html?id=${encodeURIComponent(leader.member_id)}` } })
      : leader.nickname;
    const term = `${formatDate(leader.term_start)} – ${leader.term_end ? formatDate(leader.term_end) : '現任'}`;
    return el('tr', {}, [
      el('td', {}, [name, ' ', demoBadge(leader.is_demo)]),
      el('td', { text: term }),
      el('td', { text: leader.note || '' }),
    ]);
  });
  return el('section', { className: 'section', attrs: { 'aria-labelledby': 'story-leaders' } }, [
    sectionHead('歷任會長', { id: 'story-leaders', eyebrow: 'LEADERS' }),
    rows.length
      ? el('div', { className: 'table-wrap' }, [el('table', { className: 'leaders' }, [
        el('thead', {}, [el('tr', {}, [el('th', { text: '暱稱', attrs: { scope: 'col' } }), el('th', { text: '任期', attrs: { scope: 'col' } }), el('th', { text: '備註', attrs: { scope: 'col' } })])]),
        el('tbody', {}, rows),
      ])])
      : statusMessage('還沒有會長資料。'),
  ]);
}

render();
