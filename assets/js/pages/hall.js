// 虛擬公會城堡頁：讀資料 → 啟動遊戲。
// 網址參數：?room=music 從該房間開始、?meet=m03 這位成員今天一定在（從他所在的房間開始）
// 測試用：?seed=123 固定抽選結果、?date=2026-01-01 假裝是那一天、?npcs=40 指定人數、?debug=1 顯示除錯圖層、?noart=1 不用圖片（只畫色塊）
// ?moon=7.4 指定月齡（天）看不同月相（測試用）
import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { createMusicPlayer } from '../castle/music.js';
import { parseMoonAge } from '../castle/sky.js';

initLayout();
// 公會歌和遊戲各自獨立：遊戲載入失敗也能聽歌
createMusicPlayer(document.getElementById('castle-music'));

const stage = document.getElementById('castle-stage');
const loading = document.getElementById('castle-loading');
const roomName = document.getElementById('castle-room');

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
  // 城堡程式一載入就要用到 Phaser，所以確認有 Phaser 之後才載入（否則整頁都不會動）
  let startCastle;
  try {
    ({ startCastle } = await import('../castle/main.js'));
  } catch (error) {
    fail('遊戲程式載入失敗，請重新整理頁面再試一次。', error);
    return;
  }
  let members;
  let looks = [];
  let lines = [];
  try {
    members = await loadTable('members');
  } catch (error) {
    fail('成員資料讀取失敗，請稍後再試。', error);
    return;
  }
  // 外觀與台詞讀不到也能玩（改用自動配色與預設台詞）
  [looks, lines] = await Promise.all([
    loadTable('castle_looks').catch((e) => (console.warn(e), [])),
    loadTable('castle_lines').catch((e) => (console.warn(e), [])),
  ]);
  if (!members.length) {
    fail('還沒有成員資料。');
    return;
  }

  const params = new URLSearchParams(location.search);
  const num = (key) => (params.has(key) && /^\d+$/.test(params.get(key)) ? Number(params.get(key)) : undefined);
  loading.hidden = true;
  startCastle(stage, { members, looks, lines }, {
    seed: num('seed'),
    npcs: num('npcs'),
    date: /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') || '') ? params.get('date') : undefined,
    room: params.get('room') || undefined, // main.js 只接受開放中的房間
    meet: /^m\d+$/.test(params.get('meet') || '') ? params.get('meet') : undefined,
    debug: params.get('debug') === '1',
    noArt: params.get('noart') === '1',
    moonAge: parseMoonAge(params.get('moon')),
    onRoomChange: (name) => { roomName.textContent = `目前位置：${name}`; },
  });
}

main().catch((error) => fail('城堡啟動失敗，請重新整理頁面再試一次。', error));
