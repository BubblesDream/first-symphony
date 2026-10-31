# 第一交響樂團｜公會紀念網站

《瑪奇 M》與《瑪奇》（PC）公會「第一交響樂團」的紀念網站。
網址：<https://bubblesdream.github.io/first-symphony/>

純 HTML／CSS／原生 JavaScript／JSON，不需要安裝任何東西、也沒有建置步驟。完整規格見 `docs/spec.md`。

> 目前所有內容都是**示範資料**（名稱都以「示範」開頭，年份用 2091 年以後的虛構年份，避免被誤認為真實公會歷史）。換成正式內容時，把該筆資料的 `is_demo` 改成 `false`。

## 本機預覽

直接雙擊 HTML 檔會因為瀏覽器的安全限制讀不到資料，請在專案資料夾執行：

```bash
python3 -m http.server 8000
```

然後開啟 <http://localhost:8000/>。

## 檔案位置

| 位置 | 內容 |
|---|---|
| `*.html` | 各頁面（首頁、故事、成員、成員詳情、影片、紀念館、大廳、404） |
| `data/*.json` | 所有內容資料，一個檔案＝試算表的一個分頁 |
| `assets/css/tokens.css` | 配色、字型、字級、間距（換版只要改這裡） |
| `assets/css/` 其他檔案 | `base.css` 基本樣式、`components.css` 共用元件、`pages.css` 各頁版面 |
| `assets/js/config.js` | 每張資料表的來源設定、遊戲名稱 |
| `assets/js/data.js` | 讀取資料的唯一入口（含 CSV 解析） |
| `assets/js/validate.js` | 圖片網址與 YouTube 網址檢查 |
| `assets/images/` | 圖片：`members/` 頭像、`outfits/` 造型、`gallery/` 相簿、`history/` 歷史、`placeholders/` 佔位圖 |

## 修改內容

每個 JSON 檔都是「一列一筆」的清單，每筆只有簡單欄位（文字、數字、true/false），不要在欄位裡再放清單或物件。

共同規則：

- `id`：只用英文小寫、數字、連字號，例如 `cello-2024`，不能重複。
- 日期：寫成 `2024`、`2024-03` 或 `2024-03-15` 都可以，畫面會依精度顯示。
- `game`：只能是 `mabinogi_m`（瑪奇 M）、`mabinogi_pc`（瑪奇 PC）、`both`（兩者）。
- 內文：純文字，要換行就在文字裡寫 `\n`。不支援 HTML。
- 圖片：放在 `assets/images/` 對應資料夾，欄位寫相對路徑，例如 `assets/images/members/cello.png`；也可以填 `https://` 開頭的網址。其他格式會自動換成佔位圖。
- 選填欄位不需要時，整個欄位刪掉或留空字串都可以。
- `is_demo`：示範資料填 `true`（畫面會標示「示範資料」），正式資料填 `false`。

### 成員 `data/members.json`

```json
{
  "id": "cello",
  "nickname": "遊戲暱稱",
  "game": "mabinogi_m",
  "role": "會長",
  "avatar": "assets/images/members/cello.png",
  "intro": "自我介紹",
  "joined": "2024-03",
  "featured": true,
  "sort_order": 1,
  "is_demo": false
}
```

`featured: true` 的成員會出現在首頁預覽（最多 6 位）；`sort_order` 數字小的排前面。

### 造型 `data/outfits.json`

每一套造型一筆，用 `member_id` 對到成員的 `id`：

```json
{ "id": "cello-outfit-1", "member_id": "cello", "name": "造型名稱", "image": "assets/images/outfits/cello-1.png", "note": "小故事（選填）", "sort_order": 1, "is_demo": false }
```

造型圖建議直式 3:4。

### 照片 `data/gallery.json`

```json
{ "id": "photo-2024-01", "image": "assets/images/gallery/2024-01.jpg", "thumb": "", "title": "標題", "caption": "說明", "date": "2024-01", "game": "both", "category": "團體合照", "featured": true, "is_demo": false }
```

`thumb` 是選填的小圖；`category` 是自由文字，紀念館的「分類」篩選會自動列出所有出現過的分類；`featured: true` 的前 3 張會出現在首頁。

### 影片 `data/videos.json`

```json
{ "id": "video-anniversary", "youtube_url": "https://www.youtube.com/watch?v=XXXXXXXXXXX", "title": "標題", "published": "2024-03", "game": "both", "category": "活動紀錄", "summary": "簡介", "featured": true, "is_demo": false }
```

`youtube_url` 接受 `youtube.com/watch?v=`、`youtu.be/`、`youtube.com/shorts/`、`youtube.com/embed/` 四種格式。網址留空會顯示「尚未設定影片網址」的佔位卡片；格式不對的影片不會顯示。只放願意公開的影片。

### 歷史事件 `data/history.json`

```json
{ "id": "founding", "date": "2024-03", "title": "標題", "body": "內文", "image": "assets/images/history/founding.jpg", "video_url": "", "game": "mabinogi_m", "is_demo": false }
```

`image`、`video_url` 選填。時間軸依日期排序。

### 歷任會長 `data/leaders.json`

```json
{ "id": "leader-1", "nickname": "暱稱", "member_id": "cello", "term_start": "2024-03", "term_end": "", "note": "", "is_demo": false }
```

`term_end` 留空代表現任；`member_id` 有填且對得到成員時，名字會連到成員頁。

### 語錄 `data/quotes.json`

```json
{ "id": "quote-1", "text": "語錄內容", "speaker": "說話的人", "date": "2024", "context": "背景（選填）", "is_demo": false }
```

### 網站文字 `data/site.json`

`key` / `value` 兩欄，例如首頁橫幅圖 `banner_image`、橫幅引言 `banner_quote`、故事摘要 `story_summary`、創立緣由 `story_origin`、名稱由來 `story_name`、頁尾短句 `footer_quote` 等。直接改 `value` 即可。

## 未來改接 Google 試算表

1. 建一份 Google 試算表，每個分頁對應一個 JSON 檔（分頁名稱用 `members`、`outfits`…），第一列是欄位名稱，欄位名稱和 JSON 相同。
2. 布林欄位填 `TRUE`／`FALSE`，數字欄位填數字，選填欄位可留空。
3. 「檔案 → 共用 → 發布到網路」，選擇要發布的分頁、格式選「逗號分隔值 (.csv)」，複製網址。每個分頁各發布一次。
4. 打開 `assets/js/config.js`，把對應的表改成：

   ```js
   members: { source: 'csv', url: '貼上剛剛複製的 CSV 網址' },
   ```

5. 存檔、推上 GitHub 即可。頁面程式不需要修改，`data.js` 會自動把文字轉成布林與數字。

注意：發布到網路的試算表任何人都看得到，只放可以公開的資訊（遊戲暱稱、截圖網址、影片網址），不要放真實姓名或聯絡方式。

## 部署（GitHub Pages）

1. Settings → Pages → Source 選「Deploy from a branch」。
2. Branch 選 `main`、資料夾選 `/ (root)`，儲存。
3. 幾分鐘後開啟 <https://bubblesdream.github.io/first-symphony/>。

根目錄的 `.nojekyll` 讓 GitHub 直接提供檔案，不經過 Jekyll 處理。所有連結都是相對路徑，所以網站在子路徑底下也能正常運作。
