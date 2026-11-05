// 遊戲模式（主要給手機）：遊戲區蓋滿整個可視範圍，下方（橫拿時右側）出現固定的操作列。
// - iPhone Safari 不能把網頁元素變成真正的全螢幕，所以一律用 CSS 蓋滿（.is-game）。
//   Android Chrome 與電腦另外再要求瀏覽器全螢幕（requestFullscreen），失敗也沒關係。
// - 進入時把對話框、公會歌按鈕搬進操作列，離開時搬回原位（對話不再蓋住遊戲畫面）。
// - 畫面大小改變後由 main.js 的 fit() 重設遊戲寬高（ResizeObserver 會通知）。

/**
 * els：{ root, stage, bar, enter, exit, talk, buttons, music, dialog }
 * 回傳 { get active, enter(), exit() }
 */
export function setupGameMode(els) {
  const { root, stage, bar, enter, exit, talk, buttons, music, dialog } = els;
  const home = { music: music.parentElement, musicNext: music.nextSibling };
  let active = false;
  let wantedFullscreen = false;

  function enterMode() {
    if (active) return;
    active = true;
    document.documentElement.classList.add('castle-gaming');
    root.classList.add('is-game');
    bar.hidden = false;
    exit.hidden = false;
    talk.prepend(dialog);
    buttons.append(music);
    stage.focus({ preventScroll: true });
    wantedFullscreen = false;
    if (root.requestFullscreen && !document.fullscreenElement) {
      wantedFullscreen = true;
      root.requestFullscreen({ navigationUI: 'hide' }).catch(() => { wantedFullscreen = false; });
    }
  }

  function exitMode() {
    if (!active) return;
    active = false;
    document.documentElement.classList.remove('castle-gaming');
    root.classList.remove('is-game');
    bar.hidden = true;
    exit.hidden = true;
    stage.append(dialog);
    home.music.insertBefore(music, home.musicNext);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    enter.focus({ preventScroll: true });
    root.scrollIntoView({ block: 'center' });
  }

  enter.addEventListener('click', enterMode);
  exit.addEventListener('click', exitMode);
  // 電腦按 Esc 結束瀏覽器全螢幕時，一起離開遊戲模式；手機（觸控）維持遊戲模式，避免邊緣手勢誤觸
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && active && wantedFullscreen && !window.matchMedia('(pointer: coarse)').matches) {
      exitMode();
    }
  });

  return {
    get active() { return active; },
    enter: enterMode,
    exit: exitMode,
  };
}
