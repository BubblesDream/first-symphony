# 第一交響樂團｜公會紀念網站

《瑪奇 M》與《瑪奇》（PC）公會「第一交響樂團」的紀念網站。
網址：<https://bubblesdream.github.io/first-symphony/>

純 HTML／CSS／原生 JavaScript，不需要安裝任何套件，也沒有建置步驟。

> 目前所有內容都是**示範資料**（`is_demo: true`），名稱、日期、事件皆為虛構，圖片為佔位圖。

## 本機預覽

在專案根目錄執行：

```bash
python3 -m http.server 8000
```

然後用瀏覽器開啟 <http://localhost:8000/>。

直接雙擊 HTML 檔案開啟會讀不到資料（瀏覽器限制），一定要透過上面的方式。

## 檔案結構

```
index.html        首頁
story.html        公會故事（創立緣由、名稱由來、遊戲時期、時間軸、歷任會長）
members.html      成員列表（可依遊戲篩選）
member.html       成員詳情（member.html?id=成員id），含造型切換
videos.html       影片回顧（可依年份、遊戲篩選）
gallery.html      紀念館（相簿＋燈箱、經典語錄）
hall.html         虛擬大廳（籌備中）
404.html          找不到頁面
assets/css/       tokens.css（顏色字型間距）、base.css、components.css、pages.css
assets/js/        config.js、data.js、validate.js、render.js、layout.js、cards.js、pages/
assets/images/    placeholders/、members/、outfits/、gallery/、history/
data/             所有資料（JSON）
```

想換配色或字型，只要改 `assets/css/tokens.css`。

## 修改內容

所有內容都在 `data/` 資料夾，每個檔案是一個「表格」：一個陣列，每一筆資料是一列，欄位只能是文字、數字或 true／false（**不能**在欄位裡再放陣列或物件）。

共通規則：

- `id`：英文小寫、數字與連字號，例如 `kotone`、`photo-2024-01`，不可重複。
- 日期：可以只寫年（`2021`）、年月（`2021-03`）或完整日期（`2021-03-05`）。
- 內文：純文字，要換行就在 JSON 字串裡寫 `\n`。不支援 HTML。
- `game`：只能是 `mabinogi_m`（瑪奇 M）、`mabinogi_pc`（瑪奇 PC）、`both`（兩邊都有）。
- `is_demo`：示範資料填 `true`，正式資料改成 `false`，畫面上的「示範資料」標籤就會消失。
- 圖片路徑：放在 `assets/images/` 底下，寫成 `assets/images/members/kotone.png`（**開頭不要加 `/`**）；或填 `https://` 開頭的網址。其他格式會自動換成佔位圖。
- 選填欄位不需要時填空字串 `""`。

### 網站設定 `data/site.json`

每列一個 `key`／`value`。可修改公會介紹（`intro`）、橫幅圖片（`banner_image`）、橫幅引言（`banner_quote`）、創立年份（`founded_year`）、故事摘要（`story_summary`）、創立緣由（`founding_story`）、名稱由來（`name_origin`）、兩個遊戲時期的介紹（`era_mabinogi_m`、`era_mabinogi_pc`）、頁尾短句（`footer_phrase`）。正式上線時把 `is_demo` 改成 `false`，頁尾的示範說明會一起換掉。

### 成員 `data/members.json`

```json
{
  "id": "kotone",
  "nickname": "琴音",
  "game": "mabinogi_m",
  "role": "會長",
  "avatar": "assets/images/members/kotone.png",
  "intro": "介紹文字",
  "joined": "2020-05",
  "featured": true,
  "sort_order": 10,
  "is_demo": false
}
```

- `featured: true` 會出現在首頁（最多 6 位）。
- `sort_order` 數字越小越前面。
- 頭像建議正方形（1:1）。成員詳情頁網址是 `member.html?id=kotone`。

### 造型 `data/outfits.json`

