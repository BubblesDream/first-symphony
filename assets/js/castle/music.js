// 公會歌播放器（城堡頁）。
// - 預設不出聲：訪客按下「播放公會歌」才開始下載與播放。
// - 一首播完接下一首，最後一首播完回到第一首。
// - 音樂在遊戲畫布外播放，換房間不會中斷。
// 新增歌曲：檔案放 assets/audio/castle/（原始檔與 MIDI 放 docs/素材/公會歌/），在 SONGS 加一行。

const DIR = 'assets/audio/castle/';

export const SONGS = [
  { title: '公會歌（一）', src: `${DIR}guild_song_1.mp3` },
  { title: '公會歌（二）', src: `${DIR}guild_song_2.mp3` },
];

const VOLUME = 0.6;

/** 在 container 裡建立播放按鈕。文字一律用 textContent。 */
export function createMusicPlayer(container, songs = SONGS) {
  if (!container || !songs.length) return null;

  const audio = new Audio();
  audio.preload = 'none';
  audio.volume = VOLUME;
  let index = 0;

  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'btn';
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'btn';
  next.textContent = '下一首';
  next.hidden = songs.length < 2;
  const status = document.createElement('span');
  status.className = 'castle__music-status';
  status.setAttribute('aria-live', 'polite');
  container.append(play, next, status);

  const render = (message) => {
    const playing = !audio.paused;
    play.textContent = playing ? '暫停音樂' : '播放公會歌';
    play.setAttribute('aria-pressed', String(playing));
    status.textContent = message ?? (playing ? `正在播放：${songs[index].title}` : '');
  };

  const load = (i) => {
    index = (i + songs.length) % songs.length;
    audio.src = songs[index].src;
  };

  const start = () => {
    if (!audio.src) load(index);
    audio.play().then(() => render()).catch(() => render('音樂無法播放，請稍後再試。'));
  };

  play.addEventListener('click', () => {
    if (audio.paused) start();
    else {
      audio.pause();
      render();
    }
  });
  next.addEventListener('click', () => {
    load(index + 1);
    start();
  });
  audio.addEventListener('ended', () => {
    load(index + 1);
    start();
  });
  audio.addEventListener('error', () => {
    if (audio.src) render('音樂載入失敗，請稍後再試。');
  });

  render();
  return { audio, songs };
}
