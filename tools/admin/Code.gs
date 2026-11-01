/**
 * 第一交響樂團｜網站管理頁（Google Apps Script 網頁應用程式）
 * 綁在「網站用」試算表上，以管理員身分執行、只有管理員能存取。
 * 這個資料夾不是網站的一部分，不會部署到 GitHub Pages。
 * 純邏輯函式在 Logic.gs，畫面在 Index.html／Style.html／Script.html。
 */

// ======== 要改的設定都在這裡 ========
var SPREADSHEET_ID = '1inLCZdA6cb78yycdnq2HBby0o8zHQ7y-e76E2PC8LfA'; // 「網站用」試算表（腳本綁在它上面時用 getActive，這個只是備用）
var ADMIN_ROOT_FOLDER_ID = '15kYNAy8PwyNyIubTE-dhtPXJlg9o3Z-A';      // 管理員專用資料夾
var INBOX_ROOT_FOLDER_ID = '1TIU1HSaM6SQJDIuwXTJrsCDxDkhXrWil';      // 投稿區相簿資料夾（只讀取、複製，不改動）
// ====================================

var FOLDER_MEMBERS = '成員';
var FOLDER_ALBUMS = '網站相簿';
var FOLDER_SITE = '橫幅與故事配圖';
var FOLDER_HISTORY = '歷史配圖';
var ALBUM_CATEGORIES = ['團體合照', '副本', '節日活動', '演奏', '日常', '紀念日'];
var TZ = 'Asia/Taipei';
var PAGE_SIZE = 30;

var SHEET_MEMBERS = '成員';
var SHEET_OUTFITS = '造型';
var SHEET_ALBUMS = '相簿';
var SHEET_HISTORY = '歷史';
var SHEET_LEADERS = '歷任會長';
var SHEET_SETTINGS = '公會設定';

// 轉換功能用的新格式（欄位順序＋第 2 列說明）
var LEADERS_COLUMNS = [
  ['id', '穩定代號，例如 leader-01（英數與 -）'],
  ['nickname', '會長的遊戲暱稱'],
  ['member_id', '（選填）對應「成員」分頁的 id，例如 m01'],
  ['period', '任期，自由文字，例如 2005～2008 左右'],
  ['sort_order', '排序數字，越早越小：1、2、3…'],
  ['note', '（選填）備註'],
  ['is_demo', '示範資料填 TRUE，正式資料填 FALSE']
];
var ALBUMS_COLUMNS = [
  ['album', '雲端硬碟相簿資料夾名稱，例如 2010-08 夏日合奏（必須完全相同）'],
  ['title', '（選填）相簿標題，空白時網站用資料夾名稱去掉日期'],
  ['caption', '（選填）相簿說明'],
  ['game', 'mabinogi_m、mabinogi_pc 或 both'],
  ['featured', '要不要放在首頁精選：TRUE 或 FALSE'],
  ['is_demo', '示範資料填 TRUE，正式資料填 FALSE']
];

// ---------------------------------------------------------------- 進入點

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('第一交響樂團｜網站管理')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** 在 Index.html 內用 <?!= include('Style') ?> 引入其他 html 檔 */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('網站管理')
    .addItem('開啟管理頁', 'menuOpenAdmin')
    .addSeparator()
    .addItem('轉換：歷任會長改用 period', 'menuConvertLeaders')
    .addItem('轉換：相簿改成一本相簿一列', 'menuConvertAlbums')
    .addToUi();
}

