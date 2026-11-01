import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el, img, clear, formatDate, queryParam } from '../render.js';
import { tapeTitle, gameTag, demoBadge, errorBox, polaroid, pendingNote } from '../ui.js';
import { PLACEHOLDERS, safeImageUrl } from '../validate.js';

initLayout();

const root = document.getElementById('member');

function notFound() {
  document.title = '找不到成員｜第一交響樂團';
  return el('div', { className: 'card empty-state' },
    el('h1', { className: 'page-title', text: '找不到這位成員' }),
    el('p', { text: '網址可能打錯了，或這位成員的資料已經移除。' }),
    el('a', { className: 'btn', href: 'members.html', text: '回到成員列表' }),
  );
}

/** 造型切換：縮圖列＋主圖。縮圖可用滑鼠、Tab、左右方向鍵操作。 */
function outfitViewer(member, outfits) {
  if (outfits.length === 0) {
    return pendingNote('造型照片整理中，敬請期待。');
  }
  const mainImg = img(outfits[0].image, '', { fallback: PLACEHOLDERS.outfit, lazy: false });
  const caption = el('figcaption', { 'aria-live': 'polite' });
  const main = el('figure', { className: 'polaroid outfit-viewer__main has-tape' }, mainImg, caption);
  const buttons = [];

  const select = (index, focus = false) => {
    const o = outfits[index];
    mainImg.src = safeImageUrl(o.image, PLACEHOLDERS.outfit);
    mainImg.alt = `${member.nickname || ''}的造型：${o.name || ''}`;
    caption.replaceChildren(el('span', { className: 'outfit-viewer__name', text: o.name || '' }));
    if (o.note) caption.append(el('span', { className: 'outfit-viewer__note', text: o.note }));
    buttons.forEach((b, i) => {
      b.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      b.tabIndex = i === index ? 0 : -1;
    });
    if (focus) buttons[index].focus();
  };

  const thumbs = el('ul', { className: 'outfit-viewer__thumbs', 'aria-label': '造型縮圖（可用左右方向鍵切換）' },
    outfits.map((o, i) => {
      const b = el('button', {
        type: 'button',
        className: 'outfit-thumb',
        'aria-label': `造型：${o.name || i + 1}`,
        on: {
          click: () => select(i),
          keydown: (e) => {
            let next = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % outfits.length;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + outfits.length) % outfits.length;
            if (e.key === 'Home') next = 0;
            if (e.key === 'End') next = outfits.length - 1;
            if (next !== null) { e.preventDefault(); select(next, true); }
          },
        },
      }, img(o.image, '', { fallback: PLACEHOLDERS.outfit }));
      buttons.push(b);
      return el('li', {}, b);
    }),
  );

  select(0);
  return el('div', { className: 'outfit-viewer' }, main, thumbs);
}

async function main() {
  try {
    const id = queryParam('id');
    const [members, outfits] = await Promise.all([loadTable('members'), loadTable('outfits')]);
    const member = members.find((m) => m.id === id);
    if (!member) {
      clear(root).append(notFound());
      return;
    }

    document.title = `${member.nickname || '成員'}｜第一交響樂團`;
    const mine = outfits
      .filter((o) => o.member_id === member.id)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

    const info = el('dl', { className: 'profile__facts' },
      el('div', {}, el('dt', { text: '遊戲' }), el('dd', {}, gameTag(member.game))),
      member.aka ? el('div', {}, el('dt', { text: '別名' }), el('dd', { text: member.aka })) : null,
      member.role ? el('div', {}, el('dt', { text: '職位' }), el('dd', { text: member.role })) : null,
      member.joined ? el('div', {}, el('dt', { text: '加入' }), el('dd', { text: formatDate(member.joined) })) : null,
    );

    const outfitsTitle = tapeTitle('造型收藏');
    outfitsTitle.id = 'outfits-title';

    clear(root).append(
      el('p', { className: 'breadcrumb' }, el('a', { href: 'members.html', text: '← 成員列表' })),
      el('div', { className: 'member-detail' },
        el('section', { className: 'profile card', 'aria-labelledby': 'member-name' },
          polaroid({ src: member.avatar, alt: `${member.nickname || '成員'}的頭像`, fallback: PLACEHOLDERS.avatar, tilt: 'tilt-a', className: 'profile__avatar' }),
          el('div', { className: 'profile__body' },
            el('h1', { className: 'profile__name', id: 'member-name', text: member.nickname || '（未命名）' }),
            demoBadge(member),
            info,
            member.intro ? el('p', { className: 'prose pre-line', text: member.intro }) : pendingNote('自我介紹整理中。'),
          ),
        ),
        el('section', { className: 'outfits', 'aria-labelledby': 'outfits-title' },
          outfitsTitle,
          outfitViewer(member, mine),
        ),
      ),
    );
  } catch (error) {
    console.warn(error);
    clear(root).append(errorBox());
  }
}

main();
