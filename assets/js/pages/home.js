import { initLayout } from '../layout.js';
import { loadSite, loadTable } from '../data.js';
import { el, image, clear, demoBadge, showError, sectionHead, bySortOrder, compareDate, statusMessage } from '../render.js';
import { safeImageUrl } from '../validate.js';
import { memberCard, videoCard } from '../cards.js';

initLayout();

const main = document.getElementById('home-content');

async function render() {
  try {
    const [site, members, gallery, videos] = await Promise.all([
      loadSite(), loadTable('members'), loadTable('gallery'), loadTable('videos'),
    ]);
    clear(main);
    main.append(
      heroSection(site),
      storySection(site, gallery),
      gallerySection(gallery),
      membersSection(members),
      videosSection(videos),
    );
  } catch (error) {
    showError(main, error);
  }
}

function heroSection(site) {
  return el('section', { className: 'hero', attrs: { 'aria-label': '公會介紹' } }, [
    el('div', { className: 'hero__image photo' }, [
      image(safeImageUrl(site.banner_image, 'banner'), site.banner_alt || '公會合照', { eager: true, width: 1600, height: 600 }),
      site.banner_quote ? el('p', { className: 'hero__quote', text: site.banner_quote }) : null,
    ]),
    el('div', { className: 'hero__intro' }, [
      el('p', { className: 'pre-line' }, [site.intro || '', ' ', demoBadge(site.is_demo)]),
    ]),
  ]);
}

function storySection(site, gallery) {
  const cover = gallery.find((g) => g.category === '合照') || gallery[0];
  return el('section', { className: 'section', attrs: { 'aria-labelledby': 'home-story' } }, [
    sectionHead('我們的故事', { id: 'home-story', eyebrow: 'OUR STORY' }),
    el('div', { className: 'feature' }, [
      el('div', { className: 'feature__text' }, [
        el('p', { className: 'pre-line', text: site.story_summary || '' }),
        el('p', {}, [demoBadge(site.is_demo)]),
        el('a', { className: 'button-link', text: '閱讀完整故事', attrs: { href: 'story.html' } }),
      ]),
      cover ? el('div', { className: 'photo' }, [image(safeImageUrl(cover.image, 'photo'), cover.title, { width: 800, height: 600 })]) : null,
    ]),
  ]);
}

function gallerySection(gallery) {
  const picks = gallery.filter((g) => g.featured).sort((a, b) => compareDate(b.date, a.date)).slice(0, 6);
  const list = picks.length
    ? el('div', { className: 'photo-grid' }, picks.map((photo) => el('figure', { className: 'card' }, [
      el('a', { className: 'card__link', attrs: { href: `gallery.html#${encodeURIComponent(photo.id)}` } }, [
        el('div', { className: 'photo' }, [image(safeImageUrl(photo.thumb || photo.image, 'photo'), photo.title, { width: 800, height: 600 })]),
      ]),
      el('figcaption', { className: 'meta' }, [el('span', { text: photo.title }), demoBadge(photo.is_demo)]),
    ])))
    : statusMessage('目前還沒有精選照片。');
  return el('section', { className: 'section', attrs: { 'aria-labelledby': 'home-gallery' } }, [
    sectionHead('精選回憶', { id: 'home-gallery', eyebrow: 'MEMORIES', more: { href: 'gallery.html', label: '查看紀念館' } }),
    list,
  ]);
}

function membersSection(members) {
  const picks = members.filter((m) => m.featured).sort(bySortOrder).slice(0, 6);
  return el('section', { className: 'section', attrs: { 'aria-labelledby': 'home-members' } }, [
    sectionHead('公會成員', { id: 'home-members', eyebrow: 'MEMBERS', more: { href: 'members.html', label: '查看全部成員' } }),
    picks.length ? el('div', { className: 'grid' }, picks.map(memberCard)) : statusMessage('目前還沒有成員資料。'),
  ]);
}

function videosSection(videos) {
  const picks = videos.filter((v) => v.featured).sort((a, b) => compareDate(b.published, a.published))
    .map(videoCard).filter(Boolean).slice(0, 3);
  return el('section', { className: 'section', attrs: { 'aria-labelledby': 'home-videos' } }, [
    sectionHead('精選影片', { id: 'home-videos', eyebrow: 'VIDEOS', more: { href: 'videos.html', label: '查看全部影片' } }),
    picks.length ? el('div', { className: 'grid grid--wide' }, picks) : statusMessage('目前還沒有精選影片。'),
  ]);
}

render();
