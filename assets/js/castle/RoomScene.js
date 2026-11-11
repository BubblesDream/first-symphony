// 唯一的房間場景：所有房間都用這一個場景，差別只在房間定義檔（rooms/*.js）。
// 進入房間時：畫地圖（roomView.js）→ 放牆壁碰撞 → 放訪客 → 只建立這個房間的 NPC。
// 走進門 → 淡出 → 用新的房間 id 重新啟動這個場景。
import { TILE, ZOOM, COLORS, FONT, INTERACT_RANGE } from './config.js';
import { ROOMS, START_ROOM } from './rooms/index.js';
import { buildGrid, tileFeet, toTile } from './grid.js';
import { Npc } from './npc.js';
import { Player } from './player.js';
import { pickLines } from './roster.js';
import { drawDebug, updateDebug } from './debug.js';
import { queueArt } from './art.js';
import { RoomView } from './roomView.js';
import { Critter } from './critter.js';
import { Groups } from './groups.js';
import { Ensemble } from './ensemble.js';
import { drawAmbience } from './ambience.js';
import { renderCard } from './card.js';
import * as sources from './sources/index.js';
import { furnitureTiles, furnitureReach } from './interaction.js';
import { TapMove } from './tapMove.js';

const unknownSources = new Set();

export class RoomScene extends Phaser.Scene {
  constructor() {
    super('room');
  }

  init(data) {
    this.roomId = ROOMS[data?.roomId] ? data.roomId : START_ROOM;
    this.spawnId = data?.spawn || 'start';
  }

  preload() {
    queueArt(this); // 圖片載入失敗不會中斷遊戲，那張圖改畫色塊
  }

