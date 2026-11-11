// 點擊移動：靠近互動對象、尋找可達格與目的地提示；新增點擊行為集中在此類別。
import { TILE, INTERACT_RANGE, CLICK_RANGE } from './config.js';
import { tileFeet, toTile } from './grid.js';

export class TapMove {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 點成員、羊或物品：夠近就直接互動，不然先走到旁邊，到了再互動。
   * 點地板：走過去；點到牆或家具：走到離點的位置最近、走得到的空格。
   */
  onPointerDown(pointer) {
    this.scene.ensemble?.unlock();
    if (this.scene.uiBusy() || this.scene.leaving) return;
    const wx = pointer.worldX;
    const wy = pointer.worldY;
    const loose = Boolean(pointer.wasTouch || this.scene.ctx.touch);
    this.scene.pending = null;
    const npc = this.scene.npcAt(wx, wy, loose);
    if (npc) return this.reach({ npc, x: npc.x, y: npc.y });
    const critter = this.scene.critterAt(wx, wy, loose);
    if (critter) return this.reach({ critter, x: critter.x, y: critter.y });
    const obj = this.scene.objectAt(wx, wy, loose);
    if (obj) return this.reach({ obj, x: (obj.x + 0.5) * TILE, y: (obj.y + 0.5) * TILE });
    const t = toTile(wx, wy);
    const dest = this.scene.grid.playerWalkable(t.x, t.y) ? t : this.nearestReachable(wx, wy);
    if (!dest) return;
    this.scene.player.walkTo(dest.x, dest.y);
    this.markTap(dest.x, dest.y);
  }

  /** 互動時要靠近的點與距離（物件用格子下緣，和按 E 的判斷一樣） */
  reachPoint(target) {
    if (target.obj) return { x: target.x, y: target.y + TILE / 2, range: INTERACT_RANGE };
    const who = target.npc || target.critter;
    return { x: who.x, y: who.y, range: CLICK_RANGE };
  }

  reach(target) {
    const p = this.reachPoint(target);
    if (!this.scene.player.act && Math.hypot(p.x - this.scene.player.x, p.y - this.scene.player.y) <= p.range) {
      this.scene.interact(target);
      return;
    }
    const dest = this.nearestReachable(p.x, p.y);
    const here = this.scene.player.tile;
    if (!this.scene.player.act && dest && dest.x === here.x && dest.y === here.y) {
      this.scene.interact(target); // 已經站在走得到最近的位置
      return;
    }
    if (dest) this.scene.player.walkTo(dest.x, dest.y);
    if (!dest || !this.scene.player.route.length) {
      this.scene.ctx.ui.toast('那裡走不過去。');
      return;
    }
    this.markTap(dest.x, dest.y);
    this.scene.pending = target;
  }

  /** 走到了就互動；用鍵盤移動、對話中或對象走遠了就取消 */
  updatePending() {
    const target = this.scene.pending;
    if (!target) return;
    if (this.scene.player.keyMoved || this.scene.uiBusy() || this.scene.player.act) {
      this.scene.pending = null;
      return;
    }
    if (this.scene.player.route.length) return;
    this.scene.pending = null;
    const p = this.reachPoint(target);
    const d = Math.hypot(p.x - this.scene.player.x, p.y - this.scene.player.y);
    if (d <= Math.max(p.range, TILE * 2.5)) {
      this.scene.interact(target);
    } else if (target.npc) {
      this.scene.ctx.ui.toast(`${target.npc.data.nickname} 走開了，再點一次吧。`);
    }
  }

  /** 從訪客所在位置走得到（不經過門與別人）的格子中，離 (px, py) 最近的一格 */
  nearestReachable(px, py) {
    const { grid, player } = this.scene;
    const start = player.tile;
    const passable = (x, y) => grid.playerWalkable(x, y) && !grid.isDoor(x, y) && !grid.occupant(x, y);
    const seen = new Set([`${start.x},${start.y}`]);
    const queue = [[start.x, start.y]];
    let best = null;
    let bestDist = Infinity;
    while (queue.length && seen.size < 3000) {
      const [x, y] = queue.shift();
      const f = tileFeet(x, y);
      const d = Math.hypot(f.x - px, f.y - py);
      if (d < bestDist - 0.01) {
        best = { x, y };
        bestDist = d;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx},${y + dy}`;
        if (seen.has(k) || !passable(x + dx, y + dy)) continue;
        seen.add(k);
        queue.push([x + dx, y + dy]);
      }
    }
    return best;
  }

  /** 在目的地閃一下圓圈，讓人知道點到了哪裡 */
  markTap(tx, ty) {
    const p = tileFeet(tx, ty);
    const ring = this.scene.add.ellipse(p.x, p.y - 2, 20, 10).setStrokeStyle(2, 0xffe08a, 0.9).setDepth(99999);
    this.scene.tweens.add({ targets: ring, alpha: 0, scale: 1.6, duration: 600, onComplete: () => ring.destroy() });
  }

}
