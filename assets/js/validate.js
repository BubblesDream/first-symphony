// 網址與欄位驗證。所有外部來的圖片網址、YouTube 網址都要經過這裡。

const LOCAL_ASSET = /^assets\/[A-Za-z0-9._\-/]+$/;
const HTTPS_URL = /^https:\/\/[^\s"'<>\\]+$/i;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const RECORD_ID = /^[a-z0-9-]+$/;

/** 圖片網址只接受 assets/ 底下的相對路徑或 https:// 網址，否則回傳 fallback。 */
export function safeImageUrl(url, fallback) {
  if (typeof url !== 'string') return fallback;
  const value = url.trim();
  if (LOCAL_ASSET.test(value) && !value.includes('..')) return value;
  if (HTTPS_URL.test(value)) return value;
  return fallback;
}

/** 從 YouTube 網址抽出 11 碼影片 ID，格式不符回傳 null。 */
export function youtubeId(url) {
  if (typeof url !== 'string' || url.trim() === '') return null;
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const host = parsed.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
  let id = null;
  if (host === 'youtu.be') {
    id = parsed.pathname.split('/')[1] || null;
  } else if (host === 'youtube.com') {
    if (parsed.pathname === '/watch') {
      id = parsed.searchParams.get('v');
    } else {
      const match = parsed.pathname.match(/^\/(shorts|embed)\/([^/]+)/);
      if (match) id = match[2];
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export const youtubeThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeEmbed = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
export const youtubeWatch = (id) => `https://www.youtube.com/watch?v=${id}`;

/** 資料 id 只允許英數小寫與連字號。 */
export function isValidId(id) {
  return typeof id === 'string' && RECORD_ID.test(id);
}

/** 日期字串：YYYY、YYYY-MM、YYYY-MM-DD。回傳 { year, month, day } 或 null。 */
export function parseDate(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: match[2] ? Number(match[2]) : null,
    day: match[3] ? Number(match[3]) : null,
  };
}