function menuOpenAdmin() {
  var url = ScriptApp.getService().getUrl();
  var msg = url
    ? '管理頁網址：\n\n' + url + '\n\n（請複製後在瀏覽器開啟，並加入書籤。只有你自己的帳號能開。）'
    : '還沒有部署成網頁應用程式。請照 docs/指南-管理頁.md 的步驟部署。';
  SpreadsheetApp.getUi().alert('開啟管理頁', msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

function menuConvertLeaders() {
  var ui = SpreadsheetApp.getUi();
  var msg = withLock_(function () { return convertLeaders_(); });
  ui.alert('轉換：歷任會長', msg, ui.ButtonSet.OK);
}

function menuConvertAlbums() {
  var ui = SpreadsheetApp.getUi();
  var msg = withLock_(function () { return convertAlbums_(); });
  ui.alert('轉換：相簿', msg, ui.ButtonSet.OK);
}

// ---------------------------------------------------------------- 試算表工具

function getSS_() {
  return SpreadsheetApp.getActive() || SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet_(name) {
  var sheet = getSS_().getSheetByName(name);
  if (!sheet) throw new Error('找不到試算表分頁「' + name + '」。');
  return sheet;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var result = fn();
    SpreadsheetApp.flush();
    return result;
  } finally {
    lock.releaseLock();
  }
}

/**
 * 讀一個分頁。第 1 列＝欄位名稱、第 2 列＝說明、第 3 列起是資料。
 * 一律用欄位名稱找欄，不寫死位置。回傳 {sheet, headers, rows:[{_row, 欄位…}]}
 * 文字用「顯示值」（避免 2008-09 被當日期、2005 被當數字），布林保留布林。
 */
function readTable_(name) {
  var sheet = getSheet_(name);
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastCol < 1) throw new Error('分頁「' + name + '」是空的，第 1 列要有欄位名稱。');
  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(trimText);
  var rows = [];
  if (lastRow >= 3) {
    var range = sheet.getRange(3, 1, lastRow - 2, lastCol);
    var values = range.getValues();
    var shown = range.getDisplayValues();
    for (var i = 0; i < values.length; i++) {
      var obj = { _row: i + 3 };
      var empty = true;
      for (var j = 0; j < headers.length; j++) {
        if (!headers[j]) continue;
        obj[headers[j]] = typeof values[i][j] === 'boolean' ? values[i][j] : shown[i][j];
        if (shown[i][j] !== '') empty = false;
      }
      if (!empty) rows.push(obj);
    }
  }
  return { sheet: sheet, name: name, headers: headers, rows: rows };
}

function requireColumns_(table, names) {
  var missing = names.filter(function (n) { return table.headers.indexOf(n) < 0; });
  if (missing.length) {
    throw new Error('分頁「' + table.name + '」第 1 列缺少欄位：' + missing.join('、') + '。如果是歷任會長／相簿，請先用選單「網站管理」做轉換。');
  }
}

function colOf_(table, field) {
  var i = table.headers.indexOf(field);
  return i < 0 ? 0 : i + 1;
}

/** 只寫 obj 裡有的欄位，不動其他欄位與第 2 列。文字先設成純文字格式，避免被轉成日期或數字 */
function writeRow_(table, rowNum, obj) {
  Object.keys(obj).forEach(function (field) {
    if (field.charAt(0) === '_') return;
    var col = colOf_(table, field);
    if (!col) return;
    var cell = table.sheet.getRange(rowNum, col);
    var v = obj[field];
    if (v === null || v === undefined) v = '';
    if (typeof v === 'string') cell.setNumberFormat('@');
    cell.setValue(v);
  });
}

function appendRow_(table, obj) {
  var rowNum = Math.max(table.sheet.getLastRow() + 1, 3);
  if (table.sheet.getMaxRows() < rowNum) {
    table.sheet.insertRowsAfter(table.sheet.getMaxRows(), rowNum - table.sheet.getMaxRows());
  }
  writeRow_(table, rowNum, obj);
  return rowNum;
}

function findRow_(table, field, value) {
  var v = trimText(value);
  for (var i = 0; i < table.rows.length; i++) {
    if (trimText(table.rows[i][field]) === v) return table.rows[i];
  }
  return null;
}

function stripRow_(row) {
  var out = {};
  Object.keys(row).forEach(function (k) { if (k.charAt(0) !== '_') out[k] = row[k]; });
  return out;
}

function numberOrBlank_(v) {
  var s = trimText(v);
  if (s === '') return '';
  var n = Number(s);
  return isNaN(n) ? '' : n;
}

function maxSort_(rows) {
  var max = 0;
  rows.forEach(function (r) { var n = Number(r.sort_order); if (n > max) max = n; });
  return max;
}

// ---------------------------------------------------------------- Drive 工具（只動管理員資料夾與投稿區）

function adminRoot_() { return DriveApp.getFolderById(ADMIN_ROOT_FOLDER_ID); }
function inboxRoot_() { return DriveApp.getFolderById(INBOX_ROOT_FOLDER_ID); }

function childFolder_(parent, name, create) {
  var it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return create ? parent.createFolder(name) : null;
}

/** 檔案或資料夾是否在指定根資料夾底下（往上找父層） */
function isInside_(item, rootIds) {
  var seen = {};
  var queue = [item];
  var guard = 0;
  while (queue.length && guard < 300) {
    var cur = queue.shift();
    if (rootIds.indexOf(cur.getId()) >= 0) return true;
    var parents = cur.getParents();
    while (parents.hasNext()) {
      var p = parents.next();
      if (!seen[p.getId()]) { seen[p.getId()] = true; queue.push(p); }
    }
    guard++;
  }
  return false;
}

function fileInScope_(fileId) {
  var file = DriveApp.getFileById(fileId);
  if (!isInside_(file, [ADMIN_ROOT_FOLDER_ID, INBOX_ROOT_FOLDER_ID])) {
    throw new Error('這個檔案不在管理員資料夾或投稿區內，已拒絕。');
  }
  return file;
}

function filesByBase_(folder, base) {
  var out = [];
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (baseName(f.getName()) === base) out.push(f);
  }
  return out;
}

