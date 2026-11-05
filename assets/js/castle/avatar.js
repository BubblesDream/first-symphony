// 角色外觀。目前預設是第一版的幾何色塊；網址加 ?pixel=1 改用像素小人（spriteAvatar.js，示範中，管理員確認後改成預設）。
// NPC 行為與訪客只會呼叫下面這幾個方法，兩種外觀都實作同樣的方法，行為程式不用改：
//   setPosition(x, y)  setFacing(dir)  setPose(pose, seated)  say(text)
//   setNameVisible(bool)  setTag(text)  destroy()
// 姿勢：idle、walk、play、conduct、read、work、sleep、cheer

import { FONT } from './config.js';
import { SpriteAvatar } from './spriteAvatar.js';

const hex = (color) => Number.parseInt(String(color).slice(1), 16);
const DARK = 0x2e2420;

export function createAvatar(scene, look, options = {}) {
  if (scene.registry.get('pixel')) return new SpriteAvatar(scene, look, options);
  return new GeometricAvatar(scene, look, options);
}

class GeometricAvatar {
  constructor(scene, look, { name = '', nameColor = '#fffaf0' } = {}) {
    this.scene = scene;
    this.facing = 'down';
    this.pose = null;
    this.seated = false;
    this.tweens = [];

    const add = scene.add;
    this.root = add.container(0, 0);
    this.rig = add.container(0, 0);

    const shadow = add.ellipse(0, 0, 20, 7, 0x000000, 0.22);
    this.cape = add.rectangle(0, -6, 18, 16, hex(look.accent)).setOrigin(0.5, 1).setVisible(look.mark === 'cape');
    this.legs = [
      add.rectangle(-4, 0, 5, 6, look.bottom ? hex(look.bottom) : DARK).setOrigin(0.5, 1),
      add.rectangle(4, 0, 5, 6, look.bottom ? hex(look.bottom) : DARK).setOrigin(0.5, 1),
    ];
    this.body = add.rectangle(0, -5, 16, 16, hex(look.outfit)).setOrigin(0.5, 1);
    this.head = add.circle(0, -28, 8, hex(look.skin));
    this.hairBack = add.circle(0, -29, 8.5, hex(look.hair)).setVisible(false);
    this.hair = add.arc(0, -29, 8.5, 180, 360, false, hex(look.hair));
    this.eyes = [add.rectangle(-3, -27, 2, 2, DARK), add.rectangle(3, -27, 2, 2, DARK)];

    const marks = [];
    if (look.mark === 'hat') marks.push(add.triangle(0, -38, -7, 4, 7, 4, 0, -8, hex(look.accent)));
    if (look.mark === 'ribbon') marks.push(add.rectangle(6, -34, 6, 4, hex(look.accent)), add.circle(6, -34, 1.5, DARK));
    if (look.mark === 'glasses') this.glasses = add.rectangle(0, -27, 12, 3).setStrokeStyle(1, DARK);
    if (look.mark === 'visitor') marks.push(add.triangle(0, -44, -4, -3, 4, -3, 0, 3, 0xf2c94c));

    // 道具：樂器、指揮棒、書（需要時才顯示）
    this.tool = add.rectangle(8, -12, 4, 12, 0x8a5a2b).setOrigin(0.5, 1).setVisible(false);
    this.book = add.rectangle(0, -10, 10, 7, 0xe8dcc4).setStrokeStyle(1, 0x7a5236).setVisible(false);

    this.rig.add([this.cape, ...this.legs, this.body, this.head, this.hairBack, this.hair, ...this.eyes, this.tool, this.book, ...marks]);
    if (this.glasses) this.rig.add(this.glasses);

    this.nameText = add.text(0, 5, name, {
      fontFamily: FONT, fontSize: '10px', color: nameColor,
      backgroundColor: 'rgba(43, 33, 25, 0.78)', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 0).setResolution(3).setVisible(false);

    this.tagText = add.text(0, 20, '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ffe08a', backgroundColor: 'rgba(0,0,0,0.6)',
    }).setOrigin(0.5, 0).setResolution(3).setVisible(false);

    this.root.add([shadow, this.rig, this.nameText, this.tagText]);
    this.setPose('idle');
    this.setFacing('down');
  }

  get x() { return this.root.x; }
  get y() { return this.root.y; }

  setPosition(x, y) {
    this.root.setPosition(x, y);
    this.root.setDepth(y); // 腳底越下面的越前面
  }

  setFacing(dir) {
    if (!dir || dir === this.facing) return;
    this.facing = dir;
    const [left, right] = this.eyes;
    const up = dir === 'up';
    this.hairBack.setVisible(up);
    left.setVisible(!up && dir !== 'right');
    right.setVisible(!up && dir !== 'left');
    left.x = dir === 'left' ? -4 : -3;
    right.x = dir === 'right' ? 4 : 3;
    if (this.glasses) this.glasses.setVisible(!up);
    const side = dir === 'left' ? -1 : 1;
    this.tool.x = 8 * side;
  }

  setPose(pose, seated = false) {
    if (pose === this.pose && seated === this.seated) return;
    this.pose = pose;
    this.seated = seated;
    for (const t of this.tweens) t.remove();
    this.tweens = [];
    this.rig.setPosition(0, seated ? 5 : 0).setAngle(0);
    this.tool.setVisible(false).setAngle(0).setSize(4, 12).setFillStyle(0x8a5a2b);
    this.book.setVisible(false);
    for (const leg of this.legs) leg.setVisible(!seated);

    const tween = (config) => this.tweens.push(this.scene.tweens.add({ yoyo: true, repeat: -1, ...config }));
    switch (pose) {
      case 'walk':
        tween({ targets: this.rig, y: this.rig.y - 2, duration: 140 });
        break;
      case 'play':
        this.tool.setVisible(true);
        tween({ targets: this.rig, angle: { from: -4, to: 4 }, duration: 520, ease: 'Sine.easeInOut' });
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
  }

  /** 頭上冒一個短短的泡泡 */
  say(text, seconds = 1.8) {
    if (this.bubble) this.bubble.destroy();
    this.bubble = this.scene.add.text(0, this.seated ? -38 : -43, text, {
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
    this.root.destroy();
  }
}
