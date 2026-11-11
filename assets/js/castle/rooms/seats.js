// 房間定義用的小工具：一排座位。
// row(3, 9, 8, 'up') ＝ x 從 3 到 9、y＝8、都面向上的 7 個座位。
export const row = (fromX, toX, y, facing) =>
  Array.from({ length: toX - fromX + 1 }, (_, i) => ({ x: fromX + i, y, facing }));
