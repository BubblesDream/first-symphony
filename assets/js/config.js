// 資料來源設定。
// 每張表對應「網站用」Google 試算表的一個分頁。
//
// 試算表分頁（source: 'csv'）：
//   url      ＝「檔案 → 共用 → 發布到網路」產生的 CSV 網址，每個分頁一個，格式像：
//              https://docs.google.com/spreadsheets/d/e/<文件代碼>/pub?gid=<分頁代碼>&single=true&output=csv
//              發布時「整份文件」改選該分頁、格式選「逗號分隔值 (.csv)」。
//   fallback ＝本地 JSON 路徑。url 還沒填（空字串）時直接讀它；試算表讀取失敗時也會自動改讀它。
//   skipRows ＝第 1 列欄位名稱之後要略過幾列。試算表第 2 列是中文說明，所以填 1。
//
// 網址目前都還沒有，由管理員之後填進下面的 url。

const SHEET = { source: 'csv', skipRows: 1 };

export const TABLES = {
  site:    { ...SHEET, url: '', fallback: 'data/site.json' },     // 分頁：公會設定
  members: { ...SHEET, url: '', fallback: 'data/members.json' },  // 分頁：成員
  outfits: { ...SHEET, url: '', fallback: 'data/outfits.json' },  // 分頁：造型
  albums:  { ...SHEET, url: '', fallback: 'data/albums.json' },   // 分頁：相簿（一本相簿一列）
  videos:  { ...SHEET, url: '', fallback: 'data/videos.json' },   // 分頁：影片
  history: { ...SHEET, url: '', fallback: 'data/history.json' },  // 分頁：歷史
  leaders: { ...SHEET, url: '', fallback: 'data/leaders.json' },  // 分頁：歷任會長
  quotes:  { ...SHEET, url: '', fallback: 'data/quotes.json' },   // 分頁：語錄
  // 相簿照片清單（一張照片一列）由同步程式從雲端硬碟產生，固定讀本地檔，不走試算表。
  gallery: { source: 'json', url: 'data/gallery.json' },
  // 虛擬公會城堡（hall.html）專用：成員外觀與台詞。第一版只讀本地檔，日後可改成試算表分頁。
  castle_looks: { source: 'json', url: 'data/castle_looks.json' },
  castle_lines: { source: 'json', url: 'data/castle_lines.json' },
};

// 各表欄位型別：沒列出的欄位一律當作字串。
// CSV 讀進來全是字串，data.js 依這裡把它們轉成布林或數字。
export const FIELD_TYPES = {
  members: { featured: 'boolean', sort_order: 'number', is_demo: 'boolean' },
  outfits: { sort_order: 'number', is_demo: 'boolean' },
  history: { is_demo: 'boolean' },
  leaders: { sort_order: 'number', is_demo: 'boolean' },
  videos:  { featured: 'boolean', is_demo: 'boolean' },
  albums:  { featured: 'boolean', is_demo: 'boolean' },
  gallery: { sort_order: 'number' },
  quotes:  { is_demo: 'boolean' },
  castle_looks: { is_demo: 'boolean' },
  castle_lines: { is_demo: 'boolean' },
};

// game 欄位的顯示名稱（全站只在這裡定義）
export const GAME_LABELS = {
  mabinogi_m: '瑪奇 M',
  mabinogi_pc: '瑪奇 PC',
  both: '瑪奇 M／瑪奇 PC',
};
