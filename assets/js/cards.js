// 多個頁面共用的卡片：成員、照片、影片。
import { el, image, demoBadge, gameTag, formatDate } from './render.js';
import { safeImageUrl, youtubeId, youtubeThumbnail, youtubeEmbedUrl, youtubeWatchUrl } from './validate.js';
import { PLACEHOLDERS } from './config.js';

export function memberCard(member) {
  return el('article', { className: 'card member-card' }, [
    el('a', { className: 'card__link', attrs: { href: `member.html?id=${encodeURIComponent(member.id)}` } }, [
      el('div', { className: 'photo' }, [image(safeImageUrl(member.avatar, 'avatar'), `${member.nickname} 的頭像`, { width: 480, height: 480 })]),
      el('h3', { text: member.nickname }),
    ]),
    el('div', { className: 'meta' }, [gameTag(member.game), member.role ? el('span', { text: member.role }) : null, demoBadge(member.is_demo)]),
  ]);
}

// 一次只播放一支影片：開新的之前，把上一支換回縮圖。
let activeVideo = null;

// 回傳 null 代表網址格式錯誤、不顯示；網址留空則顯示佔位卡片。
export function videoCard(video) {
  const id = youtubeId(video.youtube_url);
  if (!id && video.youtube_url) return null;

  const frame = el('div', { className: 'video-frame' });
  const links = el('p', { className: 'video-links' });

  if (id) {
    const showThumb = () => {
      frame.replaceChildren(
        image(youtubeThumbnail(id), '', { width: 480, height: 360 }),
        el('button', {
          className: 'video-play',
          attrs: { type: 'button', 'aria-label': `播放影片：${video.title}` },
          on: { click: play },
        }),
      );
    };
    const play = () => {
      if (activeVideo && activeVideo !== showThumb) activeVideo();
      activeVideo = showThumb;
      const iframe = el('iframe', {
        attrs: {
          src: youtubeEmbedUrl(id),
          title: video.title,
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: true,
          referrerpolicy: 'strict-origin-when-cross-origin',
        },
      });
      frame.replaceChildren(iframe);
      iframe.focus();
    };
    showThumb();
    links.append(el('a', { text: '在 YouTube 開啟', attrs: { href: youtubeWatchUrl(id), target: '_blank', rel: 'noopener noreferrer' } }));
  } else {
    frame.append(image(PLACEHOLDERS.video, '影片佔位圖：尚未提供影片網址', { width: 640, height: 360 }));
    links.append(el('span', { className: 'meta', text: '尚未提供影片網址' }));
  }

  return el('article', { className: 'card video-card' }, [
    el('div', { className: 'photo' }, [frame]),
    el('h3', { text: video.title }),
    el('div', { className: 'meta' }, [
      video.published ? el('span', { text: formatDate(video.published) }) : null,
      gameTag(video.game),
      video.category ? el('span', { text: video.category }) : null,
      demoBadge(video.is_demo),
    ]),
    video.summary ? el('p', { className: 'pre-line', text: video.summary }) : null,
    links,
  ]);
}
