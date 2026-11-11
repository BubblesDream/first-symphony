// 訪客召集合奏：座位分配、門口逐位加入，以及同一時鐘上的六個聲部。
// NPC 沿用多人演出的走路與就位流程；音訊只在使用者操作後建立。
import { Npc } from './npc.js';
import { ENSEMBLE_SONGS, pauseBackgroundMusic, resumeBackgroundMusic } from './music.js';

// 整個網頁共用一個音訊時鐘，換房間不關掉。
// 瀏覽器只在使用者點擊／按鍵的當下允許開聲音，Phaser 的輸入事件可能晚一格才處理，
// 所以直接聽網頁本身的事件來建立／喚醒。
let sharedContext = null;
function unlockAudio() {
  try {
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!sharedContext && Context) sharedContext = new Context();
    if (sharedContext?.state === 'suspended') sharedContext.resume().catch(() => {});
  } catch { /* 不支援音訊時保留畫面演出。 */ }
}
if (typeof window !== 'undefined') {
  for (const type of ['pointerdown', 'keydown', 'touchend']) {
    window.addEventListener(type, unlockAudio, { capture: true, passive: true });
  }
}

export class Ensemble {
  constructor(scene) {
    this.scene = scene;
    const def = scene.room.ensemble;
    const spotAt = ([x, y]) => scene.spots.find((s) => s.x === x && s.y === y);
    this.parts = def.parts.map(spotAt);
    this.conductor = spotAt(def.conductor);
    this.entrance = scene.room.spawns[def.entrance];
    this.active = false;
    this.members = new Set();
    this.session = null;
    this.disposed = false;
    this.showInstruments(ENSEMBLE_SONGS[scene.ctx.ensembleSong || 0]);
  }

  isSpot(spot) { return spot === this.conductor || this.parts.includes(spot); }

  showInstruments(song) {
    this.parts.forEach((spot, i) => {
      const label = spot.object || this.scene.room.objects.find((o) => o.play === 'play_part' && o.x === spot.x && o.y === spot.y);
      // 房間定義共用，不改寫它；目前樂器另存演出點，互動文字由場景取用。
      spot.instrument = song.parts[i];
      if (label) spot.object = label;
    });
  }

  get context() { return this.disposed ? null : sharedContext; }

  unlock() {
    if (!this.disposed) unlockAudio();
  }

  start(spot) {
    if (!this.isSpot(spot) || this.active) return;
    unlockAudio();
    const scene = this.scene;
    for (const g of scene.groups.list) if (g.phase) scene.groups.cancel(g);
    // cancel 會讓途中成員改成單人演出；合奏區要先完整釋放。
    for (const npc of scene.npcs) if (this.isSpot(npc.spot)) npc.leaveEnsemble();
    this.active = true;
    const index = scene.ctx.ensembleSong || 0;
    this.song = ENSEMBLE_SONGS[index];
    scene.ctx.ensembleSong = (index + 1) % ENSEMBLE_SONGS.length;
    this.showInstruments(this.song);
    this.session = { sources: [], gains: [], buffers: null, abort: new AbortController(), started: false };
    this.background = pauseBackgroundMusic();
    this.called = 0;
    this.gap = 0;
    this.elapsed = 0;
    this.failed = false;
    this.names = [];
    this.targets = [...this.parts, ...(spot === this.conductor ? [] : [this.conductor])];
    this.recruit();
    const part = this.parts.indexOf(spot);
    if (part >= 0) scene.player.avatar.say(`${this.song.parts[part]}♪`);
    this.load(this.session);
  }

  recruit() {
    for (const spot of this.targets) {
      if (spot.user || this.scene.grid.occupant(spot.x, spot.y)) continue;
      const npc = this.scene.npcs.find((n) => n.state === 'idle' && !n.group && n.joinGroup(this, spot));
      if (npc) {
        const first = !this.members.has(npc);
        this.members.add(npc);
        if (first && !this.names.includes(npc.data.nickname)) {
          npc.avatar.say('來了！');
          this.names.push(npc.data.nickname);
          this.scene.ctx.ui.toast(`已召集：${this.names.join('、')}`);
        }
      }
    }
  }

  async load(session) {
    try {
      if (!this.context) throw new Error('沒有可用的音訊時鐘');
      const context = this.context;
      const buffers = await Promise.all(this.parts.map(async (_, i) => {
        const response = await fetch(`${this.song.dir}part${i + 1}.mp3`, { signal: session.abort.signal });
        if (!response.ok) throw new Error('樂譜讀取失敗');
        return context.decodeAudioData(await response.arrayBuffer());
      }));
      if (this.session === session) session.buffers = buffers;
    } catch {
      if (this.session !== session) return;
      this.failed = true;
      this.scene.ctx.ui.toast('樂譜載入失敗，這次只有畫面。');
    }
  }

  occupied(spot) {
    const user = spot.user;
    return user === this.scene.player ? user.acting : Boolean(user && user.spot === spot &&
      (user.state === 'perform' || (user.state === 'talk' && user.saved?.state === 'perform')));
  }

