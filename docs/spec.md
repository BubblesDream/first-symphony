# 第一交響樂團｜公會紀念網站：第一版規格（v2）

> 本文件取代 `docs/原始提示詞.md`，是第一版網站的正式規格。
> 專案規則與禁止事項見根目錄 `CLAUDE.md`，兩者衝突時以 `CLAUDE.md` 為準。

## 一、專案定位

**第一交響樂團**是以《瑪奇 M》與《瑪奇》（PC）為主的遊戲公會。本網站是公會的數位紀念館，保存公會歷史、成員、遊戲截圖、YouTube 影片與共同回憶，也作為對外展示的門面。

- 更新頻率低，不以公告或即時消息為中心。
- 內容只有遊戲暱稱、遊戲截圖與願意公開的遊戲影片，不含真實個資或聯絡方式。
- 未來會加入可走動的 2D 虛擬公會大廳（第一版只做入口）。

部署網址：`https://bubblesdream.github.io/first-symphony/`
repo：`https://github.com/BubblesDream/first-symphony`

## 二、視覺設計

整體方向：「日系遊戲回憶錄 × 簡潔部落格 × 數位相簿」。

### 參考圖

`docs/reference/home-mood.png` 是首頁氛圍參考圖（AI 繪製的概念圖，**只參考氛圍，不是要逐像素重現**）。要取用的元素：

- 暖米白紙張底色、深咖啡色文字與頂部細色帶
- 公會名稱用有份量的中文標題字，副標一行小字
- 橫向的合照大橫幅，上面疊一句短短的引言
- 區塊標題像貼上去的紙膠帶標籤；照片像拍立得（白邊、極淡陰影、少量傾斜）
- 影片區用簡單的膠卷框意象
- 頁尾一句手寫感的短句與豎琴（lyre）小圖示

要捨棄或簡化的部分：

- 右側「最新文章／文章分類」側欄：本站不以文章更新為中心，第一版不做。首頁改為單欄或雙欄區塊。
- 搜尋圖示：第一版不做搜尋。
- 背景的城堡剪影、紙張紋理：用純色或極輕的 CSS 效果代替，不放大型背景圖。
- 手寫字：只用在少數短句（引言、頁尾）。若使用中文手寫網頁字型，必須是 Google Fonts 分片載入的版本；也可以不用，改以一般字型表現。
- 圖中的照片都是概念圖，一律換成本地 SVG 佔位圖。豎琴圖示用簡單的自製 SVG。

具體的裝飾程度由各工作任務指定（見 `docs/cloud-tasks.md`）。

共同要求：

- 簡潔、自然、有溫度，像玩家自己用心整理的紀念網站
- 照片、遊戲截圖與故事是主要視覺
- 留白適當，正文易讀（行高約 1.7–1.9，正文欄寬不超過約 40 個中文字）
- 簡單的卡片、相簿與文章版面
- 桌面與手機都好用
- 色彩、字級、間距集中定義為 CSS 自訂屬性，方便日後換版

避免：

- 金色發光邊框、過量漸層、粒子與光效
- 華麗奇幻商城風、遊戲官方 UI 的仿製
- 大量無意義動畫（尊重 `prefers-reduced-motion`）
- 常見 AI 生成網站的浮誇視覺：巨大漸層標題、玻璃擬態卡片、滿版發光按鈕
- 控制面板式的過度設計

字型：優先使用系統字型（`"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif` 等）。若要用網頁字型，最多一套標題字，中文字型必須是 Google Fonts 那種依 unicode-range 分片載入的版本。

圖片：一律使用本地 SVG 佔位圖，圖上清楚寫出「佔位圖」與用途（如「成員頭像 1:1」「橫幅 16:9」），不使用外部佔位圖服務。

## 三、網站架構

採**多頁靜態 HTML**，不使用前端路由。詳情頁用 query string。

