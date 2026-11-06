"""Michelangelo's two hands, cut out and reprinted riso (public/prints/hand-left.webp, hand-right.webp).

    python3 scripts/creation.py

Source: scripts/src/creation.jpg, with the cut-outs in scripts/src/hand-{L,R}-mask.png (u2net, via rembg,
run on a band around each hand). Each hand is separated into three spot inks the way scripts/riso.py prints
everything else: yellow follows the warm of the skin, pink the midtones, blue the shadows. Each a halftone at
its own angle, each drum out of register, speckled. Transparent around the hand, so the page can slide it
over anything.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, 'scripts')
from riso import INK, PAPER, halftone, drum, shift  # noqa: E402

SCALE = 2.0
BOXES = {'L': (0, 380, 480, 760), 'R': (440, 380, 954, 760)}  # where each mask was cut from the source
src = Image.open('scripts/src/creation.jpg').convert('RGB')
rng = np.random.default_rng(7)

for side, name in (('L', 'hand-left'), ('R', 'hand-right')):
    box = BOXES[side]
    crop = src.crop(box)
    size = (int(crop.width * SCALE), int(crop.height * SCALE))
    img = crop.resize(size, Image.LANCZOS).filter(ImageFilter.UnsharpMask(3, 90, 2))
    mask = np.asarray(Image.open(f'scripts/src/hand-{side}-mask.png').resize(size, Image.LANCZOS), np.float32) / 255
    rgb = np.asarray(img, np.float32) / 255
    h, w = rgb.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    L = np.clip((0.3 * r + 0.59 * g + 0.11 * b - 0.1) / 0.8, 0, 1)
    warm = np.clip((r - b) * 2.6, 0, 1)
    yellow = drum(halftone(warm * 0.75 * (1 - 0.4 * L) + 0.12, ys, xs, 0, 6.0), rng, h, w)
    pink = drum(halftone(np.clip((0.95 - L) * 1.1, 0, 1) ** 1.2, ys, xs, 75, 5.2), rng, h, w)
    blue = drum(halftone(np.clip((0.6 - L) * 2.0, 0, 1), ys, xs, 15, 4.4), rng, h, w)
    yellow, pink = shift(yellow, rng, 3), shift(pink, rng, 3)
    out = np.ones((h, w, 3), np.float32) * PAPER
    for cov, ink in ((yellow, 'yellow'), (pink, 'pink'), (blue, 'blue')):
        out *= 1 - cov[..., None] * (1 - INK[ink][None, None])
    # an ink keyline round the hand so it reads on any ground
    m = (mask > 0.5).astype(np.float32)
    grow = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)), np.float32) / 255
    edge = np.clip(grow - m, 0, 1)
    out = out * (1 - edge[..., None]) + np.array([22, 22, 58], np.float32) / 255 * edge[..., None]
    alpha = np.maximum(mask, edge)
    Image.fromarray(np.dstack([np.clip(out, 0, 1) * 255, alpha * 255]).astype(np.uint8), 'RGBA').save(f'public/prints/{name}.webp', quality=86, method=6)
    ys_, xs_ = np.nonzero(alpha > 0.5)
    tip = xs_.max() if side == 'L' else xs_.min()
    print('printed', name, w, h, 'tip x', tip, 'tip y', int(ys_[xs_ == tip].mean()))
