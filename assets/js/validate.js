// 網址與欄位驗證。所有圖片網址與 YouTube 網址都要經過這裡。

export const PLACEHOLDERS = {
  image: 'assets/images/placeholders/image.svg',
  avatar: 'assets/images/placeholders/avatar.svg',
  outfit: 'assets/images/placeholders/outfit.svg',
  video: 'assets/images/placeholders/video.svg',
  banner: 'assets/images/placeholders/banner.svg',
  story: 'assets/images/placeholders/story.svg',
};

/**
 * 圖片網址只允許：
 * 1. 網站內 assets/ 底下的相對路徑（不可含 ..、反斜線或協定）
 * 2. https:// 開頭的網址
 * 其餘一律回傳佔位圖。
 */
export function safeImageUrl(url, fallback = PLACEHOLDERS.image) {
  if (typeof url !== 'string') return fallback;
  const value = url.trim();
  if (!value) return fallback;

  if (/^assets\/[A-Za-z0-9._\-/]+$/.test(value) && !value.includes('..')) {
    return value;
  }
  if (/^https:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.protocol === 'https:') return parsed.href;
    } catch {
      /* 格式錯誤就用佔位圖 */
    }
  }
  return fallback;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * 從 YouTube 網址抽出 11 碼影片 ID。只接受：
 * youtube.com/watch?v=、youtu.be/、youtube.com/shorts/、youtube.com/embed/
 * 不符合時回傳 null。
 */
export function parseYouTubeId(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const host = parsed.hostname.replace(/^(www\.|m\.)/, '');
  let id = null;
  if (host === 'youtu.be') {
    id = parsed.pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') {
      id = parsed.searchParams.get('v');
    } else {
      const match = parsed.pathname.match(/^\/(shorts|embed)\/([^/]+)/);
      if (match) id = match[2];
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function youTubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youTubeEmbed(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
}

export function youTubeWatch(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** id 只允許英數小寫與連字號 */
export function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9-]+$/.test(id);
}
