import { initLayout } from '../layout.js';
import { loadSite, loadTable } from '../data.js';
import { el, clear, formatDate, dateKey, matchesGame } from '../render.js';
import { tapeTitle, polaroid, gameTag, demoBadge, filterGroup, errorBox, showStatus, tiltClass } from '../ui.js';
import { parseYouTubeId, youTubeWatch } from '../validate.js';

initLayout();

const root = document.getElementById('story');

function textSection(id, title, body) {
  if (!body) return null;
  return el('section', { className: 'story-section card', 'aria-labelledby': id },
    (() => { const h = tapeTitle(title); h.id = id; return h; })(),
    el('p', { className: 'prose pre-line', text: body }),
  );
}

function timelineItem(item, index) {
  const videoId = parseYouTubeId(item.video_url);
  return el('li', { className: 'timeline__item' },
    el('article', { className: 'timeline__card card' },
      el('p', { className: 'meta' },
        el('time', { className: 'timeline__date', datetime: item.date, text: formatDate(item.date) }),
        gameTag(item.game),
        demoBadge(item),
      ),
      el('h3', { className: 'timeline__title', text: item.title || '' }),
      el('div', { className: 'timeline__content' },
        item.body ? el('p', { className: 'prose pre-line', text: item.body }) : null,
        item.image ? polaroid({ src: item.image, alt: item.title || '', tilt: tiltClass(index), className: 'timeline__photo' }) : null,
      ),
      videoId ? el('a', {
        className: 'text-link', href: youTubeWatch(videoId), target: '_blank', rel: 'noopener noreferrer',
        text: '觀看相關影片（YouTube）',
      }) : null,
    ),
  );
}

function leaderTerm(l) {
  const start = formatDate(l.term_start);
  const end = l.term_end ? formatDate(l.term_end) : '至今';
  return `${start} – ${end}`;
}

async function main() {
  try {
    const [site, history, leaders, members] = await Promise.all([
      loadSite(), loadTable('history'), loadTable('leaders'), loadTable('members'),
    ]);
    const memberIds = new Set(members.map((m) => m.id));

    // 不同遊戲時期
    const periods = el('section', { className: 'story-periods', 'aria-labelledby': 'periods-title' },
      (() => { const h = tapeTitle('不同的遊戲時期'); h.id = 'periods-title'; return h; })(),
      el('div', { className: 'period-grid' },
        ['mabinogi_m', 'mabinogi_pc'].map((g) => site[`period_${g}`]
          ? el('article', { className: 'card period' },
            el('h3', { className: 'period__title' }, gameTag(g)),
            el('p', { className: 'prose pre-line', text: site[`period_${g}`] }),
          )
          : null),
      ),
    );

    // 時間軸
    const sorted = [...history].sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)));
    const list = el('ol', { className: 'timeline' });
    const status = el('p', { className: 'status', role: 'status', 'aria-live': 'polite' });
    const draw = (game) => {
      const items = sorted.filter((h) => matchesGame(h.game, game));
      list.replaceChildren(...items.map(timelineItem));
      showStatus(status, items.length ? '' : '這個時期還沒有紀錄。');
    };
    const timeline = el('section', { className: 'story-timeline', 'aria-labelledby': 'timeline-title' },
      (() => { const h = tapeTitle('時間軸'); h.id = 'timeline-title'; return h; })(),
      el('div', { className: 'filters' },
        filterGroup('遊戲', [
          { value: 'all', label: '全部' },
          { value: 'mabinogi_m', label: '瑪奇 M' },
          { value: 'mabinogi_pc', label: '瑪奇 PC' },
        ], 'all', draw),
      ),
      status,
      list,
    );
    draw('all');

    // 歷任會長
    const leaderList = el('ol', { className: 'leaders' },
      [...leaders].sort((a, b) => dateKey(a.term_start).localeCompare(dateKey(b.term_start))).map((l) => el('li', { className: 'leaders__item' },
        el('p', { className: 'leaders__name' },
          l.member_id && memberIds.has(l.member_id)
            ? el('a', { href: `member.html?id=${encodeURIComponent(l.member_id)}`, text: l.nickname || '' })
            : el('span', { text: l.nickname || '' }),
          l.term_end ? null : el('span', { className: 'tag tag--plain', text: '現任' }),
          demoBadge(l),
        ),
        el('p', { className: 'leaders__term', text: leaderTerm(l) }),
        l.note ? el('p', { className: 'leaders__note', text: l.note }) : null,
      )),
    );
    const leaderSection = el('section', { className: 'story-leaders card', 'aria-labelledby': 'leaders-title' },
      (() => { const h = tapeTitle('歷任會長'); h.id = 'leaders-title'; return h; })(),
      leaderList,
    );

    clear(root).append(
      el('div', { className: 'story-intro' },
        textSection('origin-title', '創立緣由', site.story_origin),
        textSection('name-title', '名稱由來', site.story_name),
      ),
      periods,
      timeline,
      leaderSection,
    );
  } catch (error) {
    console.warn(error);
    clear(root).append(errorBox());
  }
}

main();
