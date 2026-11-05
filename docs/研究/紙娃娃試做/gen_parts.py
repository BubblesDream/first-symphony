"""紙娃娃部件生成：python jobs.py <名稱> [...]（並行 4 個）"""
import subprocess, sys, shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
HERE = Path(__file__).parent
PY = r'D:/UserData/Documents/WS/WS_codex_gen_image/.venv/Scripts/python'
SRC = Path(r'D:/UserData/Documents/WS/WS_FirstSymphony/docs/素材/城堡原圖')
DOLL = SRC / '紙娃娃'
STYLE = SRC / 'table_round.png'

HEAD = """The FIRST attached image is a paper-doll template sheet (front, back and right-side views of one chibi character). Redraw it as a new image that matches it EXACTLY: same canvas size 1536x1024, the same three views at exactly the same positions and the same size on the canvas, same pose, same face, same body, same clothes, same style (warm fantasy 16-bit Japanese RPG pixel art, thin dark-brown outlines, soft shading lit from the upper left). Change ONLY: {change}

Flat key colors so a program can recolor them (shade ONLY with lighter/darker versions of the same hue, never mix in other hues):
- hair: vivid key green (#22c55e)
- top: key magenta (#d946ef); trousers: key blue (#2563eb)
- any accessory item (hat, ribbon, headband, glasses, cape): vivid key yellow (#facc15)
Skin, face, eyes and shoes stay as in the template. Transparent background, no ground shadow, no floor, no text, no frame."""

OUTFIT = """The FIRST attached image is a paper-doll template sheet (front, back and right-side views of one chibi character). Redraw it as a new image that matches it EXACTLY: same canvas size 1536x1024, the same three views at exactly the same positions and the same size on the canvas, same pose (standing, arms relaxed at the sides), same head, same face, same short hair, same body proportions, same style (warm fantasy 16-bit Japanese RPG pixel art, thin dark-brown outlines, soft shading lit from the upper left). Change ONLY the clothes and shoes.

New outfit: {outfit}
Shoes: simple ankle boots in vivid key cyan (#06b6d4).

Flat key colors so a program can recolor them (shade ONLY with lighter/darker versions of the same hue, never mix in other hues):
- hair stays vivid key green (#22c55e)
- main clothing color: key magenta (#d946ef)
- lower clothing color (trousers / shorts / skirt): key blue (#2563eb)
- shoes: key cyan (#06b6d4)
White parts, metal parts and belts keep natural colors. No other colored patterns. Transparent background, no ground shadow, no floor, no text, no frame."""

HAIR = {
    'medium': 'shoulder-length hair with soft bangs',
    'ponytail': 'a single ponytail tied high at the back of the head, reaching the shoulder blades, with bangs',
    'bun': 'hair tied up in a round bun on top of the head, with bangs',
}
ACC = {
    'hat': 'add a simple soft felt hat with a small brim, sitting on the head (key yellow). Keep the hairstyle exactly the same, hair visible under the hat.',
    'ribbon': 'add one big ribbon bow tied in the hair at the back of the head, visible from all three views (key yellow). Keep the hairstyle exactly the same.',
    'headband': 'add a plain smooth headband over the top of the head from ear to ear (key yellow). Keep the hairstyle exactly the same.',
}
TOPS = {
    'shirt': 'a simple long-sleeved shirt with a small collar, tucked in, with a plain brown belt',
    'jacket': 'a short open jacket with long sleeves over a plain white shirt (the shirt is natural white, the jacket is key magenta)',
    'armor': 'light adventurer armor: a padded tunic in key magenta with a natural steel-gray metal breastplate and small steel shoulder guards, plain brown belt',
}
BOTTOMS = {
    'pants': 'straight long trousers (key blue)',
    'shorts': 'knee-length shorts (key blue), bare lower legs',
    'longskirt': 'an ankle-length flowing skirt (key blue)',
    'skirt': 'a knee-length flared skirt (key blue), bare lower legs',
}
ONE_PIECE = {
    'robe': 'a long ankle-length robe with wide long sleeves in key magenta, tied with a plain brown rope belt. No trousers visible.',
    'dress': 'a knee-length dress with short puffed sleeves in key magenta, with a small natural white collar, bare lower legs. No trousers.',
}

def jobs():
    j = {}
    for h, d in HAIR.items():
        j[f'head_{h}_none'] = (HEAD.format(change=f'the hairstyle. New hairstyle: {d}.'), [DOLL / 'base.png'])
    for h in ['short', 'medium', 'long', 'ponytail', 'twintails', 'bun']:
        ref = DOLL / ('base.png' if h == 'short' else f'head_{h}_none.png')
        for a, d in ACC.items():
            j[f'head_{h}_{a}'] = (HEAD.format(change=d), [ref])
    j['over_glasses'] = (HEAD.format(change='add simple round glasses on the face (thin key yellow frames, clear lenses showing the eyes). Keep everything else the same.'), [DOLL / 'base.png'])
    j['over_cape'] = (HEAD.format(change='add a short cape fastened at the neck, falling behind the back to the waist (key yellow, plain, no pattern). Keep everything else the same.'), [DOLL / 'base.png'])
    for t, d in TOPS.items():
        for b, e in BOTTOMS.items():
            j[f'outfit_{t}_{b}'] = (OUTFIT.format(outfit=f'{d}; {e}.'), [DOLL / 'base.png'])
    for t, d in ONE_PIECE.items():
        j[f'outfit_{t}'] = (OUTFIT.format(outfit=d), [DOLL / 'base.png'])
    return j

def run(name):
    prompt, refs = jobs()[name]
    if (DOLL / f'{name}.png').exists():
        return name, 'exists'
    (HERE / f'{name}.txt').write_text(prompt, encoding='utf-8')
    out = HERE / f'out_{name}'
    if out.exists():
        shutil.rmtree(out)
    r = subprocess.run([PY, str(HERE / 'run.py'), name, str(HERE / f'{name}.txt'), str(out), *map(str, refs), str(STYLE)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    png = out / f'{name}.png'
    if png.exists():
        shutil.copyfile(png, DOLL / f'{name}.png')
        return name, r.stdout.strip().splitlines()[-1][:40] if r.stdout.strip() else 'ok?'
    return name, 'FAILED ' + (r.stdout + r.stderr)[-300:]

if __name__ == '__main__':
    names = sys.argv[1:] if sys.argv[1:] != ['all'] else list(jobs())
    with ThreadPoolExecutor(4) as ex:
        for name, msg in ex.map(run, names):
            print(name, msg, flush=True)
