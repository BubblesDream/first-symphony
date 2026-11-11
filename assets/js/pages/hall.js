// 虛擬公會城堡頁：讀資料 → 啟動遊戲。
// 網址參數（測試用）：?seed=123 固定抽選結果、?npcs=40 指定人數、?debug=1 顯示除錯圖層、?noart=1 不用圖片（只畫色塊）、
//   ?hour=21 假裝現在是幾點（測試時間氛圍）
import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { createMusicPlayer } from '../castle/music.js';

initLayout();
// 公會歌和遊戲各自獨立：遊戲載入失敗也能聽歌
createMusicPlayer(document.getElementById('castle-music'));

const stage = document.getElementById('castle-stage');
const loading = document.getElementById('castle-loading');
const roomName = document.getElementById('castle-room');
const barRoom = document.getElementById('castle-bar-room');
const actButton = document.getElementById('castle-act');
const enterButton = document.getElementById('castle-enter');

function fail(message, error) {
  if (error) console.error(error);
  loading.textContent = message;
  loading.hidden = false;
  stage.classList.add('is-error');
}

async function main() {
  if (!window.Phaser) {
    fail('遊戲程式載入失敗，請重新整理頁面再試一次。');
    return;
  }
  // 遊戲程式要等 Phaser 確定載入後才讀（它一讀進來就會用到 Phaser）
  const [{ startCastle }, { setupGameMode }] = await Promise.all([
    import('../castle/main.js'),
    import('../castle/gameMode.js'),
  ]);
  let members;
  let looks = [];
  let lines = [];
  let history = [];
  let updates = [];
  try {
    members = await loadTable('members');
  } catch (error) {
    fail('成員資料讀取失敗，請稍後再試。', error);
    return;
  }
  // 外觀、台詞、公會歷史與更新紀錄讀不到也能玩（改用預設內容或空資料提示）
  [looks, lines, history, updates] = await Promise.all([
    loadTable('castle_looks').catch((e) => (console.warn(e), [])),
    loadTable('castle_lines').catch((e) => (console.warn(e), [])),
    loadTable('history').catch((e) => (console.warn(e), [])),
    loadTable('updates').catch((e) => (console.warn(e), [])),
  ]);
  if (!members.length) {
    fail('還沒有成員資料。');
    return;
  }

  const params = new URLSearchParams(location.search);
  const num = (key) => (params.has(key) && /^\d+$/.test(params.get(key)) ? Number(params.get(key)) : undefined);
  loading.hidden = true;
  let gameMode = null;
  const castle = startCastle(stage, { members, looks, lines, history, updates }, {
    seed: num('seed'),
    npcs: num('npcs'),
    hour: num('hour'),
    debug: params.get('debug') === '1',
    noArt: params.get('noart') === '1',
    onRoomChange: (name) => {
      roomName.textContent = `目前位置：${name}`;
      barRoom.textContent = name;
    },
    onAction: ({ label, enabled }) => {
      actButton.textContent = label;
      actButton.disabled = !enabled;
    },
    isGameMode: () => Boolean(gameMode?.active),
  });
  // 遊戲模式（全螢幕遊玩）
  gameMode = setupGameMode({
    root: document.getElementById('castle-play'),
    stage,
    bar: document.getElementById('castle-bar'),
    enter: enterButton,
    exit: document.getElementById('castle-exit'),
    talk: document.getElementById('castle-bar-talk'),
    buttons: document.getElementById('castle-bar-buttons'),
    music: document.getElementById('castle-music'),
    dialog: castle.dialog,
  });
  actButton.addEventListener('click', () => castle.pressInteract());
  enterButton.hidden = false;
}

main().catch((error) => fail('城堡啟動失敗，請重新整理頁面再試一次。', error));
