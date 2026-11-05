// 房間清單。新增房間：寫一個定義檔，在這裡登記即可。
import hall from './hall.js';
import music from './music.js';
import tavern from './tavern.js';
import training from './training.js';
import forge from './forge.js';

export const ROOMS = { hall, music, tavern, training, forge };

/** 目前開放、會分配 NPC 的房間（依序） */
export const OPEN_ROOMS = ['hall', 'music', 'tavern', 'training', 'forge'];

export const START_ROOM = 'hall';
