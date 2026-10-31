"""Kognivo's plates: copperplate etchings of instruments, rendered from code.

Every image on the site is drawn here, so the house owns all of it. Run from the repo root:
    python3 scripts/etch.py            # all plates
    python3 scripts/etch.py armillary  # one plate
Writes WebP files to public/plates/. Deterministic: same seed, same plate.

How it works: each instrument is a signed-distance scene, ray-marched in numpy. The shaded
result is never shown; it only decides how thick the engraved lines are. Lines are slices of
the object by a family of parallel planes, so they wrap the form the way a burin follows it,
then cross-hatch where the shadow is deep. Paper is laid (fine laid lines, chain lines, fibre)
and every plate leaves its plate mark.
"""
import sys
import numpy as np
from PIL import Image

OUT = 'public/plates/'
PAPER = np.array([237, 231, 218], np.float32) / 255
INK = np.array([43, 17, 20], np.float32) / 255  # oxblood-black etching ink
F = np.float32


# ---------- noise ----------
def noise(h, w, cell, rng):
    gh, gw = max(2, int(h / cell)), max(2, int(w / cell))
    a = rng.random((gh, gw)).astype(F)
    return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), F) / 255


def fbm(h, w, rng, cells=(160, 60, 22, 7), wts=(0.45, 0.3, 0.17, 0.08)):
    return sum(wt * noise(h, w, c, rng) for c, wt in zip(cells, wts))


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


# ---------- SDF primitives (p: (N,3)) ----------
def rot(axis, deg):
    a = np.radians(deg)
    c, s = np.cos(a), np.sin(a)
    if axis == 'x':
        return np.array([[1, 0, 0], [0, c, -s], [0, s, c]], F)
    if axis == 'y':
        return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], F)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], F)


def sphere(p, c, r):
    return np.linalg.norm(p - c, axis=1) - r


def torus(p, c, R, r, M):
    q = (p - c) @ M  # into ring frame; ring lies in local xz
    xz = np.hypot(q[:, 0], q[:, 2]) - R
    return np.hypot(xz, q[:, 1]) - r


def cyl(p, c, r, h):
    q = p - c
    d = np.stack([np.hypot(q[:, 0], q[:, 2]) - r, np.abs(q[:, 1]) - h], 1)
    return np.minimum(d.max(1), 0) + np.linalg.norm(np.maximum(d, 0), axis=1)


def box(p, c, b, rr=0.0, M=None):
    q = p - c
    if M is not None:
        q = q @ M
    q = np.abs(q) - (np.array(b, F) - rr)
    return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(q.max(1), 0) - rr


def capsule(p, a, b, r):
    pa, ba = p - a, b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[:, None] * ba, axis=1) - r


def cone_seg(p, a, b, ra, rb):
    # tapered capsule: radius goes ra -> rb from a to b
    pa, ba = p - a, b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[:, None] * ba, axis=1) - (ra + (rb - ra) * h)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


# ---------- scenes: return (distance, material id) ----------
def scene_armillary(p):
    parts = [
        sphere(p, np.array([0, 1.05, 0], F), 0.16),  # earth
        torus(p, np.array([0, 1.05, 0], F), 0.62, 0.028, rot('x', 90)),  # meridian
        torus(p, np.array([0, 1.05, 0], F), 0.62, 0.024, rot('z', 23) @ rot('x', 0)),  # equator, tilted
        torus(p, np.array([0, 1.05, 0], F), 0.56, 0.02, rot('z', -18) @ rot('x', 64)),  # ecliptic
        torus(p, np.array([0, 1.05, 0], F), 0.5, 0.016, rot('x', 90) @ rot('z', 60)),  # colure
        capsule(p, np.array([0, 0.18, 0], F), np.array([0, 1.9, 0], F) @ np.eye(3, dtype=F), 0.018),  # axis rod
        cyl(p, np.array([0, 0.28, 0], F), 0.05, 0.18),  # stem
        cyl(p, np.array([0, 0.06, 0], F), 0.36, 0.06),  # base
        torus(p, np.array([0, 0.13, 0], F), 0.3, 0.025, np.eye(3, dtype=F)),  # base moulding
    ]
    # tilt the axis rod with the meridian frame
    D = np.stack(parts, 1)
    return D.min(1), D.argmin(1)


