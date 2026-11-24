# Fit each letter's box to the AmiT original (src/amit-0.png): render the glyph at the original's 106x54 (8x
# supersampled coverage), compare with that letter's pixels in the original, and move the box edges (and the m's
# slant) to minimise the squared difference. Writes boxes.json, which rebuild_amit.py uses when the font matches.
#   A: the white fill inside its navy outline; m: the red pixels left of the i; T: the navy pixels right of the i.
# usage: ~/.venvs/trace/bin/python -I fit_letters.py [A/T font ...]   (default: Arial Bold.ttf, Arial Black.ttf;
#        the best-scoring face is kept for the A and T)
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label as cc
from scipy.optimize import minimize
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

S = 8  # supersampling
im = np.asarray(Image.open('src/amit-0.png').convert('RGBA')).astype(float)
H0, W0 = im.shape[:2]
pal = np.array([[42, 57, 130], [255, 255, 255], [166, 42, 48]], float)
lab = np.where(im[..., 3] > 110, ((im[..., :3][..., None, :] - pal[None, None]) ** 2).sum(-1).argmin(-1), -1)

def window(x0, y0, x1, y1):
    w = np.zeros(lab.shape, bool); w[y0:y1, x0:x1] = True; return w

# targets: (window the loss is measured over, target mask)
wA = window(18, 11, 37, 35)
comp, _ = cc((lab == 1) & wA)
tA = comp == comp[28, 27]  # the white component through the A's crossbar
wm = window(35, 16, 60, 36); tm = (lab == 2) & wm
wT = window(68, 11, 86, 35); tT = (lab == 0) & wT

class Flatten(BasePen):
    """Glyph outline -> list of polygons (curves sampled)."""
    def __init__(self, gs):
        super().__init__(gs); self.polys, self.cur = [], []
    def _moveTo(self, p): self.cur = [p]
    def _lineTo(self, p): self.cur.append(p)
    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for t in np.linspace(0, 1, 9)[1:]:
            self.cur.append(tuple((1 - t) ** 3 * np.array(p0) + 3 * t * (1 - t) ** 2 * np.array(p1) + 3 * t * t * (1 - t) * np.array(p2) + t ** 3 * np.array(p3)))
    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for t in np.linspace(0, 1, 7)[1:]:
            self.cur.append(tuple((1 - t) ** 2 * np.array(p0) + 2 * t * (1 - t) * np.array(p1) + t * t * np.array(p2)))
    def _closePath(self): self.polys.append(self.cur); self.cur = []
    _endPath = _closePath

def font_path(fontfile):
    name, _, idx = fontfile.partition('#')
    for d in ('/System/Library/Fonts/Supplemental/', '/System/Library/Fonts/'):
        if os.path.exists(d + name): return d + name, int(idx or 0)

def outline(fontfile, ch):
    """Glyph polygons in font units, plus the glyph set (for bounds)."""
    p, i = font_path(fontfile); f = TTFont(p, fontNumber=i); gs = f.getGlyphSet(); g = f.getBestCmap()[ord(ch)]
    return gs, g

def coverage(gs, g, box, slant):
    """Same placement as rebuild_amit.glyph(), in original px: slant, then scale the ink box into box."""
    k = np.tan(np.radians(slant))
    bp = BoundsPen(gs); gs[g].draw(TransformPen(bp, (1, 0, k, 1, 0, 0))); gx0, gy0, gx1, gy1 = bp.bounds
    x0, y0, x1, y1 = box
    sx, sy = (x1 - x0) / (gx1 - gx0), (y1 - y0) / (gy1 - gy0)
    pen = Flatten(gs)
    gs[g].draw(TransformPen(pen, (sx * S, 0, sx * k * S, -sy * S, (x0 - gx0 * sx) * S, (y1 + gy0 * sy) * S)))
    acc = np.zeros((H0 * S, W0 * S), bool)
    for poly in pen.polys:  # even-odd: counters cut out
        m = Image.new('1', (W0 * S, H0 * S), 0); ImageDraw.Draw(m).polygon([tuple(q) for q in poly], fill=1)
        acc ^= np.asarray(m)
    return acc.reshape(H0, S, W0, S).mean((1, 3))

def fit(fontfile, ch, box, target, win, slant=None):
    gs, g = outline(fontfile, ch)
    x = list(box) + ([slant] if slant is not None else [])
    def loss(v):
        c = coverage(gs, g, v[:4], v[4] if slant is not None else 0)
        return ((c - target) ** 2)[win].sum()
    r = minimize(loss, x, method='Nelder-Mead', options={'xatol': 0.02, 'fatol': 0.01, 'maxiter': 600})
    c = coverage(gs, g, r.x[:4], r.x[4] if slant is not None else 0) > 0.5
    iou = (c & target & win).sum() / ((c | target) & win).sum()
    return r.x, r.fun, iou

out = {}
sans = sys.argv[1:] or ['Arial Bold.ttf', 'Arial Black.ttf']
best = None
for f in sans:
    (bA, lA, iA), (bT, lT, iT) = fit(f, 'A', (20.2, 13.2, 34.8, 33.9), tA, wA), fit(f, 'T', (70.2, 13.2, 82.9, 33.9), tT, wT)
    print(f'{f:28s} A loss {lA:6.2f} IoU {iA:.3f} | T loss {lT:6.2f} IoU {iT:.3f}')
    if best is None or lA + lT < best[0]: best = (lA + lT, f, bA, bT)
_, f, bA, bT = best
out['A'] = {'font': f, 'box': [round(v, 2) for v in bA]}
out['T'] = {'font': f, 'box': [round(v, 2) for v in bT]}
# m candidates: (face, starting slant); italic faces start near 0, upright ones near the original's ~9 degrees
bestm = None
for M, s0 in [('Verdana Bold Italic.ttf', 1.0), ('Tahoma Bold.ttf', 9.0)] + [('Arial Black.ttf', s) for s in (13.0, 15.0, 17.0, 19.0, 21.0, 24.0)]:
    bm, lm, im_ = fit(M, 'm', (38.2, 19.2, 57.5, 34.2), tm, wm, slant=s0)
    print(f'{M:28s} m loss {lm:6.2f} IoU {im_:.3f} slant {bm[4]:+.1f} deg')
    if bestm is None or lm < bestm[0]: bestm = (lm, M, bm)
_, M, bm = bestm
out['m'] = {'font': M, 'box': [round(v, 2) for v in bm[:4]], 'slant': round(bm[4], 2)}
json.dump(out, open('boxes.json', 'w'), indent=1)
print('A/T face:', f, '\n', json.dumps(out))
