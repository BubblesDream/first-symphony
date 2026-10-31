// 全站共用的小元件（紙膠帶標題、拍立得、膠卷影片卡、篩選按鈕等）。
import { el, img, formatDate, gameLabel } from './render.js';
import { parseYouTubeId, youTubeThumb, youTubeEmbed, youTubeWatch, PLACEHOLDERS } from './validate.js';

// 五種角度（含不傾斜），在四欄格線中也不會整欄同一個角度
const TILTS = ['tilt-a', 'tilt-b', 'tilt-c', 'tilt-d', ''];
export function tiltClass(index) {
  return TILTS[index % TILTS.length];
}

/** 紙膠帶樣式的區塊標題 */
export function tapeTitle(text, level = 'h2', className = '') {
  return el(level, { className: `tape-title ${className}`.trim() }, el('span', { className: 'tape', text }));
}

export function demoBadge(item) {
  if (!item || !item.is_demo) return null;
  return el('span', { className: 'demo-badge', text: '示範資料' });
}

export function gameTag(game) {
  const label = gameLabel(game);
  if (!label) return null;
  return el('span', { className: `tag tag--${game}`, text: label });
}

/** 拍立得照片（白邊＋手寫說明） */
export function polaroid({ src, alt, caption, fallback, tilt = '', tape = false, className = '' }) {
  return el('figure', { className: `polaroid ${tilt} ${tape ? 'has-tape' : ''} ${className}`.replace(/\s+/g, ' ').trim() },
    img(src, alt, { fallback }),
    caption ? el('figcaption', { text: caption }) : null,
  );
}

/** 手寫便條 */
export function handNote(text, className = '') {
  if (!text) return null;
  return el('p', { className: `hand-note ${className}`.trim(), text });
}

/** 讀取中／錯誤／沒有資料 的訊息 */
export function showStatus(node, message, type = 'info') {
  if (!node) return;
  node.textContent = message;
  node.dataset.type = type;
  node.hidden = !message;
}

export function errorBox(message = '資料讀取失敗，請稍後重新整理頁面。') {
  return el('div', { className: 'error-box', role: 'alert' },
    el('p', { text: message }),
    el('p', { className: 'error-box__hint', text: '若是在自己電腦上預覽，請用 python3 -m http.server 8000 啟動後再開啟網頁。' }),
  );
}

/**
 * 篩選按鈕組。options: [{ value, label }]
 * onChange(value) 會在切換時呼叫。
 */
export function filterGroup(label, options, current, onChange) {
  const buttons = [];
  const group = el('div', { className: 'filter', role: 'group', 'aria-label': label },
    el('span', { className: 'filter__label', text: label }),
  );
  for (const option of options) {
    const button = el('button', {
      type: 'button',
      className: 'chip',
      'aria-pressed': option.value === current ? 'true' : 'false',
      text: option.label,
      on: {
        click: () => {
          buttons.forEach((b) => b.setAttribute('aria-pressed', b === button ? 'true' : 'false'));
          onChange(option.value);
        },
      },
    });
    buttons.push(button);
    group.append(button);
  }
  return group;
}

// ---------- 影片 ----------
// 同一時間只允許一個 iframe：播放新影片時，把上一支還原成縮圖。
let playing = null;

/**
 * 膠卷框影片卡。網址空白顯示佔位卡片；網址不合法回傳 null（不顯示）。
 */
export function videoCard(video, { compact = false, headingLevel = 'h3' } = {}) {
  const hasUrl = Boolean(video.youtube_url);
  const id = parseYouTubeId(video.youtube_url);
  if (hasUrl && !id) return null;

  const frame = el('div', { className: 'film__frame' });
  const film = el('div', { className: 'film' }, frame);

  if (id) {
    const thumb = el('button', {
      type: 'button',
      className: 'film__play',
      'aria-label': `播放影片：${video.title || ''}`,
    },
    img(youTubeThumb(id), '', { fallback: PLACEHOLDERS.video }),
    el('span', { className: 'film__icon', 'aria-hidden': 'true' }),
    );
    const restore = () => frame.replaceChildren(thumb);
    thumb.addEventListener('click', () => {
      if (playing && playing.restore !== restore) playing.restore();
      const iframe = el('iframe', {
        src: youTubeEmbed(id),
        title: video.title || 'YouTube 影片',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen: true,
        referrerpolicy: 'strict-origin-when-cross-origin',
        loading: 'lazy',
      });
      frame.replaceChildren(iframe);
      iframe.focus();
      playing = { restore };
    });
    frame.append(thumb);
  } else {
    frame.append(
      img(PLACEHOLDERS.video, '佔位圖：影片縮圖', { fallback: PLACEHOLDERS.video }),
      el('span', { className: 'film__empty', text: '尚未設定影片網址' }),
    );
  }

  const meta = el('p', { className: 'meta' },
    video.published ? el('time', { datetime: video.published, text: formatDate(video.published) }) : null,
    gameTag(video.game),
    video.category ? el('span', { className: 'tag tag--plain', text: video.category }) : null,
    demoBadge(video),
  );

  const body = el('div', { className: 'video-card__body' },
    el(headingLevel, { className: 'video-card__title', text: video.title || '（未命名影片）' }),
    meta,
    !compact && video.summary ? el('p', { className: 'video-card__summary', text: video.summary }) : null,
    id ? el('a', {
      className: 'text-link',
      href: youTubeWatch(id),
      target: '_blank',
      rel: 'noopener noreferrer',
      text: '在 YouTube 開啟',
    }) : null,
  );

  return el('article', { className: `video-card ${compact ? 'video-card--compact' : ''}`.trim() }, film, body);
}
