// 訪客角色：鍵盤（WASD／方向鍵）移動，或點地板自動走過去（手機也能用）。
// 碰撞用 Phaser 的 Arcade 物理：只在腳邊放一個小碰撞框。
import { PLAYER_SPEED } from './config.js';
import { ACTIONS } from './actions.js';
import { createAvatar } from './avatar.js';
import { toTile, tileFeet } from './grid.js';

const VISITOR_LOOK = { skin: '#f3d6bd', hair: '#4a3426', outfit: '#f5efe2', accent: '#c9a227', mark: 'visitor' };

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.feet = scene.add.zone(x, y, 18, 10);
    scene.physics.add.existing(this.feet);
    this.feet.body.setCollideWorldBounds(true);
    this.avatar = createAvatar(scene, VISITOR_LOOK, { name: '你', nameColor: '#ffe08a' });
    this.avatar.setPosition(x, y);
    this.avatar.setNameVisible(true);
    this.route = []; // 點地板移動時的路線（格子）
    this.stuck = 0;
    this.act = null; // 訪客自己演出：{ phase: 'go'|'do', spot, action, approach, bubble }

    this.keys = scene.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
      up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT',
    });
  }

  get x() { return this.feet.x; }
  get y() { return this.feet.y; }
  get tile() { return toTile(this.feet.x, this.feet.y); }

  /** 點地板：找路走過去 */
  walkTo(tx, ty) {
    this.stopAct();
    this.findRoute(tx, ty);
  }

  findRoute(tx, ty) {
    const { grid } = this.scene;
    const { x, y } = this.tile;
    const path = grid.findPath(x, y, tx, ty, (cx, cy) => grid.playerWalkable(cx, cy) && !grid.occupant(cx, cy));
    this.route = path || [];
    this.stuck = 0;
  }

  // ---------- 訪客演出（物件的 play） ----------

  /**
   * 走到演出點旁邊，再「坐上去」演出。演出點若是椅子等訪客不能走的格子，
   * 先走到旁邊的空格（approach），到了再把訪客移到演出點上，離開時移回來。
   */
  startAct(spot, approach) {
    this.stopAct();
    const { grid } = this.scene;
    spot.user = this;
    grid.reserve(spot.x, spot.y, this);
    this.act = { phase: 'go', spot, action: ACTIONS[spot.action] || ACTIONS.stand_guard, approach, bubble: 1 };
    const { x, y } = this.tile;
    if (x === approach[0] && y === approach[1]) this.route = [approach];
    else this.findRoute(...approach);
    if (!this.route.length) {
      this.stopAct();
      return false;
    }
    return true;
  }

  stopAct() {
    const act = this.act;
    if (!act) return;
    this.act = null;
    this.scene.grid.release(act.spot.x, act.spot.y, this);
    if (act.spot.user === this) act.spot.user = null;
    this.route = []; // 還在走過去的路上就取消，不要繼續走到演出點
    this.stuck = 0;
    if (act.phase === 'do') {
      const back = tileFeet(...this.leaveTile(act));
      this.feet.body.enable = true;
      this.feet.body.reset(back.x, back.y);
      this.avatar.setPose('idle');
    } else {
      this.feet.body.setVelocity(0, 0);
    }
  }

  /** 離開演出點要站到哪一格：原本走來的那格被 NPC 佔了，就換演出點旁邊另一格空的 */
  leaveTile(act) {
    const { grid } = this.scene;
    const free = ([x, y]) => grid.playerWalkable(x, y) && !grid.occupant(x, y);
    if (free(act.approach)) return act.approach;
    const { x, y } = act.spot;
    return [[x, y + 1], [x, y - 1], [x + 1, y], [x - 1, y]].find(free) || act.approach;
  }

  get acting() { return this.act?.phase === 'do'; }

  updateAct(dt, moving) {
    const act = this.act;
    if (moving) return this.stopAct();
    if (act.phase === 'go') {
      const { x, y } = this.tile;
      // 已經踏進目標格就算到了（畫面掉格時不用來回對準）
      if (this.route.length === 1 && x === act.approach[0] && y === act.approach[1]) this.route = [];
      if (this.route.length) return;
      if (x !== act.approach[0] || y !== act.approach[1]) return this.stopAct(); // 被擋住，沒走到
      const p = tileFeet(act.spot.x, act.spot.y);
      this.feet.body.setVelocity(0, 0);
      this.feet.body.enable = false;
      this.feet.setPosition(p.x, p.y);
      act.phase = 'do';
      this.avatar.setFacing(act.spot.facing || 'down');
      this.avatar.setPose(act.action.pose, act.action.seated);
      this.scene.ctx.ui.toast('按方向鍵或點地板就會離開。');
      return;
    }
    act.bubble -= dt;
    if (act.bubble <= 0) {
      act.bubble = 3 + Math.random() * 3;
      const list = act.action.bubbles || [];
      if (list.length) this.avatar.say(list[Math.floor(Math.random() * list.length)]);
    }
  }

  update(dt, frozen) {
    const k = this.keys;
    let vx = (k.right.isDown || k.right2.isDown ? 1 : 0) - (k.left.isDown || k.left2.isDown ? 1 : 0);
    let vy = (k.down.isDown || k.down2.isDown ? 1 : 0) - (k.up.isDown || k.up2.isDown ? 1 : 0);
    let speed = PLAYER_SPEED;

    if (this.act && !frozen) {
      this.updateAct(dt, Boolean(vx || vy));
    }
    if (this.act) {
      if (this.acting) {
        this.avatar.setPosition(this.feet.x, this.feet.y);
        return;
      }
    }

    if (frozen) {
      // 對話中先停下；正要走去演出點的話保留路線，對話結束再繼續走
      vx = 0;
      vy = 0;
      if (!this.act) this.route = [];
    } else if (vx || vy) {
      this.route = []; // 用鍵盤就取消自動走路
    } else if (this.route.length) {
      const target = tileFeet(...this.route[0]);
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const last = this.route.length === 1;
      if (dist < (last ? 2 : 8)) {
        // 中途的格子靠近就換下一格，走起來才順；最後一格才停準
        this.route.shift();
        this.stuck = 0;
      } else {
        vx = dx / dist;
        vy = dy / dist;
        // 最後一格放慢，避免畫面掉格時衝過頭來回晃（每格畫面最多 0.1 秒）
        if (last) speed = Math.min(PLAYER_SPEED, dist * 10);
        this.stuck += dt;
        if (this.stuck > 1.5) this.route = []; // 被擋住太久就停下
      }
    }

    const len = Math.hypot(vx, vy) || 1;
    this.feet.body.setVelocity((vx / len) * speed, (vy / len) * speed);

    if (vx || vy) {
      if (Math.abs(vx) >= Math.abs(vy)) this.avatar.setFacing(vx > 0 ? 'right' : 'left');
      else this.avatar.setFacing(vy > 0 ? 'down' : 'up');
      this.avatar.setPose('walk');
    } else {
      this.avatar.setPose('idle');
    }
    this.avatar.setPosition(this.feet.x, this.feet.y);
  }

  faceToward(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) this.avatar.setFacing(dx > 0 ? 'right' : 'left');
    else this.avatar.setFacing(dy > 0 ? 'down' : 'up');
  }
}
