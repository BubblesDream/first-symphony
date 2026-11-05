// 演出動作表。每個演出點指定一個動作；新增生活動作＝在這裡加一行。
//   pose：     外觀要擺的姿勢（見 avatar.js）
//   seated：   是否坐著
//   bubbles：  演出時偶爾冒出的泡泡文字
//   duration： 停留秒數範圍

export const ACTIONS = {
  sit_chat:    { pose: 'idle',    seated: true, bubbles: ['…', '哈哈', '嗯嗯', '真的嗎？'], duration: [10, 20] },
  sit_watch:   { pose: 'idle',    seated: true, bubbles: ['♪', '好聽', '…'], duration: [12, 24] },
  read_notice: { pose: 'read',    seated: false, bubbles: ['？', '！', '喔～'], duration: [4, 8] },
  stand_guard: { pose: 'idle',    seated: false, bubbles: ['…'], duration: [8, 16] },
  play_piano:  { pose: 'play',    seated: true, instrument: 'piano', bubbles: ['♪', '♫', '♬'], duration: [14, 26] },
  play_violin: { pose: 'play',    seated: true, instrument: 'violin', bubbles: ['♪', '♫'], duration: [14, 26] },
  play_flute:  { pose: 'play',    seated: true, instrument: 'flute', bubbles: ['♪', '♬'], duration: [14, 26] },
  play_harp:   { pose: 'play',    seated: true, instrument: 'harp', bubbles: ['♫', '♪'], duration: [14, 26] },
  conduct:     { pose: 'conduct', seated: false, bubbles: ['1、2、3…', '♪'], duration: [12, 22] },
  // 外庭
  shear_sheep:  { pose: 'work',  seated: false, bubbles: ['咩～', '好蓬鬆', '乖乖別動'], duration: [10, 18] },
  spin_wool:    { pose: 'play',  seated: true, bubbles: ['喀啦喀啦', '…', '毛線＋1'], duration: [14, 24] },
  craft:        { pose: 'work',  seated: false, bubbles: ['叮叮', '快好了', '嗯…'], duration: [10, 20] },
  draw_water:   { pose: 'work',  seated: false, bubbles: ['嘿咻', '好重', '水好冰'], duration: [6, 12] },
  water_plants: { pose: 'work',  seated: false, bubbles: ['長大吧～', '♪', '開花了'], duration: [8, 14] },
  sit_fountain: { pose: 'idle',  seated: true, bubbles: ['…', '好涼', '天氣真好'], duration: [12, 22] },
  // 後續：hammer、hit_dummy、shoot_arrow、sleep_bed…
};
