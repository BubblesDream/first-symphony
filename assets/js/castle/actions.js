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
  // 後續：shear_sheep、spin_wool、hammer、hit_dummy、shoot_arrow、sleep_bed…
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
  craft:       { pose: 'work',    seated: false, bubbles: ['嗯…', '快好了', '…'], duration: [8, 16] },
  sharpen:     { pose: 'work',    seated: false, bubbles: ['唰—唰—', '…'], duration: [6, 12] },
};
