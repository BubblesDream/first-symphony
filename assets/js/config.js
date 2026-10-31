// 資料來源設定。
// 每張表對應試算表的一個分頁。第一版全部讀取本地 JSON；
// 日後改接 Google 試算表時，把 source 改成 'csv'、url 換成「發布到網路」的 CSV 網址即可。
// 例：members: { source: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv' }

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

// 各表欄位型別：沒列出的欄位一律當作字串。
// CSV 讀進來全是字串，data.js 依這裡把它們轉成布林或數字。
export const FIELD_TYPES = {
  members: { featured: 'boolean', sort_order: 'number', is_demo: 'boolean' },
  outfits: { sort_order: 'number', is_demo: 'boolean' },
  history: { is_demo: 'boolean' },
  leaders: { is_demo: 'boolean' },
  videos:  { featured: 'boolean', is_demo: 'boolean' },
  gallery: { featured: 'boolean', is_demo: 'boolean' },
  quotes:  { is_demo: 'boolean' },
};

// game 欄位的顯示名稱（全站只在這裡定義）
export const GAME_LABELS = {
  mabinogi_m: '瑪奇 M',
  mabinogi_pc: '瑪奇 PC',
  both: '瑪奇 M／瑪奇 PC',
};
