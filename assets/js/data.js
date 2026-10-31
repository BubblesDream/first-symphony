// 資料載入模組：全站唯一讀取資料的地方。
// 頁面只呼叫 loadTable('members') 或 loadSite()，不需要知道資料來自 JSON 還是 CSV。

import { TABLES, BOOLEAN_FIELDS, NUMBER_FIELDS } from './config.js';

const cache = new Map();

/** 小型 CSV 解析器：處理雙引號、逗號、換行與 "" 跳脫。回傳二維陣列。 */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
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

/** 把 CSV 轉成物件陣列，第一列是欄位名稱。 */
export function csvToObjects(text) {
  const [header, ...rows] = parseCSV(text);
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return rows.map((cells) => {
    const obj = {};
    keys.forEach((key, index) => {
      if (key) obj[key] = cells[index] ?? '';
    });
    return obj;
  });
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return /^(true|yes|y|1)$/i.test(value.trim());
  return false;
}

/** 型別轉換：布林欄位、數字欄位、空字串 → undefined。巢狀值一律丟棄。 */
export function normalizeRow(row) {
  const result = {};
  Object.entries(row).forEach(([key, raw]) => {
    if (raw === null || typeof raw === 'object') return;
    let value = typeof raw === 'string' ? raw.trim() : raw;
    if (BOOLEAN_FIELDS.includes(key)) {
      result[key] = toBoolean(value);
      return;
    }
    if (value === '') return;
    if (NUMBER_FIELDS.includes(key)) {
      const num = Number(value);
      if (Number.isFinite(num)) result[key] = num;
      return;
    }
    result[key] = typeof value === 'number' ? String(value) : value;
  });
  return result;
}

async function fetchTable(config) {
  const response = await fetch(config.url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`讀取失敗（${response.status}）`);
  const rows = config.source === 'csv'
    ? csvToObjects(await response.text())
    : await response.json();
  if (!Array.isArray(rows)) throw new Error('資料格式不正確');
  return rows.filter((r) => r && typeof r === 'object' && !Array.isArray(r)).map(normalizeRow);
}

/** 讀取一張資料表，回傳物件陣列。 */
export function loadTable(name) {
  if (cache.has(name)) return cache.get(name);
  const config = TABLES[name];
  if (!config) return Promise.reject(new Error(`未知的資料表：${name}`));
  const promise = fetchTable(config);
  cache.set(name, promise);
  promise.catch(() => cache.delete(name));
  return promise;
}

/** 讀取 site 表，轉成 { key: value } 物件。 */
export async function loadSite() {
  const rows = await loadTable('site');
  const site = {};
  rows.forEach((row) => {
    if (row.key) site[row.key] = row.value;
  });
  return site;
}