function trashFiles_(files, exceptId) {
  files.forEach(function (f) { if (f.getId() !== exceptId) f.setTrashed(true); });
}

function membersRoot_() { return childFolder_(adminRoot_(), FOLDER_MEMBERS, true); }

function memberFolder_(id, create, nickname) {
  var parent = membersRoot_();
  var it = parent.getFolders();
  while (it.hasNext()) {
    var f = it.next();
    if (parseMemberFolderId(f.getName()) === id) return f;
  }
  return create ? parent.createFolder(memberFolderName(id, nickname)) : null;
}

/** 讀成員資料夾內容：頭像檔與造型檔 */
function folderImages_(folder) {
  var avatar = null;
  var outfits = [];
  if (!folder) return { avatar: null, outfits: [] };
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    var name = f.getName();
    if (isAvatarFileName(name)) {
      if (!avatar || f.getLastUpdated() > avatar.getLastUpdated()) avatar = f;
    } else {
      var n = parseOutfitFileName(name);
      if (n) outfits.push({ n: n, file: f });
    }
  }
  outfits.sort(function (a, b) { return a.n - b.n; });
  return { avatar: avatar, outfits: outfits };
}

function decodeUpload_(payload) {
  if (!payload || !payload.base64) throw new Error('沒有收到檔案。');
  var bytes = Utilities.base64Decode(payload.base64);
  var check = checkUpload(payload.mimeType, bytes.length);
  if (!check.ok) throw new Error(check.reason);
  var ext = uploadExt(payload.name, payload.mimeType);
  if (!ext) throw new Error('只能上傳圖片（jpg、png、webp、gif）。');
  return { bytes: bytes, mimeType: payload.mimeType, ext: ext };
}

function createImageFile_(folder, fileName, upload) {
  return folder.createFile(Utilities.newBlob(upload.bytes, upload.mimeType, fileName));
}

// ---------------------------------------------------------------- 共用 API

function getInit() {
  return { categories: ALBUM_CATEGORIES, pageSize: PAGE_SIZE };
}

/** 縮圖：用 getThumbnail 轉 data URI，不需要公開分享檔案。一次最多 12 張 */
function getThumbnails(ids) {
  var out = {};
  (ids || []).slice(0, 12).forEach(function (id) {
    out[id] = '';
    try {
      var blob = fileInScope_(id).getThumbnail();
      if (blob) out[id] = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
    } catch (e) {
      out[id] = '';
    }
  });
  return out;
}

// ---------------------------------------------------------------- 成員

function listMembers() {
  var table = readTable_(SHEET_MEMBERS);
  var byId = {};
  var it = membersRoot_().getFolders();
  while (it.hasNext()) {
    var f = it.next();
    var fid = parseMemberFolderId(f.getName());
    if (fid) byId[fid] = f;
  }
  var list = table.rows.map(function (r) {
    var m = stripRow_(r);
    var imgs = folderImages_(byId[trimText(r.id)]);
    m.has_avatar = !!imgs.avatar;
    m.outfit_count = imgs.outfits.length;
    return m;
  });
  list.sort(function (a, b) { return (Number(a.sort_order) || 9999) - (Number(b.sort_order) || 9999); });
  return list;
}

function getMemberDetail(id) {
  var table = readTable_(SHEET_MEMBERS);
  var row = findRow_(table, 'id', id);
  if (!row) throw new Error('找不到成員 ' + id + '。');
  var imgs = folderImages_(memberFolder_(trimText(id), false));
  var outfitTable = readTable_(SHEET_OUTFITS);
  var rows = outfitTable.rows.filter(function (r) { return trimText(r.member_id) === trimText(id); });
  var byN = {};
  rows.forEach(function (r) { byN[Number(r.sort_order)] = r; });
  var outfits = [];
  var seen = {};
  imgs.outfits.forEach(function (o) {
    var r = byN[o.n];
    seen[o.n] = true;
    outfits.push({ n: o.n, fileId: o.file.getId(), name: r ? r.name : '', note: r ? r.note : '', hasRow: !!r });
  });
  rows.forEach(function (r) {
    var n = Number(r.sort_order);
    if (!seen[n]) outfits.push({ n: n, fileId: '', name: r.name, note: r.note, hasRow: true });
  });
  outfits.sort(function (a, b) { return a.n - b.n; });
  return {
    member: stripRow_(row),
    avatar: imgs.avatar ? { id: imgs.avatar.getId(), name: imgs.avatar.getName() } : null,
    outfits: outfits
  };
}

