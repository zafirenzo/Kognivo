"""Kognivo's posters: every product printed as a riso poster, from code.

    python3 scripts/riso.py              # all posters
    python3 scripts/riso.py macropad     # one poster
Writes WebP files to public/prints/. Deterministic: same seed, same print.

Each instrument is the same signed-distance scene as scripts/etch.py, ray-marched for its shading.
The shading is then separated into spot inks the way a risograph prints: a flat backdrop shape in
one ink, the lit body of the object as a halftone in a second, its shadows as a halftone in a third,
each on its own screen angle, each drum a few pixels out of register, with the speckle and patchy
coverage of real soy ink on uncoated paper. Inks multiply where they overlap, so two inks make a third.
"""
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, 'scripts')
import etch  # noqa: E402
from etch import F, fbm, noise, smooth  # noqa: E402

OUT = 'public/prints/'
PAPER = np.array([247, 243, 234], F) / 255
INK = {
    'pink': np.array([255, 72, 176], F) / 255,
    'blue': np.array([0, 120, 191], F) / 255,
    'yellow': np.array([255, 232, 0], F) / 255,
    'orange': np.array([255, 108, 47], F) / 255,
    'teal': np.array([0, 131, 138], F) / 255,
    'purple': np.array([118, 91, 167], F) / 255,
}
# (backdrop, body, shadow): every poster gets its own three drums.
PALETTES = [
    ('yellow', 'pink', 'blue'),
    ('pink', 'yellow', 'blue'),
    ('blue', 'yellow', 'pink'),
    ('orange', 'pink', 'blue'),
    ('teal', 'yellow', 'pink'),
    ('yellow', 'orange', 'purple'),
    ('pink', 'teal', 'blue'),
    ('purple', 'yellow', 'pink'),
]


def halftone(tone, ys, xs, angle, period):
    """Round dots on a rotated screen; dot area follows tone (0..1)."""
    a = np.radians(angle)
    u = (xs * np.cos(a) + ys * np.sin(a)) / period
    v = (-xs * np.sin(a) + ys * np.cos(a)) / period
    d = np.hypot(u - np.round(u), v - np.round(v))  # 0 at a cell centre, ~0.7 at its corner
    r = np.sqrt(np.clip(tone, 0, 1)) * 0.72
    return smooth(r + 0.06, r - 0.06, d) * (tone > 0.02)


