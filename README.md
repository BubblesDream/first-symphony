# 第一交響樂團｜公會紀念網站

《瑪奇 M》與《瑪奇》（PC）公會「第一交響樂團」的紀念網站。
網址：<https://bubblesdream.github.io/first-symphony/>

純 HTML／CSS／JavaScript，不需要安裝任何套件，也沒有建置步驟。

> 目前網站上的成員、照片、影片、歷史與語錄全部是**示範資料**（`is_demo: true`），之後換成公會的真實內容。

## 本機預覽

```bash
python3 -m http.server 8000
```

然後用瀏覽器開啟 <http://localhost:8000/>。

直接雙擊 HTML 檔案會因為瀏覽器的安全限制讀不到資料，請一定要用上面的方式開啟。

## 檔案在哪裡

| 位置 | 內容 |
|---|---|
| `index.html` 等 `.html` | 各頁面（首頁、故事、成員、成員詳情、影片、紀念館、虛擬大廳、404） |
| `data/*.json` | 所有內容資料，一個檔案＝試算表的一個分頁 |
| `assets/images/` | 圖片。`placeholders/` 是目前的佔位圖；正式圖片放 `members/`、`outfits/`、`gallery/`、`history/` |
| `assets/css/tokens.css` | 配色、字型、字級、間距等設定，換版時主要改這裡 |
| `assets/js/config.js` | 資料來源設定、遊戲顯示名稱 |
| `assets/js/data.js` | 讀取資料的唯一入口 |

## 修改內容

所有內容都在 `data/` 資料夾。每個檔案是一個清單，每一筆用 `{ }` 包起來，筆與筆之間用逗號分隔。改完存檔、重新整理網頁即可看到結果。

共通規則：

- `id`：只能用**英文小寫、數字、連字號**，例如 `bubble-cat`，而且不能重複。
- 日期：可以寫 `2024`、`2024-05` 或 `2024-05-12` 三種。
- `game`：只能填 `mabinogi_m`（瑪奇 M）、`mabinogi_pc`（瑪奇 PC）、`both`（兩款都有）。
- 圖片：填 `assets/images/...` 開頭的相對路徑，或 `https://` 開頭的網址。其他格式會自動換成佔位圖。
- 內文要換行，在文字中寫 `\n`。不支援 HTML 語法。
- `is_demo`：正式資料請填 `false`（或直接刪掉這一欄）；填 `true` 的資料畫面上會標示「示範資料」。
- `featured`：填 `true` 會出現在首頁精選。
- 不要放真實姓名或聯絡方式，只放遊戲暱稱。

### 新增成員（`data/members.json`）

1. 把頭像（建議正方形）放到 `assets/images/members/`。
2. 新增一筆：

```json
{
  "id": "bubble-cat",
  "nickname": "泡泡貓",
  "game": "mabinogi_m",
  "role": "團員",
  "avatar": "assets/images/members/bubble-cat.png",
  "intro": "自我介紹文字。",
  "joined": "2024-05",
  "featured": false,
  "sort_order": 7,
  "is_demo": false
}
```

`sort_order` 數字越小排越前面；`role`、`joined` 可以不填。成員詳情頁網址是 `member.html?id=bubble-cat`。

### 新增造型（`data/outfits.json`）

圖片建議 3:4 直式，放到 `assets/images/outfits/`。`member_id` 要填成員的 `id`。

```json
{ "id": "bubble-cat-summer", "member_id": "bubble-cat", "name": "夏日浴衣", "image": "assets/images/outfits/bubble-cat-summer.png", "note": "", "sort_order": 1, "is_demo": false }
```

### 新增照片（`data/gallery.json`）

圖片建議 4:3 橫式，放到 `assets/images/gallery/`。`thumb` 是縮圖（可留空，會直接用原圖）；`category` 自由填寫（例如「合照」「活動」），篩選選單會自動列出。

```json
{ "id": "photo-2024-summer", "image": "assets/images/gallery/2024-summer.jpg", "thumb": "", "title": "夏日合照", "caption": "照片說明", "date": "2024-08", "game": "mabinogi_m", "category": "合照", "featured": true, "is_demo": false }
```

### 新增影片（`data/videos.json`）

`youtube_url` 可以貼這幾種網址：`https://www.youtube.com/watch?v=...`、`https://youtu.be/...`、`https://www.youtube.com/shorts/...`、`https://www.youtube.com/embed/...`。網址格式不對時會顯示佔位卡片。只放成員同意公開的影片。

```json
{ "id": "video-2024-concert", "youtube_url": "https://youtu.be/影片ID", "title": "演奏會", "published": "2024-08", "game": "mabinogi_m", "category": "活動紀錄", "summary": "影片簡介", "featured": true, "is_demo": false }
```

### 新增歷史事件（`data/history.json`）

`image`（建議 4:3，放 `assets/images/history/`）與 `video_url`（YouTube 網址）都可以留空。事件會依日期自動排序。

```json
{ "id": "event-2024-anniv", "date": "2024-03", "title": "四週年", "body": "內文", "image": "", "video_url": "", "game": "both", "is_demo": false }
```

### 歷任會長（`data/leaders.json`）

`member_id` 填了會連到成員頁（可留空）；`term_end` 留空代表現任。

```json
{ "id": "leader-4", "nickname": "泡泡貓", "member_id": "bubble-cat", "term_start": "2025-01", "term_end": "", "note": "", "is_demo": false }
```

### 經典語錄（`data/quotes.json`）

```json
{ "id": "quote-5", "text": "語錄內容", "speaker": "泡泡貓", "date": "2024", "context": "說這句話的情境", "is_demo": false }
```

### 網站文字（`data/site.json`）

這張表只有 `key`、`value` 兩欄，用來放公會介紹、橫幅圖片與引言、故事摘要、創立緣由、名稱由來、各遊戲時期的介紹等。修改 `value` 即可。

## 未來改用 Google 試算表

資料表的欄位刻意設計成「一個 JSON 檔＝試算表一個分頁、第一列是欄位名稱」，可以直接搬過去。

1. 建立一份 Google 試算表，每個 JSON 檔建立一個分頁（`members`、`outfits`…），第一列填欄位名稱，之後每列一筆資料。布林值填 `TRUE`／`FALSE`。
2. 試算表只放可以公開的資訊（任何人都看得到）。
3. 「檔案」→「共用」→「發布到網路」，選擇該分頁、格式選「逗號分隔值（.csv）」，複製網址。每個分頁各做一次。
4. 打開 `assets/js/config.js`，把對應的表改成：

   ```js
   members: { source: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&single=true&output=csv' },
   ```

5. 重新整理網頁確認。頁面程式不需要修改，`data.js` 會自動解析 CSV 並轉換型別。

## 部署（GitHub Pages）

1. repo 的 Settings → Pages → Source 選「Deploy from a branch」。
2. Branch 選 `main`、資料夾選 `/ (root)`，按 Save。
3. 幾分鐘後開啟 <https://bubblesdream.github.io/first-symphony/>。

網站內所有連結都是相對路徑，所以在 `/first-symphony/` 子路徑與本機都能正常運作。根目錄的 `.nojekyll` 讓 GitHub Pages 不做額外處理。