function saveMember(data) {
  var nickname = trimText(data.nickname);
  if (!nickname) throw new Error('請填暱稱。');
  var game = normalizeGame(data.game);
  if (!game) throw new Error('請選擇遊戲。');
  return withLock_(function () {
    var table = readTable_(SHEET_MEMBERS);
    requireColumns_(table, ['id', 'nickname', 'role', 'game', 'joined', 'intro', 'aka', 'featured', 'sort_order']);
    var fields = {
      nickname: nickname,
      role: trimText(data.role),
      game: game,
      joined: trimText(data.joined),
      intro: String(data.intro === null || data.intro === undefined ? '' : data.intro).replace(/\s+$/, ''),
      aka: trimText(data.aka),
      featured: toBool(data.featured),
      sort_order: numberOrBlank_(data.sort_order)
    };
    var id = trimText(data.id);
    if (!id) {
      id = nextMemberId(table.rows.map(function (r) { return r.id; }));
      if (fields.sort_order === '') fields.sort_order = maxSort_(table.rows) + 1;
      fields.id = id;
      fields.is_demo = false;
      appendRow_(table, fields);
      memberFolder_(id, true, nickname);
    } else {
      var row = findRow_(table, 'id', id);
      if (!row) throw new Error('找不到成員 ' + id + '。');
      writeRow_(table, row._row, fields);
      var folder = memberFolder_(id, true, nickname);
      var wanted = memberFolderName(id, nickname);
      if (folder.getName() !== wanted) folder.setName(wanted); // id 不動，只改 - 後面的暱稱
    }
    return { id: id };
  });
}

/** 上傳頭像或造型。kind: 'avatar' | 'outfit' */
function uploadMemberImage(memberId, kind, payload) {
  var upload = decodeUpload_(payload);
  return withLock_(function () {
    var table = readTable_(SHEET_MEMBERS);
    var member = findRow_(table, 'id', memberId);
    if (!member) throw new Error('找不到成員 ' + memberId + '。');
    var folder = memberFolder_(memberId, true, member.nickname);
    if (kind === 'avatar') {
      var created = createImageFile_(folder, avatarFileName(upload.ext), upload);
      trashFiles_(filesByBase_(folder, '頭像'), created.getId()); // 舊的移到垃圾桶
      return { fileId: created.getId() };
    }
    if (kind !== 'outfit') throw new Error('不認得的圖片種類。');
    var outfitTable = readTable_(SHEET_OUTFITS);
    requireColumns_(outfitTable, ['id', 'member_id', 'sort_order', 'name', 'note']);
    var names = [];
    var it = folder.getFiles();
    while (it.hasNext()) names.push(it.next().getName());
    var mine = outfitTable.rows.filter(function (r) { return trimText(r.member_id) === memberId; });
    var n = nextOutfitNumber(names, mine.map(function (r) { return r.sort_order; }));
    var file = createImageFile_(folder, outfitFileName(n, upload.ext), upload);
    appendRow_(outfitTable, {
      id: outfitId(memberId, n, outfitTable.rows.map(function (r) { return r.id; })),
      member_id: memberId,
      sort_order: n,
      name: '',
      note: '',
      is_demo: false
    });
    return { fileId: file.getId(), n: n };
  });
}

/** 修改造型名稱／備註。找不到該列（例如手動放進資料夾的檔案）就新增一列 */
function saveOutfit(data) {
  return withLock_(function () {
    var table = readTable_(SHEET_OUTFITS);
    requireColumns_(table, ['id', 'member_id', 'sort_order', 'name', 'note']);
    var memberId = trimText(data.member_id);
    var n = Number(data.n);
    if (!memberId || !n) throw new Error('缺少成員或造型編號。');
    var row = null;
    table.rows.forEach(function (r) {
      if (trimText(r.member_id) === memberId && Number(r.sort_order) === n) row = r;
    });
    var fields = { name: trimText(data.name), note: trimText(data.note) };
    if (row) {
      writeRow_(table, row._row, fields);
    } else {
      fields.id = outfitId(memberId, n, table.rows.map(function (r) { return r.id; }));
      fields.member_id = memberId;
      fields.sort_order = n;
      fields.is_demo = false;
      appendRow_(table, fields);
    }
    return { ok: true };
  });
}

/** 刪除造型：檔案移到垃圾桶＋刪該列 */
function deleteOutfit(memberId, n) {
  return withLock_(function () {
    n = Number(n);
    var folder = memberFolder_(trimText(memberId), false);
    if (folder) {
      var it = folder.getFiles();
      while (it.hasNext()) {
        var f = it.next();
        if (parseOutfitFileName(f.getName()) === n) f.setTrashed(true);
      }
    }
    var table = readTable_(SHEET_OUTFITS);
    var rows = table.rows.filter(function (r) {
      return trimText(r.member_id) === trimText(memberId) && Number(r.sort_order) === n;
    });
    rows.sort(function (a, b) { return b._row - a._row; }); // 由下往上刪，列號不會跑掉
    rows.forEach(function (r) { table.sheet.deleteRow(r._row); });
    return { ok: true };
  });
}