def make_cloth(hidden, seed):
    """A sheet thrown over hidden shapes: the envelope, inflated, with folds falling to the floor."""
    rng = np.random.default_rng(seed)
    ph = rng.uniform(0, 6.28, 4)
    k = rng.integers(7, 12)

    def scene(p):
        d = np.full(len(p), 9, F)
        for f in hidden:
            d = smin(d, f(p), 0.12)
        top = np.maximum(d.copy(), -p[:, 1])
        # skirt: the cloth falls from the shape's widest reach toward the floor, flaring out
        y = np.clip(p[:, 1], 0, None)
        r = np.hypot(p[:, 0], p[:, 2])
        a = np.arctan2(p[:, 2], p[:, 0])
        H = 1.35
        skirt = r - (0.34 + 0.34 * (1 - np.clip(y / 0.5, 0, 1)) ** 2.2)
        skirt = np.maximum(skirt, p[:, 1] - 0.5)
        env = smin(top - 0.05, skirt, 0.22)
        fall = 1 - np.clip(y / H, 0, 1)
        folds = (0.05 * np.sin(a * k + ph[0] + 2.2 * y) + 0.025 * np.sin(a * (k + 5) + ph[1] - 3 * y)) * (0.15 + fall ** 1.5)
        wrinkle = 0.008 * np.sin(p[:, 0] * 23 + ph[2]) * np.sin(p[:, 1] * 19 + ph[3])
        env = env + folds + wrinkle
        hem = 0.05 + 0.04 * np.sin(a * 5 + ph[2])
        env = np.maximum(env, hem * 0 - p[:, 1] + hem * (r > 0.3))
        return env, np.zeros(len(p), np.int64)

    return scene


def scene_dividers(p):
    hinge = np.array([0, 1.55, 0], F)
    l1, l2 = np.array([-0.42, 0.02, 0.05], F), np.array([0.42, 0.02, -0.05], F)
    parts = [
        cone_seg(p, hinge, l1, 0.045, 0.006),
        cone_seg(p, hinge, l2, 0.045, 0.006),
        cyl(p - hinge, np.zeros(3, F), 0.07, 0.035) if False else sphere(p, hinge, 0.075),
        capsule(p, hinge, hinge + np.array([0, 0.22, 0], F), 0.022),  # handle
        sphere(p, hinge + np.array([0, 0.26, 0], F), 0.045),
        torus(p, hinge, 0.09, 0.012, rot('x', 90)),
        box(p, np.array([0, 0.0, 0], F), (0.85, 0.004, 0.55), 0.002, rot('y', 8)),  # sheet of paper under it
    ]
    D = np.stack(parts, 1)
    return D.min(1), D.argmin(1)


def scene_magnifier(p):
    c = np.array([-0.05, 1.05, 0], F)
    M = rot('x', 70) @ rot('z', -28)
    q = (p - c) @ M
    rim = np.hypot(np.hypot(q[:, 0], q[:, 2]) - 0.42, q[:, 1]) - 0.035
    lens = np.maximum(np.hypot(q[:, 0], q[:, 2]) - 0.41, np.abs(q[:, 1]) - 0.012)
    hdir = np.array([0.62, -0.78, 0.12], F)
    hdir /= np.linalg.norm(hdir)
    s = c + hdir * 0.44
    parts = [
        rim,
        lens,
        capsule(p, s, s + hdir * 0.16, 0.03),  # ferrule
        cone_seg(p, s + hdir * 0.16, s + hdir * 0.72, 0.05, 0.065),  # handle
        box(p, np.array([0.05, 0.0, 0.1], F), (0.7, 0.004, 0.46), 0.002, rot('y', -6)),  # a letter under it
    ]
    D = np.stack(parts, 1)
    return D.min(1), D.argmin(1)


def _stand(p):
    return [cyl(p, np.array([0, 0.06, 0], F), 0.34, 0.06), cyl(p, np.array([0, 0.28, 0], F), 0.045, 0.18)]


def scene_hourglass(p):
    v = lambda *a: np.array(a, F)
    glass = smin(cone_seg(p, v(0, 0.62, 0), v(0, 0.2, 0), 0.03, 0.27), cone_seg(p, v(0, 0.62, 0), v(0, 1.04, 0), 0.03, 0.27), 0.04)
    sand = np.maximum(cone_seg(p, v(0, 0.62, 0), v(0, 0.2, 0), 0.02, 0.25), p[:, 1] - 0.34)
    parts = [glass, sand, cyl(p, v(0, 0.12, 0), 0.38, 0.06), cyl(p, v(0, 1.12, 0), 0.38, 0.06)]
    for a in (0, 120, 240):
        r = np.radians(a)
        parts.append(capsule(p, v(0.31 * np.cos(r), 0.16, 0.31 * np.sin(r)), v(0.31 * np.cos(r), 1.08, 0.31 * np.sin(r)), 0.026))
    D = np.stack(parts, 1)
    return D.min(1), D.argmin(1)


