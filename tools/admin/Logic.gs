/**
 * 純邏輯函式（不碰 Drive／試算表），可以在 Apps Script 內使用，
 * 也可以用 node 單獨載入執行（見檔案最後一行）。
 * 在 Apps Script 裡所有 .gs 檔共用同一個全域範圍，所以 Code.gs 直接呼叫這些函式即可。
 */

var MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 單檔上限 20MB
var ALLOWED_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};
var ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
var GAME_VALUES = ['mabinogi_m', 'mabinogi_pc', 'both'];

function pad2(n) {
  n = Number(n);
  return (n < 10 ? '0' : '') + n;
}

function trimText(v) {
  return v === null || v === undefined ? '' : String(v).replace(/^\s+|\s+$/g, '');
}

/** 把試算表或表單的值轉成布林（TRUE／true／1／是 都算 true） */
function toBool(v) {
  if (v === true || v === false) return v;
  var s = trimText(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === '是';
}

/** 去掉資料夾／檔名不能用的字元 */
function sanitizeName(name) {
  return trimText(name)
    .replace(/[\\\/:*?"<>|\r\n\t]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '');
}

/** 歷任會長：把舊的 term_start、term_end 合併成 period。 2005＋空白 → 2005～ */
function periodFromTerms(start, end) {
  var s = trimText(start);
  var e = trimText(end);
  if (!s && !e) return '';
  return s + '～' + e;
}

/** 模糊日期：支援 2008、2008-09、2008 左右、約 2008。回傳 {year, month} 或 null */
function parseFuzzyDate(text) {
  var m = /(\d{4})(?:\s*[-\/.年]\s*(\d{1,2}))?/.exec(trimText(text));
  if (!m) return null;
  var month = m[2] ? Number(m[2]) : 0;
  if (month < 0 || month > 12) month = 0;
  return { year: Number(m[1]), month: month };
}

/** 排序用數字：2008-09 → 200809、2008 → 200800、看不懂 → 大數字排最後 */
function dateSortKey(text) {
  var d = parseFuzzyDate(text);
  return d ? d.year * 100 + d.month : 999999;
}

function compareByDate(a, b) {
  return dateSortKey(a) - dateSortKey(b);
}

/** 從已有的 id 清單找出 prefix＋數字的下一個號碼，例如 nextNumber(['m01','m26'], /^m(\d+)$/) → 27 */
function nextNumber(ids, pattern) {
  var max = 0;
  for (var i = 0; i < ids.length; i++) {
    var m = pattern.exec(trimText(ids[i]));
    if (m && Number(m[1]) > max) max = Number(m[1]);
  }
  return max + 1;
}

function nextMemberId(ids) {
  return 'm' + pad2(nextNumber(ids, /^m(\d+)$/));
}

function nextLeaderId(ids) {
  return 'leader-' + pad2(nextNumber(ids, /^leader-(\d+)$/));
}

/** 歷史 id：h-2008-01（年份＋流水號，只用英數與 -）；日期沒有年份時用 h-x-01 */
function historyId(date, existingIds) {
  var d = parseFuzzyDate(date);
  var prefix = 'h-' + (d ? d.year : 'x') + '-';
  var max = 0;
  for (var i = 0; i < existingIds.length; i++) {
    var id = trimText(existingIds[i]);
    if (id.indexOf(prefix) === 0) {
      var m = /^(\d+)$/.exec(id.slice(prefix.length));
      if (m && Number(m[1]) > max) max = Number(m[1]);
    }
  }
  return prefix + pad2(max + 1);
}

function isValidId(id) {
  return /^[a-z0-9-]+$/.test(trimText(id));
}

// ---------- 檔名規則 ----------

function extOf(fileName) {
  var m = /\.([A-Za-z0-9]+)$/.exec(trimText(fileName));
  return m ? m[1].toLowerCase() : '';
}

function baseName(fileName) {
  return trimText(fileName).replace(/\.[A-Za-z0-9]+$/, '');
}

/** 上傳檔案要用的副檔名：優先用原檔名的（限允許的圖片格式），否則依 MIME 決定 */
function uploadExt(fileName, mimeType) {
  var ext = extOf(fileName);
  if (ALLOWED_IMAGE_EXTS.indexOf(ext) >= 0) return ext === 'jpeg' ? 'jpg' : ext;
  return ALLOWED_IMAGE_TYPES[mimeType] || '';
}

/** 檢查上傳的檔案：只收 jpg／png／webp／gif，單檔 ≤ 20MB */
function checkUpload(mimeType, byteLength) {
  if (!ALLOWED_IMAGE_TYPES[mimeType]) {
    return { ok: false, reason: '只能上傳圖片（jpg、png、webp、gif）。' };
  }
  if (byteLength > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: '檔案超過 20MB，請先縮小再上傳。' };
  }
  if (byteLength <= 0) {
    return { ok: false, reason: '檔案是空的。' };
  }
  return { ok: true, reason: '' };
}

function avatarFileName(ext) {
  return '頭像.' + ext;
}

function outfitFileName(n, ext) {
  return '造型-' + n + '.' + ext;
}

/** '造型-3.png' → 3；不是造型檔回傳 0 */
function parseOutfitFileName(fileName) {
  var m = /^造型-(\d+)$/.exec(baseName(fileName));
  return m ? Number(m[1]) : 0;
}

function isAvatarFileName(fileName) {
  return baseName(fileName) === '頭像';
}

/** 'm01-伊莎貝拉' → 'm01'；不符合回傳 '' */
function parseMemberFolderId(folderName) {
  var m = /^(m\d+)(?:-|$)/.exec(trimText(folderName));
  return m ? m[1] : '';
}

/** 成員資料夾名稱：id 不動，- 後面是暱稱 */
function memberFolderName(id, nickname) {
  var nick = sanitizeName(nickname);
  return nick ? id + '-' + nick : id;
}

/** 下一個造型編號：參考雲端檔案的 n 與試算表的 sort_order，取最大值加 1 */
function nextOutfitNumber(fileNames, sheetNumbers) {
  var max = 0;
  var i;
  for (i = 0; i < fileNames.length; i++) {
    var n = parseOutfitFileName(fileNames[i]);
    if (n > max) max = n;
  }
  for (i = 0; i < sheetNumbers.length; i++) {
    var s = Number(sheetNumbers[i]);
    if (s > max) max = s;
  }
  return max + 1;
}

/** 造型的 id：m01-outfit-2；若已被用就加後綴 */
function outfitId(memberId, n, existingIds) {
  var base = memberId + '-outfit-' + n;
  var id = base;
  var k = 2;
  while (existingIds.indexOf(id) >= 0) {
    id = base + '-' + k;
    k++;
  }
  return id;
}

/** 歷史配圖路徑（網站固定路徑） */
function historyImagePath(id) {
  return 'assets/images/history/' + id + '.webp';
}

// ---------- 相簿 ----------

function isValidYearMonth(ym) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(trimText(ym));
}

/** 相簿資料夾名稱：'2010-08 夏日合奏'。年月格式不對會丟錯誤 */
function albumFolderName(ym, title) {
  var y = trimText(ym);
  var t = sanitizeName(title);
  if (!isValidYearMonth(y)) throw new Error('年月格式要像 2010-08。');
  if (!t) throw new Error('請輸入相簿標題。');
  return y + ' ' + t;
}

/** '2010-08 夏日合奏' → {ym, title}；不符合回傳 null */
function parseAlbumFolderName(name) {
  var m = /^(\d{4}-(?:0[1-9]|1[0-2]))\s+(.+)$/.exec(trimText(name));
  return m ? { ym: m[1], title: m[2] } : null;
}

/** 判斷照片是否已在網站相簿：用「檔名｜大小」比對（複製檔的 id 和原檔不同） */
function photoKey(name, size) {
  return trimText(name) + '|' + Number(size);
}

// ---------- 其他 ----------

function normalizeGame(v) {
  var s = trimText(v);
  if (GAME_VALUES.indexOf(s) >= 0) return s;
  var map = { '瑪奇 M': 'mabinogi_m', '瑪奇M': 'mabinogi_m', '瑪奇 PC': 'mabinogi_pc', '瑪奇PC': 'mabinogi_pc', '兩邊都有': 'both' };
  return map[s] || '';
}

/** 影片網址：空白可以；有填就要能取出 11 碼影片 ID。回傳 ID 或 ''（空白）或 null（不合格） */
function youtubeId(url) {
  var u = trimText(url);
  if (!u) return '';
  var m = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&#\/].*)?$/.exec(u);
  return m ? m[1] : null;
}

/** 把多筆資料依 sort_order 重新編成 1、2、3…（用於移動順序），回傳新的 id 順序 */
function moveInOrder(ids, id, dir) {
  var list = ids.slice();
  var i = list.indexOf(id);
  var j = i + (dir < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= list.length) return list;
  var tmp = list[i];
  list[i] = list[j];
  list[j] = tmp;
  return list;
}

// 讓 node 可以單獨載入（Apps Script 沒有 module，所以先判斷）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    periodFromTerms: periodFromTerms, parseFuzzyDate: parseFuzzyDate, dateSortKey: dateSortKey,
    compareByDate: compareByDate, nextMemberId: nextMemberId, nextLeaderId: nextLeaderId,
    historyId: historyId, isValidId: isValidId, uploadExt: uploadExt, checkUpload: checkUpload,
    avatarFileName: avatarFileName, outfitFileName: outfitFileName, parseOutfitFileName: parseOutfitFileName,
    parseMemberFolderId: parseMemberFolderId, memberFolderName: memberFolderName,
    nextOutfitNumber: nextOutfitNumber, outfitId: outfitId, albumFolderName: albumFolderName,
    parseAlbumFolderName: parseAlbumFolderName, photoKey: photoKey, normalizeGame: normalizeGame,
    youtubeId: youtubeId, moveInOrder: moveInOrder, sanitizeName: sanitizeName, toBool: toBool,
    baseName: baseName, isAvatarFileName: isAvatarFileName
  };
}