// ---------------------------------------------------------------- 歷史

function listHistory() {
  var table = readTable_(SHEET_HISTORY);
  var list = table.rows.map(stripRow_);
  list.sort(function (a, b) { return compareByDate(a.date, b.date); });
  return list;
}

function saveHistory(data) {
  var title = trimText(data.title);
  if (!title) throw new Error('請填標題。');
  if (!trimText(data.date)) throw new Error('請填日期（可以只填年份，例如 2008）。');
  var video = trimText(data.video_url);
  if (youtubeId(video) === null) throw new Error('影片網址看不懂。請貼 YouTube 網址（watch?v=、youtu.be、shorts 皆可）。');
  var game = data.game ? normalizeGame(data.game) : '';
  if (data.game && !game) throw new Error('遊戲欄位不正確。');
  return withLock_(function () {
    var table = readTable_(SHEET_HISTORY);
    requireColumns_(table, ['id', 'date', 'title', 'body', 'image', 'video_url', 'game']);
    var fields = {
      date: trimText(data.date),
      title: title,
      body: String(data.body === null || data.body === undefined ? '' : data.body).replace(/\s+$/, ''),
      game: game,
      video_url: video
    };
    var id = trimText(data.id);
    if (!id) {
      id = historyId(fields.date, table.rows.map(function (r) { return r.id; }));
      fields.id = id;
      fields.is_demo = false;
      appendRow_(table, fields);
    } else {
      var row = findRow_(table, 'id', id);
      if (!row) throw new Error('找不到這筆歷史（id ' + id + '）。');
      writeRow_(table, row._row, fields);
    }
    return { id: id };
  });
}

function uploadHistoryImage(id, payload) {
  var upload = decodeUpload_(payload);
  return withLock_(function () {
    var table = readTable_(SHEET_HISTORY);
    requireColumns_(table, ['id', 'image']);
    var row = findRow_(table, 'id', id);
    if (!row) throw new Error('請先儲存這筆歷史，再上傳配圖。');
    var folder = childFolder_(adminRoot_(), FOLDER_HISTORY, true);
    var created = createImageFile_(folder, id + '.' + upload.ext, upload);
    trashFiles_(filesByBase_(folder, id), created.getId());
    writeRow_(table, row._row, { image: historyImagePath(id) });
    return { image: historyImagePath(id), fileId: created.getId() };
  });
}

function getHistoryImage(id) {
  var folder = childFolder_(adminRoot_(), FOLDER_HISTORY, false);
  if (!folder) return null;
  var files = filesByBase_(folder, trimText(id));
  return files.length ? { id: files[0].getId(), name: files[0].getName() } : null;
}

function deleteHistory(id) {
  return withLock_(function () {
    var table = readTable_(SHEET_HISTORY);
    var row = findRow_(table, 'id', id);
    if (!row) throw new Error('找不到這筆歷史。');
    var folder = childFolder_(adminRoot_(), FOLDER_HISTORY, false);
    if (folder) trashFiles_(filesByBase_(folder, trimText(id)), '');
    table.sheet.deleteRow(row._row);
    return { ok: true };
  });
}

// ---------------------------------------------------------------- 歷任會長

function sortedLeaders_(table) {
  var rows = table.rows.slice();
  rows.sort(function (a, b) { return (Number(a.sort_order) || 9999) - (Number(b.sort_order) || 9999) || a._row - b._row; });
  return rows;
}

function listLeaders() {
  var table = readTable_(SHEET_LEADERS);
  requireColumns_(table, ['id', 'nickname', 'member_id', 'period', 'sort_order', 'note']);
  return sortedLeaders_(table).map(stripRow_);
}

function saveLeader(data) {
  var nickname = trimText(data.nickname);
  if (!nickname) throw new Error('請填暱稱（可從成員下拉選，或自己輸入）。');
  return withLock_(function () {
    var table = readTable_(SHEET_LEADERS);
    requireColumns_(table, ['id', 'nickname', 'member_id', 'period', 'sort_order', 'note']);
    var fields = {
      nickname: nickname,
      member_id: trimText(data.member_id),
      period: trimText(data.period),
      note: trimText(data.note)
    };
    var sort = numberOrBlank_(data.sort_order);
    var id = trimText(data.id);
    if (!id) {
      id = nextLeaderId(table.rows.map(function (r) { return r.id; }));
      fields.id = id;
      fields.sort_order = sort === '' ? maxSort_(table.rows) + 1 : sort;
      fields.is_demo = false;
      appendRow_(table, fields);
    } else {
      var row = findRow_(table, 'id', id);
      if (!row) throw new Error('找不到這位會長（id ' + id + '）。');
      if (sort !== '') fields.sort_order = sort;
      writeRow_(table, row._row, fields);
    }
    return { id: id };
  });
}

