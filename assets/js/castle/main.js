// 啟動城堡遊戲：抽選成員 → 建立 Phaser 遊戲。
import { MAX_NPCS, VIEW_W, VIEW_H, ZOOM, TILE, COLORS } from './config.js';
import { createRng } from './rng.js';
import { drawRoster } from './roster.js';
import { ROOMS, OPEN_ROOMS } from './rooms/index.js';
import { RoomScene } from './RoomScene.js';
import { createDialog, createToast } from './dialog.js';

/**
 * stage：放遊戲畫布的元素（要能取得焦點，鍵盤只在它取得焦點時作用）
 * data：{ members, looks, lines, history }
 * options：{ seed, npcs, hour, debug, noArt, pixel, onRoomChange, onAction, isGameMode }
 *   onAction({ label, enabled })：操作列的「互動」按鈕要顯示什麼（有變才呼叫）
 *   isGameMode()：是否在遊戲模式（遊戲畫面改成依螢幕比例）
 * 回傳 { game, fit(), pressInteract() }
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

  // 觸控裝置：放大點擊範圍、提示文字不提鍵盤
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const ctx = {
    touch,
    roster,
    lines: data.lines,
    history: data.history || [], // 圖書館的公會歷史展示櫃
    hour: Number.isInteger(options.hour) ? options.hour : undefined, // 測試時間氛圍用
    rng,
    debug: Boolean(options.debug),
    ui: {
      dialog: createDialog(stage, { touch }),
      toast: createToast(stage),
      setRoomName: options.onRoomChange || (() => {}),
      setAction: options.onAction || (() => {}),
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
        game.registry.set('pixel', Boolean(options.pixel)); // 角色用像素小人（示範中）
      },
    },
    scene: [RoomScene],
  });
  if (ctx.debug) window.__castleGame = game; // 除錯用

  /**
   * 依遊戲區大小決定畫面寬高與放大倍率。
   * 一般網頁版面固定 640×360（放大 2 倍）；遊戲模式依螢幕比例，一格約佔畫面短邊的 1/10
   * （手機直拿一格約 39 px），倍率依螢幕像素密度取 2～3（太大手機會變慢），畫面才不會糊。
   */
  function fit() {
    if (!game.isBooted) return;
    const rect = stage.getBoundingClientRect();
    let width = VIEW_W * ZOOM;
    let height = VIEW_H * ZOOM;
    let zoom = ZOOM;
    if (options.isGameMode?.() && rect.width > 0 && rect.height > 0) {
      const tile = clamp(Math.min(rect.width, rect.height) / 10, 32, 64);
      zoom = clamp(Math.round((window.devicePixelRatio || 1) * tile / TILE), 2, 3);
      width = Math.round(rect.width * TILE * zoom / tile);
      height = Math.round(rect.height * TILE * zoom / tile);
    }
    game.registry.set('zoom', zoom);
    if (game.scale.width !== width || game.scale.height !== height) game.scale.setGameSize(width, height);
    else game.scale.refresh();
    const scene = game.scene.getScene('room');
    if (scene?.sys.isActive()) scene.fitCamera();
  }
  game.events.once('ready', fit);
  new ResizeObserver(() => fit()).observe(stage);

  return {
    game,
    fit,
    dialog: ctx.ui.dialog.element,
    /** 操作列的「互動」按鈕：等於按 E */
    pressInteract() {
      const scene = game.scene.getScene('room');
      if (scene?.sys.isActive()) scene.pressInteract();
    },
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
