// 像素小人外觀：紙娃娃部件依每個人的顏色疊成貼圖（pixelAvatar.js），再由程式做動作。
// 方法和 avatar.js 的 GeometricAvatar 相同（setPosition／setFacing／setPose／say／setNameVisible／setTag／destroy）。
import { FONT } from './config.js';
import { avatarTexture, SCALE, CELL, FOOT_ROW } from './pixelAvatar.js';

const SEAT_DEPTH = 14; // 坐著時往前排多少（椅子圖以格子下緣排前後）

const WALK_MS = 150; // 走路換腳的間隔
const SIT_DROP = 4; // 坐下時往下移幾像素

export class SpriteAvatar {
  constructor(scene, look, { name = '', nameColor = '#fffaf0' } = {}) {
    this.scene = scene;
    this.facing = 'down';
    this.pose = null;
    this.seated = false;
    this.tweens = [];
    this.step = 0;
    this.walkTimer = null;

    const add = scene.add;
    this.root = add.container(0, 0);
    this.rig = add.container(0, 0);

    const shadow = add.ellipse(0, 0, 20, 7, 0x000000, 0.22);
    this.key = avatarTexture(scene, look);
    // 腳底對齊 (0, 0)：圖的原點放在腳底那一列
    this.sprite = add.image(0, 0, this.key, 'down-stand')
      .setOrigin(0.5, FOOT_ROW / CELL.h)
      .setScale(SCALE);
    this.star = look.mark === 'visitor' ? add.triangle(0, -50, -4, -3, 4, -3, 0, 3, 0xf2c94c) : null;

    // 道具：樂器、指揮棒、書（需要時才顯示）
    this.tool = add.rectangle(9, -12, 4, 12, 0x8a5a2b).setOrigin(0.5, 1).setVisible(false);
    this.book = add.rectangle(0, -12, 10, 7, 0xe8dcc4).setStrokeStyle(1, 0x7a5236).setVisible(false);
    this.rig.add([this.sprite, this.tool, this.book, ...(this.star ? [this.star] : [])]);

    this.nameText = add.text(0, 5, name, {
      fontFamily: FONT, fontSize: '10px', color: nameColor,
      backgroundColor: 'rgba(43, 33, 25, 0.78)', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 0).setResolution(3).setVisible(false);

    this.tagText = add.text(0, 20, '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ffe08a', backgroundColor: 'rgba(0,0,0,0.6)',
    }).setOrigin(0.5, 0).setResolution(3).setVisible(false);

    this.root.add([shadow, this.rig, this.nameText, this.tagText]);
    this.setPose('idle');
    this.setFacing('down', true);
  }

  get x() { return this.root.x; }
  get y() { return this.root.y; }
  get top() { return this.seated ? 44 : 48; }

  setPosition(x, y) {
    this.root.setPosition(x, y);
    this.updateDepth();
  }

  /** 腳底越下面的越前面；坐著（不是背對）時畫在椅子前面，不然會被椅子蓋住 */
  updateDepth() {
    this.root.setDepth(this.root.y + (this.seated && this.facing !== 'up' ? SEAT_DEPTH : 0));
  }

  setFacing(dir, force = false) {
    if (!dir || (dir === this.facing && !force)) return;
    this.facing = dir;
    this.updateDepth();
    this.sprite.setFlipX(dir === 'left');
    const side = dir === 'left' ? -1 : 1;
    this.tool.x = 9 * side;
    this.showFrame();
  }

  /** 依方向、坐著與否、走路的腳換圖 */
  showFrame() {
    const dir = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
    let name = 'stand';
    if (this.seated) name = 'sit';
    else if (this.pose === 'walk') name = this.step % 2 ? 'walk1' : 'walk2';
    this.sprite.setFrame(`${dir}-${name}`);
  }

  setPose(pose, seated = false) {
    if (pose === this.pose && seated === this.seated) return;
    this.pose = pose;
    this.seated = seated;
    this.updateDepth();
    for (const t of this.tweens) t.remove();
    this.tweens = [];
    if (this.walkTimer) {
      this.walkTimer.remove();
      this.walkTimer = null;
    }
    this.rig.setPosition(0, seated ? SIT_DROP : 0).setAngle(0);
    this.tool.setVisible(false).setAngle(0).setSize(4, 12).setFillStyle(0x8a5a2b);
    this.book.setVisible(false);

    const tween = (config) => this.tweens.push(this.scene.tweens.add({ yoyo: true, repeat: -1, ...config }));
    switch (pose) {
      case 'walk':
        this.step = 0;
        this.walkTimer = this.scene.time.addEvent({
          delay: WALK_MS,
          loop: true,
          callback: () => {
            this.step += 1;
            this.showFrame();
          },
        });
        tween({ targets: this.rig, y: this.rig.y - 1, duration: WALK_MS });
        break;
      case 'play':
        this.tool.setVisible(true);
        tween({ targets: this.rig, angle: { from: -3, to: 3 }, duration: 520, ease: 'Sine.easeInOut' });
        break;
      case 'conduct':
        this.tool.setVisible(true).setSize(2, 12).setFillStyle(0xf5f0e6);
        tween({ targets: this.tool, angle: { from: -40, to: 30 }, duration: 380, ease: 'Sine.easeInOut' });
        break;
      case 'work':
        this.tool.setVisible(true).setFillStyle(0x777777);
        tween({ targets: this.tool, angle: { from: 0, to: -60 }, duration: 260 });
        break;
      case 'read':
        this.book.setVisible(true);
        break;
      case 'sleep':
        this.rig.setAngle(80);
        break;
      case 'cheer':
        tween({ targets: this.rig, y: this.rig.y - 6, duration: 200, repeatDelay: 700 });
        break;
      default:
        break;
    }
    this.showFrame();
  }

  /** 頭上冒一個短短的泡泡 */
  say(text, seconds = 1.8) {
    if (this.bubble) this.bubble.destroy();
    this.bubble = this.scene.add.text(0, this.seated ? -44 : -48, text, {
      fontFamily: FONT, fontSize: '10px', color: '#3a2a1f',
      backgroundColor: '#fffaf0', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 1).setResolution(3);
    this.root.add(this.bubble);
    const bubble = this.bubble;
    this.scene.time.delayedCall(seconds * 1000, () => {
      bubble.destroy();
      if (this.bubble === bubble) this.bubble = null;
    });
  }

  setNameVisible(visible) {
    if (this.nameText.text) this.nameText.setVisible(visible);
  }

  /** 除錯用的小標籤（顯示狀態） */
  setTag(text) {
    this.tagText.setVisible(Boolean(text)).setText(text || '');
  }

  destroy() {
    for (const t of this.tweens) t.remove();
    this.walkTimer?.remove();
    this.root.destroy();
  }
}