function deleteLeader(id) {
  return withLock_(function () {
    var table = readTable_(SHEET_LEADERS);
    var row = findRow_(table, 'id', id);
    if (!row) throw new Error('找不到這位會長。');
    table.sheet.deleteRow(row._row);
    return { ok: true };
  });
}

/** 上移／下移：交換順序後，把 sort_order 重新編成 1、2、3… */
function moveLeader(id, dir) {
  return withLock_(function () {
    var table = readTable_(SHEET_LEADERS);
    requireColumns_(table, ['id', 'sort_order']);
    var rows = sortedLeaders_(table);
    var ids = moveInOrder(rows.map(function (r) { return trimText(r.id); }), trimText(id), dir);
    var rowOf = {};
    rows.forEach(function (r) { rowOf[trimText(r.id)] = r._row; });
    ids.forEach(function (rid, i) { writeRow_(table, rowOf[rid], { sort_order: i + 1 }); });
    return { ok: true };
  });
}

// ---------------------------------------------------------------- 相簿

/** 瀏覽投稿區：folderId 空白＝投稿區根目錄。照片用 search 分頁，一頁 30 張 */
function browseInbox(folderId, token) {
  var folder = folderId ? DriveApp.getFolderById(folderId) : inboxRoot_();
  if (!isInside_(folder, [INBOX_ROOT_FOLDER_ID])) throw new Error('這個資料夾不在投稿區內，已拒絕。');
  var folders = [];
  if (!token) {
    var fit = folder.getFolders();
    while (fit.hasNext()) { var sub = fit.next(); folders.push({ id: sub.getId(), name: sub.getName() }); }
    folders.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
  }
  var it = token ? DriveApp.continueFileIterator(token) : folder.searchFiles("mimeType contains 'image/'");
  var files = [];
  while (files.length < PAGE_SIZE && it.hasNext()) {
    var f = it.next();
    files.push({ id: f.getId(), name: f.getName(), size: f.getSize() });
  }
  return {
    folderId: folder.getId(),
    name: folder.getName(),
    folders: folders,
    files: files,
    nextToken: it.hasNext() ? it.getContinuationToken() : ''
  };
}

function albumsRoot_(create) { return childFolder_(adminRoot_(), FOLDER_ALBUMS, create); }

function albumFolder_(category, album, create) {
  if (ALBUM_CATEGORIES.indexOf(category) < 0) throw new Error('分類不正確。');
  var root = albumsRoot_(create);
  if (!root) return null;
  var cat = childFolder_(root, category, create);
  if (!cat) return null;
  return childFolder_(cat, album, create);
}

/** 網站相簿內所有照片的「檔名｜大小」，給投稿區標示「已加入」 */
function getAddedIndex() {
  var keys = [];
  var root = albumsRoot_(false);
  if (!root) return keys;
  var cats = root.getFolders();
  while (cats.hasNext()) {
    var albums = cats.next().getFolders();
    while (albums.hasNext()) {
      var files = albums.next().getFiles();
      while (files.hasNext()) { var f = files.next(); keys.push(photoKey(f.getName(), f.getSize())); }
    }
  }
  return keys;
}

/**
 * 把投稿區照片「複製」（不是移動）到 網站相簿/<分類>/<YYYY-MM 標題>/
 * req: {fileIds, category, album（選現有）或 ym＋title（新建）}
 */
function addPhotos(req) {
  var ids = (req && req.fileIds) || [];
  if (!ids.length) throw new Error('請先勾選照片。');
  if (ALBUM_CATEGORIES.indexOf(req.category) < 0) throw new Error('請選擇分類。');
  var albumName = req.album ? trimText(req.album) : albumFolderName(req.ym, req.title);
  return withLock_(function () {
    var folder = albumFolder_(req.category, albumName, true);
    var existing = {};
    var it = folder.getFiles();
    while (it.hasNext()) { var e = it.next(); existing[photoKey(e.getName(), e.getSize())] = true; }
    var added = 0;
    var skipped = 0;
    ids.forEach(function (id) {
      var src = DriveApp.getFileById(id);
      if (!isInside_(src, [INBOX_ROOT_FOLDER_ID])) throw new Error('有照片不在投稿區內，已拒絕。');
      var key = photoKey(src.getName(), src.getSize());
      if (existing[key]) { skipped++; return; }
      src.makeCopy(src.getName(), folder);
      existing[key] = true;
      added++;
    });
    // 確保「相簿」分頁有這本相簿一列
    var table = readTable_(SHEET_ALBUMS);
    requireColumns_(table, ['album', 'title', 'caption', 'game', 'featured']);
    if (!findRow_(table, 'album', albumName)) {
      var parsed = parseAlbumFolderName(albumName);
      appendRow_(table, {
        album: albumName,
        title: parsed ? parsed.title : albumName,
        caption: '',
        game: '',
        featured: false,
        is_demo: false
      });
    }
    return { album: albumName, added: added, skipped: skipped };
  });
}

