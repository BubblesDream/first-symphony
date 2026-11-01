import { initLayout } from '../layout.js';
import { loadSite, loadTable } from '../data.js';
import { el, img, clear, dateKey, formatDate } from '../render.js';
import { tapeTitle, polaroid, handNote, videoCard, errorBox, demoBadge, pendingNote } from '../ui.js';
import { PLACEHOLDERS } from '../validate.js';

initLayout();

const root = document.getElementById('home');

function sortMembers(a, b) {
  return (a.sort_order ?? 999) - (b.sort_order ?? 999);
}

function card({ id, title, text, button, href, visual, extra }) {
  const headingId = `home-${id}-title`;
  const heading = tapeTitle(title, 'h2');
  heading.id = headingId;
  return el('section', { className: `home-card home-card--${id}`, 'aria-labelledby': headingId },
    el('div', { className: 'home-card__inner' },
      el('div', { className: 'home-card__text' },
        heading,
        text ? el('p', { className: 'home-card__lead', text }) : null,
        extra,
        el('a', { className: 'btn', href }, button, el('span', { 'aria-hidden': 'true', text: ' →' })),
      ),
      visual ? el('div', { className: 'home-card__visual' }, visual) : null,
    ),
  );
}

/** 精選回憶的一張照片：拍立得白邊、不傾斜，點了進紀念館打開燈箱 */
function featuredItem(p, isLarge) {
  const meta = el('p', { className: 'featured-photo__meta' },
    p.date ? el('time', { datetime: p.date, text: formatDate(p.date) }) : null,
    p.category ? el('span', { text: p.category }) : null,
    demoBadge(p),
  );
  return el('li', { className: isLarge ? 'featured-photo featured-photo--large' : 'featured-photo' },
    el('a', { href: `gallery.html#${encodeURIComponent(p.id)}` },
      el('figure', { className: 'polaroid featured-photo__frame' },
        el('span', { className: 'featured-photo__img' },
          img(isLarge ? p.image || p.thumb : p.thumb || p.image, p.title || '紀念館照片'),
        ),
        el('figcaption', {},
          el('span', { className: 'featured-photo__title', text: p.title || '（未命名照片）' }),
          meta,
        ),
      ),
    ),
  );
}

/** 精選回憶：featured 照片依日期由新到舊取前 5 張；沒有照片就顯示「整理中」 */
function featuredSection(gallery, site) {
  const photos = gallery
    .filter((g) => g.featured && g.id)
    .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
    .slice(0, 5);

  const heading = tapeTitle('精選回憶', 'h2');
  heading.id = 'home-memories-title';
  return el('section', { className: 'home-featured', 'aria-labelledby': heading.id },
    el('div', { className: 'home-featured__head' },
      heading,
      el('a', { className: 'btn', href: 'gallery.html' }, '走進紀念館', el('span', { 'aria-hidden': 'true', text: ' →' })),
    ),
    site.memories_intro ? el('p', { className: 'home-featured__lead', text: site.memories_intro }) : null,
    photos.length
      ? el('ul', { className: 'featured-grid', dataset: { count: String(photos.length) } },
        // 5 張：左大右四小；1 張：只有一張大圖；2–4 張：等分
        photos.map((p, i) => featuredItem(p, i === 0 && (photos.length === 5 || photos.length === 1))),
      )
      : pendingNote('照片整理中，敬請期待。'),
  );
}

async function main() {
  try {
    const [site, members, gallery, videos] = await Promise.all([
      loadSite(), loadTable('members'), loadTable('gallery'), loadTable('videos'),
    ]);

    // 橫幅
    const hero = el('section', { className: 'hero', 'aria-label': '公會合照' },
      el('div', { className: 'hero__photo' },
        img(site.banner_image, site.banner_alt || '公會合照', { fallback: PLACEHOLDERS.banner, lazy: false, width: 1600, height: 560 }),
        site.banner_quote ? el('p', { className: 'hero__quote', text: site.banner_quote }) : null,
      ),
      handNote(site.banner_note, 'hero__note'),
    );

    const intro = el('div', { className: 'home-intro' },
      el('h1', { className: 'visually-hidden', text: site.guild_name || '第一交響樂團' }),
      site.intro ? el('p', { className: 'home-intro__text', text: site.intro }) : null,
    );

    // 1. 故事
    const story = card({
      id: 'story', title: '我們的創立故事', text: site.story_summary,
      button: '閱讀完整故事', href: 'story.html',
      visual: polaroid({ src: site.story_image, alt: '公會故事配圖', tilt: 'tilt-b', tape: true }),
    });

    // 2. 成員預覽（最多 6 位）
    const featured = members.filter((m) => m.featured).sort(sortMembers);
    const preview = (featured.length ? featured : [...members].sort(sortMembers)).slice(0, 6);
    const memberCard = card({
      id: 'members', title: '公會成員', text: site.members_intro,
      button: '認識我們的成員', href: 'members.html',
      extra: handNote(site.members_note, 'home-card__note'),
      visual: el('ul', { className: 'mini-members' },
        preview.map((m) => el('li', {},
          el('a', { href: `member.html?id=${encodeURIComponent(m.id)}` },
            img(m.avatar, '', { fallback: PLACEHOLDERS.avatar }),
            el('span', { text: m.nickname || '' }),
          ),
        )),
      ),
    });

    // 3. 精選影片（膠卷框一支＋其他片名）
    const featuredVideos = videos.filter((v) => v.featured);
    const cards = [];
    for (const v of featuredVideos) {
      const c = videoCard(v, { compact: true, headingLevel: 'h3' });
      if (c) cards.push(c);
      if (cards.length >= 3) break;
    }
    const videoSection = card({
      id: 'videos', title: '精彩影片回顧', text: site.videos_intro,
      button: '觀看更多影片', href: 'videos.html',
      visual: cards[0] || null,
      extra: cards.length > 1
        ? el('div', { className: 'home-more-videos' },
          el('p', { className: 'home-more-videos__label', text: '也推薦：' }),
          el('ul', {}, cards.slice(1).map((c) => el('li', {},
            el('a', { href: 'videos.html', text: c.querySelector('.video-card__title').textContent }),
          ))),
        )
        : null,
    });

    const memories = featuredSection(gallery, site);
    clear(root).append(
      ...[hero, intro, memories, el('div', { className: 'home-grid' }, story, memberCard, videoSection)].filter(Boolean),
    );
  } catch (error) {
    console.warn(error);
    clear(root).append(errorBox());
  }
}

main();