每套造型一列，用 `member_id` 對應到成員的 `id`：

```json
{ "id": "kotone-outfit-1", "member_id": "kotone", "name": "日常服", "image": "assets/images/outfits/kotone-1.png", "note": "", "sort_order": 10, "is_demo": false }
```

造型圖建議直式 3:4。

### 照片 `data/gallery.json`

```json
{ "id": "photo-2024-01", "image": "assets/images/gallery/2024-01.jpg", "thumb": "", "title": "標題", "caption": "說明", "date": "2024-01", "game": "both", "category": "合照", "featured": true, "is_demo": false }
```

- `thumb` 可以放較小的縮圖，留空就用原圖。
- `category` 自由填寫（例如「合照」「風景」「活動」），篩選選單會自動列出。
- `featured: true` 會出現在首頁「精選回憶」（最多 6 張）。

### 影片 `data/videos.json`

```json
{ "id": "video-2024-anniversary", "youtube_url": "https://www.youtube.com/watch?v=XXXXXXXXXXX", "title": "標題", "published": "2024-01", "game": "both", "category": "活動", "summary": "簡介", "featured": true, "is_demo": false }
```

`youtube_url` 只接受 `youtube.com/watch?v=`、`youtu.be/`、`youtube.com/shorts/`、`youtube.com/embed/` 四種格式，格式錯誤的影片不會顯示；留空會顯示「尚未提供影片網址」的佔位卡片。只放成員同意公開的影片。

### 公會歷史 `data/history.json`

```json
{ "id": "founding", "date": "2020", "title": "公會成立", "body": "內文", "image": "", "video_url": "", "game": "mabinogi_m", "is_demo": false }
```

`image`、`video_url` 選填。時間軸依日期由舊到新排列。

### 歷任會長 `data/leaders.json`

```json
{ "id": "leader-1", "nickname": "琴音", "member_id": "kotone", "term_start": "2020", "term_end": "2023-06", "note": "", "is_demo": false }
```

`term_end` 留空代表現任；`member_id` 有填就會連到成員頁。

### 經典語錄 `data/quotes.json`

```json
{ "id": "quote-1", "text": "語錄內容", "speaker": "琴音", "date": "2020-08", "context": "", "is_demo": false }
```

## 未來改用 Google 試算表

資料表的欄位設計和試算表一一對應，日後可以改用 Google 試算表維護：

1. 建立一份試算表，每個 JSON 檔案開一個分頁（`site`、`members`、`outfits`、`history`、`leaders`、`videos`、`gallery`、`quotes`）。
2. 第一列填欄位名稱（和 JSON 的欄位名稱完全相同），之後每一列是一筆資料。布林值填 `TRUE`／`FALSE`。
3. 「檔案」→「共用」→「發布到網路」，每個分頁選擇「逗號分隔值（.csv）」並發布，複製網址。
4. 打開 `assets/js/config.js`，把對應的資料表改成：
   ```js
   members: { type: 'csv', url: '貼上該分頁的 CSV 網址' },
   ```
5. 存檔後重新整理網站即可。`data.js` 會自動處理 CSV 解析與型別轉換，頁面程式不用改。

注意：發布到網路的試算表**任何人都看得到**，只能放可以公開的資訊（遊戲暱稱、截圖網址等），不要放真實姓名、聯絡方式或任何密碼。圖片可以放在本 repo 的 `assets/images/`，試算表只填路徑。

## 部署到 GitHub Pages

1. 到 repo 的 Settings → Pages。
2. Source 選「Deploy from a branch」，Branch 選 `main`、資料夾 `/ (root)`，按 Save。
3. 幾分鐘後開啟 <https://bubblesdream.github.io/first-symphony/>。

根目錄的 `.nojekyll` 讓 GitHub Pages 原樣提供檔案。所有連結都是相對路徑，網站在子路徑 `/first-symphony/` 和本機都能運作。