function listAlbums() {
  var table = readTable_(SHEET_ALBUMS);
  requireColumns_(table, ['album', 'title', 'caption', 'game', 'featured']);
  var out = [];
  var seen = {};
  var root = albumsRoot_(false);
  ALBUM_CATEGORIES.forEach(function (cat) {
    var cf = root ? childFolder_(root, cat, false) : null;
    if (!cf) return;
    var it = cf.getFolders();
    while (it.hasNext()) {
      var f = it.next();
      var count = 0;
      var files = f.getFiles();
      while (files.hasNext()) { files.next(); count++; }
      var row = findRow_(table, 'album', f.getName());
      seen[f.getName()] = true;
      out.push({
        category: cat,
        album: f.getName(),
        title: row ? row.title : '',
        caption: row ? row.caption : '',
        game: row ? row.game : '',
        featured: row ? toBool(row.featured) : false,
        hasRow: !!row,
        count: count
      });
    }
  });
  out.sort(function (a, b) { return a.album < b.album ? -1 : 1; });
  return out;
}

function getAlbumPhotos(category, album) {
  var folder = albumFolder_(category, album, false);
  if (!folder) return [];
  var out = [];
  var it = folder.getFiles();
  while (it.hasNext()) { var f = it.next(); out.push({ id: f.getId(), name: f.getName() }); }
  out.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
  return out;
}

function saveAlbum(data) {
  var album = trimText(data.album);
  if (!album) throw new Error('缺少相簿名稱。');
  var game = data.game ? normalizeGame(data.game) : '';
  if (data.game && !game) throw new Error('遊戲欄位不正確。');
  return withLock_(function () {
    var table = readTable_(SHEET_ALBUMS);
    requireColumns_(table, ['album', 'title', 'caption', 'game', 'featured']);
    var fields = {
      title: trimText(data.title),
      caption: String(data.caption === null || data.caption === undefined ? '' : data.caption).replace(/\s+$/, ''),
      game: game,
      featured: toBool(data.featured)
    };
    var row = findRow_(table, 'album', album);
    if (row) {
      writeRow_(table, row._row, fields);
    } else {
      fields.album = album;
      fields.is_demo = false;
      appendRow_(table, fields);
    }
    return { ok: true };
  });
}

/** 從網站相簿移除一張照片（移到垃圾桶，不永久刪除） */
function removeAlbumPhoto(fileId) {
  var file = DriveApp.getFileById(fileId);
  var root = albumsRoot_(false);
  if (!root || !isInside_(file, [root.getId()])) throw new Error('這張照片不在網站相簿內，已拒絕。');
  file.setTrashed(true);
  return { ok: true };
}

// ---------------------------------------------------------------- 公會設定

function listSettings() {
  var table = readTable_(SHEET_SETTINGS);
  requireColumns_(table, ['key', 'value']);
  return table.rows.map(stripRow_);
}

function saveSetting(key, value) {
  key = trimText(key);
  if (!key) throw new Error('key 不能空白。');
  return withLock_(function () {
    var table = readTable_(SHEET_SETTINGS);
    requireColumns_(table, ['key', 'value']);
    var v = String(value === null || value === undefined ? '' : value);
    var row = findRow_(table, 'key', key);
    if (row) writeRow_(table, row._row, { value: v });
    else appendRow_(table, { key: key, value: v });
    return { ok: true };
  });
}

function getSiteImages() {
  var folder = childFolder_(adminRoot_(), FOLDER_SITE, false);
  var out = { banner: null, story: null };
  if (!folder) return out;
  var b = filesByBase_(folder, '橫幅');
  var s = filesByBase_(folder, '故事配圖');
  if (b.length) out.banner = { id: b[0].getId(), name: b[0].getName() };
  if (s.length) out.story = { id: s[0].getId(), name: s[0].getName() };
  return out;
}

/** kind: 'banner' → 橫幅.*、'story' → 故事配圖.*（舊檔移到垃圾桶） */
function uploadSiteImage(kind, payload) {
  var base = kind === 'banner' ? '橫幅' : kind === 'story' ? '故事配圖' : '';
  if (!base) throw new Error('不認得的圖片種類。');
  var upload = decodeUpload_(payload);
  return withLock_(function () {
    var folder = childFolder_(adminRoot_(), FOLDER_SITE, true);
    var created = createImageFile_(folder, base + '.' + upload.ext, upload);
    trashFiles_(filesByBase_(folder, base), created.getId());
    return { fileId: created.getId() };
  });
}