| 頁面 | 檔案 | 說明 |
|---|---|---|
| 首頁 | `index.html` | 導覽列、合照橫幅、公會名稱與一句介紹、故事摘要、精選回憶、成員預覽、精選影片、頁尾 |
| 公會故事 | `story.html` | 創立緣由、名稱由來、時間軸、歷任會長、不同遊戲時期 |
| 成員列表 | `members.html` | 成員卡片，可依遊戲篩選 |
| 成員詳情 | `member.html?id=<member_id>` | 頭像、介紹、職位、造型收藏切換 |
| 影片回顧 | `videos.html` | 影片卡片，可依年份或遊戲篩選 |
| 紀念館 | `gallery.html` | 相簿，可依年份或分類篩選，點擊放大並顯示說明；另有經典語錄區 |
| 虛擬大廳 | `hall.html` | 預留入口與構想介紹，不實作遊戲 |
| 找不到頁面 | `404.html` | 提供回首頁連結 |

首頁保持簡潔：每個區塊只放少量精選（例如 3–6 筆）並附「查看全部」連結。

### 頁面細節

**公會故事**：時間軸與文章混排。事件包含日期（可只填年或年月）、標題、內文、圖片（選填）、相關影片（選填）。可依遊戲時期（瑪奇 M／瑪奇 PC）區分或標示。

**成員詳情**：像簡易角色圖鑑。造型以切換整張圖片的方式呈現（縮圖列＋主圖），不做分層紙娃娃。可用鍵盤操作。id 不存在時顯示友善訊息與回列表連結。

**影片回顧**：列表只顯示縮圖（`https://i.ytimg.com/vi/<VIDEO_ID>/hqdefault.jpg`）。點擊後才在原地載入 `https://www.youtube-nocookie.com/embed/<VIDEO_ID>` 的 iframe，或直接開啟 YouTube。不要一次載入多個 iframe。

**紀念館**：燈箱放大要能用 Esc 關閉、左右鍵切換，手機可點擊關閉；開啟時鎖定背景捲動，關閉後焦點回到原本的縮圖。

**虛擬大廳**：說明構想（操控小角色走動、與物品和成員互動、看公告板與相簿、支援鍵盤與觸控），標示「籌備中」。未來可能使用 Godot Web Export 或 HTML5 Canvas。

## 四、技術要求

- 純 HTML、CSS、原生 JavaScript（ES modules）、JSON；不使用框架、不需要建置步驟、不需要 npm。
- 所有內部連結與資源一律使用**相對路徑**，網站要能同時在 `/first-symphony/` 子路徑與本機 `http://localhost:8000/` 正常運作。
- 根目錄放 `.nojekyll`。
- GitHub Pages 設定：從 `main` 分支根目錄部署，網站本身不需要 GitHub Actions。唯一例外是圖片同步 workflow（見第八節），它只負責開 Pull Request，不參與部署。
- 共用的頁首、頁尾由 JS 產生，或以其他方式避免在每頁重複大量 HTML。
- RWD：至少在 360px 手機寬度與 1440px 桌面寬度都正常。
- 基本無障礙：語意化標籤、圖片 `alt`、可見的鍵盤焦點、足夠的對比。
- `<html lang="zh-Hant-TW">`，每頁有適當的 `<title>` 與 `description`。

建議目錄結構（可在合理範圍內調整）：

```
index.html  story.html  members.html  member.html
videos.html gallery.html hall.html    404.html
.nojekyll   README.md   CLAUDE.md
assets/
  css/        # tokens（變數）、base、components、各頁樣式
  js/
    config.js   # 資料來源設定（json / csv）
    data.js     # 資料載入模組（唯一讀取資料的地方）
    validate.js # 網址與欄位驗證
    render.js   # 共用的安全 DOM 產生工具
    pages/      # 各頁腳本
  images/
    placeholders/
    members/ outfits/ gallery/ history/
data/
  site.json members.json outfits.json history.json
  leaders.json videos.json albums.json gallery.json quotes.json
docs/
```

## 五、資料管理

資料來源是管理員專用的「網站用」Google 試算表，網站讀取「檔案 → 共用 → 發布到網路」產生的 CSV（每個分頁一個網址）。CSV 網址還沒填或讀取失敗時，自動改讀 `data/*.json`（當作備用資料）。圖片由同步程式從雲端硬碟轉成 WebP，放到固定路徑。

### 設計原則

