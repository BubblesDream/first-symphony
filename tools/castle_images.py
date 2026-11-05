"""城堡圖片處理（手動執行，網站本身不會用到這支程式）。

把 docs/素材/城堡原圖/ 的原圖裁切、縮放成遊戲用的大小，存到 assets/images/castle/（WebP）。
用法（在專案根目錄）：python3 tools/castle_images.py
需要 Pillow（pip install pillow）。

新增一張圖：原圖放進 docs/素材/城堡原圖/<名稱>.png，
在 assets/js/castle/art.js 加一行（寫上大小），執行本程式，遊戲就會改用圖片。
（遊戲裡沒登記的圖會畫色塊，所以可以一張一張補。）
"""
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs' / '素材' / '城堡原圖'
OUT = ROOT / 'assets' / 'images' / 'castle'
PX = 64  # 遊戲一格 32 單位、畫面放大 2 倍，所以一格 = 64 像素

ART_JS = ROOT / 'assets' / 'js' / 'castle' / 'art.js'


def read_art():
    """從 art.js 讀每張圖的大小（遊戲與本程式共用同一份設定，只要改 art.js）。
    家具：w×h 格（等比縮進這個框，下緣置中）；拼貼圖：cols×rows 格。"""
    text = ART_JS.read_text(encoding='utf-8')
    sprites, tiles = {}, {}
    for name, fields in re.findall(r"(\w+): \{ src: `\$\{DIR\}\w+\.webp`,([^}]*)\}", text):
        values = dict((k, float(v)) for k, v in re.findall(r"(\w+): ([\d.]+)", fields))
        if 'cols' in values:
            tiles[name] = (int(values['cols']), int(values['rows']))
        else:
            sprites[name] = (values['w'], values['h'])
    return sprites, tiles


def resize(im, size):
    """縮放時先預乘透明度，避免透明邊緣出現白邊或黑邊"""
    return im.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')


def check_transparency(name, im):
    """透明背景是不是真的透明（ChatGPT 偶爾會畫成白底或棋盤格）"""
    alpha = im.getchannel('A')
    if alpha.getextrema()[0] > 16:
        return f'{name}：沒有透明的地方，可能是白底或棋盤格，需要重新產生或手動去背'
    w, h = im.size
    corners = [im.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    if any(c[3] > 16 for c in corners):
        return f'{name}：四個角不是透明的，請檢查背景'
    return None


def make_sprite(name, w, h):
    im = Image.open(SRC / f'{name}.png').convert('RGBA')
    problem = check_transparency(name, im)
    # 幾乎看不見的半透明雜點直接清掉，再裁掉透明邊
    alpha = im.getchannel('A').point(lambda v: 0 if v < 8 else v)
    im.putalpha(alpha)
    im = im.crop(alpha.point(lambda v: 255 if v > 16 else 0).getbbox())
    box_w, box_h = round(w * PX), round(h * PX)
    scale = min(box_w / im.width, box_h / im.height)
    size = (max(1, round(im.width * scale)), max(1, round(im.height * scale)))
    canvas = Image.new('RGBA', (box_w, box_h), (0, 0, 0, 0))
    canvas.alpha_composite(resize(im, size), ((box_w - size[0]) // 2, box_h - size[1]))
    return canvas, problem


def read_chars():
    """art.js 的角色圖清單與每格大小"""
    text = ART_JS.read_text(encoding='utf-8')
    cell = re.search(r"CHAR_CELL = \{ w: (\d+), h: (\d+) \}", text)
    ids = re.findall(r"(\w+): \{ src: `\$\{DIR\}members/\w+\.webp` \}", text)
    return ids, (int(cell.group(1)), int(cell.group(2)))


def split_views(im):
    """原圖裡左右排的三個方向：依透明的直欄切開，回傳裁到邊的三張"""
    alpha = im.getchannel('A')
    w, h = im.size
    solid = alpha.point(lambda v: 255 if v >= 128 else 0)
    cols = [solid.crop((x, 0, x + 1, h)).getbbox() is not None for x in range(w)]
    segs, start = [], None
    for x, on in enumerate(cols + [False]):
        if on and start is None:
            start = x
        if not on and start is not None:
            if x - start > w // 30:
                segs.append((start, x))
            start = None
    views = []
    for x0, x1 in segs:
        sub = im.crop((x0, 0, x1, h))
        views.append(sub.crop(sub.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()))
    return views


def make_char(cid, cell):
    """角色圖：三個方向用同一個比例縮進每格，腳底貼齊下緣、左右置中"""
    im = Image.open(SRC / 'members' / f'{cid}.png').convert('RGBA')
    problem = check_transparency(cid, im)
    im.putalpha(im.getchannel('A').point(lambda v: 0 if v < 8 else v))
    views = split_views(im)
    if len(views) != 3:
        return None, f'{cid}：找到 {len(views)} 個方向（應該是 3 個：正面、背面、側面）'
    cw, ch = cell
    scale = min(ch / max(v.height for v in views), cw / max(v.width for v in views))
    sheet = Image.new('RGBA', (cw * 3, ch), (0, 0, 0, 0))
    for i, v in enumerate(views):
        size = (max(1, round(v.width * scale)), max(1, round(v.height * scale)))
        sheet.alpha_composite(resize(v, size), (i * cw + (cw - size[0]) // 2, ch - size[1]))
    return sheet, problem


def make_tile(name, w, h):
    im = Image.open(SRC / f'{name}.png').convert('RGB')
    return im.resize((w * PX, h * PX), Image.LANCZOS), None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    problems = []
    sprites, tiles = read_art()
    jobs = [(n, make_sprite, s) for n, s in sprites.items()] + [(n, make_tile, s) for n, s in tiles.items()]
    for name, func, size in jobs:
        if not (SRC / f'{name}.png').exists():
            print(f'略過 {name}：還沒有原圖')
            continue
        im, problem = func(name, *size)
        if problem:
            problems.append(problem)
        path = OUT / f'{name}.webp'
        im.save(path, 'WEBP', quality=90, method=6)
        print(f'{name}: {im.size[0]}×{im.size[1]}  {path.stat().st_size // 1024} KB')
    ids, cell = read_chars()
    (OUT / 'members').mkdir(exist_ok=True)
    for cid in ids:
        if not (SRC / 'members' / f'{cid}.png').exists():
            print(f'略過角色 {cid}：還沒有原圖')
            continue
        im, problem = make_char(cid, cell)
        if problem:
            problems.append(problem)
        if im is None:
            continue
        path = OUT / 'members' / f'{cid}.webp'
        im.save(path, 'WEBP', quality=90, method=6)
        print(f'角色 {cid}: {im.size[0]}×{im.size[1]}  {path.stat().st_size // 1024} KB')
    for p in problems:
        print('注意：', p)
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
