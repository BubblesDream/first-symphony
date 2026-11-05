"""城堡紙娃娃部件處理（手動執行，網站本身不會用到這支程式）。

原圖：docs/素材/城堡原圖/紙娃娃/<部件>.png（Codex 生成，三個方向一列，用鍵色畫）。
做法與由來見 docs/研究-城堡紙娃娃.md、docs/提示詞-城堡紙娃娃.md。

每個部件都是「照母版 base.png 重畫、只改一處」，所以位置和母版只差幾個像素：
1. 每個方向自動找位移，對齊母版。
2. 只取這個部件負責的像素：
   head（頭）＝脖子切線以上全部＋切線以下的頭髮、配件與它們的外框；
   outfit（衣服）＝切線以下全部＋切線以上的衣領；
   over（眼鏡、披風）＝配件鍵色＋和母版不同的外框；
   face（臉部疊圖）＝正面、側面臉內側（母版皮膚範圍補滿眼睛、往內縮）的全部像素，眼珠畫成鍵色藍。
3. 依顏色分成固定色與 6 個可染色區（頭髮、皮膚、上衣、下身、鞋子、配件）；臉部疊圖多一個第 7 區（眼睛，藍色鍵色）。
   可染色區只存明暗（OKLab 明度和鍵色的差＋0.5），遊戲裡再換成每個人挑的顏色（paperdoll.js）。
4. 每層各自縮小（預乘透明度），存成 WebP：三個方向排一列，七層（臉部疊圖八層）由上往下排。

用法（在專案根目錄）：python tools/castle_paperdoll.py [部件名稱 ...]
需要 Pillow、numpy。部件清單與格子大小只寫在 assets/js/castle/art.js 的 DOLL_PARTS、DOLL_CELL。
"""
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs' / '素材' / '城堡原圖' / '紙娃娃'
OUT = ROOT / 'assets' / 'images' / 'castle' / 'doll'
ART_JS = ROOT / 'assets' / 'js' / 'castle' / 'art.js'

VIEWS = [(0, 512), (512, 1024), (1024, 1536)]  # 原圖 1536×1024，三個方向各占三分之一
REGIONS = ['hair', 'skin', 'top', 'bottom', 'shoes', 'acc', 'eyes']  # 第 1～7 層；第 0 層是固定色；eyes 只有臉部疊圖有
KEY_HEX = {'shoes': '#06b6d4', 'acc': '#facc15', 'eyes': '#2563eb'}  # 其他區的基準明度從母版量


def read_art():
    text = ART_JS.read_text(encoding='utf-8')
    cell = re.search(r"DOLL_CELL = \{ w: (\d+), h: (\d+), body: (\d+) \}", text)
    block = re.search(r"DOLL_PARTS = \[(.*?)\];", text, re.S)
    names = re.findall(r"'(\w+)'", block.group(1))
    return names, tuple(int(g) for g in cell.groups())


# ---------- 顏色 ----------

def load(path):
    a = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32) / 255
    a[..., 3] = np.where(a[..., 3] < 8 / 255, 0, a[..., 3])
    return a


def hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a[..., :3].max(-1)
    mn = a[..., :3].min(-1)
    d = mx - mn + 1e-6
    s = (mx - mn) / (mx + 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, s, mx


def classify(a):
    """每個像素屬於哪一區：0＝固定色，1～6＝REGIONS"""
    h, s, v = hsv(a)
    cls = np.zeros(a.shape[:2], np.uint8)
    rules = [
        # 皮膚（先判，後面的鍵色會蓋過）：亮的桃色；陰影比較飽和，但眼珠（暗）不算
        (2, ((h < 45) | (h > 345)) & (s > 0.12) & (((s < 0.52) & (v > 0.55)) | ((s < 0.75) & (v > 0.72)))),
        (1, (h > 65) & (h < 170) & (s > 0.2)),  # 頭髮：綠（高光偏黃綠，到 65°）
        (5, (h >= 170) & (h < 200) & (s > 0.3)),  # 鞋子：青
        (4, (h >= 200) & (h < 258) & (s > 0.3)),  # 下身：藍
        (3, (h > 265) & (h < 335) & (s > 0.25)),  # 上衣：洋紅
        (6, (h > 38) & (h <= 65) & (s > 0.45) & (v > 0.35)),  # 配件：黃
    ]
    for k, m in rules:
        cls[m] = k
    # 黃色配件的陰影偏橘：只有貼著黃色的才算配件（避免把眼珠的橘色反光算進去）
    orange = (h >= 28) & (h <= 38) & (s > 0.8) & (v > 0.55)
    cls[orange & near(cls == 6, 6)] = 6
    cls[a[..., 3] < 0.02] = 0  # 透明的地方顏色沒有意義
    return cls


def srgb2lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


M1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929],
               [0.2119034982, 0.6806995451, 0.1073969566],
               [0.0883024619, 0.2817188376, 0.6299787005]])
