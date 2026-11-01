// 資料載入模組：全站唯一讀取資料的地方。
// 頁面只呼叫 loadTable('members') 之類的函式，不需要知道資料來自 JSON 還是 CSV。
import { TABLES, FIELD_TYPES } from './config.js';
import { isValidId } from './validate.js';

const cache = new Map();

/** 讀取一張表，回傳物件陣列（已完成型別轉換）。 */
export function loadTable(name) {
  if (!cache.has(name)) {
    const promise = fetchTable(name);
    // 失敗時移除快取，讓下次可以重試
    promise.catch(() => cache.delete(name));
    cache.set(name, promise);
  }
  return cache.get(name);
}

/** 讀取 site 表，轉成 { key: value } 物件。 */
export async function loadSite() {
  const rows = await loadTable('site');
  const site = {};
  for (const row of rows) {
    if (row.key) site[row.key] = row.value ?? '';
  }
  return site;
}

async function fetchTable(name) {
  const config = TABLES[name];
  if (!config) throw new Error(`未設定的資料表：${name}`);

  let rows;
  if (config.source === 'csv' && config.url) {
    try {
      rows = await fetchCSV(name, config.url, config.skipRows);
    } catch (error) {
      if (!config.fallback) throw error;
      console.warn(`${name} 的試算表讀取失敗，改讀本地資料 ${config.fallback}`, error);
      rows = await fetchJSON(name, config.fallback);
    }
  } else {
    // CSV 網址還沒填時直接讀本地 JSON
    const url = config.source === 'csv' ? config.fallback : config.url;
    if (!url) throw new Error(`${name} 沒有可讀取的資料來源`);
    rows = await fetchJSON(name, url);
  }

  const types = FIELD_TYPES[name] || {};
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => normalizeRow(row, types));
}

async function fetchOk(name, url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`讀取 ${name} 失敗（HTTP ${response.status}）`);
  return response;
}

async function fetchJSON(name, url) {
  const rows = await (await fetchOk(name, url)).json();
  if (!Array.isArray(rows)) throw new Error(`${name} 的格式不正確，應為陣列`);
  return rows;
}

async function fetchCSV(name, url, skipRows = 0) {
  const text = await (await fetchOk(name, url)).text();
  return csvToObjects(parseCSV(text), skipRows);
}

// ---------- 相簿 ----------

/** 相簿資料夾名稱去掉開頭的日期，例如「2010-08 夏日合奏」→「夏日合奏」 */
export function albumTitle(album) {
  const name = String(album || '').trim();
  return name.replace(/^\d{4}(?:-\d{1,2}){0,2}[\s_-]*/, '') || name;
}

/** 從相簿資料夾名稱開頭取出日期（YYYY 或 YYYY-MM） */
function albumDate(album) {
  const m = String(album || '').match(/^(\d{4}(?:-\d{1,2})?)/);
  return m ? m[1] : '';
}

/**
 * 讀取相簿照片：gallery（一張照片一列，同步程式產生）＋ albums（一本相簿一列，試算表），
 * 用 album 欄位對起來，回傳頁面使用的照片物件：
 * { id, image, thumb, title, caption, date, game, category, featured, is_demo, album, sort_order }
 * 試算表裡沒有對應相簿的照片也照樣顯示，標題用資料夾名稱去掉日期。
 */
export async function loadGallery() {
  const [photos, albums] = await Promise.all([loadTable('gallery'), loadTable('albums')]);
  const byAlbum = new Map();
  for (const a of albums) {
    if (a.album && !byAlbum.has(a.album)) byAlbum.set(a.album, a);
  }

  return photos
    .filter((p) => p.id)
    .map((p) => {
      const a = byAlbum.get(p.album) || {};
      const out = {
        id: p.id,
        album: p.album || '',
        image: p.image || galleryImage(p.id),
        thumb: p.thumb || galleryThumb(p.id),
        title: a.title || albumTitle(p.album),
        caption: a.caption || '',
        date: p.date || albumDate(p.album),
        game: a.game || '',
        category: p.category || '',
        featured: Boolean(a.featured),
        is_demo: Boolean(a.is_demo),
      };
      if (p.sort_order !== undefined) out.sort_order = p.sort_order;
      return out;
    })
    .sort((x, y) => (x.sort_order ?? 999999) - (y.sort_order ?? 999999));
}

// ---------- 圖片固定路徑 ----------
// 同步程式會把雲端硬碟的圖片轉成 WebP 放到固定位置。資料欄位有填網址就用資料的，
// 空白時改用固定路徑。檔案不存在時 render.js 的 img() 會自動換成佔位圖。

/** 成員頭像：assets/images/members/<id>/avatar.webp */
export function memberAvatar(member) {
  if (member?.avatar) return member.avatar;
  return isValidId(member?.id) ? `assets/images/members/${member.id}/avatar.webp` : '';
}

/** 成員造型：assets/images/members/<member_id>/outfit-<sort_order>.webp */
export function outfitImage(outfit) {
  if (outfit?.image) return outfit.image;
  const n = outfit?.sort_order;
  if (!isValidId(outfit?.member_id) || !Number.isInteger(n) || n < 1) return '';
  return `assets/images/members/${outfit.member_id}/outfit-${n}.webp`;
}

/** 首頁橫幅：assets/images/site/banner.webp */
export function bannerImage(site) {
  return site?.banner_image || 'assets/images/site/banner.webp';
}

/** 故事配圖：assets/images/site/story.webp */
export function storyImage(site) {
  return site?.story_image || 'assets/images/site/story.webp';
}

function galleryImage(id) {
  return /^[A-Za-z0-9_-]+$/.test(id) ? `assets/images/gallery/${id}.webp` : '';
}

function galleryThumb(id) {
  return /^[A-Za-z0-9_-]+$/.test(id) ? `assets/images/gallery/${id}-thumb.webp` : '';
}

/** 依欄位型別轉換值；空字串視為「未填」直接略過。 */
export function normalizeRow(row, types) {
  const out = {};
  for (const [key, raw] of Object.entries(row)) {
    if (raw === null || raw === undefined) continue;
    if (typeof raw === 'object') continue; // 規格不允許巢狀資料，直接忽略
    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (value === '') continue;

    const type = types[key];
    if (type === 'boolean') {
      out[key] = value === true || /^(true|1|yes|是)$/i.test(String(value));
    } else if (type === 'number') {
      const n = Number(value);
      if (Number.isFinite(n)) out[key] = n;
    } else {
      out[key] = String(value);
    }
  }
  return out;
}

/**
 * 小型 CSV 解析器：支援以雙引號包住的欄位、欄位內的逗號與換行、"" 代表一個引號。
 * 回傳二維字串陣列（空白列也保留，讓「略過第幾列」的位置固定不變）。
 */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, ''); // 去掉 BOM

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * 第一列當欄位名稱，其餘列轉成物件。
 * skipRows：欄位名稱之後要略過的列數（試算表第 2 列是中文說明，設定 1）。
 */
export function csvToObjects(rows, skipRows = 0) {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1 + skipRows)
    .filter((cells) => cells.some((cell) => cell.trim() !== '')) // 去掉完全空白的列
    .map((cells) => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = cells[i] ?? ''; });
      return obj;
    });
}
