"""紙娃娃臉部疊圖生成：python gen_faces.py <名稱> [...]（並行 4 個；要用 WS_codex_gen_image/.venv 的 python）
照母版 base.png 只改眼睛、眉毛、嘴巴，眼珠畫成鍵色藍，讓程式換成每個人挑的眼睛顏色。"""
import subprocess, sys, shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
HERE = Path(__file__).parent
PY = r'D:/UserData/Documents/WS/WS_codex_gen_image/.venv/Scripts/python'
SRC = Path(r'D:/UserData/Documents/WS/WS_FirstSymphony/docs/素材/城堡原圖')
DOLL = SRC / '紙娃娃'
STYLE = SRC / 'table_round.png'

FACE = """The FIRST attached image is a paper-doll template sheet (front, back and right-side views of one chibi character). Redraw it as a new image that matches it EXACTLY: same canvas size 1536x1024, the same three views at exactly the same positions and the same size on the canvas, same pose, same head shape, same hair, same ears, same body, same clothes, same style (warm fantasy 16-bit Japanese RPG pixel art, thin dark-brown outlines, soft shading lit from the upper left). Change ONLY the facial expression (eyes, eyebrows and mouth) in the front view and the side view: {change}
The eyes stay at the same place and roughly the same size as in the template. The back view does not change.

Flat key colors so a program can recolor them (shade ONLY with lighter/darker versions of the same hue, never mix in other hues):
- hair and eyebrows stay vivid key green (#22c55e)
- irises: vivid key blue (#2563eb), darker blue pupils, keep the small white highlights
- top stays key magenta (#d946ef); trousers stay key blue (#2563eb)
Skin, ears and shoes stay as in the template. Transparent background, no ground shadow, no floor, no text, no frame."""

FACES = {
    'base': 'keep exactly the same eyes, eyebrows and gentle smile as the template; only the irises become key blue.',
    'smile': 'a big cheerful open-mouth smile, eyes slightly curved with joy but still open (irises visible), eyebrows raised a little.',
    'cool': 'a calm, cool look: slightly narrowed half-lidded eyes (irises still visible), straight flat eyebrows, a small neutral closed mouth.',
    'sparkle': 'big round sparkling eyes with extra white highlights, eyebrows raised in wonder, a small open "o" mouth.',
    'determined': 'a determined look: eyebrows angled down toward the nose, focused eyes (irises visible), a confident closed smirk.',
    'sleepy': 'a sleepy, gentle look: droopy half-closed eyes (irises still a little visible), relaxed soft eyebrows, a small relaxed smile.',
    'closed': 'a happy closed-eye smile: both eyes closed as upward curved arcs (^ ^ shape), cheerful raised eyebrows, a wide open smiling mouth.',
    'shy': 'a shy look: rosy pink blush across both cheeks, eyes glancing down to the side (irises visible), worried slanted eyebrows, a small wavy mouth.',
    'mischief': 'a mischievous look: one eyebrow raised higher than the other, eyes slightly narrowed with a sly glint (irises visible), a cat-like smug smile.',
    'wink': 'a playful wink: in the front view the character’s right eye (viewer’s left) is closed as a curved line and the other eye is open; in the side view the visible eye is open; a big grin.',
}

def run(key):
    name = f'face_{key}'
    if (DOLL / f'{name}.png').exists():
        return name, 'exists'
    (HERE / f'{name}.txt').write_text(FACE.format(change=FACES[key]), encoding='utf-8')
    out = HERE / f'out_{name}'
    if out.exists():
        shutil.rmtree(out)
    r = subprocess.run([PY, str(HERE / 'run.py'), name, str(HERE / f'{name}.txt'), str(out), str(DOLL / 'base.png'), str(STYLE)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    png = out / f'{name}.png'
    if png.exists():
        shutil.copyfile(png, DOLL / f'{name}.png')
        return name, (r.stdout.strip().splitlines() or ['ok?'])[-1][:60]
    return name, 'FAILED ' + (r.stdout + r.stderr)[-400:]

if __name__ == '__main__':
    keys = sys.argv[1:] if sys.argv[1:] != ['all'] else list(FACES)
    with ThreadPoolExecutor(4) as ex:
        for name, msg in ex.map(run, keys):
            print(name, msg, flush=True)
