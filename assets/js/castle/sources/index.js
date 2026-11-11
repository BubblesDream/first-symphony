// 新增來源：新增一個來源檔，再加一行 export * as 名稱 from './名稱.js'，不用修改 RoomScene。
// 每個來源匯出 lines(scene, obj, state)，回傳 [{ text, is_demo? }]；
// 可選的 card(scene, obj, state) 回傳 { filename, spec } 或 null。
// state 是每次互動新建的物件，先呼叫 lines 再呼叫 card，供兩者共用當次抽籤／打造結果。
// 模組載入時不可存取瀏覽器物件，讓 Node 檢查工具也能直接匯入這份登記表。
export * as moon from './moon.js';
export * as fortune from './fortune.js';
export * as forge from './forge.js';
export * as history from './history.js';
export * as updates from './updates.js';