def scene_metronome(p):
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    k = np.cos(np.radians(10))
    body = np.maximum.reduce([np.abs(x) * k + y * np.sin(np.radians(10)) - 0.34 * k, np.abs(z) - 0.2, -y, y - 1.05])
    face = np.maximum.reduce([np.abs(x) * k + y * np.sin(np.radians(10)) - 0.22 * k, np.abs(z - 0.2) - 0.012, 0.15 - y, y - 0.95])
    piv = np.array([0, 0.24, 0.23], F)
    top = piv + np.array([0.26, 0.95, 0], F)
    parts = [body, face, capsule(p, piv, top, 0.014), box(p, piv + (top - piv) * 0.62, (0.06, 0.05, 0.03), 0.01), cyl(p, np.array([0, 0.03, 0], F), 0.44, 0.03) if False else box(p, np.array([0, 0.02, 0], F), (0.42, 0.02, 0.26), 0.01)]
    D = np.stack(parts, 1)
    return D.min(1), D.argmin(1)


def scene_padlock(p):
    v = lambda *a: np.array(a, F)
    body = box(p, v(0, 0.42, 0), (0.34, 0.3, 0.13), 0.06)
    # the shackle is lifted and swung open: a half ring on two legs, one leg out of the body
    c = v(0, 1.0, 0)
    q = p - c
    ring = np.hypot(np.hypot(q[:, 0], q[:, 1]) - 0.2, q[:, 2]) - 0.045
    ring = np.maximum(ring, -q[:, 1])
    legs = np.minimum(capsule(p, v(-0.2, 1.0, 0), v(-0.2, 0.62, 0), 0.045), capsule(p, v(0.2, 1.0, 0), v(0.2, 0.86, 0), 0.045))
    hole = np.maximum(np.minimum(np.hypot(p[:, 0], p[:, 1] - 0.47) - 0.045, box(p, v(0, 0.37, 0), (0.018, 0.08, 0.5))), np.abs(p[:, 2] - 0.13) - 0.03)
    parts = [np.maximum(body, -hole), np.minimum(ring, legs), box(p, v(0, 0.0, 0), (0.8, 0.004, 0.5), 0.002, rot('y', 10))]
    D = np.stack(parts, 1)
    return D.min(1), D.argmin(1)


def scene_inkwell(p):
    v = lambda *a: np.array(a, F)
    bottle = smin(cyl(p, v(0, 0.17, 0), 0.3, 0.15), cyl(p, v(0, 0.4, 0), 0.12, 0.1), 0.1)
    lip = torus(p, v(0, 0.5, 0), 0.12, 0.025, np.eye(3, dtype=F))
    a, b = v(0.02, 0.42, 0.0), v(-0.42, 1.55, 0.12)
    shaft = cone_seg(p, a, b, 0.008, 0.016)
    d = (b - a) / np.linalg.norm(b - a)
    vane = np.maximum(cone_seg(p, a + d * 0.35, b, 0.004, 0.11), np.abs((p - a) @ np.array([0.2, 0.05, 1], F) / np.linalg.norm([0.2, 0.05, 1])) - 0.012)
    parts = [bottle, lip, shaft, vane, box(p, v(0.1, 0.0, 0.1), (0.75, 0.004, 0.5), 0.002, rot('y', -12))]
    D = np.stack(parts, 1)
    return D.min(1), D.argmin(1)


def scene_macropad(p):
    v = lambda *a: np.array(a, F)
    tilt = rot('x', -7)
    base = box(p, v(0, 0.1, 0), (0.78, 0.09, 0.46), 0.05, tilt)
    keys = np.full(len(p), 9, F)
    for i in range(3):
        for j in range(2):
            c = v(-0.5 + i * 0.36, 0.23 + j * 0.03, -0.15 + j * 0.3)
            keys = np.minimum(keys, box(p, c, (0.14, 0.06, 0.12), 0.03, tilt))
    knob = cyl(p, v(0.62, 0.3, 0.02), 0.11, 0.09)
    grip = torus(p, v(0.62, 0.34, 0.02), 0.11, 0.02, np.eye(3, dtype=F))
    cable = capsule(p, v(-0.78, 0.1, -0.2), v(-1.4, 0.03, -0.55), 0.03)
    D = np.stack([base, keys, np.minimum(knob, grip), cable], 1)
    return D.min(1), D.argmin(1)


