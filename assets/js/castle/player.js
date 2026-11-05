// 訪客角色：鍵盤（WASD／方向鍵）移動，或點地板自動走過去（手機也能用）。
// 碰撞用 Phaser 的 Arcade 物理：只在腳邊放一個小碰撞框。
import { PLAYER_SPEED } from './config.js';
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
    const { grid } = this.scene;
    const { x, y } = this.tile;
    const path = grid.findPath(x, y, tx, ty, (cx, cy) => grid.playerWalkable(cx, cy) && !grid.occupant(cx, cy));
    this.route = path || [];
    this.stuck = 0;
  }

  update(dt, frozen) {
    const k = this.keys;
    let vx = (k.right.isDown || k.right2.isDown ? 1 : 0) - (k.left.isDown || k.left2.isDown ? 1 : 0);
    let vy = (k.down.isDown || k.down2.isDown ? 1 : 0) - (k.up.isDown || k.up2.isDown ? 1 : 0);
    let speed = PLAYER_SPEED;

    if (vx || vy) {
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

    if (frozen) {
      vx = 0;
      vy = 0;
      this.route = [];
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
