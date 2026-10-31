// 多頁共用的卡片元件（照片、成員、影片）。

import { el, image, gameTag, gameLabel, demoBadge, formatShortDate, formatDate } from './render.js';
import { youtubeId, youtubeThumb, youtubeEmbed, youtubeWatch, isValidId } from './validate.js';
import { PLACEHOLDERS } from './config.js';

/** 拍立得照片（白邊、不傾斜）。 */
export function photoFigure(item, options = {}) {
  const meta = [formatShortDate(item.date), item.category].filter(Boolean).join('・');
  return el('figure', { className: 'polaroid' }, [
    el('div', { className: 'polaroid__frame' }, [
      image(options.useFull ? item.image : (item.thumb || item.image), item.title || '相簿照片', PLACEHOLDERS.photo,
        { width: 1200, height: 900, eager: options.eager }),
    ]),
    el('figcaption', { className: 'polaroid__caption' }, [
      el('span', { className: 'polaroid__title', text: item.title }),
      el('span', { className: 'polaroid__meta' }, [meta, demoBadge(item.is_demo)]),
    ]),
  ]);
}

/** 成員卡片（連到詳情頁）。 */
export function memberCard(member, options = {}) {
  const href = isValidId(member.id) ? `member.html?id=${encodeURIComponent(member.id)}` : 'members.html';
  return el('a', { className: `member-card${options.compact ? ' member-card--compact' : ''}`, attrs: { href } }, [
    el('div', { className: 'member-card__photo' }, [
      image(member.avatar, `${member.nickname} 的頭像`, PLACEHOLDERS.avatar, { width: 600, height: 600 }),
    ]),
    el('div', { className: 'member-card__body' }, [
      el('span', { className: 'member-card__name', text: member.nickname }),
      member.role ? el('span', { className: 'member-card__role', text: member.role }) : null,
      options.compact ? null : el('span', { className: 'member-card__tags' }, [gameTag(member.game), demoBadge(member.is_demo)]),
    ]),
  ]);
}

// 同一時間只播放一部影片：開新的時把舊的還原成縮圖。
let activePlayer = null;

function stopActive() {
  if (activePlayer) {
    activePlayer.restore();
    activePlayer = null;
  }
}

/** 影片卡片：只顯示縮圖，點擊後才在原地載入 iframe。 */
export function videoCard(video, options = {}) {
  const id = youtubeId(video.youtube_url);
  const HeadingTag = options.headingLevel || 'h3';
  const media = el('div', { className: 'film' });
  const meta = [formatDate(video.published), gameLabel(video.game), video.category].filter(Boolean).join('・');

  if (id) {
    const button = el('button', {
      className: 'film__play',
      attrs: { type: 'button', 'aria-label': `播放影片：${video.title}` },
    }, [
      image(youtubeThumb(id), '', PLACEHOLDERS.video, { width: 480, height: 360 }),
      el('span', { className: 'film__icon', attrs: { 'aria-hidden': 'true' } }),
    ]);
    const restore = () => {
      media.replaceChildren(button);
    };
    button.addEventListener('click', () => {
      stopActive();
      const iframe = el('iframe', {
        attrs: {
          src: youtubeEmbed(id),
          title: video.title || 'YouTube 影片',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: true,
          referrerpolicy: 'strict-origin-when-cross-origin',
        },
      });
      media.replaceChildren(iframe);
      activePlayer = { restore };
      iframe.focus();
    });
    media.append(button);
  } else {
    media.classList.add('film--empty');
    media.append(
      image(PLACEHOLDERS.video, '', PLACEHOLDERS.video, { width: 1280, height: 720 }),
      el('span', { className: 'film__empty-label', text: '示範影片・尚未提供網址' }),
    );
  }

  return el('article', { className: 'video-card' }, [
    media,
    el('div', { className: 'video-card__body' }, [
      el(HeadingTag, { className: 'video-card__title', text: video.title }),
      el('p', { className: 'video-card__meta' }, [meta, demoBadge(video.is_demo)]),
      video.summary && !options.compact ? el('p', { className: 'video-card__summary', text: video.summary }) : null,
      id ? el('a', {
        className: 'text-link',
        text: '在 YouTube 開啟',
        attrs: { href: youtubeWatch(id), target: '_blank', rel: 'noopener noreferrer' },
      }) : null,
    ]),
  ]);
}
