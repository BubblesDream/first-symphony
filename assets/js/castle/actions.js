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
};
