// 資料載入模組：全站唯一讀取資料的地方。
// 頁面只呼叫 loadTable('members') 之類的函式，不需要知道資料來自 JSON 還是 CSV。
import { TABLES, FIELD_TYPES } from './config.js';

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

  const response = await fetch(config.url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`讀取 ${name} 失敗（HTTP ${response.status}）`);

  let rows;
  if (config.source === 'csv') {
    rows = csvToObjects(parseCSV(await response.text()));
  } else {
    rows = await response.json();
  }
  if (!Array.isArray(rows)) throw new Error(`${name} 的格式不正確，應為陣列`);

  const types = FIELD_TYPES[name] || {};
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => normalizeRow(row, types));
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
 * 回傳二維字串陣列。
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
  // 去掉完全空白的列
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** 第一列當欄位名稱，其餘列轉成物件。 */
export function csvToObjects(rows) {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = cells[i] ?? ''; });
    return obj;
  });
}
