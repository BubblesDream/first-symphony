// 「靈感」額度：每次重新整理頁面或走進房間，就重新得到幾次（只存在記憶體，不存瀏覽器）。
// 面板裡比較「好玩」的動作（三張牌、鍛造）每次用 1 次。
import { INSPIRATION } from './config.js';

export const OUT_OF_QUOTA = '今天的靈感用完了，出去走走再回來吧！';

export function createQuota(total = INSPIRATION) {
  let left = total;
  return {
    total,
    get left() { return left; },
    /** 用 1 次；用完了回傳 false */
    use() {
      if (left <= 0) return false;
      left -= 1;
      return true;
    },
  };
}

export const quotaText = (quota) => `剩下 ${quota.left} 次靈感（走進房間會恢復 ${quota.total} 次）`;
