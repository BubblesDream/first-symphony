// 啟動城堡遊戲：抽選成員 → 建立 Phaser 遊戲。
import { MAX_NPCS, VIEW_W, VIEW_H, ZOOM, COLORS } from './config.js';
import { createRng, hashString, taipeiDate } from './rng.js';
import { drawRoster, placeMember } from './roster.js';
import { ROOMS, OPEN_ROOMS, START_ROOM } from './rooms/index.js';
import { RoomScene } from './RoomScene.js';
import { createDialog, createToast } from './dialog.js';

/**
 * stage：放遊戲畫布的元素（要能取得焦點，鍵盤只在它取得焦點時作用）
 * data：{ members, looks, lines }
 * options：{ seed, date, npcs, room, meet, debug, noArt, onRoomChange }
 *
 * 今日城堡：誰在哪個房間、站哪裡、說哪句台詞，用「台灣時間的今天」當種子，
 * 同一天大家看到的城堡一樣（options.seed 可覆蓋，測試用）。NPC 走路等即時動作仍是隨機。
 */
export function startCastle(stage, data, options = {}) {
  const seeded = Number.isFinite(options.seed);
  const dayKey = seeded ? `seed:${options.seed}` : (options.date || taipeiDate());
  /** 依「今天＋其他部分（房間 id、成員 id…）」產生固定的亂數 */
  const dayRng = (...parts) => createRng(hashString([dayKey, ...parts].join('|')));
  const max = Number.isInteger(options.npcs) && options.npcs > 0 ? options.npcs : MAX_NPCS;
  const capacities = Object.fromEntries(OPEN_ROOMS.map((id) => [id, ROOMS[id].capacity]));
  const roster = drawRoster({
    members: data.members,
    looks: data.looks,
    rooms: OPEN_ROOMS.map((id) => ({ id, capacity: capacities[id] })),
    rng: seeded ? createRng(options.seed) : dayRng('roster'),
    max,
  });

  // ?meet=：這位成員今天一定在城堡裡，從他所在的房間開始
  const meet = options.meet ? placeMember({
    roster, members: data.members, looks: data.looks, memberId: options.meet, capacities, fallbackRoom: START_ROOM,
  }) : null;
  const startRoom = meet?.roomId || (OPEN_ROOMS.includes(options.room) ? options.room : START_ROOM);

  const ctx = {
    roster,
    lines: data.lines,
    rng: createRng(options.seed), // 即時動作（走路、泡泡）；有 seed 時也固定，方便測試
    dayRng,
    dayKey,
    startRoom,
    meet: meet ? { id: options.meet, roomId: meet.roomId, nickname: meet.nickname, shown: false } : null,
    debug: Boolean(options.debug),
    ui: {
      dialog: createDialog(stage),
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
