// 啟動城堡遊戲：抽選成員 → 建立 Phaser 遊戲。
import { MAX_NPCS, VIEW_W, VIEW_H, ZOOM, COLORS } from './config.js';
import { createRng } from './rng.js';
import { drawRoster } from './roster.js';
import { ROOMS, OPEN_ROOMS } from './rooms/index.js';
import { RoomScene } from './RoomScene.js';
import { createDialog, createPanel, createToast } from './dialog.js';
import { loadTable } from '../data.js';

/**
 * stage：放遊戲畫布的元素（要能取得焦點，鍵盤只在它取得焦點時作用）
 * data：{ members, looks, lines }
 * options：{ seed, npcs, debug, noArt, moonAge, onRoomChange }
 */
export function startCastle(stage, data, options = {}) {
  const rng = createRng(options.seed);
  const max = Number.isInteger(options.npcs) && options.npcs > 0 ? options.npcs : MAX_NPCS;
  const roster = drawRoster({
    members: data.members,
    looks: data.looks,
    rooms: OPEN_ROOMS.map((id) => ({ id, capacity: ROOMS[id].capacity })),
    rng,
    max,
  });

  const ctx = {
    roster,
    lines: data.lines,
    rng,
    debug: Boolean(options.debug),
    load: loadTable,                 // 面板要用的資料（塔羅牌、鍛造材料、飲料）用到時才讀
    moonAge: Number.isFinite(options.moonAge) ? options.moonAge : null, // ?moon= 指定月齡（測試用）
    quota: null,                     // 靈感額度，RoomScene 每次進房間重新建立（quota.js）
    drink: null,                     // 酒館點的飲料 { name, color }
    ui: {
      dialog: createDialog(stage),
      panel: createPanel(stage),
      toast: createToast(stage),
      setRoomName: options.onRoomChange || (() => {}),
    },
  };

  // 點遊戲區時把焦點移過來，鍵盤才會作用；方向鍵與空白鍵也只在這時不捲動網頁
  stage.addEventListener('pointerdown', () => stage.focus({ preventScroll: true }));

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: stage,
    width: VIEW_W * ZOOM,
    height: VIEW_H * ZOOM,
    backgroundColor: COLORS.background,
    banner: false,
    // 依真實經過時間移動：電腦或手機掉格時，角色速度仍然一致
    fps: { smoothStep: false },
    audio: { noAudio: true },
    physics: { default: 'arcade', arcade: { debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { keyboard: { target: stage } },
    callbacks: {
      preBoot: (game) => {
        game.registry.set('ctx', ctx);
        game.registry.set('noArt', Boolean(options.noArt)); // 測試色塊備案用
      },
    },
    scene: [RoomScene],
  });
  if (ctx.debug) window.__castleGame = game; // 除錯用
  return game;
}
