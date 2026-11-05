import numpy as np
from PIL import Image
def load(p): return np.asarray(Image.open(p).convert('RGBA')).astype(np.float32)/255
def hsv(a):
    r,g,b=a[...,0],a[...,1],a[...,2]
    mx=a[...,:3].max(-1); mn=a[...,:3].min(-1); d=mx-mn+1e-6; s=(mx-mn)/(mx+1e-6)
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
    return h,s,mx
def masks(a, thr=.5):
    h,s,v=hsv(a); op=a[...,3]>thr
    return dict(green=op&(h>85)&(h<175)&(s>.25), mag=op&(h>265)&(h<335)&(s>.25), blue=op&(h>200)&(h<258)&(s>.3), op=op)
VIEWS=[(0,512),(512,1024),(1024,1536)]
def bbox(m):
    ys,xs=np.nonzero(m); return (xs.min(),ys.min(),xs.max(),ys.max()) if len(xs) else None
