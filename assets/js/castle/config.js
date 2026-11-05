// 城堡遊戲的常數。數值都集中在這裡，調整手感時只改這個檔案。

export const TILE = 32;            // 一格 32×32 像素
export const VIEW_W = 640;         // 訪客看到的範圍（遊戲世界單位，約 20×11 格）
export const VIEW_H = 360;
export const ZOOM = 2;             // 畫布實際用 1280×720 繪製，文字較清楚

export const MAX_NPCS = 22;        // 城堡裡同時出現的成員上限（網址加 ?npcs=40 可測試更多人）
export const PLAYER_SPEED = 120;   // 像素／秒
export const NPC_SPEED = 55;
export const INTERACT_RANGE = 48;  // 按 E 可互動的距離
export const CLICK_RANGE = 96;     // 滑鼠點擊可直接對話的距離

// NPC 待機結束後選下一個動作的機率（合計 1）
export const BEHAVIOR = { idle: 0.4, wander: 0.35, spot: 0.25 };
export const IDLE_SECONDS = [2, 5];
export const WANDER_RADIUS = 6;

// 畫布上的文字字型（名字、泡泡、標籤）
export const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';

// 地圖配色（只用在畫布上；網頁其他部分的顏色在 tokens.css）
export const COLORS = {
  background: 0x2b2119,
  wall: 0x5a4636,
  wallTop: 0x6d5644,
  floor: 0xd9c7a6,
  floorAlt: 0xd2bf9c,
  carpet: 0x9c3a33,
  stage: 0xb88a5a,
  stageAlt: 0xb08254,
  door: 0x3d2a1c,
  doorLocked: 0x4a3a2e,
  furniture: 0x7a5236,
  furnitureLine: 0x4a3020,
  seat: 0xa47148,
  plant: 0x5f8a4a,
  banner: 0x2f4a86,
  notice: 0xc9a774,
  piano: 0x2a2420,
  stand: 0x8c8c8c,
  // 戶外（城堡外庭）
  grass: 0x7fa65a,
  grassAlt: 0x78a054,
  path: 0xb9b2a4,
  pathAlt: 0xb1aa9b,
  dirt: 0x9a7650,
  dirtAlt: 0x93704b,
  hedge: 0x3f6b35,
  tree: 0x4e7d3c,
  fence: 0x8f6a44,
  sheep: 0xf2eee4,
  hay: 0xd9b55a,
  laundry: 0xe8e2d4,
  crop: 0x6f9a3a,
  flower: 0xd77fa1,
  water: 0x6fa8c8,
  // 2F／3F
  bed: 0xb5524a,
  wardrobe: 0x6b4429,
  bookshelf: 0x5c3a24,
  display: 0x9fc4c9,
  globe: 0x4f86a8,
  telescope: 0xb08d4a,
  starMap: 0x3c4f7a,
  starWindow: 0x24305e,
  windowGlass: 0x8fb3d1,
  // 1F：酒館／練習室／鍛造工坊
  bar: 0x6b4228,
  barrel: 0x8a5a32,
  fire: 0xc8552e,
  iron: 0x55575c,
  straw: 0xcfb15a,
  target: 0xc94a3a,
  rope: 0xb59a6a,
  coal: 0x2e2b29,
  label: '#3a2a1f',
};
