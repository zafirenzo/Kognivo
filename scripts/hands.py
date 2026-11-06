"""Two hands reaching for each other, printed riso from code (public/prints/hand-left.webp, hand-right.webp).

    python3 scripts/hands.py

Each hand is a signed-distance model (forearm, palm, jointed fingers and thumb, all smooth-blended), ray-marched
with scripts/etch.py and separated into two inks the way scripts/riso.py prints everything else: a flat pink body,
blue halftone shadows, slightly out of register. The background is transparent so the page can slide the hands
over anything. Left hand: open and resting, the index finger just lifting. Right hand: reaching, index finger
straight. They meet in the middle of the screen.
"""
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, 'scripts')
import etch  # noqa: E402
from etch import F, fbm, noise, smooth, capsule, smin, box, rot  # noqa: E402
from riso import INK, PAPER, halftone, drum, shift  # noqa: E402

OUT = 'public/prints/'


def finger(p, base, segs, curl, spread, r0):
    """A finger of three bones. Each joint bends down (around z) by `curl`, the whole finger fans by `spread` (around y)."""
    d = np.full(len(p), 9, F)
    a = base.copy()
    direction = np.array([np.cos(np.radians(spread)), 0, -np.sin(np.radians(spread))], F)
    pitch = 0.0
    r = r0
    for i, L in enumerate(segs):
        pitch += curl[i]
        c, s = np.cos(np.radians(pitch)), np.sin(np.radians(pitch))
        dv = np.array([direction[0] * c, -s, direction[2] * c], F)
        b = a + dv * L
        d = smin(d, etch.cone_seg(p, a, b, r, r * 0.86), 0.02)
        a, r = b, r * 0.86
    tip = etch.sphere(p, a, r * 0.98)
    return smin(d, tip, 0.015)


def hand(curls, thumb_curl, reach):
    """reach: 0 = limp and open (left), 1 = reaching (right)."""
    v = lambda *a: np.array(a, F)

    def scene(p):
        arm = etch.cone_seg(p, v(-6.0, 0.06, 0.0), v(-0.38, 0.0, 0.0), 0.24, 0.15)
        palm = box(p, v(-0.06, 0.0, 0.0), (0.3, 0.06, 0.24), 0.07)
        d = smin(arm, palm, 0.16)
        bases = [(0.26, 0.185, 0.0), (0.29, 0.065, 2.0), (0.27, -0.055, 4.0), (0.22, -0.165, 7.0)]  # index .. little
        lengths = [(0.31, 0.2, 0.15), (0.34, 0.21, 0.16), (0.31, 0.2, 0.15), (0.25, 0.16, 0.12)]
        radii = [0.062, 0.064, 0.06, 0.052]
        for (bx, bz, sp), L, rr, cu in zip(bases, lengths, radii, curls):
            d = smin(d, finger(p, v(bx, 0.0, bz), L, cu, sp, rr), 0.05)
        # thumb: from the inner palm edge, forward and in
        t0 = v(-0.12, -0.03, 0.22)
        t1 = t0 + v(0.17, -0.03, 0.12)
        t2 = t1 + v(0.16 + 0.04 * reach, -0.02 - thumb_curl * 0.06, 0.02)
        thumb = smin(etch.cone_seg(p, t0, t1, 0.075, 0.06), etch.cone_seg(p, t1, t2, 0.06, 0.048), 0.03)
        d = smin(d, smin(thumb, etch.sphere(p, t2, 0.047), 0.02), 0.07)
        return d, np.zeros(len(p), np.int64)

    return scene


def print_hand(name, scene, flip, seed, tilt):
    w, h = 1500, 760
    rng = np.random.default_rng(seed)
    # turn the hand a little toward the camera so the fingers read, and tilt the arm up into the frame
    M = rot('x', -24) @ rot('z', tilt)

    def posed(p):
        return scene((p - np.array([0.75, 0.0, 0.0], F)) @ M.T)

    m = etch.march(posed, w, h, np.array([0.0, -0.35, 2.6], F), np.array([0.0, 0.0, 0.0], F), 0.42, (-0.45, 0.8, 0.6))
    dark, hit, ys, xs = m['dark'], m['hit'], m['ys'], m['xs']
    gy, gx = np.gradient(hit.astype(F))
    edge = np.clip(np.hypot(gx, gy) * 1.2, 0, 1)

    body = drum(hit.astype(F) * 0.95, rng, h, w)
    shade_tone = np.where(hit, np.clip(dark * 1.15 - 0.08, 0, 1), 0)
    shade = drum(np.maximum(halftone(shade_tone, ys, xs, 15, 6.0), edge * 0.85) * hit, rng, h, w)
    shade = shift(shade, rng, 5)  # the second drum, out of register

    rgb = np.ones((h, w, 3), F) * PAPER
    rgb *= 1 - body[..., None] * (1 - INK['pink'][None, None])
    rgb *= 1 - shade[..., None] * (1 - INK['blue'][None, None])
    alpha = np.clip(np.maximum(body, shade), 0, 1)
    img = Image.fromarray(np.dstack([np.clip(rgb, 0, 1) * 255, alpha * 255]).astype(np.uint8), 'RGBA')
    if flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    img.save(f'{OUT}{name}.webp', quality=90, method=6)
    print('printed', name)


if __name__ == '__main__':
    # left: resting, fingers soft, index just lifting
    print_hand('hand-left', hand([(4, 10, 8), (14, 22, 16), (22, 28, 18), (30, 30, 20)], 0.5, 0.0), False, 31, 6)
    # right: reaching, index straight, the rest gently curled
    print_hand('hand-right', hand([(-2, 2, 2), (24, 34, 26), (34, 40, 26), (40, 42, 26)], 1.0, 1.0), True, 32, -4)
