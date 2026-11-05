// 抽選成員、分配房間、整理外觀與台詞。只處理資料，不碰畫面。
import { hashString } from './rng.js';
import { isColor } from '../validate.js';

const SKINS = ['#f3d6bd', '#eac4a0', '#d9a77f', '#f6e0cc', '#c98f68'];
const HAIRS = ['#2e2420', '#5b3a29', '#8a5a36', '#c9a46a', '#e8d9b5', '#7a2f2f', '#3b4a6b', '#c7c7d1', '#d7839b', '#4f6b45'];
const OUTFITS = ['#3d5a99', '#8c3b3b', '#4f7a4a', '#7a5a9c', '#c08a2e', '#2f6f73', '#a35d7a', '#5c5c5c', '#b5603a', '#3f3f6e'];
const MARKS = ['none', 'none', 'none', 'hat', 'ribbon', 'glasses', 'cape'];
const VALID_MARKS = new Set(['none', 'hat', 'ribbon', 'glasses', 'cape']);

/** 沒有填外觀的成員：依 id 產生固定的顏色組合 */
export function autoLook(id) {
  const h = hashString(id);
  return {
    skin: SKINS[h % SKINS.length],
    hair: HAIRS[(h >>> 4) % HAIRS.length],
    outfit: OUTFITS[(h >>> 9) % OUTFITS.length],
    accent: OUTFITS[(h >>> 14) % OUTFITS.length],
    mark: MARKS[(h >>> 19) % MARKS.length],
  };
}

// 問卷的配件（中文）→ 目前色塊小人的記號
const ACCESSORY_MARK = { 無: 'none', 帽子: 'hat', 蝴蝶結: 'ribbon', 眼鏡: 'glasses', 披風: 'cape', 髮箍: 'none' };

// 問卷「最喜歡待的房間」→ 房間 id
export const FAVORITE_ROOM = {
  大廳: 'hall', 演奏室: 'music', 酒館: 'tavern', 交流廳: 'tavern', 練習室: 'training', 鍛造工坊: 'forge',
  外庭: 'courtyard', 客房: 'guest', 圖書館: 'library', 觀星台: 'observatory',
};
const FAVORITE_CHANCE = 0.6; // 有填喜歡的房間時，分到那裡的機率

/**
 * 資料表的外觀＋自動外觀合併；格式不對的欄位改用自動值。
 * 欄位見 docs/問卷-城堡成員外觀.md（top＝上衣色、bottom＝下身色、accessory＝配件）；
 * 舊欄位 outfit、mark 仍可用。其餘款式欄位（hair_style 等）留給之後的圖片小人。
 */
export function resolveLook(id, row) {
  const look = autoLook(id);
  if (!row) return look;
  for (const k of ['skin', 'hair', 'outfit', 'accent', 'bottom', 'shoes']) {
    if (isColor(row[k])) look[k] = row[k];
  }
  if (isColor(row.top)) look.outfit = row.top;
  if (['長袍', '洋裝'].includes(row.top_style)) look.bottom = look.outfit; // 連身：下身和上衣同色
  const mark = ACCESSORY_MARK[row.accessory] || row.mark;
  if (VALID_MARKS.has(mark)) look.mark = mark;
  return look;
}

/**
 * 抽選並分配房間。
 * rooms：[{ id, capacity }]（只放開放中的房間）
 * 回傳 { [roomId]: [npc資料…] }，npc資料＝{ id, nickname, role, look }
 */
export function drawRoster({ members, looks, rooms, rng, max }) {
  const lookById = new Map(looks.map((row) => [row.member_id, row]));
  const totalCap = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const picked = rng.shuffle(members.filter((m) => m.id && m.nickname))
    .slice(0, Math.min(max, totalCap));

  const result = Object.fromEntries(rooms.map((r) => [r.id, []]));
  const left = Object.fromEntries(rooms.map((r) => [r.id, r.capacity]));

  picked.forEach((m, i) => {
    let roomId;
    const favorite = FAVORITE_ROOM[lookById.get(m.id)?.favorite_room];
    if (favorite && left[favorite] > 0 && rng.next() < FAVORITE_CHANCE) {
      roomId = favorite; // 比較常出現在喜歡的房間
    } else if (i < rooms.length && left[rooms[i].id] > 0) {
      roomId = rooms[i].id; // 先讓每個房間至少有 1 人
    } else {
      // 依剩餘容量比例隨機
      const total = rooms.reduce((sum, r) => sum + left[r.id], 0);
      let roll = rng.next() * total;
      roomId = rooms.find((r) => (roll -= left[r.id]) < 0)?.id || rooms.find((r) => left[r.id] > 0).id;
    }
    left[roomId] -= 1;
    result[roomId].push({
      id: m.id,
      nickname: m.nickname,
      role: m.role || '',
      look: resolveLook(m.id, lookById.get(m.id)),
    });
  });
  return result;
}

/**
 * 挑 1～3 句台詞：先挑本人的（本房間或不限房間），不夠再補通用台詞。
 * 回傳 [{ text, is_demo }]
 */
export function pickLines(lines, memberId, roomId, rng) {
  const fits = (row) => row.text && (!row.room || row.room === roomId);
  const own = rng.shuffle(lines.filter((row) => row.member_id === memberId && fits(row)));
  const common = rng.shuffle(lines.filter((row) => !row.member_id && fits(row)));
  const count = rng.int(1, 3);
  const out = [...own, ...common].slice(0, count);
  return out.length ? out : [{ text: '……（微笑）', is_demo: false }];
}
