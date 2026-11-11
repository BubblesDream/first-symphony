// 角色圖外觀：三格貼圖（正面、背面、朝右側面，朝左左右翻轉）。來源是每人一張的角色圖（CHAR_ART），
// 或紙娃娃組出來的貼圖（paperdoll.js）。
// 方法和 avatar.js 的 GeometricAvatar 相同。走路不換腳，改成整個人輕晃；坐下時只露出上半身。
import { FONT, TILE } from './config.js';
import { CHAR_H } from './art.js';
import { Hand } from './props.js';

const SEAT_DEPTH = 14; // 坐著時往前排多少（椅子圖以格子下緣排前後）

const FRAME = { down: 0, up: 1, left: 2, right: 2 };
const HEIGHT = CHAR_H * TILE; // 畫面上的高度（遊戲單位）
export const HEIGHT_SCALE = { short: 0.92, medium: 1, tall: 1.08 }; // 問卷的身高：整個人縮放
const SIT_SHOW = 0.68; // 坐下時露出上面幾成
const SIT_DROP = 6; // 坐下時往下移幾單位（臀部落在椅面）

export class ImageAvatar {
  /**
   * art：{ key: 貼圖名稱, cell: { w, h, body }, height }（每格像素；body＝角色身高的像素，上面可以留空給帽子；
   * height＝身高 short／medium／tall，見 HEIGHT_SCALE）
   */
  constructor(scene, art, { name = '', nameColor = '#fffaf0' } = {}) {
    this.cell = art.cell;
    this.height = HEIGHT * (HEIGHT_SCALE[art.height] || 1);
    this.scene = scene;
    this.facing = 'down';
    this.pose = null;
    this.seated = false;
    this.tweens = [];

    const add = scene.add;
    this.root = add.container(0, 0);
    this.rig = add.container(0, 0);
    const shadow = add.ellipse(0, 0, 18, 6, 0x000000, 0.2);
    this.sprite = add.image(0, 1, art.key, 0).setOrigin(0.5, 1).setScale(this.height / art.cell.body);
    // 書（讀書時顯示）；手上的道具由 Hand 管（props.js）
    this.book = add.rectangle(0, -12, 10, 7, 0xe8dcc4).setStrokeStyle(1, 0x7a5236).setVisible(false);
    this.rig.add([this.sprite, this.book]);
    this.hand = new Hand(scene, this.rig);

    this.nameText = add.text(0, 5, name, {
      fontFamily: FONT, fontSize: '10px', color: nameColor,
      backgroundColor: 'rgba(43, 33, 25, 0.78)', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 0).setResolution(3).setVisible(false);
    this.tagText = add.text(0, 20, '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ffe08a', backgroundColor: 'rgba(0,0,0,0.6)',
    }).setOrigin(0.5, 0).setResolution(3).setVisible(false);

    this.root.add([shadow, this.rig, this.nameText, this.tagText]);
    this.setPose('idle');
  }

  get x() { return this.root.x; }
  get y() { return this.root.y; }
  get top() { return this.seated ? this.height - SIT_DROP : this.height + 2; }

  setPosition(x, y) {
    this.root.setPosition(x, y);
    this.updateDepth();
  }

  /** 腳底越下面的越前面；坐著（不是背對）時畫在椅子前面，不然會被椅子蓋住 */
  updateDepth() {
    this.root.setDepth(this.root.y + (this.seated && this.facing !== 'up' ? SEAT_DEPTH : 0));
  }

  setFacing(dir) {
    if (!dir || dir === this.facing) return;
    this.facing = dir;
    this.updateDepth();
    this.sprite.setFrame(FRAME[dir] ?? 0).setFlipX(dir === 'left');
    this.hand.setFacing(dir);
  }

  /** prop：手上拿的道具（props.js 的名稱，null＝空手）；propStill：拿著不動 */
  setPose(pose, seated = false, prop = null, propStill = false) {
    const propKey = prop && `${prop}${propStill ? ':still' : ''}`;
    if (pose === this.pose && seated === this.seated && propKey === this.propKey) return;
    this.pose = pose;
    this.propKey = propKey;
    this.seated = seated;
    this.updateDepth();
    for (const t of this.tweens) t.remove();
    this.tweens = [];
    this.rig.setPosition(0, seated ? SIT_DROP : 0).setAngle(0);
    this.sprite.setAngle(0);
    // 坐下：只畫上半身（下半身在椅子裡）
    const { w, h, body } = this.cell;
    if (seated) this.sprite.setCrop(0, 0, w, h - body * (1 - SIT_SHOW));
    else this.sprite.setCrop();
    this.sprite.y = 1; // 坐下時裁掉的下半身留空，露出的部分剛好落在椅面
    this.book.setVisible(false);
    this.hand.hold(prop, { still: propStill });

    const tween = (config) => this.tweens.push(this.scene.tweens.add({ yoyo: true, repeat: -1, ...config }));
    switch (pose) {
      case 'walk':
        tween({ targets: this.sprite, y: this.sprite.y - 2, duration: 150, ease: 'Sine.easeInOut' });
        tween({ targets: this.sprite, angle: { from: -3, to: 3 }, duration: 300, ease: 'Sine.easeInOut' });
        break;
      case 'play':
        tween({ targets: this.rig, angle: { from: -3, to: 3 }, duration: 520, ease: 'Sine.easeInOut' });
        break;
      case 'conduct':
        tween({ targets: this.rig, angle: { from: -2, to: 2 }, duration: 760, ease: 'Sine.easeInOut' });
        break;
      case 'work':
        tween({ targets: this.sprite, y: this.sprite.y + 1, duration: 320, ease: 'Sine.easeInOut' });
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
    this.bubble = this.scene.add.text(0, -this.top - 2, text, {
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

  setTag(text) {
    this.tagText.setVisible(Boolean(text)).setText(text || '');
  }

  destroy() {
    for (const t of this.tweens) t.remove();
    this.hand.clear();
    this.root.destroy();
  }
}
