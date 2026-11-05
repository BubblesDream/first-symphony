// 酒館菜單（面板 drink，1F 交流廳的吧台）：選一杯飲料 → 關閉面板 → 訪客到吧台坐下來喝（物件的 play）。
// 飲料清單在 data/castle_drinks.json，讀不到就用內建的 3 種。不用靈感。
import { el } from '../render.js';
import { isNight } from './sky.js';

const DEFAULT_DRINKS = [
  { name: '熱可可', desc: '濃濃的巧克力香，喝完整個人暖起來。', color: '#6b4228' },
  { name: '蜂蜜牛奶', desc: '溫溫的牛奶加一匙蜂蜜。', color: '#efe3c2' },
  { name: '麥茶', desc: '冰冰涼涼的麥茶，練習完來一杯。', color: '#a9743c' },
];

const COLOR = /^#[0-9a-f]{6}$/i;

export function buildDrinkPanel(ctx, env) {
  const list = el('ul', { className: 'castle-drinks' });
  const status = el('p', { className: 'castle-panel__status', text: '菜單拿來了…', 'aria-live': 'polite' });

  function order(drink) {
    ctx.drink = { name: drink.name, color: drink.color };
    env.close();
    env.play(() => ctx.ui.toast(`你點了一杯${drink.name}。`, 3));
  }

  function render(drinks) {
    const night = isNight();
    const shown = drinks.filter((d) => d.name && (!d.night_only || night));
    status.textContent = shown.some((d) => d.night_only) ? '夜深了，今晚有特別的飲料。' : '';
    list.replaceChildren(...shown.map((drink) => {
      const color = COLOR.test(drink.color || '') ? drink.color : '#a47148';
      const swatch = el('span', { className: 'castle-drinks__swatch', 'aria-hidden': 'true' });
      swatch.style.backgroundColor = color;
      const button = el('button', { type: 'button', className: 'castle-drinks__item' },
        swatch,
        el('span', { className: 'castle-drinks__text' },
          el('span', { className: 'castle-drinks__name', text: drink.name }),
          drink.night_only ? el('span', { className: 'castle-drinks__tag', text: '夜晚限定' }) : null,
          el('span', { className: 'castle-drinks__desc', text: drink.desc || '' }),
        ),
      );
      button.addEventListener('click', () => order({ name: drink.name, color }));
      return el('li', {}, button);
    }));
  }

  ctx.load('castle_drinks')
    .then((rows) => (rows.some((r) => r.name) ? rows : DEFAULT_DRINKS))
    .catch((error) => { console.warn(error); return DEFAULT_DRINKS; })
    .then(render);

  const body = el('div', { className: 'castle-drink' },
    el('p', { className: 'castle-panel__lead', text: '酒保擦著杯子：「想喝點什麼？點好就到吧台坐一下吧。」' }),
    status,
    list,
    el('p', { className: 'castle-panel__small castle-panel__foot', text: '點飲料不用靈感，想喝幾杯都可以。' }),
  );
  return { title: '酒館菜單', body };
}
