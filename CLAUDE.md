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

## 內容規則

- 只放遊戲暱稱、遊戲截圖、願意公開的遊戲影片；不放真實姓名或聯絡方式。
- 示範資料一律 `is_demo: true`，畫面上要標出「示範資料」。不要編造看起來像真實公會歷史的內容。
- 不使用遊戲官方的 LOGO 或美術素材當網站圖示或裝飾；圖片先用本地 SVG 佔位圖。
- 介面文字使用繁體中文（台灣用語）。

## 工作方式

- 不要自行追加規格以外的功能；不要建立測試框架或 CI。
- 不要修改與當前任務無關的檔案。
- 本機預覽：`python3 -m http.server 8000`，開啟 `http://localhost:8000/`（直接雙擊 HTML 會因 fetch 限制無法讀取資料）。
- 完成工作時在獨立分支提交並開 Pull Request，PR 說明列出完成項目、驗證結果、未完成項目。
