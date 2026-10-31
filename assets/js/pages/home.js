import { initLayout } from '../layout.js';
import { loadSite, loadTable } from '../data.js';
import { el, showMessage, bySortOrder, dateKey, demoBadge, LOAD_ERROR } from '../render.js';
import { photoFigure, memberCard, videoCard } from '../components.js';
import { safeImageUrl } from '../validate.js';
import { PLACEHOLDERS } from '../config.js';

initLayout();

const $ = (id) => document.getElementById(id);

async function renderHero() {
  try {
    const site = await loadSite();
    const img = $('hero-image');
    img.src = safeImageUrl(site.banner_image, PLACEHOLDERS.banner);
    if (site.banner_alt) img.alt = site.banner_alt;
    if (site.guild_name) $('hero-title').textContent = site.guild_name;
    if (site.banner_quote) $('hero-quote').textContent = site.banner_quote;
    $('hero-tagline').textContent = site.tagline || '';
    $('hero-intro').replaceChildren(site.intro || '', ' ', demoBadge(site.is_demo) || '');
    $('story-summary').textContent = site.story_summary || '';
    if (site.founded_year) $('story-founded').textContent = `創立於 ${site.founded_year} 年`;
  } catch {
    $('story-summary').textContent = LOAD_ERROR;
  }
}

async function renderPhotos() {
  const box = $('featured-photos');
  try {
    const rows = await loadTable('gallery');
    const items = rows.filter((r) => r.featured)
      .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
      .slice(0, 5);
    if (!items.length) return showMessage(box, '目前還沒有精選照片。');
    box.replaceChildren(...items.map((item, i) => el('a', {
      className: 'photo-grid__item',
      attrs: { href: 'gallery.html' },
    }, [photoFigure(item, { useFull: i === 0, eager: i === 0 })])));
  } catch {
    showMessage(box, LOAD_ERROR);
  }
}

async function renderMembers() {
  const box = $('featured-members');
  try {
    const rows = await loadTable('members');
    const items = rows.filter((r) => r.featured).sort(bySortOrder).slice(0, 6);
    if (!items.length) return showMessage(box, '目前還沒有成員資料。');
    box.replaceChildren(...items.map((m) => memberCard(m, { compact: true })));
  } catch {
    showMessage(box, LOAD_ERROR);
  }
}

async function renderVideos() {
  const box = $('featured-videos');
  try {
    const rows = await loadTable('videos');
    const items = rows.filter((r) => r.featured)
      .sort((a, b) => dateKey(b.published).localeCompare(dateKey(a.published)))
      .slice(0, 3);
    if (!items.length) return showMessage(box, '目前還沒有精選影片。');
    box.replaceChildren(...items.map((v) => videoCard(v, { compact: true })));
  } catch {
    showMessage(box, LOAD_ERROR);
  }
}

renderHero();
renderPhotos();
renderMembers();
renderVideos();
