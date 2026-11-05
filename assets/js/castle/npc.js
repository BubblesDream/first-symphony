// NPC 行為：簡單狀態機。
//   idle（待機）→ 隨機選：繼續待機／walk 走到附近／walk 走向演出點 → perform（演出）→ idle
//   任何時候被訪客搭話 → talk（停下、面向訪客）→ 回到原本狀態
// 所有生活動作都走同一套演出流程，差別只在 actions.js 的資料。
import { NPC_SPEED, BEHAVIOR, IDLE_SECONDS, WANDER_RADIUS } from './config.js';
import { ACTIONS } from './actions.js';
import { tileFeet } from './grid.js';
import { createAvatar } from './avatar.js';
import { playEffect } from './effects.js';

const WAIT_STEP = 0.5;   // 前面有人時等幾秒再試
const MAX_TRIES = 4;     // 試幾次後放棄這次移動

export class Npc {
  constructor(scene, data, tx, ty) {
    this.scene = scene;
    this.grid = scene.grid;
    this.rng = scene.rng;
    this.data = data;
    this.avatar = createAvatar(scene, data.look, { name: data.nickname });
    this.tx = tx;
    this.ty = ty;
    const p = tileFeet(tx, ty);
    this.x = p.x;
    this.y = p.y;
    this.avatar.setPosition(this.x, this.y);
    this.avatar.setFacing(this.rng.pick(['down', 'left', 'right']));
    this.grid.reserve(tx, ty, this);

    this.state = 'idle';
    this.timer = this.rng.range(0.5, 3);
    this.path = [];
    this.next = null;
    this.goal = null;
    this.spot = null;
    this.waited = 0;
    this.tries = 0;
  }

  update(dt) {
    switch (this.state) {
      case 'idle':
        this.timer -= dt;
        if (this.timer <= 0) this.decide();
        break;
      case 'walk':
        this.walk(dt);
        break;
      case 'perform':
        this.timer -= dt;
        this.bubbleTimer -= dt;
        if (this.bubbleTimer <= 0) {
          this.bubbleTimer = this.rng.range(3, 6);
          if (this.action.bubbles?.length) this.avatar.say(this.rng.pick(this.action.bubbles));
        }
        // 演出效果：比訪客簡化、頻率低（畫面外不畫）
        if (this.action.effect) {
          this.fxTimer -= dt;
          if (this.fxTimer <= 0) {
            this.fxTimer = playEffect(this.scene, this.action.effect, {
              x: this.x, y: this.y, facing: this.spot?.facing, spot: this.spot, who: this, isPlayer: false, memo: this.fxMemo,
            });
          }
        }
        if (this.timer <= 0) this.finishPerform();
        break;
      default: // talk：等訪客說完
        break;
    }
  }

  // ---------- 決定下一個動作 ----------

  decide() {
    const onSeat = !this.grid.npcWalkable(this.tx, this.ty);
    const roll = this.rng.next();
    if (!onSeat && roll < BEHAVIOR.idle) {
      this.toIdle(this.rng.range(...IDLE_SECONDS));
    } else if (onSeat || roll < BEHAVIOR.idle + BEHAVIOR.wander) {
      this.wander();
    } else if (!this.goToSpot()) {
      this.wander();
    }
  }

  toIdle(seconds) {
    this.state = 'idle';
    this.timer = seconds;
    this.avatar.setPose('idle');
  }

  wander() {
    const { grid, rng } = this;
    for (let i = 0; i < 12; i++) {
      const gx = this.tx + rng.int(-WANDER_RADIUS, WANDER_RADIUS);
      const gy = this.ty + rng.int(-WANDER_RADIUS, WANDER_RADIUS);
      if ((gx === this.tx && gy === this.ty) || !grid.npcWalkable(gx, gy) || !grid.isFree(gx, gy, this)) continue;
      const path = grid.findPath(this.tx, this.ty, gx, gy, grid.npcWalkable);
      if (path && path.length <= WANDER_RADIUS * 3) return this.startWalk(path, [gx, gy], null);
    }
    this.toIdle(1);
    return false;
  }

  goToSpot() {
    const free = this.scene.spots.filter((s) => !s.user && this.grid.isFree(s.x, s.y, this));
    for (const spot of this.rng.shuffle(free).slice(0, 4)) {
      const path = this.grid.findPath(this.tx, this.ty, spot.x, spot.y, this.grid.npcWalkable);
      if (path) {
        spot.user = this;
        return this.startWalk(path, [spot.x, spot.y], spot);
      }
    }
    return false;
  }

