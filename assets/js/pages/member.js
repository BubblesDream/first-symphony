import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el, image, gameTag, demoBadge, formatDate, bySortOrder, showMessage, LOAD_ERROR } from '../render.js';
import { isValidId, safeImageUrl } from '../validate.js';
import { PLACEHOLDERS, SITE_NAME } from '../config.js';

initLayout();

const root = document.getElementById('member-detail');
const BACK = { text: '回到成員列表', href: 'members.html' };

function outfitViewer(member, outfits) {
  if (!outfits.length) {
    return el('p', { className: 'muted', text: '這位成員還沒有造型收藏。' });
  }
  const mainImg = image(outfits[0].image, '', PLACEHOLDERS.outfit, { width: 600, height: 800, eager: true });
  const caption = el('figcaption', { className: 'outfit__caption', attrs: { 'aria-live': 'polite' } });
  const thumbs = [];

  const select = (index, focus) => {
    const outfit = outfits[index];
    mainImg.src = safeImageUrl(outfit.image, PLACEHOLDERS.outfit);
    mainImg.alt = `${member.nickname} 的造型：${outfit.name}`;
    caption.replaceChildren(
      el('span', { className: 'outfit__name', text: outfit.name }),
      outfit.note ? el('span', { className: 'outfit__note', text: outfit.note }) : '',
    );
    thumbs.forEach((btn, i) => {
      btn.setAttribute('aria-pressed', String(i === index));
      btn.tabIndex = i === index ? 0 : -1;
    });
    if (focus) thumbs[index].focus();
  };

  outfits.forEach((outfit, index) => {
    const btn = el('button', {
      className: 'outfit__thumb',
      attrs: { type: 'button', 'aria-label': `切換造型：${outfit.name}` },
    }, [image(outfit.image, '', PLACEHOLDERS.outfit, { width: 600, height: 800 })]);
    btn.addEventListener('click', () => select(index, false));
    btn.addEventListener('keydown', (event) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (event.key in keys) {
        event.preventDefault();
        select((index + keys[event.key] + outfits.length) % outfits.length, true);
      } else if (event.key === 'Home') {
        event.preventDefault();
        select(0, true);
      } else if (event.key === 'End') {
        event.preventDefault();
        select(outfits.length - 1, true);
      }
    });
    thumbs.push(btn);
  });

  const viewer = el('div', { className: 'outfit' }, [
    el('figure', { className: 'outfit__main polaroid' }, [el('div', { className: 'polaroid__frame' }, [mainImg]), caption]),
    el('div', { className: 'outfit__thumbs', attrs: { role: 'group', 'aria-label': '造型縮圖（可用方向鍵切換）' } }, thumbs),
  ]);
  select(0, false);
  return viewer;
}

async function init() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!isValidId(id)) {
    showMessage(root, '找不到這位成員，可能是網址有誤。', BACK);
    return;
  }
  try {
    const [members, outfits] = await Promise.all([loadTable('members'), loadTable('outfits')]);
    const member = members.find((m) => m.id === id);
    if (!member) {
      showMessage(root, '找不到這位成員，可能已經改名或網址有誤。', BACK);
      return;
    }
    document.title = `${member.nickname}｜成員｜${SITE_NAME}`;
    const own = outfits.filter((o) => o.member_id === member.id).sort(bySortOrder);
    const facts = el('dl', { className: 'facts' }, [
      member.role ? el('div', {}, [el('dt', { text: '職位' }), el('dd', { text: member.role })]) : null,
      el('div', {}, [el('dt', { text: '遊戲' }), el('dd', {}, [gameTag(member.game)])]),
      member.joined ? el('div', {}, [el('dt', { text: '加入' }), el('dd', { text: formatDate(member.joined) })]) : null,
    ]);
    root.replaceChildren(
      el('p', { className: 'breadcrumb' }, [el('a', { text: '← 成員列表', attrs: { href: 'members.html' } })]),
      el('div', { className: 'profile' }, [
        el('figure', { className: 'polaroid profile__avatar' }, [
          el('div', { className: 'polaroid__frame' }, [
            image(member.avatar, `${member.nickname} 的頭像`, PLACEHOLDERS.avatar, { width: 600, height: 600, eager: true }),
          ]),
        ]),
        el('div', { className: 'profile__text' }, [
          el('h1', { className: 'page-title', text: member.nickname }),
          el('p', {}, [demoBadge(member.is_demo)]),
          facts,
          el('p', { className: 'prose-text', text: member.intro || '' }),
        ]),
      ]),
      el('section', { className: 'section', attrs: { 'aria-labelledby': 'outfit-title' } }, [
        el('div', { className: 'section__head' }, [
          el('h2', { className: 'section__title', text: '造型收藏', attrs: { id: 'outfit-title' } }),
        ]),
        outfitViewer(member, own),
      ]),
    );
  } catch {
    showMessage(root, LOAD_ERROR, BACK);
  }
}

init();
