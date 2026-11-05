// 城堡遊戲的常數。數值都集中在這裡，調整手感時只改這個檔案。

export const TILE = 32;            // 一格 32×32 像素
export const VIEW_W = 640;         // 訪客看到的範圍（遊戲世界單位，約 20×11 格）
export const VIEW_H = 360;
export const ZOOM = 2;             // 畫布實際用 1280×720 繪製，文字較清楚

export const MAX_NPCS = 10;        // 第一版上限（網址加 ?npcs=40 可測試更多人）
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
  bar: 0x6b4228,
  barrel: 0x8a5a32,
  fire: 0xc8552e,
  iron: 0x55575c,
  straw: 0xcfb15a,
  target: 0xc94a3a,
  rope: 0xb59a6a,
  water: 0x4a7fa8,
  coal: 0x2e2b29,
  label: '#3a2a1f',
};