1. **一個 JSON 檔對應試算表的一個分頁。** 每個檔案是物件陣列，每筆資料只有平面欄位（字串、數字、布林），**不准巢狀陣列或物件**。關聯用 id 欄位表示。
2. 每筆資料都有穩定的 `id`（英數小寫與連字號）。
3. 日期欄位是字串，允許 `YYYY`、`YYYY-MM`、`YYYY-MM-DD` 三種精度，顯示時依精度格式化。`history.date` 另外允許模糊寫法：`2008 左右`、`約 2008`、`2008 前後`（也可搭配月份，如 `2008-09 左右`），一律顯示成「約 2008 年」「約 2008 年 9 月」；排序只看開頭的年（月）。
4. 內文欄位是純文字，換行以 `white-space: pre-line` 呈現，不支援 HTML 或 Markdown。
5. 示範資料一律 `is_demo: true`，畫面上要有明顯的「示範資料」標記。正式上線後不放示範資料，沒有資料的區塊顯示「整理中」。
6. `game` 欄位值固定為 `mabinogi_m`、`mabinogi_pc`、`both` 其中之一，顯示名稱集中定義在一處。

### 資料表

| 檔案 | 欄位 |
|---|---|
| `site.json` | `key`, `value`（公會名稱、一句介紹、橫幅圖、創立年份、故事摘要等設定，key/value 兩欄方便試算表維護） |
| `members.json` | `id`, `nickname`, `aka`（選填，另一款遊戲的角色名）, `game`, `role`（選填）, `avatar`, `intro`, `joined`（選填）, `featured`, `sort_order`, `is_demo` |
| `outfits.json` | `id`, `member_id`, `name`, `image`, `note`（選填）, `sort_order`, `is_demo` |
| `history.json` | `id`, `date`（允許模糊寫法）, `title`, `body`（選填，一兩句話）, `image`（選填，管理頁上傳配圖後自動填 `assets/images/history/<id>.webp`）, `video_url`（選填）, `game`, `is_demo` |
| `leaders.json` | `id`, `nickname`, `member_id`（選填）, `period`（自由文字，原樣顯示，例如 `2005～2008 左右`、`2010 前後`、`現在`）, `sort_order`（數字，越小越前面，越早的會長越小）, `note`（選填）, `is_demo`。不記任期，故事頁依 `sort_order` 排序 |
| `videos.json` | `id`, `youtube_url`, `title`, `published`, `game`, `category`, `summary`, `featured`, `is_demo` |
| `albums.json` | `album`（必須與雲端硬碟相簿資料夾名稱完全相同）, `title`（選填，空白時用資料夾名稱去掉日期）, `caption`, `game`, `featured`, `is_demo`。一本相簿一列 |
| `gallery.json` | `id`（＝雲端硬碟檔案 id）, `album`（相簿資料夾名稱，例如 `2010-08 夏日合奏`）, `category`（團體合照／副本／節日活動／演奏／日常／紀念日）, `date`（取自資料夾名稱開頭的 `YYYY-MM`）, `image`, `thumb`, `sort_order`。一張照片一列，由同步程式產生，不走試算表（見第八節） |
| `quotes.json` | `id`, `text`, `speaker`, `date`（選填）, `context`（選填）, `is_demo` |

試算表分頁與資料表的對應：成員→`members`、造型→`outfits`、相簿→`albums`、影片→`videos`、歷史→`history`、歷任會長→`leaders`、語錄→`quotes`、公會設定→`site`（「填寫說明」分頁網站不讀）。

試算表格式：**第 1 列＝欄位名稱（與上表相同）；第 2 列＝中文說明（網站略過，`config.js` 的 `skipRows: 1`）；第 3 列起才是資料。**

CSV 讀入的值全是字串，`data.js` 要負責型別轉換（`"TRUE"`/`"true"` → 布林、數字字串 → 數字、空字串 → 未填）。

相簿頁與首頁用 `loadGallery()` 取照片：把 `gallery` 與 `albums` 用 `album` 欄位對起來，組成 `id, image, thumb, title, caption, date, game, category, featured, is_demo` 的照片物件。試算表裡沒有對應相簿的照片也照樣顯示。

### 圖片固定路徑