  update(dt) {
    if (!this.active) return;
    this.elapsed += dt;
    this.gap -= dt;
    this.recruit();
    const free = this.targets.some((s) => !s.user && !this.scene.grid.occupant(s.x, s.y));
    const [x, y] = this.entrance;
    if (free && this.called < 7 && this.gap <= 0 && !this.scene.grid.occupant(x, y) && !this.scene.isPlayerOn(x, y)) {
      const entry = Object.entries(this.scene.ctx.roster).find(([id, people]) => id !== this.scene.roomId && people.length);
      if (entry) {
        const person = entry[1].shift();
        this.scene.ctx.roster[this.scene.roomId].push(person);
        const npc = new Npc(this.scene, person, x, y);
        this.scene.npcs.push(npc);
        const zone = this.scene.add.zone(npc.x, npc.y, 16, 10);
        this.scene.physics.add.existing(zone);
        zone.body.setImmovable(true);
        zone.body.moves = false;
        zone.npc = npc;
        this.scene.npcBodies.push(zone);
        this.scene.physics.add.collider(this.scene.player.feet, zone);
        npc.avatar.say(this.scene.rng.pick(['來了！', '我也要！']));
        this.names.push(person.nickname);
        this.scene.ctx.ui.toast(`已召集：${this.names.join('、')}`);
        this.called += 1;
        this.gap = 0.8;
        this.recruit();
      }
    }
    for (const npc of this.members) {
      if (npc.group === this && npc.state === 'ready') {
        npc.startPerform(Infinity);
        const i = this.parts.indexOf(npc.spot);
        if (i >= 0) npc.avatar.say(`${this.song.parts[i]}♪`);
      }
    }
    const session = this.session;
    const playing = this.parts.map((s) => this.occupied(s));
    if (session.buffers && !session.started && playing.some(Boolean)) {
      const ctx = this.context;
      const master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
      session.master = master;
      const when = ctx.currentTime + 0.08;
      session.buffers.forEach((buffer, i) => {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(master);
        session.sources.push(source);
        session.gains.push(gain);
        source.start(when);
        if (i === 0) source.onended = () => { if (this.session === session) this.stop(true); };
      });
      session.started = true;
      session.levels = [];
      this.scene.ctx.ui.toast(`曲目：${this.song.title}`);
    }
    if (session.started) session.gains.forEach((gain, i) => {
      const target = playing[i] ? 1 : 0;
      if (session.levels[i] === target) return;
      const now = this.context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(target, now + 0.4);
      session.levels[i] = target;
    });
    // 無聲備案仍會一起收尾；指揮而無人加入也不永久卡住。
    if ((this.failed && this.elapsed >= 28) || (!playing.some(Boolean) && this.elapsed > 35 && !session.started)) this.stop(true);
  }

  /** teardown：換房間時場景的圖已經拆掉，只停聲音，不再動角色。 */
  stop(finale = false, immediate = false, teardown = false) {
    if (!this.active) return;
    this.active = false;
    const session = this.session;
    this.session = null;
    session.abort.abort();
    if (!teardown) {
      if (finale) (Array.from(this.members).find((n) => n.group === this)?.avatar || this.scene.player.avatar).say('（掌聲）');
      for (const npc of this.members) if (npc.group === this) npc.leaveEnsemble();
      if (this.isSpot(this.scene.player.act?.spot)) this.scene.player.stopAct();
    }
    this.members.clear();
    const ctx = this.context;
    const dispose = () => {
      for (const source of session.sources) { source.onended = null; source.disconnect(); }
      for (const gain of session.gains) gain.disconnect();
      session.master?.disconnect();
      session.buffers = null;
      this.retiring?.delete(session);
    };
    session.dispose = dispose;
    this.retiring ??= new Set();
    this.retiring.add(session);
    const delay = immediate ? 0 : 0.4;
    if (session.master) {
      const now = ctx.currentTime;
      session.master.gain.cancelScheduledValues(now);
      session.master.gain.setValueAtTime(session.master.gain.value, now);
      session.master.gain.linearRampToValueAtTime(0, now + delay);
      for (const source of session.sources) { source.onended = null; source.stop(now + delay); }
    }
    if (delay && session.sources.length) session.cleanup = setTimeout(dispose, 450);
    else dispose();
    resumeBackgroundMusic(this.background);
  }

  destroy() {
    this.stop(false, true, true);
    for (const session of this.retiring || []) { clearTimeout(session.cleanup); session.dispose(); }
    this.disposed = true;
  }

  report() {
    return { active: this.active, song: this.song?.title, called: this.called || 0,
      loaded: Boolean(this.session?.buffers), playing: Boolean(this.session?.started), failed: this.failed || false,
      parts: this.parts.map((s) => ({ x: s.x, y: s.y, instrument: s.instrument, user: s.user?.data?.id || (s.user ? 'visitor' : null), sounding: this.occupied(s) })) };
  }
}
