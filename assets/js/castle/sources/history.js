// 公會歷史來源：依日期由舊到新顯示。新增來源請依 index.js 介面登記。
export function lines(scene, obj, state) {
  const lines = [];
  const items = scene.ctx.history || [];
  if (!items.length) lines.push({ text: '展示櫃裡還是空的，公會歷史整理中。' });
  for (const item of [...items].sort((p, q) => String(p.date).localeCompare(String(q.date)))) {
    const body = String(item.body || '').split(/\n/).map((s) => s.trim()).filter(Boolean).join(' ');
    lines.push({ text: `【${item.date}】${item.title}${body ? `｜${body}` : ''}`, is_demo: item.is_demo });
  }
  return lines;
}
