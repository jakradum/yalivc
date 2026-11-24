# Rebuild the AmiT logo as clean vectors from the 106x54 original (src/amit-0.png), instead of tracing pixels:
#   swoosh  - the navy crescent's outline, minus the stretch hidden behind the letters, split at its two tips into an
#             outer and an inner edge; the tips stay sharp
#   letters - real glyph outlines (square corners, the original's stroke weight), each scaled into
#             the box it occupies in the original; A, m and T in Arial Black (m slanted ~17 degrees), the i in Times New
#             Roman Bold Italic;
#             the white A keeps its thin navy outline.
#             Boxes and the m's slant come from boxes.json (fit_letters.py, fitted to the original's pixels).
#   Swoosh edges are least-squares Bezier fits: the inner edge is a single cubic tip to tip (so it cannot wiggle),
#   fitted to the stretches not hidden by the letters; the outer edge is two cubics joined at its leftmost point.
# Output units: original pixels x 10 (viewBox 1060 x 540).
# usage: ~/.venvs/trace/bin/python -I rebuild_amit.py <out.svg> [debug.png]
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter
from skimage.measure import label, find_contours
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen

NAVY, RED, WHITE = '#2a3982', '#a62a30', '#ffffff'
U = 10  # output units per original pixel
UP = 12  # analysis upsampling

im = Image.open('src/amit-0.png').convert('RGBA')
W0, H0 = im.size
a = np.asarray(im).astype(float)
pal = np.array([[42, 57, 130], [255, 255, 255], [166, 42, 48]], float)
lab = np.where(a[..., 3] > 110, ((a[..., :3][..., None, :] - pal[None, None]) ** 2).sum(-1).argmin(-1), -1)

# --- swoosh -------------------------------------------------------------------------------------------------
navy = Image.fromarray(((lab == 0) * 255).astype('uint8')).resize((W0 * UP, H0 * UP), Image.LANCZOS).filter(ImageFilter.GaussianBlur(UP * 0.6))
m = np.asarray(navy) > 127
L = label(m)
big = L == (np.bincount(L.ravel())[1:].argmax() + 1)
c = max(find_contours(big.astype(float), 0.5), key=len) / UP  # (y, x) in original px
ys, xs = c[:, 0], c[:, 1]
# letters sit on top of the swoosh: their outline pixels are not the swoosh's edge
hidden = ((xs > 18.5) & (xs < 37) & (ys > 11) & (ys < 36.5)) | ((xs > 68.5) & (xs < 85) & (ys > 11) & (ys < 36))
top = int(np.argmin(ys + 0.02 * xs))     # upper tip
right = int(np.argmax(xs - 0.02 * ys))   # right tip
n = len(c)
def walk(i, j, step):
    out, k = [], i
    while True:
        out.append(k)
        if k == j: return out
        k = (k + step) % n
p1, p2 = walk(top, right, 1), walk(top, right, -1)
outer, inner = (p1, p2) if xs[p1].min() < xs[p2].min() else (p2, p1)  # the outer edge reaches furthest left

