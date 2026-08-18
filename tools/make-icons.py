#!/usr/bin/env python3
"""
Generates the app icon, adaptive icon, splash and favicon.

The icon is ~80% of the download decision in a store grid, and it is competing
against forty purple gradients. So: fluorescent pink field, thick ink border,
and two ink circles beside one yellow triangle — the odd one out, stated
without a word of copy.

Three tokens rather than four on purpose. The icon has to survive at 60px in a
search result, and past three shapes it turns to mush at that size.

    python3 tools/make-icons.py
"""
from PIL import Image, ImageDraw
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets"
OUT.mkdir(parents=True, exist_ok=True)

INK = (20, 18, 16)
PINK = (255, 61, 154)
PAPER = (242, 235, 221)
YELLOW = (255, 199, 0)

# Three tokens, two gaps, occupying this fraction of the drawable box.
TOKENS = 3
SPAN_RATIO = 0.86
GAP_RATIO = 0.55  # gap as a fraction of token radius


def halftone(img, spacing, radius, alpha=24):
    dots = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(dots)
    for y in range(0, img.size[1], spacing):
        for x in range(0, img.size[0], spacing):
            d.ellipse([x, y, x + radius, y + radius], fill=INK + (alpha,))
    return Image.alpha_composite(img.convert("RGBA"), dots)


def triangle(d, cx, cy, r, fill=None, outline=None, width=0):
    pts = [(cx, cy - r), (cx + r * 0.93, cy + r * 0.74), (cx - r * 0.93, cy + r * 0.74)]
    d.polygon(pts, fill=fill, outline=outline, width=width)


def draw_tokens(d, box_origin, box_size):
    """Two circles and a triangle, centred in the given box."""
    ox, oy = box_origin
    # 2*r*TOKENS + GAP_RATIO*r*(TOKENS-1) == SPAN_RATIO * box
    r = SPAN_RATIO * box_size / (2 * TOKENS + GAP_RATIO * (TOKENS - 1))
    gap = r * GAP_RATIO
    step = 2 * r + gap
    span = step * (TOKENS - 1)
    cx0 = ox + box_size / 2 - span / 2
    cy = oy + box_size / 2

    for i in range(TOKENS - 1):
        cx = cx0 + i * step
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=INK)

    # The ringer sits slightly proud of the line — different shape, different
    # colour, out of step. Outlined so it holds against the pink.
    cx = cx0 + (TOKENS - 1) * step
    lift = r * 0.16
    triangle(d, cx, cy - lift, r * 1.14, fill=YELLOW)
    triangle(d, cx, cy - lift, r * 1.14, outline=INK, width=max(int(box_size * 0.018), 2))


def icon(size, bg=PINK, border=True):
    img = Image.new("RGBA", (size, size), bg + (255,))
    d = ImageDraw.Draw(img)
    if border:
        bw = max(int(size * 0.038), 3)
        d.rectangle([bw // 2, bw // 2, size - 1 - bw // 2, size - 1 - bw // 2], outline=INK, width=bw)
    pad = size * 0.13
    draw_tokens(d, (pad, pad), size - pad * 2)
    return halftone(img, spacing=max(size // 70, 4), radius=max(size // 360, 1))


def save(img, name):
    img.convert("RGB").save(OUT / name, quality=95)
    print(f"  {name:22} {img.size[0]}x{img.size[1]}")


# Store icon. No transparency and no rounded corners — the OS masks it itself.
save(icon(1024), "icon.png")

# Android adaptive foreground. Launchers crop up to the outer 25% and apply
# their own mask, so the foreground carries only the tokens on transparency;
# the pink comes from adaptiveIcon.backgroundColor in app.json.
fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
d = ImageDraw.Draw(fg)
draw_tokens(d, (1024 * 0.23, 1024 * 0.23), 1024 * 0.54)
fg.convert("RGBA").save(OUT / "adaptive-icon.png")
print(f"  {'adaptive-icon.png':22} 1024x1024 (transparent foreground)")

# Splash: tokens on a clean pink field, no border — the frame reads as an
# artefact at full-screen sizes.
splash = Image.new("RGBA", (1284, 1284), PINK + (255,))
d = ImageDraw.Draw(splash)
draw_tokens(d, (1284 * 0.22, 1284 * 0.22), 1284 * 0.56)
save(halftone(splash, spacing=18, radius=2), "splash.png")

save(icon(196), "favicon.png")
save(icon(1024, bg=PAPER), "icon-paper.png")