def shift(a, rng, k=7):
    """Out of register by a few pixels; paper shows at the edge the drum missed."""
    dy, dx = int(rng.integers(-k, k + 1)), int(rng.integers(-k, k + 1))
    out = np.zeros_like(a)
    h, w = a.shape
    out[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = a[max(-dy, 0):h + min(-dy, 0), max(-dx, 0):w + min(-dx, 0)]
    return out


def drum(cov, rng, h, w):
    """Real ink on a real drum: patchy coverage, and white speckle where the paper fibre refused it."""
    starve = 0.82 + 0.18 * fbm(h, w, rng, cells=(300, 120, 50))
    speck = noise(h, w, 2.2, rng) > 0.9
    return np.clip(cov * starve * (1 - 0.55 * speck), 0, 1)


def backdrop(kind, ys, xs, h, w, cx, cy):
    """The flat shape every poster stands on."""
    if kind == 'sun':
        return smooth(0.36 * w + 2, 0.36 * w - 2, np.hypot(xs - cx, ys - cy * 0.86))
    if kind == 'arch':
        r = 0.34 * w
        top = cy * 0.82
        arc = np.hypot(xs - cx, ys - top) < r
        return ((arc | ((np.abs(xs - cx) < r) & (ys > top))) & (ys < h * 0.9)).astype(F)
    if kind == 'half':
        return (ys < h * 0.56).astype(F)
    if kind == 'stripes':
        return ((np.mod(ys, 70) < 34) & (ys < h * 0.62)).astype(F)
    if kind == 'rings':
        d = np.hypot(xs - cx, ys - cy * 0.86)
        return ((np.mod(d, 64) < 30) & (d < 0.46 * w)).astype(F)
    return smooth(0.42 * w, 0.4 * w, np.abs(xs - cx) + np.abs(ys - cy * 0.86) * 0.7)  # 'diamond'


SHAPES = ['sun', 'arch', 'half', 'rings', 'stripes', 'diamond']


def poster(name, scene, cam, look, fov=0.62, seed=1, inks=None, shape=None, w=900, h=1125, proof=False):
    rng = np.random.default_rng(seed)
    m = etch.march(scene, w, h, np.array(cam, F), np.array(look, F), fov, (-0.55, 0.72, 0.5))
    dark, hit, floor, ys, xs = m['dark'], m['hit'], m['floor'], m['ys'], m['xs']
    bg, body, shade = inks or PALETTES[seed % len(PALETTES)]

    # where the object sits on the page, so the backdrop centres on it
    yy, xx = np.nonzero(hit)
    cx, cy = (xx.mean(), yy.mean()) if len(xx) else (w / 2, h / 2)

    # contour: the press can't hold a hairline, so it is a soft 2px edge in the shadow ink
    gy, gx = np.gradient(hit.astype(F))
    edge = np.clip(np.hypot(gx, gy) * 1.4, 0, 1)
    edge = np.maximum(edge, np.roll(edge, 1, 0))

    layers = []
    if not proof:
        bd = backdrop(shape or SHAPES[seed % len(SHAPES)], ys, xs, h, w, cx, cy)
        bd = bd * (1 - hit * 0.0)  # the object prints over it; inks multiply
        layers.append((drum(bd * 0.92, rng, h, w), INK[bg]))
        lit = np.where(hit, 0.35 + 0.6 * (1 - dark), 0)
        layers.append((drum(halftone(lit, ys, xs, 75, 7.5) * hit, rng, h, w), INK[body]))
    sh = np.where(hit, np.clip(dark * 1.05 - 0.12, 0, 1), np.where(floor, np.clip(dark - 0.1, 0, 1) * 1.2, 0))
    if proof:  # one-ink proof: everything in the one drum, coarser screen
        sh = np.where(hit, np.clip(0.18 + dark * 0.85, 0, 1), sh)
    shade_cov = np.maximum(halftone(sh, ys, xs, 15, 6.5 if not proof else 8), edge * 0.9)
    layers.append((drum(shade_cov, rng, h, w), INK[shade]))

    rgb = np.ones((h, w, 3), F) * PAPER
    rgb *= (1 - 0.05 * (fbm(h, w, rng, cells=(40, 10, 3)) - 0.5))[..., None]  # paper fibre
    for cov, ink in layers:
        a = shift(cov, rng)[..., None]
        rgb *= 1 - a * (1 - ink[None, None])
    Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(f'{OUT}{name}.webp', quality=88, method=6)
    print('printed', name)


# name: (scene, cam, look, fov, seed)
JOBS = {
    'armillary': (etch.scene_armillary, (0.0, 1.05, 3.1), (0, 0.9, 0), 0.62, 1),
    'hourglass': (etch.scene_hourglass, (0.25, 0.95, 2.55), (0, 0.6, 0), 0.62, 2),
    'metronome': (etch.scene_metronome, (0.75, 0.95, 2.45), (0, 0.58, 0), 0.62, 3),
    'inkwell': (etch.scene_inkwell, (0.35, 1.0, 2.8), (0, 0.72, 0), 0.62, 4),
    'padlock': (etch.scene_padlock, (0.4, 0.95, 2.55), (0, 0.6, 0), 0.62, 5),
    'macropad': (etch.scene_macropad, (0.6, 1.9, 2.5), (0, 0.25, 0), 0.6, 6),
    'beacon': (etch.scene_beacon, (0.25, 0.95, 2.75), (0, 0.82, 0), 0.62, 7),
    'orrery': (etch.scene_orrery, (0.25, 1.4, 2.7), (0, 0.72, 0), 0.62, 8),
    'dividers': (etch.scene_dividers, (0.6, 1.5, 3.0), (0, 0.75, 0), 0.62, 9),
    'magnifier': (etch.scene_magnifier, (0.2, 1.7, 2.7), (0, 0.7, 0), 0.6, 10),
}


def main(only=None):
    import os
    os.makedirs(OUT, exist_ok=True)
    for n, (sc, cam, look, fov, seed) in JOBS.items():
        if not only or only == n:
            poster(n, sc, cam, look, fov, seed)
    # Coming soon: one-ink proofs of the shapes under cloth. Not printed in full until they ship.
    proof_inks = ['blue', 'pink', 'teal', 'purple', 'blue', 'orange', 'pink', 'teal']
    for i, hs in enumerate(etch.hidden_sets()):
        n = f'cloth-{i + 2:02d}'
        if not only or only == n:
            ink = proof_inks[i]
            poster(n, etch.make_cloth(hs, 40 + i), (0.0, 1.1, 3.0), (0, 0.65, 0), 0.62, 20 + i, inks=(ink, ink, ink), proof=True)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