def scene_beacon(p):
    v = lambda *a: np.array(a, F)
    body = cyl(p, v(0, 0.45, 0), 0.24, 0.42)
    cap = sphere(p, v(0, 0.86, 0), 0.24) if False else cone_seg(p, v(0, 0.87, 0), v(0, 1.0, 0), 0.24, 0.1)
    vents = np.full(len(p), 9, F)
    for y in (0.3, 0.42, 0.54):
        vents = np.minimum(vents, torus(p, v(0, y, 0), 0.245, 0.016, np.eye(3, dtype=F)))
    ant = capsule(p, v(0.08, 0.98, 0), v(0.08, 1.72, 0), 0.016)
    tip = sphere(p, v(0.08, 1.74, 0), 0.04)
    foot = cyl(p, v(0, 0.03, 0), 0.34, 0.03)
    D = np.stack([body, cap, vents, np.minimum(ant, tip), foot], 1)
    return D.min(1), D.argmin(1)


def scene_orrery(p):
    v = lambda *a: np.array(a, F)
    c = v(0, 1.0, 0)
    parts = [sphere(p, c, 0.15)]
    arms = np.full(len(p), 9, F)
    worlds = np.full(len(p), 9, F)
    for ang, r, s, dy in ((30, 0.42, 0.06, -0.06), (150, 0.68, 0.09, -0.12), (260, 0.92, 0.075, -0.18)):
        a = np.radians(ang)
        end = c + v(r * np.cos(a), dy, r * np.sin(a))
        arms = np.minimum(arms, capsule(p, c + v(0, dy, 0), end, 0.012))
        arms = np.minimum(arms, capsule(p, end, end + v(0, 0.12, 0), 0.01))
        worlds = np.minimum(worlds, sphere(p, end + v(0, 0.12 + s, 0), s))
    parts += [arms, worlds, torus(p, c + v(0, -0.12, 0), 0.68, 0.006, np.eye(3, dtype=F)), capsule(p, v(0, 0.2, 0), c, 0.03)] + _stand(p)
    D = np.stack(parts, 1)
    return D.min(1), D.argmin(1)


# Per-material line planes (world normals) and spacing; lines are slices by these plane families.
HATCH = {
    'armillary': [((0, 1, 0.15), 30), ((1, 0.2, 0), 34), ((0.3, 1, 0.5), 30), ((0.6, 1, -0.3), 30), ((1, 0.6, 0), 34),
                  ((0, 1, 0), 26), ((0, 1, 0), 30), ((1, 0.05, 0.3), 30), ((0, 1, 0), 30)],
    'cloth': [((0.25, 1, 0.1), 27)],
    'dividers': [((0, 1, 0.2), 30), ((0, 1, -0.2), 30), ((1, 0.3, 0), 30), ((0, 1, 0), 30), ((1, 1, 0), 30), ((1, 0, 0), 30), ((1, 0, 0.25), 80, 0.45)],
    'magnifier': [((1, 0.4, 0), 30), ((0.4, 1, 0), 95, 0.4), ((0, 1, 0.3), 30), ((1, 0.5, 0.2), 30), ((1, 0, 0.3), 80, 0.45)],
    'hourglass': [((0, 1, 0.1), 70, 0.4), ((0, 1, 0), 34), ((0, 1, 0.2), 30), ((0.1, 1, 0), 30), ((1, 0.1, 0), 34), ((1, 0.1, 0.2), 34), ((1, 0.1, -0.2), 34)],
    'metronome': [((1, 0.25, 0.2), 30), ((0, 1, 0.1), 46), ((1, 0.2, 0), 34), ((0, 1, 0.3), 34), ((0, 1, 0), 26)],
    'padlock': [((0.15, 1, 0.3), 30), ((1, 0.3, 0.2), 32), ((1, 0, 0.25), 80, 0.45)],
    'inkwell': [((0, 1, 0.15), 30), ((0, 1, 0), 30), ((1, 0.3, 0), 40), ((1, 0.6, 0.1), 60, 0.7), ((1, 0, 0.25), 80, 0.45)],
    'macropad': [((0.1, 0.2, 1), 62), ((1, 0.3, 0.2), 32), ((0, 1, 0.1), 30), ((1, 0.2, 0), 30)],
    'beacon': [((0, 1, 0.1), 28), ((0.3, 1, 0), 34), ((0, 1, 0), 30), ((1, 0.2, 0), 30), ((0, 1, 0), 26)],
    'orrery': [((0, 1, 0.15), 30), ((1, 0.3, 0), 30), ((0, 1, 0.3), 28), ((1, 0, 0.3), 30), ((1, 0.2, 0), 30), ((0, 1, 0), 26), ((0, 1, 0), 30)],
}


