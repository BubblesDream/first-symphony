// 唯一的房間場景：所有房間都用這一個場景，差別只在房間定義檔（rooms/*.js）。
// 進入房間時：畫地圖（roomView.js）→ 放牆壁碰撞 → 放訪客 → 只建立這個房間的 NPC。
// 走進門 → 淡出 → 用新的房間 id 重新啟動這個場景。
import { TILE, VIEW_W, VIEW_H, ZOOM, COLORS, FONT, INTERACT_RANGE, CLICK_RANGE } from './config.js';
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
import { drawAmbience } from './ambience.js';


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
    this.groups = new Groups(this); // 多人演出（合奏、乾杯…）

    // 時間氛圍：依訪客電腦的時間（?hour= 可測試）
    this.mood = drawAmbience(this, width, height, this.ctx.hour ?? new Date().getHours(), this.room.outdoor);

    // 鏡頭
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    // 房間比畫面小時置中（兩側露出背景色），比畫面大時鏡頭跟著訪客
    const padX = Math.max(0, (VIEW_W - width) / 2);
    const padY = Math.max(0, (VIEW_H - height) / 2);
    cam.setBounds(-padX, -padY, width + padX * 2, height + padY * 2);
    cam.startFollow(this.player.feet, true, 0.15, 0.15);
    cam.setBackgroundColor(COLORS.background);
    cam.fadeIn(200);

    // 互動提示（頭上的「E」）
    this.prompt = this.add.text(0, 0, 'E', {
      fontFamily: FONT, fontSize: '9px', color: '#3a2a1f', backgroundColor: '#ffe08a', padding: { x: 3, y: 0 },
    }).setOrigin(0.5, 1).setResolution(3).setDepth(100000).setVisible(false);

    // 按鍵：E／空白鍵互動、Esc 關閉對話
    this.keyE = this.input.keyboard.addKey('E');
    this.keySpace = this.input.keyboard.addKey('SPACE');
    this.keyEsc = this.input.keyboard.addKey('ESC');

    this.input.on('pointerdown', (pointer) => this.onPointerDown(pointer));
    this.input.on('pointermove', (pointer) => {
      this.hovered = this.npcAt(pointer.worldX, pointer.worldY);
    });

    this.events.once('shutdown', () => {
      this.ctx.ui.dialog.close();
      for (const npc of this.npcs) npc.destroy();
      for (const critter of this.critters) critter.destroy();
    });

    this.ctx.ui.setRoomName(this.room.name);
    if (this.ctx.debug) drawDebug(this);
  }

  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.1);
    const { dialog } = this.ctx.ui;

    this.player.update(dt, dialog.isOpen || this.leaving);
    for (const npc of this.npcs) npc.update(dt);
    this.npcBodies.forEach((zone) => zone.setPosition(zone.npc.x, zone.npc.y));
    for (const critter of this.critters) critter.update(dt);
    this.critterBodies.forEach((zone) => zone.setPosition(zone.critter.x, zone.critter.y - 6));
    this.groups.update(dt);

    // 最近的互動對象
    const target = this.nearestTarget();
    this.target = target;
    for (const npc of this.npcs) npc.avatar.setNameVisible(npc === this.hovered || target?.npc === npc);
    if (target && !dialog.isOpen) {
      this.prompt.setPosition(target.x, target.y - (target.npc ? 46 : target.critter ? 34 : 18)).setVisible(true);
    } else {
      this.prompt.setVisible(false);
    }

    const pressed = Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace);
    if (pressed) {
      if (dialog.isOpen) dialog.next();
      else if (this.player.act) this.player.stopAct(); // 演出中按 E：離開演出（附近沒有物件也可以）
      else if (target) this.interact(target);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) dialog.close();

    this.checkDoor();
    if (this.ctx.debug) updateDebug(this);
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

  npcAt(wx, wy) {
    return this.npcs.find((npc) => Math.abs(wx - npc.x) <= 11 && wy <= npc.y + 3 && wy >= npc.y - 40) || null;
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
      // 物件多半在牆邊或家具上，用物件格子的下緣算距離
      const d = Math.hypot(ox - x, oy + TILE / 2 - y);
      if (d < bestDist) {
        best = { obj, x: ox, y: oy };
        bestDist = d;
      }
    }
    return best;
  }

  interact(target) {
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
      dialog.open({
        title: obj.name,
        lines: this.objectLines(obj),
        onClose: obj.play ? () => this.playAt(obj) : null,
      });
    }
  }

  /**
   * 物件的文字：text 依序顯示；random 從裡面隨機抽一句接在後面（例如噴泉許願）；
   * source: 'history' 接網站的公會歷史資料，一筆一頁（展示櫃翻頁）。
   */
  objectLines(obj) {
    const lines = obj.text.map((text) => ({ text, is_demo: obj.demo }));
    if (obj.random?.length) lines.push({ text: this.rng.pick(obj.random), is_demo: obj.demo });
    if (obj.source === 'history') {
      const items = this.ctx.history || [];
      if (!items.length) lines.push({ text: '展示櫃裡還是空的，公會歷史整理中。' });
      for (const item of [...items].sort((p, q) => String(p.date).localeCompare(String(q.date)))) {
        const body = String(item.body || '').split(/\n/).map((s) => s.trim()).filter(Boolean).join(' ');
        lines.push({ text: `【${item.date}】${item.title}${body ? `｜${body}` : ''}`, is_demo: item.is_demo });
      }
    }
    return lines;
  }

  /** 物件的 play：訪客走到最近、沒人用的同動作演出點，自己演出 */
  playAt(obj) {
    const { grid } = this;
    const ox = Math.floor(obj.x);
    const oy = Math.floor(obj.y);
    const options = [];
    for (const spot of this.spots) {
      if (spot.action !== obj.play || spot.user || grid.occupant(spot.x, spot.y)) continue;
      const approach = this.approachOf(spot);
      if (approach) options.push({ spot, approach, d: Math.abs(spot.x - ox) + Math.abs(spot.y - oy) });
    }
    options.sort((a, b) => a.d - b.d);
    for (const { spot, approach } of options) {
      if (this.player.startAct(spot, approach)) return;
    }
    this.ctx.ui.toast(`${obj.name}現在有人在用，等一下再來吧。`);
  }

  /** 演出點本身能走就直接走上去；否則找旁邊能走、沒人的格子 */
  approachOf(spot) {
    const { grid } = this;
    if (grid.playerWalkable(spot.x, spot.y)) return [spot.x, spot.y];
    const near = [[0, 1], [0, -1], [-1, 0], [1, 0]]
      .map(([dx, dy]) => [spot.x + dx, spot.y + dy])
      .filter(([x, y]) => grid.npcWalkable(x, y) && !grid.occupant(x, y));
    return near[0] || null;
  }

  onPointerDown(pointer) {
    if (this.ctx.ui.dialog.isOpen || this.leaving) return;
    const wx = pointer.worldX;
    const wy = pointer.worldY;
    const npc = this.npcAt(wx, wy);
    if (npc) {
      if (Math.hypot(npc.x - this.player.x, npc.y - this.player.y) <= CLICK_RANGE) {
        this.interact({ npc, x: npc.x, y: npc.y });
      } else {
        this.ctx.ui.toast(`走近一點再和 ${npc.data.nickname} 聊天吧。`);
        this.player.walkTo(npc.tx, npc.ty + 1);
      }
      return;
    }
    const t = toTile(wx, wy);
    if (this.grid.playerWalkable(t.x, t.y)) this.player.walkTo(t.x, t.y);
  }

  // ---------- 門 ----------

  checkDoor() {
    if (this.leaving) return;
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
