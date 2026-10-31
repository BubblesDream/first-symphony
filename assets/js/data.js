// 資料載入模組：全站唯一讀取資料的地方。
// 頁面只呼叫 loadTable('members') 或 loadSite()，不需要知道資料來自 JSON 還是 CSV。
import { DATA_SOURCES, TABLE_FIELDS } from './config.js';

const cache = new Map();

export function loadTable(name) {
  if (!cache.has(name)) {
    cache.set(name, fetchTable(name).catch((error) => {
      cache.delete(name); // 失敗時不要快取，下次可以重試
      throw error;
    }));
  }
  return cache.get(name);
}

// site 表是 key/value 兩欄，轉成一個物件方便使用。
export async function loadSite() {
  const rows = await loadTable('site');
  const site = {};
  for (const row of rows) {
    if (row.key) site[row.key] = row.value ?? '';
  }
  site.is_demo = toBoolean(site.is_demo) === true;
  return site;
}

async function fetchTable(name) {
  const source = DATA_SOURCES[name];
  if (!source) throw new Error(`沒有設定資料表：${name}`);

  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`讀取 ${name} 失敗（HTTP ${response.status}）`);

  let rows;
  if (source.type === 'csv') {
    rows = csvToObjects(parseCSV(await response.text()));
  } else {
    rows = await response.json();
  }
  if (!Array.isArray(rows)) throw new Error(`資料表 ${name} 的格式應該是陣列`);

  const fields = TABLE_FIELDS[name] || { boolean: [], number: [] };
  return rows
    .filter((row) => row && typeof row === 'object' && !Array.isArray(row))
    .map((row) => normalizeRow(row, fields));
}

// 統一型別：空字串視為未填（null）、布林與數字欄位轉型、巢狀值直接丟掉。
function normalizeRow(row, fields) {
  const result = {};
  for (const [key, raw] of Object.entries(row)) {
    if (raw !== null && typeof raw === 'object') {
      console.warn(`欄位 ${key} 是巢狀資料，已忽略。`);
      continue;
    }
    let value = typeof raw === 'string' ? raw.trim() : raw;
    if (value === '' || value === undefined) value = null;

    if (fields.boolean.includes(key)) value = toBoolean(value) === true;
    else if (fields.number.includes(key)) value = toNumber(value);

    result[key] = value;
  }
  for (const key of fields.boolean) if (!(key in result)) result[key] = false;
  return result;
}

export function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', '是'].includes(text)) return true;
  if (['false', '0', 'no', 'n', '否', ''].includes(text)) return false;
  return null;
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// 小型 CSV 解析器：支援雙引號包住的欄位、欄位內的逗號與換行，以及 "" 代表一個引號。
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const input = text.replace(/^﻿/, '');

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field); field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(field); rows.push(row);
      row = []; field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

// 第一列當欄位名稱，其餘轉成物件。
export function csvToObjects(rows) {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const object = {};
    headers.forEach((header, index) => {
      if (header) object[header] = cells[index] ?? '';
    });
    return object;
  });
}