M2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468],
               [1.9779984951, -2.4285922050, 0.4505937099],
               [0.0259040371, 0.7827717662, -0.8086757660]])


def ok_l(rgb):
    """OKLab 明度"""
    return (np.cbrt(srgb2lin(rgb) @ M1.T) @ M2.T)[..., 0]


def hex_l(h):
    return float(ok_l(np.array([[int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]]))[0])


# ---------- 對齊與選像素 ----------

def near(mask, r):
    """mask 往外擴 r 像素"""
    im = Image.fromarray(mask.astype(np.uint8) * 255)
    return np.asarray(im.filter(ImageFilter.MaxFilter(2 * r + 1))) > 0


def shift(a, dx, dy):
    return np.roll(np.roll(a, dy, 0), dx, 1)


def neck_cut(base, base_cls, x0, x1):
    """脖子切線：母版上衣（洋紅）超過 30 個像素的第一列，再往上 2 列"""
    rows = ((base_cls[:, x0:x1] == 3) & (base[:, x0:x1, 3] > 0.5)).sum(1)
    return int(np.argmax(rows > 30)) - 2


def align(base, part, rows, ignore, x0, x1):
    """找 part 對 base 的位移（±24 像素，先每 3 像素粗找再細找）：比對 rows 範圍內的輪廓（忽略 ignore 的像素）"""
    a = base[rows, x0:x1, 3] > 0.5
    solid = part[..., 3] > 0.5

    def score(dx, dy):
        b = shift(solid, dx, dy)[rows, x0:x1]
        ig = shift(ignore, dx, dy)[rows, x0:x1]
        return ((a != b) & ~ig).sum()

    _, cx, cy = min((score(dx, dy), dx, dy) for dy in range(-24, 25, 3) for dx in range(-24, 25, 3))
    _, dx, dy = min((score(dx, dy), dx, dy) for dy in range(cy - 2, cy + 3) for dx in range(cx - 2, cx + 3))
    return dx, dy


_FACE = {}


def face_area(base, x0, x1, cut):
    """臉的內側：母版脖子切線以上的皮膚，補滿眼睛、眉毛的洞（閉運算），再往內縮，不碰到臉的外框與頭髮"""
    if (x0, cut) not in _FACE:
        skin = np.zeros(base.shape[:2], bool)
        skin[:cut, x0:x1] = (classify(base) == 2)[:cut, x0:x1]
        im = Image.fromarray(skin.astype(np.uint8) * 255)
        im = im.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.MinFilter(31))  # 補洞
        im = im.filter(ImageFilter.MinFilter(9))  # 往內縮 4 像素
        _FACE[(x0, cut)] = np.asarray(im) > 0
    return _FACE[(x0, cut)]


def select(kind, part, cls, base, cuts):
    """這個部件負責的像素（0～1 的權重）"""
    h, w = cls.shape
    rows = np.arange(h)[:, None]
    _, _, v = hsv(part)
    dark = (v < 0.42) & (part[..., 3] > 0.3)
    keep = np.zeros((h, w), bool)
    for (x0, x1), cut in zip(VIEWS, cuts):
        above = np.zeros((h, w), bool)
        above[:cut, x0:x1] = True
        view = np.zeros((h, w), bool)
        view[:, x0:x1] = True
        if kind == 'head':
            hair = (cls == 1) | (cls == 6)
            body = (cls == 3) | (cls == 4) | (cls == 5)
            keep |= view & (above | hair | (dark & near(hair, 10) & ~body))
        elif kind == 'outfit':
            top = cls == 3
            collar = near(top, 8) & ~near(cls == 1, 4) & (cls != 2)
            keep |= view & (~above | top | collar)
        elif kind == 'face':
            if (x0, x1) != VIEWS[1]:  # 背面沒有臉
                keep |= view & face_area(base, x0, x1, cut)
        else:  # over：眼鏡、披風
            acc = cls == 6
            diff = np.abs(part[..., :3] - base[..., :3]).max(-1) > 0.12
            keep |= view & (acc | (near(acc, 8) & dark & diff))
    del rows
    return keep


# ---------- 縮小與輸出 ----------