  // ---------- 走路與避讓 ----------

  startWalk(path, goal, spot) {
    this.state = 'walk';
    this.path = path;
    this.goal = goal;
    this.spot = spot;
    this.waited = 0;
    this.tries = 0;
    this.avatar.setPose('walk');
    return true;
  }

  walk(dt) {
    const { grid } = this;
    if (!this.next) {
      if (!this.path.length) return this.arrive();
      const [nx, ny] = this.path[0];
      const blocked = !grid.isFree(nx, ny, this) || this.scene.isPlayerOn(nx, ny);
      if (blocked) {
        // 前面有人：停一下再試；試到第 2 次就換條路；還不行就放棄
        this.avatar.setPose('idle');
        this.waited += dt;
        if (this.waited < WAIT_STEP) return;
        this.waited = 0;
        this.tries += 1;
        if (this.tries >= MAX_TRIES) return this.giveUp();
        if (this.tries >= 2) {
          const avoid = (x, y) => grid.npcWalkable(x, y) && grid.isFree(x, y, this) && !this.scene.isPlayerOn(x, y);
          const path = grid.findPath(this.tx, this.ty, this.goal[0], this.goal[1], avoid);
          if (path) this.path = path;
        }
        return;
      }
      grid.reserve(nx, ny, this);
      this.next = this.path.shift();
      this.avatar.setPose('walk');
      this.face(nx - this.tx, ny - this.ty);
    }

    const target = tileFeet(this.next[0], this.next[1]);
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = NPC_SPEED * dt;
    if (dist <= step) {
      this.x = target.x;
      this.y = target.y;
      grid.release(this.tx, this.ty, this);
      [this.tx, this.ty] = this.next;
      this.next = null;
      this.tries = 0;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
    this.avatar.setPosition(this.x, this.y);
  }

  face(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) this.avatar.setFacing(dx > 0 ? 'right' : 'left');
    else if (dy !== 0) this.avatar.setFacing(dy > 0 ? 'down' : 'up');
  }

  arrive() {
    if (this.spot) this.startPerform();
    else this.toIdle(this.rng.range(...IDLE_SECONDS));
  }

  giveUp() {
    if (this.spot) this.spot.user = null;
    this.spot = null;
    this.path = [];
    this.toIdle(this.rng.range(1, 2));
  }

  // ---------- 演出點 ----------

  startPerform() {
    this.action = ACTIONS[this.spot.action] || ACTIONS.stand_guard;
    this.state = 'perform';
    this.avatar.setFacing(this.spot.facing);
    this.avatar.setPose(this.action.pose, this.action.seated);
    this.timer = this.rng.range(...this.action.duration);
    this.bubbleTimer = this.rng.range(1, 3);
    this.fxTimer = 1.5 + Math.random() * 3; // 不用場景的亂數，免得改變 NPC 的走位
    this.fxMemo = {};
  }

  finishPerform() {
    if (this.spot) this.spot.user = null;
    this.spot = null;
    this.toIdle(this.rng.range(0.5, 1.5));
  }

  // ---------- 和訪客對話 ----------

  startTalk(px, py) {
    if (this.state === 'talk') return;
    this.saved = { state: this.state, pose: this.avatar.pose, seated: this.avatar.seated, facing: this.avatar.facing };
    // 走到一半的話，先停在下一格
    if (this.state === 'walk' && this.next) {
      const p = tileFeet(this.next[0], this.next[1]);
      this.x = p.x;
      this.y = p.y;
      this.grid.release(this.tx, this.ty, this);
      [this.tx, this.ty] = this.next;
      this.next = null;
      this.avatar.setPosition(this.x, this.y);
    }
    this.state = 'talk';
    if (this.saved.state === 'perform') return; // 演出中：維持姿勢，只停下計時
    this.avatar.setPose('idle');
    this.face(px - this.x, py - this.y);
  }

  endTalk() {
    if (this.state !== 'talk') return;
    const saved = this.saved;
    this.saved = null;
    if (saved.state === 'perform') {
      this.state = 'perform';
      return;
    }
    if (saved.state === 'walk' && this.goal) {
      // 重新找路繼續走
      const path = this.grid.findPath(this.tx, this.ty, this.goal[0], this.goal[1], this.grid.npcWalkable);
      if (path) return this.startWalk(path, this.goal, this.spot);
      this.giveUp();
      return;
    }
    this.toIdle(this.rng.range(1, 3));
  }

  destroy() {
    this.avatar.destroy();
  }
}
