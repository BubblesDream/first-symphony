// 唯一的房間場景：所有房間都用這一個場景，差別只在房間定義檔（rooms/*.js）。
// 進入房間時：畫地圖 → 放牆壁碰撞 → 放訪客 → 只建立這個房間的 NPC。
// 走進門 → 淡出 → 用新的房間 id 重新啟動這個場景。
import { TILE, ZOOM, COLORS, INTERACT_RANGE, CLICK_RANGE } from './config.js';
import { ROOMS, START_ROOM } from './rooms/index.js';
import { buildGrid, tileFeet, toTile } from './grid.js';
import { Npc } from './npc.js';
import { Player } from './player.js';
import { pickLines } from './roster.js';
import { drawDebug, updateDebug } from './debug.js';
import { TILE_ART, SPRITE_ART, KIND_TILES, queueArt, hasArt, artKey, tileFrame } from './art.js';

const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';

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

    this.drawRoom();
    this.buildColliders();

    // 訪客
    const [sx, sy] = this.room.spawns[this.spawnId] || this.room.spawns.start;
    const spawn = tileFeet(sx, sy);
    this.player = new Player(this, spawn.x, spawn.y);
    this.physics.add.collider(this.player.feet, this.solidBodies);
    this.physics.add.collider(this.player.feet, this.lockedBodies, (_, door) => this.ctx.ui.toast(door.message));

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

    // 鏡頭
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    cam.setBounds(0, 0, width, height);
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

    // 最近的互動對象
    const target = this.nearestTarget();
    this.target = target;
    for (const npc of this.npcs) npc.avatar.setNameVisible(npc === this.hovered || target?.npc === npc);
    if (target && !dialog.isOpen) {
      this.prompt.setPosition(target.x, target.y - (target.npc ? 46 : 18)).setVisible(true);
    } else {
      this.prompt.setVisible(false);
    }

    const pressed = Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace);
    if (pressed) {
      if (dialog.isOpen) dialog.next();
      else if (target) this.interact(target);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) dialog.close();

    this.checkDoor();
    if (this.ctx.debug) updateDebug(this);
  }

  // ---------- 地圖 ----------
  // 由下往上：地面色塊 → 地板與牆的拼貼圖 → 還沒有圖的家具色塊 → 家具與門的圖片。
  // 有圖就用圖；圖片沒登記或載入失敗，就看到原本的色塊。

  drawRoom() {
    this.artReport = { used: new Set(), missing: new Set() };
    this.sprites = this.findSprites();
    this.drawFallback();
    this.drawTiles();
    for (const s of this.sprites) if (s.ok) this.placeSprite(s);
    // 文字標籤（網站自己寫的固定文字）
    for (const label of this.room.labels || []) {
      this.add.text((label.x + 0.5) * TILE, (label.y + 0.5) * TILE, label.text, {
        fontFamily: FONT, fontSize: '9px', color: '#fffaf0', backgroundColor: 'rgba(43,33,25,0.6)', padding: { x: 2, y: 0 },
      }).setOrigin(0.5).setResolution(3).setDepth(-2);
    }
    this.artReport = { used: [...this.artReport.used].sort(), missing: [...this.artReport.missing].sort() };
  }

  /** 格子底下鋪什麼：floor／carpet／stage／wall */
  underOf(c) {
    if (!c) return 'wall';
    if (['floor', 'carpet', 'stage', 'wall'].includes(c.kind)) return c.kind;
    if (c.kind === 'door') return this.room.doors[c.ch]?.under || 'floor';
    return this.grid.legend[c.ch]?.under || 'floor';
  }

  /** 這格要用哪張單張圖（家具或門） */
  spriteOf(c) {
    if (c.kind === 'door') {
      const door = this.room.doors[c.ch];
      return door.sprite || (door.to ? 'door_open' : 'door_locked');
    }
    return this.grid.legend[c.ch]?.sprite || null;
  }

  /** 牆的正面（下面是房間）畫石牆；其他牆是牆頂，畫暗一點 */
  isWallFace(x, y) {
    const below = this.grid.cell(x, y + 1);
    return Boolean(below) && this.underOf(below) !== 'wall';
  }

  /** 找出每一塊家具：同一個字元連在一起的格子算一件（例如 2×2 的桌子） */
  findSprites() {
    const { grid } = this;
    const seen = new Set();
    const list = [];
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        const c = grid.cells[y][x];
        const name = this.spriteOf(c);
        if (!name || seen.has(`${x},${y}`)) continue;
        const box = { x0: x, y0: y, x1: x, y1: y };
        const stack = [[x, y]];
        seen.add(`${x},${y}`);
        while (stack.length) {
          const [cx, cy] = stack.pop();
          box.x0 = Math.min(box.x0, cx); box.x1 = Math.max(box.x1, cx);
          box.y0 = Math.min(box.y0, cy); box.y1 = Math.max(box.y1, cy);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const n = grid.cell(cx + dx, cy + dy);
            if (n && n.ch === c.ch && !seen.has(`${cx + dx},${cy + dy}`)) {
              seen.add(`${cx + dx},${cy + dy}`);
              stack.push([cx + dx, cy + dy]);
            }
          }
        }
        const ok = hasArt(this, name);
        this.artReport[ok ? 'used' : 'missing'].add(name);
        // 一塊比家具本身大時（例如一整排椅子），依家具佔的格數切開，每一份放一件
        const art = SPRITE_ART[name] || {};
        const fw = ok ? Math.max(1, Math.round(art.w)) : box.x1 - box.x0 + 1;
        const fh = ok ? art.foot || 1 : box.y1 - box.y0 + 1;
        for (let y0 = box.y0; y0 <= box.y1; y0 += fh) {
          for (let x0 = box.x0; x0 <= box.x1; x0 += fw) {
            list.push({ x0, y0, x1: Math.min(x0 + fw - 1, box.x1), y1: Math.min(y0 + fh - 1, box.y1), name, cell: c, ok });
          }
        }
      }
    }
    return list;
  }

  /** 色塊（原本的畫法）。地面色塊在最底層；家具色塊畫在拼貼圖上面，已經有圖的家具就不畫。 */
  drawFallback() {
    const ground = this.add.graphics().setDepth(-10);
    const g = this.add.graphics().setDepth(-8);
    const { grid, room } = this;
    const covered = new Set();
    for (const s of this.sprites) {
      if (!s.ok) continue;
      for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) covered.add(`${x},${y}`);
    }
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        const c = grid.cells[y][x];
        const px = x * TILE;
        const py = y * TILE;
        const def = grid.legend[c.ch] || {};
        const alt = (x + y) % 2 === 0;
        const under = this.underOf(c);
        if (under === 'wall') {
          ground.fillStyle(COLORS.wall).fillRect(px, py, TILE, TILE);
          ground.fillStyle(COLORS.wallTop).fillRect(px, py, TILE, 6);
        } else if (under === 'carpet') {
          ground.fillStyle(COLORS.carpet).fillRect(px, py, TILE, TILE);
        } else if (under === 'stage') {
          ground.fillStyle(alt ? COLORS.stage : COLORS.stageAlt).fillRect(px, py, TILE, TILE);
        } else {
          ground.fillStyle(alt ? COLORS.floor : COLORS.floorAlt).fillRect(px, py, TILE, TILE);
        }
        if (covered.has(`${x},${y}`)) continue;
        switch (c.kind) {
          case 'wall':
            if (def.color) g.fillStyle(COLORS[def.color]).fillRect(px + 8, py + 4, 16, 24);
            break;
          case 'door': {
            const locked = !room.doors[c.ch]?.to;
            g.fillStyle(locked ? COLORS.doorLocked : COLORS.door).fillRect(px, py, TILE, TILE);
            g.lineStyle(2, locked ? 0x8a6f58 : 0xe0c27a).strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
            break;
          }
          case 'seat':
            g.fillStyle(COLORS[def.color] || COLORS.seat).fillRoundedRect(px + 6, py + 8, TILE - 12, TILE - 12, 4);
            break;
          case 'floor': case 'carpet': case 'stage':
            break;
          default: // furniture
            g.fillStyle(COLORS[def.color] || COLORS.furniture).fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
            g.lineStyle(1, COLORS.furnitureLine).strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
        }
      }
    }
  }

  /** 地板、地毯、舞台、牆的拼貼圖，畫進一張兩倍大的畫布（圖片原尺寸，接縫不會出現細線） */
  drawTiles() {
    const { grid } = this;
    const tileName = (under) => {
      const name = this.room.tiles?.[under] || KIND_TILES[under];
      return hasArt(this, name) ? name : null;
    };
    if (!Object.keys(KIND_TILES).some((k) => tileName(k))) return;
    const S = TILE * 2; // 畫布上一格 64 像素
    const rt = this.add.renderTexture(0, 0, grid.w * S, grid.h * S).setOrigin(0).setScale(0.5).setDepth(-9);
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        const c = grid.cells[y][x];
        const under = this.underOf(c);
        const name = tileName(under);
        if (!name) continue;
        this.artReport.used.add(name);
        const art = TILE_ART[name];
        let col = x % art.cols;
        if (art.edges) {
          // 地毯：找出這一段地毯的左右端，左右端用滾邊，中間輪流用花紋
          let start = x;
          let end = x;
          while (this.underOf(grid.cell(start - 1, y)) === under) start--;
          while (this.underOf(grid.cell(end + 1, y)) === under) end++;
          const i = x - start;
          if (i === 0) col = 0;
          else if (x === end) col = art.cols - 1;
          else col = 1 + ((i - 1) % (art.cols - 2));
        }
        rt.drawFrame(artKey(name), tileFrame(this, name, col, y % art.rows), x * S, y * S);
        if (under === 'wall' && !this.isWallFace(x, y)) rt.fill(COLORS.background, 0.55, x * S, y * S, S, S);
      }
    }
  }

  /** 家具與門的圖片。牆上的東西永遠在角色後面；地上的依下緣排前後。 */
  placeSprite(s) {
    const art = SPRITE_ART[s.name];
    const def = this.grid.legend[s.cell.ch] || {};
    const cx = ((s.x0 + s.x1 + 1) / 2) * TILE;
    const bottom = (s.y1 + 1) * TILE;
    const onWall = s.cell.kind === 'wall' || s.cell.kind === 'door';
    if (!onWall) {
      // 遊戲自己加的淡淡影子
      this.add.ellipse(cx, bottom - 3, art.w * TILE * 0.8, 8, 0x000000, 0.16).setDepth(-3);
    }
    this.add.image(cx, bottom, artKey(s.name))
      .setOrigin(0.5, 1)
      .setDisplaySize(art.w * TILE, art.h * TILE)
      .setFlipX(Boolean(def.flipX))
      .setDepth(onWall ? -4 : bottom);
  }

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
        if (grid.npcWalkable(x, y) && Math.abs(x - sx) + Math.abs(y - sy) > 2) tiles.push([x, y]);
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
      dialog.open({ title: obj.name, lines: obj.text.map((text) => ({ text, is_demo: obj.demo })) });
    }
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