  create() {
    this.ctx = this.registry.get('ctx'); // { roster, lines, rng, ui, debug }
    this.rng = this.ctx.rng;
    this.room = ROOMS[this.roomId];
    this.grid = buildGrid(this.room);
    this.spots = this.room.spots.map((s) => ({ ...s, user: null }));
    this.leaving = false;

    const width = this.grid.w * TILE;
    const height = this.grid.h * TILE;
    this.physics.world.setBounds(0, 0, width, height);

    this.artReport = new RoomView(this, this.grid, this.room).draw();
    this.buildColliders();

    // 訪客
    const [sx, sy] = this.room.spawns[this.spawnId] || this.room.spawns.start;
    const spawn = tileFeet(sx, sy);
    this.player = new Player(this, spawn.x, spawn.y);
    this.physics.add.collider(this.player.feet, this.solidBodies);
    this.physics.add.collider(this.player.feet, this.lockedBodies, (_, door) => this.ctx.ui.toast(door.message));

    // 會走動的小動物（羊）：先放，NPC 的起始位置會避開牠們
    this.critters = [];
    for (const def of this.room.critters || []) {
      for (const [x, y] of def.at) this.critters.push(new Critter(this, def, x, y));
    }
    this.critterBodies = this.critters.map((critter) => {
      const zone = this.add.zone(critter.x, critter.y - 6, 20, 10);
      this.physics.add.existing(zone);
      zone.body.setImmovable(true);
      zone.body.moves = false;
      zone.critter = critter;
      return zone;
    });
    this.physics.add.collider(this.player.feet, this.critterBodies);

    // NPC：只建立這個房間被分配到的人
    this.npcs = [];
    const people = this.ctx.roster[this.roomId] || [];
    const startTiles = this.pickStartTiles(people.length, sx, sy);
    people.forEach((person, i) => {
      if (startTiles[i]) this.npcs.push(new Npc(this, person, ...startTiles[i]));
    });
    // NPC 的碰撞框（訪客撞得到，NPC 自己移動時不靠物理）
    this.npcBodies = this.npcs.map((npc) => {
      const zone = this.add.zone(npc.x, npc.y, 16, 10);
      this.physics.add.existing(zone);
      zone.body.setImmovable(true);
      zone.body.moves = false;
      zone.npc = npc;
      return zone;
    });
    this.physics.add.collider(this.player.feet, this.npcBodies);
    this.ensemble = this.room.ensemble ? new Ensemble(this) : null;
    this.onPlayerAct = (spot) => this.ensemble?.start(spot);
    this.onPlayerActEnd = (spot) => { if (this.ensemble?.isSpot(spot)) this.ensemble.stop(); };
    this.groups = new Groups(this); // 多人演出（合奏、乾杯…）

    // 時間氛圍：依訪客電腦的時間（?hour= 可測試）
    this.mood = drawAmbience(this, width, height, this.ctx.hour ?? new Date().getHours(), this.room.outdoor);

    // 鏡頭（畫面大小會隨遊戲模式改變，見 fitCamera）
    const cam = this.cameras.main;
    this.fitCamera();
    cam.startFollow(this.player.feet, true, 0.15, 0.15);
    cam.setBackgroundColor(COLORS.background);
    cam.fadeIn(200);

    // 互動提示（頭上的「E」；觸控裝置改成「！」，按操作列的互動按鈕）
    this.prompt = this.add.text(0, 0, this.ctx.touch ? '！' : 'E', {
      fontFamily: FONT, fontSize: '9px', color: '#3a2a1f', backgroundColor: '#ffe08a', padding: { x: 3, y: 0 },
    }).setOrigin(0.5, 1).setResolution(3).setDepth(100000).setVisible(false);

    // 按鍵：E／空白鍵互動、Esc 關閉對話
    this.keyE = this.input.keyboard.addKey('E');
    this.keySpace = this.input.keyboard.addKey('SPACE');
    this.keyEsc = this.input.keyboard.addKey('ESC');

    const unlockAudio = () => this.ensemble?.unlock();
    this.input.keyboard.on('keydown', unlockAudio);
    this.input.on('pointerdown', (pointer) => this.onPointerDown(pointer));
    this.input.on('pointermove', (pointer) => {
      this.hovered = this.npcAt(pointer.worldX, pointer.worldY);
    });
    this.tapMove = new TapMove(this);
    this.pending = null; // 點了成員或物品、正走過去：到了就互動
    this.actionLabel = null;
    this.blobs = new Map(); // 物件所在家具的格子（點家具任何一格都算點到物件）

    this.events.once('shutdown', () => {
      this.leaving = true;
      this.input.keyboard.off('keydown', unlockAudio);
      this.ensemble?.destroy();
      this.ctx.ui.dialog.close();
      this.ctx.ui.card.close();
      for (const npc of this.npcs) npc.destroy();
      for (const critter of this.critters) critter.destroy();
    });

    this.ctx.ui.setRoomName(this.room.name);
    this.ctx.ui.setAction({ label: '互動', enabled: false });
    if (this.ctx.debug) drawDebug(this);
  }

  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.1);
    const { dialog } = this.ctx.ui;

    this.player.update(dt, this.uiBusy() || this.leaving);
    for (const npc of this.npcs) npc.update(dt);
    this.npcBodies.forEach((zone) => zone.setPosition(zone.npc.x, zone.npc.y));
    for (const critter of this.critters) critter.update(dt);
    this.critterBodies.forEach((zone) => zone.setPosition(zone.critter.x, zone.critter.y - 6));
    this.ensemble?.update(dt);
    this.groups.update(dt);

    // 最近的互動對象
    const target = this.nearestTarget();
    this.target = target;
    for (const npc of this.npcs) npc.avatar.setNameVisible(npc === this.hovered || target?.npc === npc);
    if (target && !this.uiBusy()) {
      this.prompt.setPosition(target.x, target.y - (target.npc ? target.npc.avatar.top + 6 : target.critter ? 34 : 18)).setVisible(true);
    } else {
      this.prompt.setVisible(false);
    }

    this.updatePending();
    const pressed = Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace);
    if (pressed) this.pressInteract();
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      if (this.ctx.ui.card.isOpen) this.ctx.ui.card.close();
      else dialog.close();
    }
    this.updateActionButton();

    this.checkDoor();
    if (this.ctx.debug) updateDebug(this);
  }

  // ---------- 畫面 ----------

  /** 依目前的畫面大小與放大倍率設定鏡頭（main.js 的 fit 在畫面大小改變時呼叫） */
  fitCamera() {
    const cam = this.cameras.main;
    const zoom = this.registry.get('zoom') || ZOOM;
    const { width: gw, height: gh } = this.scale.gameSize;
    const width = this.grid.w * TILE;
    const height = this.grid.h * TILE;
    cam.setSize(gw, gh);
    cam.setZoom(zoom);
    // 房間比畫面小時置中（兩側露出背景色），比畫面大時鏡頭跟著訪客
    const padX = Math.max(0, (gw / zoom - width) / 2);
    const padY = Math.max(0, (gh / zoom - height) / 2);
    cam.setBounds(-padX, -padY, width + padX * 2, height + padY * 2);
  }

  // ---------- 碰撞 ----------

  /** 把會擋路的格子合併成一段一段的靜態碰撞框（同一列相鄰的合併） */
  buildColliders() {
    this.solidBodies = [];
    this.lockedBodies = [];
    const { grid, room } = this;
    for (let y = 0; y < grid.h; y++) {
      let start = -1;
      for (let x = 0; x <= grid.w; x++) {
        const solid = x < grid.w && grid.playerSolid(x, y);
        if (solid && start < 0) start = x;
        if (!solid && start >= 0) {
          const zone = this.add.zone(start * TILE, y * TILE, (x - start) * TILE, TILE).setOrigin(0);
          this.physics.add.existing(zone, true);
          this.solidBodies.push(zone);
          start = -1;
        }
        // 上鎖的門：擋住訪客，碰到時顯示訊息
        const c = grid.cell(x, y);
        if (c?.kind === 'door' && !room.doors[c.ch]?.to) {
          const zone = this.add.zone(x * TILE, y * TILE, TILE, TILE).setOrigin(0);
          this.physics.add.existing(zone, true);
          zone.message = room.doors[c.ch].locked || '這裡還沒開放。';
          this.lockedBodies.push(zone);
        }
      }
    }
  }

  /** NPC 的起始位置：能走的空格子，避開門口與訪客附近 */
  pickStartTiles(count, sx, sy) {
    const { grid } = this;
    const tiles = [];
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        if (grid.npcWalkable(x, y) && !grid.occupant(x, y) && Math.abs(x - sx) + Math.abs(y - sy) > 2) tiles.push([x, y]);
      }
    }
    return this.rng.shuffle(tiles).slice(0, count);
  }

  // ---------- 互動 ----------

  isPlayerOn(x, y) {
    const t = this.player.tile;
    return t.x === x && t.y === y;
  }

  /** loose：手指點的，範圍放大 */
  npcAt(wx, wy, loose = false) {
    const [half, below, above] = loose ? [16, 10, 52] : [11, 3, 46];
    const hits = this.npcs.filter((npc) => Math.abs(wx - npc.x) <= half && wy <= npc.y + below && wy >= npc.y - above);
    return closest(hits, wx, wy + 18);
  }

  critterAt(wx, wy, loose = false) {
    const half = loose ? 20 : 14;
    const hits = this.critters.filter((c) => Math.abs(wx - c.x) <= half && wy <= c.y + 6 && wy >= c.y - 28);
    return closest(hits, wx, wy + 10);
  }

  /** 點到哪個物件：點在物件所在的家具（同一個字元連成的一塊）上，或離物件中心夠近 */
  objectAt(wx, wy, loose = false) {
    const t = toTile(wx, wy);
    const radius = (loose ? 0.9 : 0.6) * TILE;
    let best = null;
    let bestDist = Infinity;
    for (const obj of this.room.objects || []) {
      const ox = (obj.x + 0.5) * TILE;
      const oy = (obj.y + 0.5) * TILE;
      const d = Math.hypot(wx - ox, wy - oy);
      if ((d <= radius || this.blobOf(obj).has(`${t.x},${t.y}`)) && d < bestDist) {
        best = obj;
        bestDist = d;
      }
    }
    return best;
  }

  /** 物件所在家具的格子（同字元相連、最多 16 格；地板、一般的牆或太大片的只算物件那一格） */
  blobOf(obj) {
    if (this.blobs.has(obj)) return this.blobs.get(obj);
    const tiles = furnitureTiles(this.grid, obj);
    this.blobs.set(obj, tiles);
    return tiles;
  }

  nearestTarget() {
    const { x, y } = this.player;
    let best = null;
    let bestDist = INTERACT_RANGE;
    for (const npc of this.npcs) {
      const d = Math.hypot(npc.x - x, npc.y - y);
      if (d < bestDist) {
        best = { npc, x: npc.x, y: npc.y };
        bestDist = d;
      }
    }
    for (const critter of this.critters) {
      const d = Math.hypot(critter.x - x, critter.y - y);
      if (d < bestDist) {
        best = { critter, x: critter.x, y: critter.y };
        bestDist = d;
      }
    }
    for (const obj of this.room.objects || []) {
      const ox = (obj.x + 0.5) * TILE;
      const oy = (obj.y + 0.5) * TILE;
      // 腳底到家具最近一格邊緣的距離
      const d = furnitureReach(this.grid, obj, x, y, this.blobOf(obj)).distance;
      if (d < bestDist) {
        best = { obj, x: ox, y: oy };
        bestDist = d;
      }
    }
    return best;
  }

  uiBusy() {
    return this.ctx.ui.dialog.isOpen || this.ctx.ui.card.isOpen;
  }

  /** 按 E、空白鍵或操作列的互動按鈕 */
  pressInteract() {
    const { dialog } = this.ctx.ui;
    if (this.leaving) return;
    if (this.ctx.ui.card.isOpen) this.ctx.ui.card.close();
    else if (dialog.isOpen) dialog.next();
    else if (this.player.act) this.player.stopAct(); // 演出中：離開演出（附近沒有物件也可以）
    else if (this.target) this.interact(this.target);
  }

  /** 操作列的互動按鈕顯示什麼（有變才通知網頁） */
  updateActionButton() {
    const { dialog } = this.ctx.ui;
    const t = this.target;
    let state;
    if (this.ctx.ui.card.isOpen) state = { label: '關閉卡片', enabled: true };
    else if (dialog.isOpen) state = { label: '繼續', enabled: true };
    else if (this.player.act) state = { label: '離開演出', enabled: true };
    else if (t?.npc) state = { label: `聊天：${t.npc.data.nickname}`, enabled: true };
    else if (t?.critter) state = { label: `摸摸${t.critter.def.name || '牠'}`, enabled: true };
    else if (t?.obj) state = { label: `查看：${t.obj.name}`, enabled: true };
    else state = { label: '互動', enabled: false };
    const key = `${state.label}|${state.enabled}`;
    if (key === this.actionLabel) return;
    this.actionLabel = key;
    this.ctx.ui.setAction(state);
  }

  interact(target) {
    if (this.uiBusy() || this.leaving) return;
    this.pending = null;
    const { dialog } = this.ctx.ui;
    this.player.faceToward(target.x, target.y);
    if (target.critter) {
      target.critter.say(true);
      return;
    }
    if (target.npc) {
      const npc = target.npc;
      npc.startTalk(this.player.x, this.player.y);
      dialog.open({
        title: npc.data.nickname,
        subtitle: npc.data.role,
        lines: pickLines(this.ctx.lines, npc.data.id, this.roomId, this.rng),
        onClose: () => npc.endTalk(),
      });
    } else if (target.obj) {
      const { obj } = target;
      if (this.player.act) {
        // 演出中再按 E：離開演出
        this.player.stopAct();
        return;
      }
      const state = {};
      const lines = this.objectLines(obj, state);
      const card = this.objectCard(obj, state);
      dialog.open({
        title: obj.name,
        lines,
        onClose: () => {
          if (this.leaving) return;
          const play = () => { if (!this.leaving && obj.play) this.playAt(obj); };
          if (card) this.ctx.ui.card.open({
            filename: card.filename,
            build: (name) => renderCard({ ...card.spec, name }),
            onClose: play,
          });
          else play();
        },
      });
    }
  }

  /** 文字與隨機句、樂器提示由場景處理，其他內容交給來源。 */
  objectLines(obj, state = {}) {
    const instrument = this.spots.find((s) => s.object === obj)?.instrument;
    const lines = (instrument ? [`${instrument}：坐下來就會召集大家一起合奏`] : obj.text).map((text) => ({ text, is_demo: obj.demo }));
    if (obj.random?.length) lines.push({ text: this.rng.pick(obj.random), is_demo: obj.demo });
    const source = this.objectSource(obj);
    if (source) lines.push(...source.lines(this, obj, state));
    return lines;
  }

  objectCard(obj, state = {}) {
    return this.objectSource(obj)?.card?.(this, obj, state) || null;
  }

  objectSource(obj) {
    if (!obj.source) return null;
    if (Object.hasOwn(sources, obj.source)) return sources[obj.source];
    if (!unknownSources.has(obj.source)) {
      unknownSources.add(obj.source);
      console.warn(`未登記的互動來源：${obj.source}`);
    }
    return null;
  }

  /** 物件的 play：訪客走到最近、沒人用的同動作演出點，自己演出 */
  playAt(obj) {
    const { grid } = this;
    const ox = Math.floor(obj.x);
    const oy = Math.floor(obj.y);
    const options = [];
    let hasFreeSpot = false;
    for (const spot of this.spots) {
      if ((obj.seats ? spot.object !== obj : spot.action !== obj.play) || spot.user || grid.occupant(spot.x, spot.y)) continue;
      hasFreeSpot = true;
      const approach = this.approachOf(spot);
      const feet = tileFeet(spot.x, spot.y);
      const d = obj.seats ? Math.hypot(feet.x - this.player.x, feet.y - this.player.y) : Math.abs(spot.x - ox) + Math.abs(spot.y - oy);
      if (approach) options.push({ spot, approach, d });
    }
    options.sort((a, b) => a.d - b.d);
    for (const { spot, approach } of options) {
      if (this.player.startAct(spot, approach)) return;
    }
    this.ctx.ui.toast(hasFreeSpot ? '那裡走不過去，換個位置再試試。' : '位子都坐滿了，等一下再來吧。');
  }

  /** 演出點本身能走就直接走上去；否則找旁邊能走、沒人的格子 */
  approachOf(spot) {
    const { grid } = this;
    if (grid.playerWalkable(spot.x, spot.y)) return [spot.x, spot.y];
    const near = [[0, 1], [0, -1], [-1, 0], [1, 0]]
      .map(([dx, dy]) => [spot.x + dx, spot.y + dy])
      .filter(([x, y]) => grid.npcWalkable(x, y) && !grid.occupant(x, y));
    const from = this.player.tile;
    return near.find(([x, y]) => grid.findPath(from.x, from.y, x, y,
      (cx, cy) => grid.playerWalkable(cx, cy) && grid.isFree(cx, cy, this.player))) || null;
  }

  // ---------- 點擊（滑鼠、手指） ----------

  onPointerDown(pointer) {
    return this.tapMove.onPointerDown(pointer);
  }

  updatePending() {
    this.tapMove.updatePending();
  }

  // ---------- 門 ----------

  checkDoor() {
    if (this.leaving || this.uiBusy()) return;
    const { x, y } = this.player.tile;
    const c = this.grid.cell(x, y);
    if (c?.kind !== 'door') return;
    const door = this.room.doors[c.ch];
    if (!door?.to) return;
    this.leaving = true;
    this.cameras.main.fadeOut(200);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ roomId: door.to, spawn: door.spawn });
    });
  }
}

/** 點到好幾個時，取離點的位置最近的（x, y 是腳底位置） */
function closest(list, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const item of list) {
    const d = Math.hypot(item.x - x, item.y - y);
    if (d < bestDist) {
      best = item;
      bestDist = d;
    }
  }
  return best;
}