# ---------- renderer ----------
def render(name, scene, w=1200, h=1500, seed=1, cam=(0.0, 1.05, 3.4), look=(0, 0.82, 0), fov=0.62, light=(-0.55, 0.72, 0.5), plate_margin=0.06):
    rng = np.random.default_rng(seed)
    hatch = HATCH.get(name.split('-')[0], HATCH['cloth'])
    cam, look = np.array(cam, F), np.array(look, F)
    fw = look - cam
    fw /= np.linalg.norm(fw)
    rt = np.cross(fw, np.array([0, 1, 0], F))
    rt /= np.linalg.norm(rt)
    up = np.cross(rt, fw)
    ys, xs = np.mgrid[0:h, 0:w].astype(F)
    u = (xs - w / 2) / h * 2 * fov
    v = -(ys - h / 2) / h * 2 * fov
    dirs = fw[None, None] + u[..., None] * rt + v[..., None] * up
    dirs = (dirs / np.linalg.norm(dirs, axis=2, keepdims=True)).reshape(-1, 3)
    N = w * h
    t = np.zeros(N, F)
    hit = np.zeros(N, bool)
    active = np.arange(N)
    for _ in range(110):
        if len(active) == 0:
            break
        p = cam + dirs[active] * t[active, None]
        d, _m = scene(p)
        t[active] += d * 0.9
        done = d < 0.0015
        hit[active[done]] = True
        keep = ~done & (t[active] < 8)
        active = active[keep]
    P = cam + dirs * t[:, None]
    # floor plane y=0 where the ray misses the object
    tf = np.where(dirs[:, 1] < -1e-4, -cam[1] / np.minimum(dirs[:, 1], -1e-4), np.inf)
    floor = ~hit & np.isfinite(tf) & (tf < 9)
    Pf = cam + dirs * np.where(floor, tf, 0)[:, None]

    L = np.array(light, F)
    L /= np.linalg.norm(L)
    dark = np.zeros(N, F)
    mat = np.zeros(N, np.int64)
    idx = np.where(hit)[0]
    if len(idx):
        p = P[idx]
        e = 0.0012
        nrm = np.stack([scene(p + np.array(o, F))[0] - scene(p - np.array(o, F))[0] for o in ((e, 0, 0), (0, e, 0), (0, 0, e))], 1)
        nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-8
        _, mat[idx] = scene(p)
        lam = np.clip(nrm @ L, 0, 1)
        # soft self-shadow
        sh = np.ones(len(idx), F)
        ts = np.full(len(idx), 0.02, F)
        for _ in range(28):
            ds, _m = scene(p + nrm * 0.004 + L * ts[:, None])
            sh = np.minimum(sh, np.clip(10 * ds / ts, 0, 1))
            ts += np.clip(ds, 0.01, 0.15)
        # ambient occlusion
        ao = np.ones(len(idx), F)
        for k in range(1, 5):
            dd = 0.03 * k
            ao -= (dd - scene(p + nrm * dd)[0]) * (1.6 / k)
        ao = np.clip(ao, 0, 1)
        rim = np.clip(1 - np.abs(nrm @ (-fw)), 0, 1) ** 3
        light_v = 0.08 + 0.92 * lam * sh
        dark[idx] = np.clip(1 - light_v * (0.55 + 0.45 * ao) + 0.15 * rim * (lam < 0.2), 0, 1)
    fidx = np.where(floor)[0]
    if len(fidx):
        p = Pf[fidx]
        sh = np.ones(len(fidx), F)
        ts = np.full(len(fidx), 0.02, F)
        for _ in range(36):
            ds, _m = scene(p + L * ts[:, None])
            sh = np.minimum(sh, np.clip(8 * ds / ts, 0, 1))
            ts += np.clip(ds, 0.01, 0.2)
        r = np.hypot(p[:, 0], p[:, 2])
        dark[fidx] = 0.1 * smooth(1.7, 0.5, r) ** 2 + 0.7 * (1 - sh) * smooth(1.8, 0.4, r)

    dark = dark.reshape(h, w)
    hit2, floor2 = hit.reshape(h, w), floor.reshape(h, w)
    P2 = np.where(hit[:, None], P, np.where(floor[:, None], Pf, 0)).reshape(h, w, 3)
    mat2 = mat.reshape(h, w)

    # hand: a slow wobble in every cut, and a burr that breaks the line now and then
    wob = (fbm(h, w, rng, cells=(220, 90)) - 0.5) * 0.35
    burr = 0.82 + 0.18 * fbm(h, w, rng, cells=(9, 3, 2), wts=(0.5, 0.3, 0.2))

    ink = np.zeros((h, w), F)

    def lines(phase, width, mask):
        gy, gx = np.gradient(phase)
        aa = np.clip(np.hypot(gx, gy) * 0.9, 0.02, 0.5)
        dist = np.abs(np.mod(phase + 0.5, 1) - 0.5)
        return mask * smooth(width + aa, width - aa, dist)

    # object: plane slices per material, then cross-hatching in the deep shadow
    obj_ink = np.zeros((h, w), F)
    for m, spec in enumerate(hatch):
        nv, freq, lift = (*spec, 1.0)[:3]
        sel = hit2 & (mat2 == m)
        if not sel.any():
            continue
        dk = dark * lift
        n1 = np.array(nv, F)
        n1 /= np.linalg.norm(n1)
        n2 = np.cross(n1, np.array([0.3, 0.2, 1], F))
        n2 /= np.linalg.norm(n2)
        ph1 = P2 @ n1 * freq + wob
        ph2 = P2 @ n2 * freq * 1.1 + wob
        w1 = np.clip(dk * 0.55, 0.03, 0.48)
        w2 = np.clip((dk - 0.42) * 0.7, 0, 0.42)
        w3 = np.clip((dk - 0.72) * 0.9, 0, 0.3)
        a = lines(ph1, w1, sel)
        b = lines(ph2, w2, sel) * (w2 > 0)
        c = lines(ph1 * 0.5 + ph2 * 0.5 + 0.25, w3, sel) * (w3 > 0)
        obj_ink = np.maximum(obj_ink, np.maximum(a, np.maximum(b, c)))
    # contour: a single cut where the form turns away
    edge = np.zeros((h, w), F)
    hm = hit2.astype(F)
    gy, gx = np.gradient(hm)
    edge = np.clip(np.hypot(gx, gy) * 1.6, 0, 1)
    dep = np.where(hit2, np.linalg.norm(P2 - cam, axis=2), 0)
    gy, gx = np.gradient(dep)
    edge = np.maximum(edge, hit2 * smooth(0.02, 0.06, np.hypot(gx, gy)))
    ink = np.maximum(obj_ink, edge * 0.9)

    # floor: horizontal ruled lines, closer in the shadow
    fy = ys
    fl = lines(fy / 3.4 + wob * 0.5, np.clip(dark * 0.6, 0.0, 0.45), floor2 & (dark > 0.006))
    ink = np.maximum(ink, fl)

    # sky: fine horizontal rules, darker toward the top of the plate, a burin's patience
    sky = ~hit2 & ~floor2
    tone = 0.2 * smooth(0.46, 0.04, ys / h) ** 1.6
    ink = np.maximum(ink, lines(ys / 3.2 + wob * 0.3, tone, sky & (tone > 0.004)))

    # plate mark: everything inside the plate is printed; outside is bare paper
    m = plate_margin
    x0, x1, y0, y1 = int(w * m), int(w * (1 - m)), int(h * m * w / h), int(h - h * m * w / h)
    inside = np.zeros((h, w), F)
    inside[y0:y1, x0:x1] = 1
    ink *= inside
    ink *= burr

    # paper: laid lines, chain lines, fibre, a faint plate tone, and the bevel of the plate edge
    paper = np.ones((h, w), F)
    paper -= 0.012 * (0.5 + 0.5 * np.sin(ys * 2 * np.pi / 4.0))
    chain = np.exp(-((np.mod(xs, 132) - 66) / 2.4) ** 2)
    paper -= 0.025 * chain
    paper -= 0.05 * (fbm(h, w, rng, cells=(40, 12, 4, 2)) - 0.5)
    paper -= 0.035 * inside
    bevel = np.zeros((h, w), F)
    bevel[y0:y0 + 3, x0:x1] = -0.06
    bevel[y0:y1, x0:x0 + 3] = -0.06
    bevel[y1 - 3:y1, x0:x1] = 0.16
    bevel[y0:y1, x1 - 3:x1] = 0.16
    paper -= bevel

    a = np.clip(ink, 0, 1)[..., None] * 0.94
    rgb = PAPER[None, None] * paper[..., None] * (1 - a) + INK[None, None] * a
    img = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8))
    img.save(f'{OUT}{name}.webp', quality=86, method=6)
    print('wrote', name)


