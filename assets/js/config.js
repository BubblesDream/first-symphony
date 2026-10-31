// 資料來源設定。
// 每張表對應一個 JSON 檔（＝試算表的一個分頁）。
// 日後改用 Google 試算表時，把 source 改成 'csv'、url 改成「發布到網路」的 CSV 網址即可。
export const TABLES = {
  site:    { source: 'json', url: 'data/site.json' },
  members: { source: 'json', url: 'data/members.json' },
  outfits: { source: 'json', url: 'data/outfits.json' },
  history: { source: 'json', url: 'data/history.json' },
  leaders: { source: 'json', url: 'data/leaders.json' },
  videos:  { source: 'json', url: 'data/videos.json' },
  gallery: { source: 'json', url: 'data/gallery.json' },
  quotes:  { source: 'json', url: 'data/quotes.json' },
};

// 需要轉成布林或數字的欄位（CSV 讀進來全部是字串）。
export const BOOLEAN_FIELDS = ['featured', 'is_demo'];
export const NUMBER_FIELDS = ['sort_order'];

// 遊戲顯示名稱，全站只在這裡定義。
export const GAMES = {
  mabinogi_m: '瑪奇 M',
  mabinogi_pc: '瑪奇（PC）',
  both: '兩款遊戲',
};

export const SITE_NAME = '第一交響樂團';

// 佔位圖
export const PLACEHOLDERS = {
  banner: 'assets/images/placeholders/banner.svg',
  avatar: 'assets/images/placeholders/avatar-1.svg',
  outfit: 'assets/images/placeholders/outfit-1.svg',
  photo: 'assets/images/placeholders/fallback.svg',
  video: 'assets/images/placeholders/video.svg',
};