全部是 WebP，由同步程式產生並 commit。資料欄位有填圖片網址時用資料的；空白時用下表的固定路徑；檔案不存在時顯示佔位圖。路徑集中寫在 `data.js`（`memberAvatar()`、`outfitImage()`、`bannerImage()`、`storyImage()`）。

| 用途 | 路徑 | 對應欄位 |
|---|---|---|
| 成員頭像 | `assets/images/members/<member_id>/avatar.webp` | `members.avatar` |
| 成員造型 | `assets/images/members/<member_id>/outfit-<n>.webp`（n＝造型的 `sort_order`：1、2、3…） | `outfits.image` |
| 首頁橫幅 | `assets/images/site/banner.webp` | `site` 的 `banner_image` |
| 故事配圖 | `assets/images/site/story.webp` | `site` 的 `story_image` |
| 歷史配圖 | `assets/images/history/<history_id>.webp`（網站不自動套用，需填入 `history.image`） | `history.image` |
| 相簿照片 | `assets/images/gallery/<drive_file_id>.webp`，縮圖 `assets/images/gallery/<drive_file_id>-thumb.webp` | `gallery.image`／`gallery.thumb` |

### 資料載入模組

- `config.js` 設定每張表的來源：試算表分頁設 `source: 'csv'`、`url`（CSV 網址）、`fallback`（本地 JSON 路徑）、`skipRows: 1`。`url` 是空字串時直接讀 `fallback`；CSV 讀取失敗時也改讀 `fallback`，並在 console 留下警告。`gallery` 固定讀 `data/gallery.json`。
- `data.js` 對外只提供類似 `loadTable('members')` 的介面，頁面腳本不知道資料來自 JSON 還是 CSV。
- 內建一個能處理引號、逗號與換行的小型 CSV 解析器。
- 讀取失敗時，頁面顯示友善的錯誤訊息，不整頁空白。

### 安全

- 外部資料**一律以 `textContent` 或 `createElement` 顯示**，不得把資料串進 `innerHTML`。
- 圖片網址只允許：網站內的相對路徑（`assets/` 底下），或 `https://` 開頭的網址。其餘一律改用佔位圖。
- YouTube 網址只接受 `youtube.com/watch?v=`、`youtu.be/`、`youtube.com/shorts/`、`youtube.com/embed/` 這幾種格式，抽出 11 碼影片 ID 並以正規表達式 `^[A-Za-z0-9_-]{11}$` 驗證，不符就不顯示該影片。
- 前端不放任何 API Key、密碼或機密。試算表只存可公開的資訊。

不建立管理後台。

## 六、第一版完成範圍

1. 首頁
2. 公會故事頁
3. 成員列表與詳情頁
4. 成員造型切換
5. 影片回顧頁
6. 紀念館與燈箱
7. 虛擬大廳預留頁
8. 手機版響應式設計
9. 本地 JSON 資料與資料載入模組
10. GitHub Pages 部署所需設定（`.nojekyll`、相對路徑、`404.html`）
11. README：本機預覽方式、如何新增修改成員、造型、照片、影片、歷史、語錄，以及未來改接 Google 試算表的步驟

示範資料：成員約 6 位（瑪奇 M 與瑪奇 PC 都有），每位 2–3 套造型；歷史事件約 6 筆；影片約 6 支；相簿約 12 張；語錄約 4 則。所有名稱、日期、事件都要看得出是虛構的示範內容。示範影片可以用明顯的佔位 ID，或留空並顯示佔位卡片，**不要隨便填真實的影片網址**。

## 七、驗證

完成後至少執行：

1. 用 Python 檢查所有 `data/*.json` 都能解析、欄位符合上表、沒有巢狀值、id 不重複、`member_id` 都對得到成員。
2. `python3 -m http.server 8000` 啟動後，以 `curl` 確認每個頁面、CSS、JS、JSON 都回傳 200。
3. 以 `grep` 確認沒有任何以 `/` 開頭的內部絕對路徑，且資料沒有被放進 `innerHTML`。
4. 若環境中有瀏覽器自動化工具（例如 Playwright），開啟各頁確認主控台沒有錯誤；沒有則略過並在 PR 說明。

