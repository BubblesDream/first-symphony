// 新增可坐家具：在 objects 放一筆，例如
// { x: 3, y: 5, name: '小桌', text: ['坐一下吧。'], demo: true,
//   play: 'sit_chat', seats: [{ x: 2, y: 5, facing: 'right' }],
//   group: { name: '聊天', min: 2, every: [30, 60], duration: [14, 22], bubbles: ['嗨！'] } }
// seats 的 action 預設沿用 play，可逐席覆寫。group 沿用 seats，不重寫座標。
// 沒有家具的演出點與舊房間仍可使用頂層 spots、groups。
// 房間清單。新增房間：寫一個定義檔，在這裡登記即可。
import hall from './hall.js';
import music from './music.js';
import tavern from './tavern.js';
import training from './training.js';
import forge from './forge.js';
import courtyard from './courtyard.js';
import guest from './guest.js';
import library from './library.js';
import observatory from './observatory.js';

export function normalizeRoom(room) {
  const spots = [...(room.spots || [])];
  const groups = [...(room.groups || [])];
  for (const object of room.objects || []) {
    for (const seat of object.seats || []) spots.push({ ...seat, action: seat.action ?? object.play, object });
    if (object.group) groups.push({ ...object.group, spots: (object.seats || []).map(({ x, y }) => [x, y]) });
  }
  return { ...room, spots, groups };
}

export const ROOMS = Object.fromEntries(Object.entries({ hall, music, tavern, training, forge, courtyard, guest, library, observatory })
  .map(([id, room]) => [id, normalizeRoom(room)]));

/** 目前開放、會分配 NPC 的房間（依序） */
export const OPEN_ROOMS = ['hall', 'music', 'tavern', 'training', 'forge', 'courtyard', 'guest', 'library', 'observatory'];

export const START_ROOM = 'hall';
