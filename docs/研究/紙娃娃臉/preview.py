"""模擬 paperdoll.js（含臉部疊圖、眼睛顏色、瀏海遮擋）：
python preview.py out.png "部件,部件,...|頭髮|皮膚|上衣|下身|鞋子|配件|眼睛" ..."""
import sys, numpy as np
from PIL import Image
sys.path.insert(0, r'D:/UserData/Documents/WS/WS_FirstSymphony/tools')
import castle_paperdoll as cp
DOLL = cp.OUT; W, H = 80, 136
def lab(hexc):
    rgb = np.array([[int(hexc[i:i+2], 16)/255 for i in (1,3,5)]])
    return (np.cbrt(cp.srgb2lin(rgb) @ cp.M1.T) @ cp.M2.T)[0]
def from_lab(lab_):
    lms = (lab_ @ np.linalg.inv(cp.M2).T) ** 3
    lin = lms @ np.linalg.inv(cp.M1).T
    return np.clip(np.where(lin <= 0.0031308, lin*12.92, 1.055*np.clip(lin,0,None)**(1/2.4)-0.055), 0, 1)
def sheet(p):
    return np.asarray(Image.open(DOLL / f'{p}.webp').convert('RGBA')).astype(float)/255
def doll(parts, colors):
    out = np.zeros((H, W*3, 4))
    head = next(p for p in parts if p.startswith('head_'))
    hs, bs = sheet(head), sheet('head_short_none')
    covered = (np.maximum(hs[H:2*H, ..., 3], hs[6*H:7*H, ..., 3]) > 128/255) & (bs[H:2*H, ..., 3] < 64/255)
    for p in parts:
        sh = sheet(p)
        for layer in range(sh.shape[0] // H):
            src = sh[layer*H:(layer+1)*H]
            rgb = src[..., :3].copy(); a = src[..., 3:4].copy()
            if p.startswith('face_'):
                a[covered] = 0
            if layer:
                L0, A, B = lab(colors[layer-1])
                L = np.clip(L0 + (src[..., 0]-0.5)*0.9, 0, 1)
                rgb = from_lab(np.stack([L, np.full_like(L, A), np.full_like(L, B)], -1))
            oa = a + out[..., 3:4]*(1-a)
            out[..., :3] = np.where(oa > 0, (rgb*a + out[..., :3]*out[..., 3:4]*(1-a))/np.maximum(oa, 1e-6), 0)
            out[..., 3:4] = oa
    return out
if __name__ == '__main__':
    rows = []
    for spec in sys.argv[2:]:
        parts, *cols = spec.split('|')
        rows.append(doll(parts.split(','), cols))
    canvas = np.zeros((H*len(rows), W*3, 4))
    for i, r in enumerate(rows): canvas[i*H:(i+1)*H] = r
    im = Image.fromarray((canvas*255+.5).astype(np.uint8))
    bg = Image.new('RGBA', im.size, (196, 160, 130, 255)); bg.alpha_composite(im)
    bg.resize((im.width*4, im.height*4), Image.NEAREST).save(sys.argv[1])
