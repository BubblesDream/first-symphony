"""紙娃娃試做：身體圖（body）＋頭髮圖（head）合成，再依鍵色染色。
用法：python compose.py <body.png> <head.png> <out.png> <髮色> <上衣色> <下身色>"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
from keys import load, hsv, masks, VIEWS, bbox

def srgb2lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def lin2srgb(c): return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
M1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566], [0.0883024619, 0.2817188376, 0.6299787005]])
M2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468], [1.9779984951, -2.4285922050, 0.4505937099], [0.0259040371, 0.7827717662, -0.8086757660]])
def to_lab(rgb): return np.cbrt(srgb2lin(rgb) @ M1.T) @ M2.T
def from_lab(lab):
    lms = (lab @ np.linalg.inv(M2).T) ** 3
    return np.clip(lin2srgb(lms @ np.linalg.inv(M1).T), 0, 1)
def hex2rgb(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255

def shift(a, dx, dy):
    return np.roll(np.roll(a, dy, 0), dx, 1)

def align(body, head, x0, x1):
    """在 ±10 像素內找 head 對 body 的位移：比對兩張都有的下半身（腰以下、非頭髮）"""
    mb, mh = masks(body), masks(head)
    best = None
    for dy in range(-10, 11):
        for dx in range(-10, 11):
            a = mb['op'][560:900, x0:x1]
            b = shift(mh['op'], dx, dy)[560:900, x0:x1]
            ng = ~shift(mh['green'], dx, dy)[560:900, x0:x1] & ~mb['green'][560:900, x0:x1]
            score = ((a != b) & ng).sum()
            if best is None or score < best[0]:
                best = (score, dx, dy)
    return best[1], best[2]

def recolor(img, mask, target):
    """鍵色區：OKLab 明度相對位移，色度換成目標色（依原本彩度比例）"""
    if not mask.any():
        return
    lab = to_lab(img[..., :3][mask])
    L0 = np.median(lab[:, 0]); C = np.hypot(lab[:, 1], lab[:, 2]); C0 = np.median(C)
    t = to_lab(hex2rgb(target)[None])[0]
    L = np.clip(t[0] + (lab[:, 0] - L0) * 0.9, 0.05, 0.97)
    k = np.clip(C / C0, 0.3, 1.2)[:, None]
    ab = t[None, 1:] * k
    img[..., :3][mask] = from_lab(np.column_stack([L, ab]))

def compose(body, head):
    out = body.copy()
    mb, mh = masks(body), masks(head)
    for x0, x1 in VIEWS:
        dx, dy = align(body, head, x0, x1)
        h = shift(head, dx, dy)
        hm = {k: shift(v, dx, dy) for k, v in mh.items()}
        # 脖子切線：身體圖上衣最上緣
        top = int(np.argmax(mb['mag'][:, x0:x1].sum(1) > 30))
        cut = top - 2
        sl = np.s_[:, x0:x1]
        o, hv, bv = out[sl], h[sl], body[sl]
        # 切線以上：整塊換成頭髮圖（含透明）
        o[:cut] = hv[:cut]
        # 切線以下：頭髮鍵色＋貼著頭髮的深色外框
        g = hm['green'][sl].copy(); g[:cut] = False
        near = ndimage.binary_dilation(g, iterations=10)
        dark = hsv(hv)[2] < .42
        hk = masks(hv)
        layer = g | (near & dark & (hv[..., 3] > .3) & ~hk['mag'] & ~hk['blue'])
        a = hv[..., 3:4] * layer[..., None]
        o[..., :3] = hv[..., :3] * a + o[..., :3] * (1 - a)
        o[..., 3:4] = a + o[..., 3:4] * (1 - a)
        print(f'view {x0}: shift ({dx},{dy}) cut {cut}', file=sys.stderr)
    return out

if __name__ == '__main__':
    bodyp, headp, outp, hair, top, bot = sys.argv[1:7]
    img = compose(load(bodyp), load(headp))
    img[..., 3] = np.where(img[..., 3] < 8 / 255, 0, img[..., 3])
    m = masks(img, thr=0.02)
    recolor(img, m['green'], hair); recolor(img, m['mag'], top); recolor(img, m['blue'], bot)
    Image.fromarray((np.clip(img, 0, 1) * 255 + .5).astype(np.uint8)).save(outp)
