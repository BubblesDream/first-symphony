// 畫房間：地板、牆、家具、門、文字標籤。只管「看起來的樣子」，不管碰撞與角色。
// 由下往上：地面色塊 → 地板與牆的拼貼圖 → 還沒有圖的家具色塊 → 家具與門的圖片。
// 有圖就用圖；圖片沒登記（art.js）或載入失敗，就看到原本的色塊。
import { TILE, COLORS, FONT } from './config.js';
import { TILE_ART, SPRITE_ART, KIND_TILES, hasArt, artKey, tileFrame } from './art.js';

export class RoomView {
  /** scene：Phaser 場景；grid：grid.js 的 buildGrid 結果；room：房間定義 */
  constructor(scene, grid, room) {
    this.scene = scene;
    this.grid = grid;
    this.room = room;
  }

  /** 畫出整個房間，回傳 { used, missing }：用到的圖、還沒有圖（畫色塊）的名稱 */
  draw() {
    this.artReport = { used: new Set(), missing: new Set() };
    this.sprites = this.findSprites();
    this.drawFallback();
    this.drawTiles();
    for (const s of this.sprites) if (s.ok) this.placeSprite(s);
    // 文字標籤（網站自己寫的固定文字）
    for (const label of this.room.labels || []) {
      this.scene.add.text((label.x + 0.5) * TILE, (label.y + 0.5) * TILE, label.text, {
        fontFamily: FONT, fontSize: '9px', color: '#fffaf0', backgroundColor: 'rgba(43,33,25,0.6)', padding: { x: 2, y: 0 },
      }).setOrigin(0.5).setResolution(3).setDepth(-2);
    }
    this.artReport = { used: [...this.artReport.used].sort(), missing: [...this.artReport.missing].sort() };
    return this.artReport;
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
        const group = new Set([`${x},${y}`]);
        seen.add(`${x},${y}`);
        while (stack.length) {
          const [cx, cy] = stack.pop();
          box.x0 = Math.min(box.x0, cx); box.x1 = Math.max(box.x1, cx);
          box.y0 = Math.min(box.y0, cy); box.y1 = Math.max(box.y1, cy);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const n = grid.cell(cx + dx, cy + dy);
            if (n && n.ch === c.ch && !seen.has(`${cx + dx},${cy + dy}`)) {
              seen.add(`${cx + dx},${cy + dy}`);
              group.add(`${cx + dx},${cy + dy}`);
              stack.push([cx + dx, cy + dy]);
            }
          }
        }
        const ok = hasArt(this.scene, name);
        this.artReport[ok ? 'used' : 'missing'].add(name);
        // 一塊比家具本身大時（例如一整排椅子），依家具佔的格數切開，每一份放一件
        const art = SPRITE_ART[name] || {};
        const fw = ok ? Math.max(1, Math.round(art.w)) : box.x1 - box.x0 + 1;
        const fh = ok ? art.foot || 1 : box.y1 - box.y0 + 1;
        for (let y0 = box.y0; y0 <= box.y1; y0 += fh) {
          for (let x0 = box.x0; x0 <= box.x1; x0 += fw) {
            // 不是方塊的一片（例如圍成一圈的柵欄）：只在真的有這個字元的位置放
            if (!group.has(`${x0},${y0}`)) continue;
            list.push({ x0, y0, x1: Math.min(x0 + fw - 1, box.x1), y1: Math.min(y0 + fh - 1, box.y1), name, cell: c, ok });
          }
        }
      }
    }
    return list;
  }

  /** 色塊（原本的畫法）。地面色塊在最底層；家具色塊畫在拼貼圖上面，已經有圖的家具就不畫。 */
  drawFallback() {
    const ground = this.scene.add.graphics().setDepth(-10);
    const g = this.scene.add.graphics().setDepth(-8);
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
        const custom = room.groundColors?.[under]; // 戶外房間換地面顏色，例如 floor → 草地
        if (custom) {
          ground.fillStyle(COLORS[custom[alt ? 0 : 1] || custom[0]]).fillRect(px, py, TILE, TILE);
        } else if (under === 'wall') {
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
      if (hasArt(this.scene, name)) return name;
      if (this.room.tiles?.[under]) this.artReport.missing.add(name); // 房間指定的地面圖還沒有，畫色塊
      return null;
    };
    if (!Object.keys(KIND_TILES).some((k) => tileName(k))) return;
    const S = TILE * 2; // 畫布上一格 64 像素
    const rt = this.scene.add.renderTexture(0, 0, grid.w * S, grid.h * S).setOrigin(0).setScale(0.5).setDepth(-9);
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
        rt.drawFrame(artKey(name), tileFrame(this.scene, name, col, y % art.rows), x * S, y * S);
        if (under === 'wall' && !this.isWallFace(x, y)) rt.fill(COLORS.background, 0.55, x * S, y * S, S, S);
      }
    }
  }

  /** 家具與門的圖片。牆上的東西永遠在角色後面；地上的依下緣排前後。 */
  placeSprite(s) {
    const art = SPRITE_ART[s.name];
    // 門的設定寫在 doors（可以有 flipX），其他寫在 legend
    const def = (s.cell.kind === 'door' ? this.room.doors[s.cell.ch] : this.grid.legend[s.cell.ch]) || {};
    const cx = ((s.x0 + s.x1 + 1) / 2) * TILE;
    const bottom = (s.y1 + 1) * TILE;
    const onWall = s.cell.kind === 'wall' || s.cell.kind === 'door';
    if (!onWall) {
      // 遊戲自己加的淡淡影子
      this.scene.add.ellipse(cx, bottom - 3, art.w * TILE * 0.8, 8, 0x000000, 0.16).setDepth(-3);
    }
    // behind：同一位置、畫在這張圖後面的另一張圖（例如布幕中間的徽章）
    if (def.behind && hasArt(this.scene, def.behind)) {
      const b = SPRITE_ART[def.behind];
      this.artReport.used.add(def.behind);
      this.scene.add.image(cx, bottom - 2, artKey(def.behind))
        .setOrigin(0.5, 1).setDisplaySize(b.w * TILE, b.h * TILE).setDepth(onWall ? -4.5 : bottom - 0.5);
    }
    this.scene.add.image(cx, bottom, artKey(s.name))
      .setOrigin(0.5, 1)
      .setDisplaySize(art.w * TILE, art.h * TILE)
      .setFlipX(Boolean(def.flipX))
      .setDepth(onWall ? -4 : bottom);
  }
}
