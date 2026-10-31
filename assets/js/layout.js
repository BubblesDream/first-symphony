// 共用頁首與頁尾。各頁 HTML 只放 <header id="site-header"> 與 <footer id="site-footer"> 空殼。

import { el } from './render.js';
import { SITE_NAME } from './config.js';

const NAV = [
  { page: 'story', href: 'story.html', label: '故事' },
  { page: 'members', href: 'members.html', label: '成員' },
  { page: 'videos', href: 'videos.html', label: '影片' },
  { page: 'gallery', href: 'gallery.html', label: '紀念館' },
  { page: 'hall', href: 'hall.html', label: '大廳' },
];

function buildHeader(current) {
  const links = NAV.map((item) => el('li', {}, [
    el('a', {
      text: item.label,
      attrs: { href: item.href, 'aria-current': item.page === current ? 'page' : null },
    }),
  ]));
  return [
    el('a', { className: 'skip-link', text: '跳到主要內容', attrs: { href: '#main' } }),
    el('div', { className: 'topbar' }, [
      el('p', { className: 'topbar__text', text: '不同的遊戲，相同的夥伴。' }),
    ]),
    el('div', { className: 'masthead container' }, [
      el('a', { className: 'brand', attrs: { href: 'index.html' } }, [
        el('span', { className: 'brand__name', text: SITE_NAME }),
        el('span', { className: 'brand__sub', text: '公會紀念相簿' }),
      ]),
      el('nav', { className: 'site-nav', attrs: { 'aria-label': '主要導覽' } }, [
        el('ul', {}, links),
      ]),
    ]),
  ];
}

function buildFooter() {
  return [
    el('div', { className: 'footer container' }, [
      el('p', { className: 'footer__line tape tape--soft', text: '遊戲會有結束的一天，但我們的故事會繼續下去。' }),
      el('div', { className: 'footer__brand' }, [
        el('img', { className: 'footer__lyre', attrs: { src: 'assets/images/lyre.svg', alt: '', width: 32, height: 37 } }),
        el('span', { text: SITE_NAME }),
      ]),
      el('p', { className: 'footer__note', text: '目前網站內容為示範資料，所有名稱、日期與事件皆為虛構，之後會換成公會的真實回憶。' }),
      el('p', { className: 'footer__note', text: '本站為玩家自製的紀念網站，與遊戲官方無關。' }),
    ]),
  ];
}

export function initLayout() {
  const current = document.body.dataset.page || '';
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  if (header) header.replaceChildren(...buildHeader(current));
  if (footer) footer.replaceChildren(...buildFooter());
}