def door(name, w=640, h=1520, seed=11, mirror=False):
    """A cabinet door, engraved: raised panel, wood grain cut in long lines, a keyhole escutcheon."""
    rng = np.random.default_rng(seed)
    ys, xs = np.mgrid[0:h, 0:w].astype(F)
    # wood grain: long vertical cuts, warped by slow noise, with a knot
    warp = (fbm(h, w, rng, cells=(380, 160, 60)) - 0.5) * 38
    kx, ky = w * 0.62, h * 0.33
    knot = 28 * np.exp(-(((xs - kx) / 70) ** 2 + ((ys - ky) / 140) ** 2))
    grain = (xs + warp + knot * np.sign(xs - kx)) / 3.6
    # panel geometry
    stile = 70
    px0, px1, py0, py1 = stile, w - stile, stile, h - stile
    bev = 34
    dx = np.minimum(xs - px0, px1 - xs)
    dy = np.minimum(ys - py0, py1 - ys)
    inpanel = (dx > 0) & (dy > 0)
    onbevel = inpanel & (np.minimum(dx, dy) < bev)
    # light from upper left: top/left bevels catch it, bottom/right fall into shadow
    face = np.where(dx < dy, np.where(xs - px0 < px1 - xs, 0.25, 0.85), np.where(ys - py0 < py1 - ys, 0.2, 0.9))
    dark = np.full((h, w), 0.7, F)
    dark = np.where(onbevel, face, dark)
    dark = np.where(inpanel & ~onbevel, 0.52, dark)
    frame_edge = (np.abs(dx) < 3) | (np.abs(np.minimum(dx, dy) - bev) < 2)
    gy, gx = np.gradient(grain)
    aa = np.clip(np.hypot(gx, gy) * 0.9, 0.02, 0.5)
    dist = np.abs(np.mod(grain + 0.5, 1) - 0.5)
    width = np.clip(dark * 0.5, 0.05, 0.45)
    ink = smooth(width + aa, width - aa, dist)
    # bevel cross-cuts at 45 degrees where the panel turns
    diag = ((xs + ys) / 4.0) if True else 0
    dd = np.abs(np.mod(diag + 0.5, 1) - 0.5)
    ink = np.maximum(ink, onbevel * (face > 0.5) * smooth(0.32, 0.22, dd))
    ink = np.maximum(ink, (inpanel & frame_edge) * 0.95)
    # escutcheon and keyhole near the closing edge
    ex, ey = w - stile * 0.5, h * 0.52  # closing edge; the mirror flips it for the right door
    r = np.hypot((xs - ex) / 1.0, (ys - ey) / 1.6)
    plate = r < 26
    ink = np.where(plate, smooth(26, 23, r) * 0.25 + lines_circle(xs, ys, ex, ey), ink)
    hole = (np.hypot(xs - ex, ys - ey + 6) < 6) | ((np.abs(xs - ex) < 2.6) & (ys > ey - 6) & (ys < ey + 12))
    ink = np.where(hole, 1, ink)
    # hinges on the outer edge
    hx = 4
    for hy in (h * 0.14, h * 0.86):
        hb = (np.abs(xs - hx) < 10) & (np.abs(ys - hy) < 46)
        ink = np.where(hb, 0.9, ink)
    burr = 0.85 + 0.15 * fbm(h, w, rng, cells=(9, 3), wts=(0.6, 0.4))
    a = np.clip(ink * burr, 0, 1)[..., None] * 0.95
    paper = 1 - 0.05 * (fbm(h, w, rng, cells=(40, 12, 4)) - 0.5)
    rgb = PAPER[None, None] * paper[..., None] * (1 - a) + INK[None, None] * a
    img = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8))
    if mirror:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    img.save(f'{OUT}{name}.webp', quality=84, method=6)
    print('wrote', name)


