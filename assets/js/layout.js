// 共用頁首、頁尾。每頁的 HTML 只放空的 <header id="site-header"> 與 <footer id="site-footer">。
import { el } from './render.js';
import { loadSite } from './data.js';

const NAV = [
  { page: 'story', href: 'story.html', label: '故事' },
  { page: 'members', href: 'members.html', label: '成員' },
  { page: 'videos', href: 'videos.html', label: '影片' },
  { page: 'gallery', href: 'gallery.html', label: '紀念館' },
  { page: 'hall', href: 'hall.html', label: '城堡' },
];

const DEFAULTS = {
  guild_name: '第一交響樂團',
  tagline: '記錄我們一起走過的遊戲時光。',
  footer_quote: '遊戲會換季，\n但我們的故事還會繼續。',
};

export function initLayout() {
  const page = document.body.dataset.page || '';
  // member.html 屬於「成員」、doll.html（捏娃娃）屬於「城堡」
  const current = { member: 'members', doll: 'hall' }[page] || page;

  const header = document.getElementById('site-header');
  const tagline = el('p', { className: 'brand__tagline', text: DEFAULTS.tagline });
  const name = el('span', { className: 'brand__name', text: DEFAULTS.guild_name });

  if (header) {
    header.replaceChildren(
      el('div', { className: 'site-band' },
        el('p', { className: 'site-band__text', text: '不同的遊戲，相同的夥伴。' }),
      ),
      el('div', { className: 'site-header__inner' },
        el('a', { className: 'brand', href: 'index.html', 'aria-label': `${DEFAULTS.guild_name} 首頁` },
          name,
          tagline,
        ),
        el('nav', { className: 'site-nav', 'aria-label': '主要導覽' },
          el('ul', {},
            NAV.map((item) => el('li', {},
              el('a', {
                href: item.href,
                text: item.label,
                'aria-current': item.page === current ? 'page' : null,
              }),
            )),
          ),
        ),
      ),
    );
  }

  const footer = document.getElementById('site-footer');
  const quote = el('p', { className: 'site-footer__quote', text: DEFAULTS.footer_quote });
  if (footer) {
    footer.replaceChildren(
      el('div', { className: 'site-footer__inner' },
        quote,
        el('div', { className: 'site-footer__sign' },
          el('img', { src: 'assets/images/icons/lyre.svg', alt: '', width: 40, height: 40, className: 'site-footer__lyre' }),
          el('span', { className: 'site-footer__name', text: DEFAULTS.guild_name }),
        ),
        el('div', { className: 'site-footer__notes' },
          el('p', { text: '網站內容持續整理中，照片與成員介紹會陸續補上。' }),
          el('p', { text: '本站為玩家自行整理的紀念網站，與遊戲官方無關。只收錄遊戲暱稱、遊戲截圖與願意公開的影片。' }),
        ),
      ),
    );
  }

  // 有設定就用 site.json 的文字覆蓋預設值；讀取失敗就保留預設值
  loadSite().then((site) => {
    if (site.tagline) tagline.textContent = site.tagline;
    if (site.footer_quote) quote.textContent = site.footer_quote;
  }).catch(() => {});
}
