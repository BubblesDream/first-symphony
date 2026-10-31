// 共用頁首與頁尾。每頁的腳本先呼叫 initLayout()。
import { NAV_ITEMS, SITE_NAME, SITE_BAND_TEXT } from './config.js';
import { loadSite } from './data.js';
import { el, image } from './render.js';

const DEMO_NOTICE = '目前網站內容為示範資料，所有名稱、日期與事件皆為虛構，正式內容整理中；圖片皆為佔位圖。';

export function initLayout() {
  const page = document.body.dataset.page || '';
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  if (header) header.replaceWith(buildHeader(page));
  if (footer) {
    const built = buildFooter();
    footer.replaceWith(built);
    fillFooter(built);
  }
}

function buildHeader(page) {
  const nav = el('nav', { className: 'site-nav', attrs: { 'aria-label': '主選單' } }, [
    el('ul', {}, NAV_ITEMS.map((item) => el('li', {}, [
      el('a', { text: item.label, attrs: { href: item.href, 'aria-current': item.page === page ? 'page' : null } }),
    ]))),
  ]);
  return el('header', {}, [
    el('div', { className: 'site-band' }, [el('div', { className: 'container' }, [el('p', { text: SITE_BAND_TEXT })])]),
    el('div', { className: 'site-header' }, [
      el('div', { className: 'container' }, [
        el('a', { className: 'site-brand', attrs: { href: 'index.html', 'aria-current': page === 'home' ? 'page' : null } }, [
          el('span', { className: 'site-brand__name', text: SITE_NAME }),
          el('span', { className: 'site-brand__tagline', text: '記錄我們一起走過的遊戲時光。', dataset: { slot: 'tagline' } }),
        ]),
        nav,
      ]),
    ]),
  ]);
}

function buildFooter() {
  return el('footer', { className: 'site-footer' }, [
    el('div', { className: 'container' }, [
      el('p', { className: 'site-footer__phrase', dataset: { slot: 'phrase' } }),
      el('div', { className: 'site-footer__sign' }, [
        el('span', { dataset: { slot: 'since' }, text: SITE_NAME }),
        image('assets/images/lyre.svg', '', { width: 28, height: 28, eager: true }),
      ]),
      el('p', { className: 'site-footer__notice', dataset: { slot: 'notice' }, text: DEMO_NOTICE }),
    ]),
  ]);
}

async function fillFooter(footer) {
  try {
    const site = await loadSite();
    const slot = (name) => document.querySelectorAll(`[data-slot="${name}"]`);
    if (site.tagline) slot('tagline').forEach((n) => { n.textContent = site.tagline; });
    footer.querySelector('[data-slot="phrase"]').textContent = site.footer_phrase || '';
    if (site.founded_year) footer.querySelector('[data-slot="since"]').textContent = `${site.guild_name || SITE_NAME}・Since ${site.founded_year}`;
    footer.querySelector('[data-slot="notice"]').textContent = site.is_demo
      ? DEMO_NOTICE
      : '本站僅收錄遊戲暱稱、遊戲截圖與成員同意公開的影片。';
  } catch (error) {
    console.error(error);
  }
}
