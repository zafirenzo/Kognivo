"""The hands over the clouds, reprinted riso (public/prints/creation.webp).

    python3 scripts/creation.py

Source: scripts/src/creation.jpg (Michelangelo's hands over a cloud sky). Separated into three spot inks the
way scripts/riso.py prints everything else: yellow follows the warm of the clouds and skin, pink the midtones,
blue the shadows and the blue sky. Each a halftone at its own angle, each drum out of register, speckled.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, 'scripts')
from riso import INK, PAPER, halftone, drum, shift  # noqa: E402

SCALE = 1.6
img = Image.open('scripts/src/creation.jpg').convert('RGB')
img = img.resize((int(img.width * SCALE), int(img.height * SCALE)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(3, 80, 2))
rgb = np.asarray(img, np.float32) / 255
h, w = rgb.shape[:2]
ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
L = 0.3 * r + 0.59 * g + 0.11 * b
L = np.clip((L - 0.12) / 0.8, 0, 1)  # stretch: the photo is low contrast
warm = np.clip((r - b) * 2.4, 0, 1)
cool = np.clip((b - r) * 3.0, 0, 1)
rng = np.random.default_rng(7)

yellow = drum(halftone(warm * 0.8 * (1 - 0.45 * L), ys, xs, 0, 6.0), rng, h, w)
pink = drum(halftone(np.clip((0.9 - L) * 1.05, 0, 1) ** 1.25, ys, xs, 75, 5.2), rng, h, w)
blue = drum(halftone(np.clip(np.maximum((0.55 - L) * 1.9, cool * 0.75), 0, 1), ys, xs, 15, 4.4), rng, h, w)
yellow, pink = shift(yellow, rng, 4), shift(pink, rng, 4)

out = np.ones((h, w, 3), np.float32) * PAPER
for cov, ink in ((yellow, 'yellow'), (pink, 'pink'), (blue, 'blue')):
    out *= 1 - cov[..., None] * (1 - INK[ink][None, None])
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save('public/prints/creation.webp', quality=80, method=6)
print('printed creation', w, h)
