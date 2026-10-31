// 網址與欄位驗證。所有來自資料的圖片與 YouTube 網址都要經過這裡。
import { GAME_LABELS, PLACEHOLDERS } from './config.js';

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function isValidId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

export function isValidGame(value) {
  return Object.prototype.hasOwnProperty.call(GAME_LABELS, value);
}

// 只允許 assets/ 底下的相對路徑，或 https:// 網址；其他一律回傳佔位圖。
export function safeImageUrl(value, fallbackKey = 'photo') {
  const fallback = PLACEHOLDERS[fallbackKey] || PLACEHOLDERS.photo;
  if (typeof value !== 'string') return fallback;
  const url = value.trim();
  if (!url) return fallback;

  if (url.startsWith('assets/')) {
    // 不准跳出網站目錄、不准夾帶協定或反斜線
    if (url.includes('..') || url.includes('\\') || url.includes(':')) return fallback;
    return url;
  }
  if (url.toLowerCase().startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' && parsed.hostname) return parsed.href;
    } catch {
      /* 網址格式錯誤，改用佔位圖 */
    }
  }
  return fallback;
}

// 從 YouTube 網址抽出 11 碼影片 ID；格式不符回傳 null。
// 只接受 youtube.com/watch?v=、youtu.be/、youtube.com/shorts/、youtube.com/embed/。
export function youtubeId(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const host = parsed.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
  const parts = parsed.pathname.split('/').filter(Boolean);
  let id = null;

  if (host === 'youtu.be') {
    id = parts[0] || null;
  } else if (host === 'youtube.com') {
    if (parts[0] === 'watch') id = parsed.searchParams.get('v');
    else if (parts[0] === 'shorts' || parts[0] === 'embed') id = parts[1] || null;
  }
  return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
}

export function youtubeThumbnail(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}

export function youtubeWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}
