// 資料來源與共用設定。
// 每張表對應試算表的一個分頁。第一版全部讀本地 JSON；
// 改用 Google 試算表時，把 type 改成 'csv'、url 換成「發布到網路」的 CSV 網址即可。
export const DATA_SOURCES = {
  site:    { type: 'json', url: 'data/site.json' },
  members: { type: 'json', url: 'data/members.json' },
  outfits: { type: 'json', url: 'data/outfits.json' },
  history: { type: 'json', url: 'data/history.json' },
  leaders: { type: 'json', url: 'data/leaders.json' },
  videos:  { type: 'json', url: 'data/videos.json' },
  gallery: { type: 'json', url: 'data/gallery.json' },
  quotes:  { type: 'json', url: 'data/quotes.json' },
};

// 各表欄位的型別（CSV 讀進來全是字串，靠這裡轉回布林與數字）。
export const TABLE_FIELDS = {
  site:    { boolean: [], number: [] },
  members: { boolean: ['featured', 'is_demo'], number: ['sort_order'] },
  outfits: { boolean: ['is_demo'], number: ['sort_order'] },
  history: { boolean: ['is_demo'], number: [] },
  leaders: { boolean: ['is_demo'], number: [] },
  videos:  { boolean: ['featured', 'is_demo'], number: [] },
  gallery: { boolean: ['featured', 'is_demo'], number: [] },
  quotes:  { boolean: ['is_demo'], number: [] },
};

// game 欄位的顯示名稱（全站只在這裡定義）。
export const GAME_LABELS = {
  mabinogi_m: '瑪奇 M',
  mabinogi_pc: '瑪奇（PC）',
  both: '瑪奇 M／瑪奇（PC）',
};

// 頁首固定文字（其餘文字由 data/site.json 提供）。
export const SITE_NAME = '第一交響樂團';
export const SITE_BAND_TEXT = '不同的遊戲，相同的夥伴，一樣的第一交響樂團。';

export const NAV_ITEMS = [
  { page: 'story', href: 'story.html', label: '故事' },
  { page: 'members', href: 'members.html', label: '成員' },
  { page: 'videos', href: 'videos.html', label: '影片' },
  { page: 'gallery', href: 'gallery.html', label: '紀念館' },
  { page: 'hall', href: 'hall.html', label: '大廳' },
];

// 圖片驗證失敗或未填時使用的本地佔位圖。
export const PLACEHOLDERS = {
  banner: 'assets/images/placeholders/banner.svg',
  avatar: 'assets/images/placeholders/avatar.svg',
  outfit: 'assets/images/placeholders/outfit.svg',
  photo: 'assets/images/placeholders/photo.svg',
  history: 'assets/images/placeholders/history.svg',
  video: 'assets/images/placeholders/video.svg',
};