PR 說明要列出：完成項目、驗證結果（含略過的項目）、已知問題、未完成項目、合併後啟用 GitHub Pages 的步驟。

## 八、圖片同步（Google 雲端硬碟 → WebP → Pull Request）

網站圖片由 GitHub Action 從 Google 雲端硬碟自動同步。這是 `CLAUDE.md`「不要建立 CI」的**唯一例外**（管理員已同意）：只允許 `.github/workflows/sync-images.yml` 這一支 workflow，以及它使用的 `tools/sync_drive_images.py`。網站本身仍是純靜態、沒有建置步驟。設定步驟見 `docs/指南-圖片同步設定.md`。

### 運作方式

- 每天排程一次，也可以在 Actions 頁面手動執行。
- 用 service account（secret `GDRIVE_SA_KEY`）以唯讀權限讀「管理員專用」資料夾（variable `GDRIVE_ROOT_FOLDER_ID`）。
- 增量同步：`tools/image-sync-state.json` 記錄每個雲端檔案的 `md5Checksum`／`modifiedTime`／輸出路徑，只下載新增或變動的檔案；雲端刪掉的檔案，對應的輸出也會刪除。
- 轉檔：修正 EXIF 方向、去掉 EXIF、轉 WebP（quality 80），只縮小不放大。
- 有變更時開 Pull Request（固定分支 `sync/images`，已有 PR 就更新），不直接推 `main`。
- 不認得的檔案或資料夾會略過並在 log／PR 說明列出警告，不會讓整個同步失敗。
- 成員的「投稿區」資料夾不同步，由管理員手動挑進下列結構。

### 雲端硬碟結構

```
第一交響樂團｜網站（管理員專用，不要分享）/
├─ 第一交響樂團｜網站資料（網站用）   ← 試算表，同步程式不處理
├─ 成員/
│   └─ m01-伊莎貝拉/   頭像.*、造型-1.*、造型-2.* …（以 m01- 前綴辨識成員 id）
├─ 網站相簿/
│   └─ 團體合照/ 副本/ 節日活動/ 演奏/ 日常/ 紀念日/   ← 固定 6 個分類
│        └─ 2010-08 夏日合奏/   ← 一本相簿＝一個資料夾，「YYYY-MM 標題」
│             └─ 任意檔名的照片
├─ 橫幅與故事配圖/   橫幅.*、故事配圖.*
└─ 歷史配圖/   <history_id>.*（主檔名＝歷史事件的 id，只能用英數、-、_）
```

### 圖片路徑

| 來源 | 輸出路徑（WebP） | 尺寸 |
|---|---|---|
| `成員/mXX-*/頭像.*` | `assets/images/members/<mXX>/avatar.webp` | 400×400 內，等比 |
| `成員/mXX-*/造型-<n>.*` | `assets/images/members/<mXX>/outfit-<n>.webp` | 高 900 內，等比 |
| `橫幅與故事配圖/橫幅.*` | `assets/images/site/banner.webp` | 寬 1600 內 |
| `橫幅與故事配圖/故事配圖.*` | `assets/images/site/story.webp` | 寬 1200 內 |
| `歷史配圖/<history_id>.*` | `assets/images/history/<history_id>.webp` | 寬 1200 內，等比 |
| `網站相簿/<分類>/<相簿>/<照片>` | `assets/images/gallery/<drive_file_id>.webp`＋`<drive_file_id>-thumb.webp` | 長邊 1600／縮圖長邊 480 |

### `data/gallery.json`

由同步程式每次重新產生，一張照片一列，平面結構：

| 欄位 | 內容 |
|---|---|
| `id` | 雲端硬碟檔案 id（drive_file_id） |
| `album` | 相簿資料夾名稱，例如 `2010-08 夏日合奏` |
| `category` | 分類資料夾名稱（6 個之一） |
| `date` | 相簿資料夾名稱開頭的 `YYYY-MM` |
| `image` | 大圖路徑 |
| `thumb` | 縮圖路徑 |
| `sort_order` | 同一本相簿內依檔名排序的順序（從 1 開始） |

相簿說明、遊戲、精選等文字放在試算表「相簿」分頁（一本相簿一列，以 `album` 對應），不是同步程式的工作。