def shrink(layer, box, size):
    """一層（H×W×4，未預乘）裁 box、縮成 size，預乘透明度避免邊緣變色"""
    pre = layer.copy()
    pre[..., :3] *= pre[..., 3:4]
    chans = [np.asarray(Image.fromarray(pre[..., i]).resize(size, Image.LANCZOS, box=box)) for i in range(4)]
    out = np.clip(np.stack(chans, -1), 0, 1)
    a = out[..., 3:4]
    out[..., :3] = np.where(a > 1e-4, out[..., :3] / np.maximum(a, 1e-4), 0)
    return np.clip(out, 0, 1)


def make_part(name, base, base_cls, cuts, geo, cell, ref_l):
    cw, ch, _ = cell
    kind = name.split('_')[0] if name.split('_')[0] in ('head', 'outfit', 'face') else 'over'
    layers = 8 if kind == 'face' else 7
    part = base.copy() if name == 'head_short_none' else load(SRC / f'{name}.png')
    cls0 = classify(part)
    # 對齊：頭和配件比下半身，衣服比頭
    aligned = np.zeros_like(part)
    shifts = []
    for (x0, x1), cut in zip(VIEWS, cuts):
        if kind == 'outfit':
            rows, ignore = slice(150, cut), np.zeros(cls0.shape, bool)
        else:
            rows, ignore = slice(cut + 80, 900), (cls0 == 1) | (cls0 == 6)
        dx, dy = align(base, part, rows, ignore, x0, x1)
        shifts.append((dx, dy))
        aligned[:, x0:x1] = shift(part, dx, dy)[:, x0:x1]
    part = aligned
    cls = classify(part)
    if kind == 'face':
        cls[cls == 4] = 7  # 臉上的藍色是眼珠
    keep = select(kind, part, cls, base, cuts)
    lab_l = ok_l(part[..., :3])

    sheet = np.zeros((ch * layers, cw * 3, 4), np.float32)
    for i, box in enumerate(geo):
        for layer in range(layers):
            m = keep & (cls == layer)
            if not m.any():
                continue
            lay = np.zeros_like(part)
            if layer == 0:
                lay[..., :3] = part[..., :3]
            else:
                vv = np.clip(lab_l - ref_l[REGIONS[layer - 1]] + 0.5, 0, 1)
                lay[..., :3] = vv[..., None]
            lay[..., 3] = part[..., 3] * m
            sheet[layer * ch:(layer + 1) * ch, i * cw:(i + 1) * cw] = shrink(lay, box, (cw, ch))
    img = Image.fromarray((sheet * 255 + 0.5).astype(np.uint8), 'RGBA')
    return img, shifts


def main(argv):
    names, cell = read_art()
    cw, ch, body = cell
    if argv:
        names = [n for n in names if n in argv]
    base = load(SRC / 'base.png')
    base_cls = classify(base)
    cuts = [neck_cut(base, base_cls, x0, x1) for x0, x1 in VIEWS]
    # 每個方向的裁切框：母版腳底貼齊格子下緣、左右置中；母版最高的方向剛好 body 像素高
    boxes, heights = [], []
    for x0, x1 in VIEWS:
        ys, xs = np.nonzero(base[:, x0:x1, 3] >= 0.5)
        boxes.append(((xs.min() + xs.max() + 1) / 2 + x0, ys.max() + 1))
        heights.append(ys.max() + 1 - ys.min())
    scale = body / max(heights)
    w, h = cw / scale, ch / scale
    geo = [(cx - w / 2, bottom - h, cx + w / 2, bottom) for cx, bottom in boxes]
    # 各區的基準明度：母版量得的中位數；母版沒有的區用鍵色
    lab = ok_l(base[..., :3])
    ref_l = {r: hex_l(KEY_HEX[r]) if r in KEY_HEX else float(np.median(lab[(base_cls == i + 1) & (base[..., 3] > 0.5)]))
             for i, r in enumerate(REGIONS)}
    print('基準明度', {k: round(v, 3) for k, v in ref_l.items()}, '切線', cuts, '縮放', round(scale, 4))

    OUT.mkdir(parents=True, exist_ok=True)
    missing = []
    for name in names:
        if name != 'head_short_none' and not (SRC / f'{name}.png').exists():
            missing.append(name)
            continue
        img, shifts = make_part(name, base, base_cls, cuts, geo, cell, ref_l)
        path = OUT / f'{name}.webp'
        img.save(path, 'WEBP', lossless=True, method=6)
        big = [s for s in shifts if max(abs(s[0]), abs(s[1])) > 16]
        print(f'{name}: 位移 {shifts}  {path.stat().st_size // 1024} KB' + ('  ← 位移偏大，請檢查' if big else ''))
    for n in missing:
        print('注意：還沒有原圖', n)
    return 1 if missing else 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main(sys.argv[1:]))