def lines_circle(xs, ys, cx, cy):
    d = np.hypot(xs - cx, ys - cy) / 3.0
    return smooth(0.3, 0.18, np.abs(np.mod(d + 0.5, 1) - 0.5)) * 0.7


# Eight sheets over eight things in development. The shapes under the cloth are different on purpose.
def hidden_sets():
    v = lambda *a: np.array(a, F)
    return [
        [lambda p: box(p, v(0, 0.55, 0), (0.3, 0.55, 0.22), 0.04)],  # Kyoris: a tall case
        [lambda p: sphere(p, v(0, 0.95, 0), 0.3), lambda p: box(p, v(0, 0.35, 0), (0.36, 0.35, 0.3), 0.04)],
        [lambda p: cyl(p, v(-0.22, 0.5, 0), 0.16, 0.5), lambda p: cyl(p, v(0.24, 0.35, 0.05), 0.18, 0.35)],
        [lambda p: box(p, v(0, 0.28, 0), (0.62, 0.28, 0.32), 0.05)],
        [lambda p: cone_seg(p, v(0, 0.02, 0), v(0, 1.25, 0), 0.5, 0.03)],
        [lambda p: box(p, v(-0.15, 0.4, 0), (0.25, 0.4, 0.25), 0.03), lambda p: sphere(p, v(0.3, 0.25, 0.1), 0.25)],
        [lambda p: capsule(p, v(0, 0.2, 0), v(0, 1.1, 0), 0.2), lambda p: torus(p, v(0, 1.15, 0), 0.32, 0.06, rot('x', 90))],
        [lambda p: box(p, v(0, 0.5, 0), (0.45, 0.06, 0.45), 0.02), lambda p: cyl(p, v(0, 0.25, 0), 0.08, 0.25)],
    ]


