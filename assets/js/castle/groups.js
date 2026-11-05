// 多人演出（規劃書 8.4）：合奏、乾杯、圍桌聊天。
// 房間定義寫 groups：
//   { name: '合奏', spots: [[x, y], ...], min: 2, every: [30, 60], duration: [16, 24], bubbles: ['預備——', '♪', ...], finale: '（掌聲）' }
//   spots  用格子座標指定房間 spots 裡的演出點（同一組人要一起做的位置）
//   min    至少幾個人才開始；every 每隔幾秒試著湊一次；duration 一起演出幾秒
//   bubbles 演出時依序輪流由參加的人說出來；finale 結束時第一個人說的話
// 流程：找房間裡閒著的人 → 各自走到位置（ready）→ 到齊後同時開始 → 一起結束。等太久或人數不夠就取消。
import { tileFeet } from './grid.js';

const WAIT_LIMIT = 20;   // 等人到齊最多幾秒
const BUBBLE_GAP = 2.4;  // 演出時每隔幾秒有人說一句
const RETRY = 3;         // 湊不到人時，幾秒後再試

export class Groups {
  constructor(scene) {
    this.scene = scene;
    const { rng } = scene;
    this.list = (scene.room.groups || []).map((def) => ({
      def,
      spots: def.spots.map(([x, y]) => scene.spots.find((s) => s.x === x && s.y === y)).filter(Boolean),
      timer: rng.range(4, 10), // 進房間後不久就可能開始，比較看得到
      members: null,
      phase: null, // null｜'gather'｜'play'
    }));
  }

  update(dt) {
    for (const g of this.list) {
      if (!g.phase) {
        g.timer -= dt;
        if (g.timer <= 0) {
          if (!this.tryStart(g)) g.timer = RETRY;
        }
      } else if (g.phase === 'gather') {
        this.gather(g, dt);
      } else {
        this.play(g, dt);
      }
    }
  }

  /** 找閒著的人，各自分配最近的空位置 */
  tryStart(g) {
    const { scene } = this;
    const freeSpots = g.spots.filter((s) => !s.user && !scene.grid.occupant(s.x, s.y) && !scene.isPlayerOn(s.x, s.y));
    const idle = scene.npcs.filter((n) => n.state === 'idle' && !n.group);
    if (Math.min(freeSpots.length, idle.length) < (g.def.min || 2)) return false;
    const members = [];
    for (const spot of freeSpots) {
      const p = tileFeet(spot.x, spot.y);
      const candidates = idle.filter((n) => !members.includes(n))
        .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
      const npc = candidates.find((n) => n.joinGroup(g, spot));
      if (npc) members.push(npc);
    }
    if (members.length < (g.def.min || 2)) {
      for (const npc of members) this.release(npc);
      return false;
    }
    g.members = members;
    g.phase = 'gather';
    g.waited = 0;
    return true;
  }

  /** 還在這組裡的人（有人放棄或被叫走就不算） */
  stillIn(g) {
    g.members = g.members.filter((n) => n.group === g && n.spot?.user === n);
    return g.members;
  }

  gather(g, dt) {
    g.waited += dt;
    const members = this.stillIn(g);
    if (members.length < (g.def.min || 2) || g.waited > WAIT_LIMIT) return this.cancel(g);
    if (!members.every((n) => n.state === 'ready')) return;
    // 到齊：一起開始，長度相同
    const seconds = this.scene.rng.range(...(g.def.duration || [16, 24]));
    for (const npc of members) npc.startPerform(seconds);
    g.phase = 'play';
    g.left = seconds;
    g.line = 0;
    g.bubble = 0.6;
  }

  play(g, dt) {
    const members = this.stillIn(g);
    g.left -= dt;
    g.bubble -= dt;
    const talking = members.some((n) => n.state === 'talk');
    if (g.bubble <= 0 && members.length && !talking) {
      g.bubble = BUBBLE_GAP;
      const lines = g.def.bubbles || [];
      if (lines.length) members[g.line % members.length].avatar.say(lines[g.line % lines.length]);
      g.line += 1;
    }
    // 時間到、而且沒有人正在和訪客說話，就一起結束（說話中的人等說完）
    if (g.left > 0 || talking) return;
    if (members[0] && g.def.finale) members[0].avatar.say(g.def.finale, 2.4);
    for (const npc of members) npc.finishPerform();
    this.reset(g);
  }

  cancel(g) {
    for (const npc of g.members || []) this.release(npc);
    this.reset(g);
  }

  /** 讓某個人離開這組：已經就位的離開；還在路上的改成自己演出 */
  release(npc) {
    npc.leaveGroup();
  }

  reset(g) {
    g.members = null;
    g.phase = null;
    g.timer = this.scene.rng.range(...(g.def.every || [30, 60]));
  }

  /** 除錯用：每組目前的狀態 */
  report() {
    return this.list.map((g) => ({ name: g.def.name, phase: g.phase, members: (g.members || []).map((n) => n.data.id) }));
  }
}
