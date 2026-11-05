# 第一交響樂團｜公會紀念網站

《瑪奇 M》與《瑪奇》（PC）公會「第一交響樂團」的紀念網站，部署在 GitHub Pages：`https://bubblesdream.github.io/first-symphony/`。

完整規格見 `docs/spec.md`。動手前先讀它。

## 最重要的原則

網站要簡單、實用、自然、有回憶感，像玩家自己整理的紀念網站。不要做成華麗的 AI 展示網站：不要金色發光邊框、大片漸層、粒子光效、玻璃擬態、無意義動畫。

## 技術規則

- 純 HTML／CSS／原生 JS（ES modules）／JSON。不用框架、不用建置步驟、不用 npm。
- 多頁靜態 HTML，不做前端路由；詳情頁用 query string（`member.html?id=...`）。
- 內部連結與資源一律相對路徑，不准以 `/` 開頭（網站在 `/first-symphony/` 子路徑下運作）。
- 資料與畫面分離：頁面只透過 `assets/js/data.js` 取資料，不直接 fetch JSON。
- 資料表是平面結構（一個 JSON 檔＝試算表一個分頁），不准巢狀陣列或物件，關聯用 id。
- 外部資料只用 `textContent`／`createElement` 顯示，不准串進 `innerHTML`。
- 圖片網址與 YouTube 網址都要經 `validate.js` 驗證。
- 樣式變數集中在 tokens 檔；不要在各頁重複定義相同元件樣式。

## 圖片同步（唯一的 CI 例外）

管理員已同意一個例外：`.github/workflows/sync-images.yml` 這一支 GitHub Action，加上它使用的 `tools/sync_drive_images.py`（Python，只在 Action 裡跑）。它每天把 Google 雲端硬碟的圖片轉成 WebP，有變更就開 Pull Request 到 `sync/images` 分支，不直接推 `main`。網站本身仍是純靜態、沒有建置步驟。除此之外不要新增其他 workflow 或 CI。

| 雲端硬碟來源 | 輸出（WebP） |
|---|---|
| `成員/mXX-*/頭像.*` | `assets/images/members/<mXX>/avatar.webp` |
| `成員/mXX-*/造型-<n>.*` | `assets/images/members/<mXX>/outfit-<n>.webp` |
| `橫幅與故事配圖/橫幅.*` | `assets/images/site/banner.webp` |
| `橫幅與故事配圖/故事配圖.*` | `assets/images/site/story.webp` |
| `歷史配圖/<history_id>.*` | `assets/images/history/<history_id>.webp` |
| `網站相簿/<分類>/<YYYY-MM 標題>/<照片>` | `assets/images/gallery/<drive_file_id>.webp`、`<drive_file_id>-thumb.webp` |

- `assets/images/members/`、`site/`、`history/`、`gallery/`、`data/gallery.json`、`tools/image-sync-state.json` 由同步程式產生，不要手動修改。
- 細節見 `docs/spec.md`「圖片同步」與 `docs/指南-圖片同步設定.md`。

## 管理頁（第二個例外，不是網站的一部分）

`tools/admin/`（`Code.gs`、`Logic.gs`、`*.html`、`appsscript.json`）是給管理員用的 Google Apps Script 網頁應用程式，綁在「網站用」試算表上，只在 Apps Script 內執行。它**不部署到 GitHub Pages、網站頁面不引用它**，也不受「純 HTML／CSS／原生 JS」與「只用 `/` 相對路徑」等網站規則限制；但仍要遵守：介面簡單實用、繁體中文（台灣用語）、外部資料只用 `textContent`／`createElement`、Drive 動作只限管理員資料夾與投稿區、刪除一律移到垃圾桶、不把任何檔案改成公開分享。說明見 `docs/指南-管理頁.md`。

## 虛擬公會城堡（第三個例外）

`hall.html`（虛擬公會城堡）與 `assets/js/castle/`、`assets/vendor/` 整個屬於例外（管理員已同意）：可以依需要導入遊戲框架或函式庫，不受「純原生 JS、不用框架」限制。目前使用 Phaser 3.90.0，檔案放在 `assets/vendor/phaser/`（本機一份、固定版本，不從外部 CDN 載入）。

- 只有 `hall.html` 載入這些函式庫，其他頁面不准引用。
- 仍要遵守：相對路徑、資料透過 `data.js` 讀取、資料表平面結構、外部資料只用 `textContent`／`createElement`（畫布上的文字用 Phaser 的文字物件，不經 HTML）、內容規則。
- 所有房間共用 `RoomScene.js`；新增房間＝在 `assets/js/castle/rooms/` 加定義檔並登記；新增生活動作＝在 `actions.js` 加一行。
- 規劃與決定見 `docs/規劃-虛擬城堡.md`。

## 內容規則

- 只放遊戲暱稱、遊戲截圖、願意公開的遊戲影片；不放真實姓名或聯絡方式。
- 示範資料一律 `is_demo: true`，畫面上要標出「示範資料」。不要編造看起來像真實公會歷史的內容。
- 不使用遊戲官方的 LOGO 或美術素材當網站圖示或裝飾；圖片先用本地 SVG 佔位圖。
- 介面文字使用繁體中文（台灣用語）。

## 工作方式

- 不要自行追加規格以外的功能；不要建立測試框架或 CI（唯一例外是上面的圖片同步 workflow）。
- 不要修改與當前任務無關的檔案。
- 本機預覽：`python3 -m http.server 8000`，開啟 `http://localhost:8000/`（直接雙擊 HTML 會因 fetch 限制無法讀取資料）。
- 完成工作時在獨立分支提交並開 Pull Request，PR 說明列出完成項目、驗證結果、未完成項目。