def main(only=None):
    import os
    os.makedirs(OUT, exist_ok=True)
    jobs = {
        'armillary': lambda: render('armillary', scene_armillary, seed=1),
        'dividers': lambda: render('dividers', scene_dividers, seed=3, cam=(0.6, 1.5, 3.2), look=(0, 0.75, 0)),
        'magnifier': lambda: render('magnifier', scene_magnifier, w=1500, h=1200, seed=5, cam=(0.2, 1.7, 2.9), look=(0, 0.7, 0), fov=0.55),
        'hourglass': lambda: render('hourglass', scene_hourglass, seed=7, w=960, h=1200, cam=(0.25, 0.95, 2.55), look=(0, 0.6, 0)),
        'metronome': lambda: render('metronome', scene_metronome, seed=8, w=960, h=1200, cam=(0.75, 0.95, 2.45), look=(0, 0.58, 0)),
        'padlock': lambda: render('padlock', scene_padlock, seed=9, w=960, h=1200, cam=(0.4, 0.95, 2.55), look=(0, 0.6, 0)),
        'inkwell': lambda: render('inkwell', scene_inkwell, seed=10, w=960, h=1200, cam=(0.35, 1.0, 2.8), look=(0, 0.72, 0)),
        'macropad': lambda: render('macropad', scene_macropad, seed=13, w=960, h=1200, cam=(0.6, 1.9, 2.5), look=(0, 0.25, 0), fov=0.6),
        'beacon': lambda: render('beacon', scene_beacon, seed=14, w=960, h=1200, cam=(0.25, 0.95, 2.75), look=(0, 0.82, 0)),
        'orrery': lambda: render('orrery', scene_orrery, seed=15, w=960, h=1200, cam=(0.25, 1.4, 2.7), look=(0, 0.72, 0)),
        'door-left': lambda: door('door-left', seed=11),
        'door-right': lambda: door('door-right', seed=12, mirror=True),
    }
    for i, hs in enumerate(hidden_sets()):
        n = f'cloth-{i + 2:02d}'
        jobs[n] = (lambda hs=hs, i=i, n=n: render(n, make_cloth(hs, 40 + i), w=960, h=1200, seed=20 + i, cam=(0.0, 1.15, 3.6), look=(0, 0.7, 0)))
    for k, fn in jobs.items():
        if only and k != only:
            continue
        fn()


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
