// 會自己走動的小動物（目前是外庭的羊）。不是成員，沒有對話，只會慢慢走、偶爾叫一聲。
// 房間定義寫 critters：
//   { name: '羊', sprite: 'sheep', color: 'sheep', at: [[x, y], ...], area: [x0, y0, x1, y1], bubbles: ['咩～'] }
//   at 起始位置（一個位置一隻）；area 只能在這個範圍裡走（例如羊圈裡）
// 動物會佔住自己站的格子，NPC 走路會繞開；訪客撞得到，靠近按 E 牠會叫一聲、跳一下。
import { TILE, COLORS, FONT } from './config.js';
import { SPRITE_ART, hasArt, artKey } from './art.js';

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class Critter {
  constructor(scene, def, tx, ty) {
    this.scene = scene;
    this.def = def;
    this.grid = scene.grid;
    this.rng = scene.rng;
    this.tx = tx;
    this.ty = ty;
    this.x = (tx + 0.5) * TILE;
    this.y = (ty + 1) * TILE - 4;
    this.shadow = scene.add.ellipse(this.x, this.y - 1, TILE * 0.7, 6, 0x000000, 0.16);
    if (hasArt(scene, def.sprite)) {
      const art = SPRITE_ART[def.sprite];
      this.body = scene.add.image(this.x, this.y, artKey(def.sprite)).setOrigin(0.5, 1).setDisplaySize(art.w * TILE, art.h * TILE);
    } else {
      this.body = scene.add.ellipse(this.x, this.y - 10, 22, 16, COLORS[def.color] || 0xffffff).setStrokeStyle(1, COLORS.furnitureLine);
    }
    this.flip(this.rng.next() < 0.5);
    this.grid.reserve(tx, ty, this);
    this.timer = this.rng.range(1, 5);
    this.moving = false;
    this.draw();
  }

  flip(left) {
    if (this.body.setFlipX) this.body.setFlipX(left);
  }

  draw() {
    const art = hasArt(this.scene, this.def.sprite);
    this.body.setPosition(this.x, art ? this.y : this.y - 10).setDepth(this.y);
    this.shadow.setPosition(this.x, this.y - 1).setDepth(this.y - 1);
    if (this.bubble) this.bubble.setPosition(this.x, this.y - TILE - 2);
  }

  update(dt) {
    if (this.moving) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.rng.range(2, 6);
    if (this.rng.next() < 0.15) this.say();
    else if (this.rng.next() < 0.7) this.step();
  }

  /** 往旁邊走一格（只在範圍內、沒人的格子） */
  step() {
    const [x0, y0, x1, y1] = this.def.area;
    const { grid, scene } = this;
    const options = this.rng.shuffle(STEPS.map(([dx, dy]) => [this.tx + dx, this.ty + dy])).filter(([x, y]) =>
      x >= x0 && x <= x1 && y >= y0 && y <= y1 && grid.npcWalkable(x, y) && grid.isFree(x, y, this) && !scene.isPlayerOn(x, y));
    if (!options.length) return;
    const [nx, ny] = options[0];
    grid.reserve(nx, ny, this);
    if (nx !== this.tx) this.flip(nx < this.tx);
    this.moving = true;
    const from = { x: this.x, y: this.y };
    const to = { x: (nx + 0.5) * TILE, y: (ny + 1) * TILE - 4 };
    scene.tweens.addCounter({
      from: 0, to: 1, duration: 900,
      onUpdate: (tw) => {
        const t = tw.getValue();
        this.x = from.x + (to.x - from.x) * t;
        this.y = from.y + (to.y - from.y) * t - Math.abs(Math.sin(t * Math.PI * 2)) * 2; // 一跳一跳地走
        this.draw();
      },
      onComplete: () => {
        grid.release(this.tx, this.ty, this);
        this.tx = nx;
        this.ty = ny;
        this.x = to.x;
        this.y = to.y;
        this.moving = false;
        this.draw();
      },
    });
  }

  /** 叫一聲（訪客按 E 時也會跳一下） */
  say(hop = false) {
    const list = this.def.bubbles || [];
    if (list.length) {
      if (this.bubble) this.bubble.destroy();
      const bubble = this.scene.add.text(this.x, this.y - TILE - 2, this.rng.pick(list), {
        fontFamily: FONT, fontSize: '9px', color: '#3a2a1f', backgroundColor: '#fffaf0', padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1).setResolution(3).setDepth(99000);
      this.bubble = bubble;
      this.scene.time.delayedCall(1600, () => {
        bubble.destroy();
        if (this.bubble === bubble) this.bubble = null;
      });
    }
    if (hop && !this.moving) {
      this.scene.tweens.add({ targets: this.body, y: this.body.y - 6, duration: 120, yoyo: true });
    }
  }

  destroy() {
    this.body.destroy();
    this.shadow.destroy();
    if (this.bubble) this.bubble.destroy();
  }
}
