import { initLayout } from '../layout.js';
import { loadTable } from '../data.js';
import { el, image, clear, demoBadge, gameTag, formatDate, showError, statusMessage, bySortOrder, sectionHead } from '../render.js';
import { safeImageUrl, isValidId } from '../validate.js';
import { SITE_NAME } from '../config.js';

initLayout();

const main = document.getElementById('member-content');

async function render() {
  const id = new URLSearchParams(location.search).get('id') || '';
  try {
    const [members, outfits] = await Promise.all([loadTable('members'), loadTable('outfits')]);
    const member = isValidId(id) ? members.find((m) => m.id === id) : null;
    clear(main);

    if (!member) {
      document.title = `找不到成員｜${SITE_NAME}`;
      main.append(
        el('h1', { text: '找不到這位成員' }),
        statusMessage('這個連結可能已經失效，或成員資料已經調整。', { href: 'members.html', label: '回到成員列表' }),
      );
      return;
    }

    document.title = `${member.nickname}｜${SITE_NAME}`;
    const own = outfits.filter((o) => o.member_id === member.id).sort(bySortOrder);
    main.append(
      el('p', { className: 'meta' }, [el('a', { text: '← 成員列表', attrs: { href: 'members.html' } })]),
      profile(member),
      outfitSection(member, own),
    );
  } catch (error) {
    showError(main, error);
  }
}

function profile(member) {
  const details = el('dl');
  const add = (label, value) => {
    if (value) details.append(el('dt', { text: label }), el('dd', {}, [value]));
  };
  add('遊戲', gameTag(member.game));
  add('職位', member.role);
  add('加入', member.joined ? formatDate(member.joined) : '');

  return el('section', { className: 'profile', attrs: { 'aria-labelledby': 'member-name' } }, [
    el('div', { className: 'photo' }, [image(safeImageUrl(member.avatar, 'avatar'), `${member.nickname} 的頭像`, { eager: true, width: 480, height: 480 })]),
    el('div', { className: 'profile__info' }, [
      el('h1', { attrs: { id: 'member-name' }, text: member.nickname }),
      demoBadge(member.is_demo),
      details,
      member.intro ? el('div', { className: 'prose' }, [el('p', { text: member.intro })]) : null,
    ]),
  ]);
}

// 造型切換：縮圖列＋主圖。縮圖是按鈕，可用 Tab 移動、Enter／空白鍵切換，左右方向鍵也能切換。
function outfitSection(member, outfits) {
  const section = el('section', { className: 'section', attrs: { 'aria-labelledby': 'outfit-title' } }, [
    sectionHead('造型收藏', { id: 'outfit-title', eyebrow: 'OUTFITS' }),
  ]);
  if (!outfits.length) {
    section.append(statusMessage('這位成員還沒有造型圖片。'));
    return section;
  }

  const mainImage = image(safeImageUrl(outfits[0].image, 'outfit'), '', { eager: true, width: 600, height: 800 });
  const caption = el('div', { className: 'outfit-viewer__caption', attrs: { 'aria-live': 'polite' } });
  const thumbs = [];

  const select = (index, moveFocus = false) => {
    const outfit = outfits[index];
    mainImage.src = safeImageUrl(outfit.image, 'outfit');
    mainImage.alt = `${member.nickname}：${outfit.name}`;
    caption.replaceChildren(
      el('h3', { text: outfit.name }),
      el('div', { className: 'meta' }, [el('span', { text: `${index + 1} / ${outfits.length}` }), demoBadge(outfit.is_demo)]),
      outfit.note ? el('p', { className: 'pre-line', text: outfit.note }) : null,
    );
    thumbs.forEach((t, i) => t.setAttribute('aria-pressed', String(i === index)));
    if (moveFocus) thumbs[index].focus();
  };

  outfits.forEach((outfit, index) => {
    thumbs.push(el('button', {
      className: 'outfit-thumb',
      attrs: { type: 'button', 'aria-pressed': 'false' },
      on: {
        click: () => select(index),
        keydown: (event) => {
          const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
          if (!step) return;
          event.preventDefault();
          select((index + step + outfits.length) % outfits.length, true);
        },
      },
    }, [image(safeImageUrl(outfit.image, 'outfit'), '', { width: 600, height: 800 }), outfit.name]));
  });

  section.append(el('div', { className: 'outfit-viewer' }, [
    el('div', { className: 'outfit-viewer__main' }, [el('div', { className: 'photo' }, [mainImage]), caption]),
    el('div', {}, [
      el('p', { className: 'result-count', text: `共 ${outfits.length} 套造型，點選縮圖切換（也可用左右方向鍵）。` }),
      el('ul', { className: 'outfit-thumbs', attrs: { 'aria-label': '造型縮圖' } }, thumbs.map((t) => el('li', {}, [t]))),
    ]),
  ]));
  select(0);
  return section;
}

render();
