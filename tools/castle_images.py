"""城堡圖片處理（手動執行，網站本身不會用到這支程式）。

把 docs/素材/城堡原圖/ 的原圖裁切、縮放成遊戲用的大小，存到 assets/images/castle/（WebP）。
用法（在專案根目錄）：python3 tools/castle_images.py
需要 Pillow（pip install pillow）。

新增一張圖：在下面的 SPRITES 或 TILES 加一行，執行本程式，
再到 assets/js/castle/art.js 登記同名的圖片，遊戲就會改用圖片。
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs' / '素材' / '城堡原圖'
OUT = ROOT / 'assets' / 'images' / 'castle'
PX = 64  # 遊戲一格 32 單位、畫面放大 2 倍，所以一格 = 64 像素

# 透明背景的家具：(寬格數, 高格數)。圖片等比縮進這個框，下緣置中對齊。
SPRITES = {
    'banner': (1, 2),
    'candle_stand': (1, 2),
    'pillar': (1, 2),
    'notice_board': (2, 1.5),
    'table_round': (2, 2),
    'plant': (1, 1),
    'door_open': (1, 1.5),
    'door_locked': (1, 1.5),
    'gate_main': (6, 2),
    'stairs_up': (4, 2),
    'piano': (3, 2),
    'piano_bench': (1, 1),
    'music_stand': (1, 1.5),
    'stool': (1, 1),
    'chair_back': (1, 1),
    'podium': (1, 1),
    'harp': (1, 2),
}

# 拼貼用的圖：一張圖涵蓋幾格 (寬, 高)
TILES = {
    'floor_stone': (2, 2),  # 原圖約 4×4 塊石磚，一張鋪 2×2 格，石磚才不會太小
    'floor_wood': (2, 2),
    'carpet_red': (6, 6),   # 地毯寬 6 格（左右滾邊），往下重複
    'wall_stone': (1, 1),
}


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


def make_tile(name, w, h):
    im = Image.open(SRC / f'{name}.png').convert('RGB')
    return im.resize((w * PX, h * PX), Image.LANCZOS), None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    problems = []
    jobs = [(n, make_sprite, s) for n, s in SPRITES.items()] + [(n, make_tile, s) for n, s in TILES.items()]
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
    for p in problems:
        print('注意：', p)
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