def fit_cubic(P, t1, t2, iters=40):
    """Least-squares cubic Bezier through P[0]..P[-1] with fixed unit end tangents t1, t2 (Schneider's method,
    with Newton reparameterisation). Returns control points (4, 2) and max distance error in px."""
    P = np.asarray(P, float); p0, p3 = P[0], P[-1]
    u = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]; u /= u[-1]
    for _ in range(iters):
        b = np.stack([(1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u ** 2 * (1 - u), u ** 3], 1)
        A1, A2 = t1[None] * b[:, 1:2], t2[None] * b[:, 2:3]
        Cm = np.array([[(A1 * A1).sum(), (A1 * A2).sum()], [(A1 * A2).sum(), (A2 * A2).sum()]])
        tmp = P - (b[:, :1] + b[:, 1:2]) * p0 - (b[:, 2:3] + b[:, 3:]) * p3
        X = np.array([(A1 * tmp).sum(), (A2 * tmp).sum()])
        al1, al2 = np.linalg.solve(Cm, X)
        C = np.array([p0, p0 + al1 * t1, p3 + al2 * t2, p3])
        q = lambda u: (((1 - u) ** 3)[:, None] * C[0] + (3 * u * (1 - u) ** 2)[:, None] * C[1] + (3 * u ** 2 * (1 - u))[:, None] * C[2] + (u ** 3)[:, None] * C[3])
        d1 = lambda u: (3 * (1 - u) ** 2)[:, None] * (C[1] - C[0]) + (6 * u * (1 - u))[:, None] * (C[2] - C[1]) + (3 * u ** 2)[:, None] * (C[3] - C[2])
        d2 = lambda u: (6 * (1 - u))[:, None] * (C[2] - 2 * C[1] + C[0]) + (6 * u)[:, None] * (C[3] - 2 * C[2] + C[1])
        r = q(u) - P; num = (r * d1(u)).sum(1); den = (d1(u) ** 2).sum(1) + (r * d2(u)).sum(1)
        u = np.clip(u - num / np.where(abs(den) < 1e-9, 1e-9, den), 0, 1); u[0], u[-1] = 0, 1
    err = np.hypot(*(q(u) - P).T).max()
    return C, err

def unit(v):
    v = np.asarray(v, float); return v / np.hypot(*v)

def pts_of(idx, drop_hidden=True):
    keep = [k for k in idx if not (drop_hidden and hidden[k])]
    if idx[0] not in keep: keep = [idx[0]] + keep
    if idx[-1] not in keep: keep = keep + [idx[-1]]
    P = np.array([[xs[k], ys[k]] for k in keep])
    return P[np.r_[True, np.hypot(*np.diff(P, axis=0).T) > 1e-6]]

Po, Pi = pts_of(outer), pts_of(inner)
tipA, tipB = (Po[0] + Pi[0]) / 2, (Po[-1] + Pi[-1]) / 2
Po[0] = Pi[0] = tipA; Po[-1] = Pi[-1] = tipB
# end tangents from the first/last stretch of each edge
# (over ~6 px: the tip pixels themselves curl and would point the wrong way)
tan_start = lambda P: unit(P[min(len(P) - 1, 120)] - P[0])
tan_end = lambda P: unit(P[max(0, len(P) - 121)] - P[-1])
# outer: two cubics joined at the leftmost point, where the edge runs straight down
L = int(np.argmin(Po[:, 0]))
Co1, e1 = fit_cubic(Po[:L + 1], tan_start(Po), np.array([0.0, -1.0]))
Co2, e2 = fit_cubic(Po[L:], np.array([0.0, 1.0]), tan_end(Po))
# inner: one cubic tip to tip (it cannot wiggle), from the visible stretches only
# The original shows white between the A and the m, so behind the A the edge must pass left of the A's right
# leg before it reappears under the m: two pinned points there (a single cubic still cannot wiggle).
gap = int(np.argmax(np.hypot(*np.diff(Pi, axis=0).T)))
pin = np.repeat(np.array([[33.6, 22.0], [33.4, 27.0]]), 60, axis=0)  # repeated = weighted like the visible stretches
Pi_fit = np.vstack([Pi[:gap + 1], pin, Pi[gap + 1:]])
Ci, e3 = fit_cubic(Pi_fit, tan_start(Pi), tan_end(Pi))
print(f'fit error px: outer {e1:.2f} / {e2:.2f}, inner {e3:.2f}')
fmt = lambda C: 'C' + ' '.join(f'{v * U:.1f}' for v in C[1:].ravel())
swoosh = f'M{tipA[0] * U:.1f} {tipA[1] * U:.1f}' + fmt(Co1) + fmt(Co2) + fmt(Ci[::-1]) + 'Z'
# the fit as editable anchors (output units) for the editor at localhost:4852/edit; a saved edit (swoosh.json)
# replaces the fitted curve
r1 = lambda v: [round(float(v[0]) * U, 1), round(float(v[1]) * U, 1)]
json.dump({'anchors': [{'p': r1(tipA), 'in': r1(Ci[1]), 'out': r1(Co1[1])},
                       {'p': r1(Co1[3]), 'in': r1(Co1[2]), 'out': r1(Co2[1])},
                       {'p': r1(tipB), 'in': r1(Co2[2]), 'out': r1(Ci[2])}]}, open('swoosh-fit.json', 'w'))
if os.path.exists('swoosh.json'):
    an = json.load(open('swoosh.json'))['anchors']
    pt = lambda v: f'{v[0]:.1f} {v[1]:.1f}'
    swoosh = f'M{pt(an[0]["p"])}' + ''.join(f'C{pt(an[k]["out"])} {pt(an[(k + 1) % len(an)]["in"])} {pt(an[(k + 1) % len(an)]["p"])}' for k in range(len(an))) + 'Z'
    print('swoosh from swoosh.json (edited)')

# --- letters ------------------------------------------------------------------------------------------------
F = '/System/Library/Fonts/Supplemental/'
def glyph(fontfile, ch, box, slant=0, dot=1.0):
    """Glyph outline (optionally slanted, degrees) scaled so its ink box fills box = (x0, y0, x1, y1) in original px.
    fontfile: a file in /System/Library/Fonts[/Supplemental], 'name.ttc#3' for a face inside a collection.
    dot: scale for the highest contour (the i's dot) about its own centre; the box is placed from the unscaled glyph."""
    name, _, idx = fontfile.partition('#')
    path = next(d + name for d in (F, '/System/Library/Fonts/') if os.path.exists(d + name))
    f = TTFont(path, fontNumber=int(idx or 0)); gs = f.getGlyphSet(); g = f.getBestCmap()[ord(ch)]
    k = np.tan(np.radians(slant))
    bp = BoundsPen(gs); gs[g].draw(TransformPen(bp, (1, 0, k, 1, 0, 0))); gx0, gy0, gx1, gy1 = bp.bounds
    x0, y0, x1, y1 = box
    sx, sy = (x1 - x0) * U / (gx1 - gx0), (y1 - y0) * U / (gy1 - gy0)
    pen = SVGPathPen(gs)
    # font units -> slant -> scale into the box (y flipped)
    tp = TransformPen(pen, (sx, 0, sx * k, -sy, x0 * U - gx0 * sx, y1 * U + gy0 * sy))
    if dot == 1.0:
        gs[g].draw(tp); return pen.getCommands()
    rec = RecordingPen(); gs[g].draw(rec)
    contours, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ('closePath', 'endPath'): contours.append(cur); cur = []
    pts = lambda c: [p for _, a in c for p in a if p is not None]
    top = max(contours, key=lambda c: min(p[1] for p in pts(c)))  # the dot sits above the stem
    P = np.array(pts(top)); cx, cy = (P.min(0) + P.max(0)) / 2
    sc = lambda p: (cx + (p[0] - cx) * dot, cy + (p[1] - cy) * dot)
    for c in contours:
        for op, args in c:
            getattr(tp, op)(*([sc(p) if p is not None else None for p in args] if c is top else args))
    return pen.getCommands()

# A, m and T: Arial Black, boxes (and the m's slant) fitted by fit_letters.py; the i is Times New Roman Bold Italic,
# its box measured from the original's colour regions.
FIT = json.load(open('boxes.json'))
SANS = os.environ.get('SANS', FIT['A']['font'])
I_FONT = os.environ.get('I_FONT', 'Times New Roman Bold Italic.ttf')
I_STROKE = float(os.environ.get('I_STROKE', '0.5'))  # px of extra weight on the i, to sit with the heavy m
A = glyph(SANS, 'A', FIT['A']['box'])

# SPACE: the i moves right by this many original px (+1 chosen 24 Nov 2026); A, m and T stay where the original has them
SPACE = float(os.environ.get('SPACE', '1'))
# M_FONT / M_SLANT: the m's face and slant (degrees; 0 for a face that is already italic)
m_ = glyph(os.environ.get('M_FONT', FIT['m']['font']), 'm', FIT['m']['box'], slant=float(os.environ.get('M_SLANT', FIT['m']['slant'])))
I_DOT = float(os.environ.get('I_DOT', '0.87'))  # the i's dot, scaled down (24 Nov 2026)
i_glyph = glyph(I_FONT, 'i', (59.6 + SPACE, 13.0, 67.2 + SPACE, 35.0), dot=I_DOT)
T = glyph(SANS, 'T', FIT['T']['box'])

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W0 * U} {H0 * U}" width="{W0 * 4}" height="{H0 * 4}">'
       f'<path fill="{NAVY}" d="{swoosh}"/>'
       f'<path fill="{WHITE}" stroke="{NAVY}" stroke-width="{1.1 * U:.0f}" stroke-linejoin="round" paint-order="stroke" d="{A}"/>'
       f'<path fill="{RED}" d="{m_}"/>'
       f'<path fill="{RED}" d="{i_glyph}"' + (f' stroke="{RED}" stroke-width="{I_STROKE * U:.1f}" stroke-linejoin="miter"' if I_STROKE else '') + '/>'
       f'<path fill="{NAVY}" d="{T}"/></svg>\n')
open(sys.argv[1], 'w').write(svg)
print('wrote', sys.argv[1], f'| outer {len(outer)} pts ({sum(hidden[k] for k in outer)} hidden), inner {len(inner)} pts ({sum(hidden[k] for k in inner)} hidden)')
if len(sys.argv) > 2:  # debug: contour points used, over the enlarged original
    from PIL import ImageDraw
    big_im = im.resize((W0 * UP, H0 * UP), Image.NEAREST).convert('RGB'); d = ImageDraw.Draw(big_im)
    for k in range(n):
        col = (255, 160, 0) if hidden[k] else ((0, 200, 0) if k in set(outer) else (255, 0, 255))
        d.point((xs[k] * UP, ys[k] * UP), fill=col)
    big_im.save(sys.argv[2])
