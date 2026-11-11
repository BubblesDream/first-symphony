// 公告來源：依日期由新到舊顯示最新五筆。新增來源請依 index.js 介面登記。
export function lines(scene, obj, state) {
  const lines = [];
  const items = [...(scene.ctx.updates || [])].sort((p, q) => String(q.date).localeCompare(String(p.date))).slice(0, 5);
  if (!items.length) lines.push({ text: '公告板上還沒有新消息。' });
  for (const item of items) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item.date);
    const date = match ? `${Number(match[2])}/${Number(match[3])}` : item.date;
    lines.push({ text: `【${date}】${item.text}`, is_demo: item.is_demo });
  }
  return lines;
}