// ---------------------------------------------------------------- 一次性轉換

/**
 * 依 columns（[[欄位, 說明]…]）重寫整個分頁：第 1 列欄位、第 2 列說明、第 3 列起資料。
 * 不認得的其他欄位保留在最右邊。textFields 以外的欄位（布林、數字）不設純文字格式。
 */
function rebuildSheet_(sheet, columns, dataRows, extras, boolFields, numberFields) {
  var headers = columns.map(function (c) { return c[0]; }).concat(extras.map(function (e) { return e.name; }));
  var descs = columns.map(function (c) { return c[1]; }).concat(extras.map(function (e) { return e.desc; }));
  var totalRows = Math.max(dataRows.length + 2, sheet.getMaxRows());
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  var full = sheet.getRange(1, 1, totalRows, sheet.getMaxColumns());
  full.clearContent();
  full.clearDataValidations();
  headers.forEach(function (h, i) {
    var isText = boolFields.indexOf(h) < 0 && numberFields.indexOf(h) < 0;
    sheet.getRange(1, i + 1, Math.max(dataRows.length + 2, 2), 1).setNumberFormat(isText ? '@' : 'General');
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, 1, headers.length).setValues([descs]);
  if (dataRows.length) {
    var values = dataRows.map(function (r) {
      return headers.map(function (h) { return r[h] === undefined || r[h] === null ? '' : r[h]; });
    });
    sheet.getRange(3, 1, values.length, headers.length).setValues(values);
  }
}

function extrasOf_(table, columns) {
  var known = columns.map(function (c) { return c[0]; });
  var descRow = table.sheet.getRange(2, 1, 1, table.headers.length).getDisplayValues()[0];
  var out = [];
  table.headers.forEach(function (h, i) {
    if (h && known.indexOf(h) < 0 && h !== 'term_start' && h !== 'term_end') out.push({ name: h, desc: descRow[i] });
  });
  return out;
}

/** term_start＋term_end → period，加 sort_order，刪掉舊兩欄。已轉換過就不做事，可重複執行 */
function convertLeaders_() {
  var table = readTable_(SHEET_LEADERS);
  var hasOld = table.headers.indexOf('term_start') >= 0 || table.headers.indexOf('term_end') >= 0;
  var expected = LEADERS_COLUMNS.map(function (c) { return c[0]; });
  var same = !hasOld && expected.every(function (h, i) { return table.headers[i] === h; });
  if (same) return '歷任會長已經是新格式（period、sort_order），不需要再轉換。';
  var rows = table.rows.map(function (r, i) {
    var period = trimText(r.period) || periodFromTerms(r.term_start, r.term_end);
    var sort = numberOrBlank_(r.sort_order);
    var out = {};
    table.headers.forEach(function (h) { if (h) out[h] = r[h]; });
    out.period = period;
    out.sort_order = sort === '' ? i + 1 : sort;
    out.is_demo = toBool(r.is_demo);
    return out;
  });
  rebuildSheet_(table.sheet, LEADERS_COLUMNS, rows, extrasOf_(table, LEADERS_COLUMNS), ['is_demo'], ['sort_order']);
  return '完成：已把 term_start、term_end 合併成 period，並加上 sort_order（共 ' + rows.length + ' 列）。';
}

/** 相簿分頁改成一本相簿一列。有舊資料時先複製一份分頁備份 */
function convertAlbums_() {
  var table = readTable_(SHEET_ALBUMS);
  var expected = ALBUMS_COLUMNS.map(function (c) { return c[0]; });
  var same = table.headers.length >= expected.length && expected.every(function (h, i) { return table.headers[i] === h; });
  if (same) return '相簿已經是新格式（一本相簿一列），不需要再轉換。';
  var note = '';
  if (table.rows.length) {
    var stamp = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmm');
    table.sheet.copyTo(getSS_()).setName(SHEET_ALBUMS + '-備份-' + stamp);
    note = '（舊資料已備份到分頁「' + SHEET_ALBUMS + '-備份-' + stamp + '」）';
  }
  var seen = {};
  var rows = [];
  table.rows.forEach(function (r) {
    var album = trimText(r.album);
    if (!album || seen[album]) return;
    seen[album] = true;
    rows.push({
      album: album,
      title: trimText(r.title),
      caption: r.caption || '',
      game: trimText(r.game),
      featured: toBool(r.featured),
      is_demo: toBool(r.is_demo)
    });
  });
  rebuildSheet_(table.sheet, ALBUMS_COLUMNS, rows, [], ['featured', 'is_demo'], []);
  return '完成：相簿分頁已改成一本相簿一列（共 ' + rows.length + ' 列）。' + note;
}
