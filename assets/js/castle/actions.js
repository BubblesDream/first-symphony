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
  // 2F／3F
  sleep_bed:      { pose: 'sleep', seated: true, bubbles: ['Zzz…', 'zz…', '…'], duration: [16, 30] },
  sit_bed:        { pose: 'idle',  seated: true, bubbles: ['呼～', '…', '今天好累'], duration: [10, 20] },
  write_desk:     { pose: 'read',  seated: true, bubbles: ['…', '嗯…', '寫好了'], duration: [12, 22] },
  look_window:    { pose: 'idle',  seated: false, bubbles: ['…', '天氣真好'], duration: [6, 12] },
  read_book:      { pose: 'read',  seated: true, bubbles: ['…', '原來如此', '？'], duration: [14, 26] },
  tidy_shelf:     { pose: 'read',  seated: false, bubbles: ['這本放這裡', '…', '咦？'], duration: [6, 12] },
  view_history:   { pose: 'idle',  seated: false, bubbles: ['好懷念', '…', '！'], duration: [6, 12] },
  spin_globe:     { pose: 'idle',  seated: false, bubbles: ['轉～', '在這裡！'], duration: [4, 8] },
  look_telescope: { pose: 'idle',  seated: false, bubbles: ['☆', '看到了！', '…'], duration: [10, 20] },
  read_starmap:   { pose: 'read',  seated: true, bubbles: ['…', '這顆星是…'], duration: [10, 20] },
  stargaze:       { pose: 'idle',  seated: true, bubbles: ['☆', '…', '好美'], duration: [12, 24] },
  // 後續：hammer、hit_dummy、shoot_arrow…
  // 1F：酒館／練習室／鍛造工坊
  drink:       { pose: 'idle',    seated: true, bubbles: ['咕嘟', '好喝！', '再來一杯'], duration: [10, 20] },
  cheers:      { pose: 'cheer',   seated: true, bubbles: ['乾杯！', '哈哈哈', '敬大家！'], duration: [10, 20] },
  serve_drink: { pose: 'work',    seated: false, bubbles: ['來了～', '請慢用', '…'], duration: [8, 16] },
  warm_hands:  { pose: 'idle',    seated: false, bubbles: ['好暖…', '呼～'], duration: [6, 12] },
  hit_dummy:   { pose: 'work',    seated: false, bubbles: ['喝！', '哈！', '再一下！'], duration: [8, 16] },
  shoot_arrow: { pose: 'play',    seated: false, bubbles: ['咻—', '中了！', '差一點…'], duration: [8, 16] },
  pick_weapon: { pose: 'idle',    seated: false, bubbles: ['用哪把好呢', '嗯…'], duration: [4, 8] },
  sit_rest:    { pose: 'idle',    seated: true, bubbles: ['呼…', '累了', '…'], duration: [8, 16] },
  hammer:      { pose: 'work',    seated: false, bubbles: ['鏗！', '鏗鏗！', '…'], duration: [10, 20] },
  stoke_fire:  { pose: 'idle',    seated: false, bubbles: ['好熱…', '火要再大一點'], duration: [6, 12] },
  sharpen:     { pose: 'work',    seated: false, bubbles: ['唰—唰—', '…'], duration: [6, 12] },
};
