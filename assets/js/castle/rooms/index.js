// 房間清單。新增房間：寫一個定義檔，在這裡登記即可。
import hall from './hall.js';
import music from './music.js';
import guest from './guest.js';
import library from './library.js';
import observatory from './observatory.js';

export const ROOMS = { hall, music, guest, library, observatory };

/** 目前開放、會分配 NPC 的房間（依序） */
export const OPEN_ROOMS = ['hall', 'music', 'guest', 'library', 'observatory'];

export const START_ROOM = 'hall';
