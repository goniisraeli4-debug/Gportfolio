"""Locate the blank screen in a laptop mockup render and emit the assets
needed to composite a video into it with ffmpeg.

Pass --no-notch for a chassis without one (Touch Bar era MacBook Pro), which
fits the top edge across the full span and leaves the dark bar empty.

For a given mockup PNG this writes, at the target canvas size:
  <out>_mask.png    grayscale alpha for the visible screen (notch cut out)
  <out>_stripe.png  dark bar across the screen, notch-height, pre-masked
  <out>_quad.txt    screen corners as ffmpeg `perspective` coordinates
  <out>_check.png   downscaled overlay for eyeballing the fit

The screen is found as the light region enclosed by the dark bezel rather than
by brightness thresholding, because these renders have a top-to-bottom gradient
across the screen that fades into the background gray.
"""

import sys
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

CANVAS = (2560, 1920)
BEZEL_MAX_LUM = 110       # bezel renders under ~50; screen and background are well above
STRIPE_RGB = (28, 28, 30)
EROSION_PX = 3            # inset the video so it doesn't paint over the bezel chrome
UNDERLAY_DILATE = 4       # push black fill + stripe under the bezel lip to hide its specular
FEATHER_PX = 1.5          # soften the flood fill's staircase to match the render's own edges


def dilate(mask, n):
    m = mask.copy()
    for _ in range(n):
        m = (m | np.roll(m, 1, 0) | np.roll(m, -1, 0)
               | np.roll(m, 1, 1) | np.roll(m, -1, 1))
    return m


def fill_holes(mask):
    """Close the gaps the flood fill leaves behind wherever the mockup's screen
    already shows dark content. Without this those gaps stay unmasked and the
    baked-in screen shows through the video."""
    # .copy() is required: floodfill silently no-ops on the read-only buffer
    # image that fromarray hands back.
    img = Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(img, (0, 0), 128)
    holes = np.array(img) == 255
    if holes.sum() > mask.sum():
        raise SystemExit("hole fill leaked — is the top-left corner background?")
    return mask | holes


def erode(mask, n):
    m = mask.copy()
    for _ in range(n):
        m = (m & np.roll(m, 1, 0) & np.roll(m, -1, 0)
               & np.roll(m, 1, 1) & np.roll(m, -1, 1))
    return m


def enclosed_screen(lum):
    """Scanline flood fill from the screen centre, bounded by the dark bezel."""
    h, w = lum.shape
    light = lum >= BEZEL_MAX_LUM

    seed = None
    for fy in (0.45, 0.40, 0.50, 0.35, 0.55):
        y, x = int(h * fy), w // 2
        if light[y, x]:
            seed = (y, x)
            break
    if seed is None:
        raise SystemExit("no light seed pixel found near the centre of the screen")

    filled = np.zeros_like(light)
    stack = [seed]
    while stack:
        y, x = stack.pop()
        if y < 0 or y >= h or filled[y, x] or not light[y, x]:
            continue
        x0 = x
        while x0 > 0 and light[y, x0 - 1] and not filled[y, x0 - 1]:
            x0 -= 1
        x1 = x
        while x1 < w - 1 and light[y, x1 + 1] and not filled[y, x1 + 1]:
            x1 += 1
        filled[y, x0:x1 + 1] = True
        for ny in (y - 1, y + 1):
            if 0 <= ny < h:
                idx = np.flatnonzero(light[ny, x0:x1 + 1] & ~filled[ny, x0:x1 + 1])
                if idx.size:
                    brk = np.flatnonzero(np.diff(idx) > 1)
                    for s in np.concatenate(([idx[0]], idx[brk + 1])):
                        stack.append((ny, x0 + int(s)))

    if filled.sum() > 0.25 * h * w:
        raise SystemExit("flood fill leaked past the bezel into the background")
    return filled


def _fit(v, u):
    return np.linalg.lstsq(np.vstack([u, np.ones_like(u)]).T, v, rcond=None)[0]


def _ransac(v, u, tol=3.0, iters=10):
    m, c = _fit(v, u)
    for _ in range(iters):
        keep = np.abs(v - (m * u + c)) < tol
        if keep.sum() < 30:
            break
        m, c = _fit(v[keep], u[keep])
    return m, c


def screen_geometry(filled, has_notch=True):
    """Fit the four screen edges and intersect them, so rounded corners and the
    notch don't pull the corner estimates in."""
    ys, xs = np.nonzero(filled)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()

    pad_y = int((y1 - y0) * 0.12)
    rows, left, right = [], [], []
    for y in range(y0 + pad_y, y1 - pad_y):
        idx = np.flatnonzero(filled[y])
        if idx.size < 200:
            continue
        rows.append(y); left.append(idx.min()); right.append(idx.max())
    rows = np.array(rows, float)
    mL, cL = _ransac(np.array(left, float), rows)
    mR, cR = _ransac(np.array(right, float), rows)

    pad_x = int((x1 - x0) * 0.08)
    cols, top, bot = [], [], []
    for x in range(x0 + pad_x, x1 - pad_x):
        idx = np.flatnonzero(filled[:, x])
        if idx.size < 200:
            continue
        cols.append(x); top.append(idx.min()); bot.append(idx.max())
    cols = np.array(cols, float)
    top = np.array(top, float)
    bot = np.array(bot, float)

    mB, cB = _ransac(bot, cols)

    if has_notch:
        # Seed the top edge from the outer thirds only, where the notch can't reach.
        outer = (cols < x0 + (x1 - x0) * 0.3) | (cols > x0 + (x1 - x0) * 0.7)
        m0, c0 = _fit(top[outer], cols[outer])
        notch = (top - (m0 * cols + c0)) > 8
        mT, cT = _ransac(top[~notch], cols[~notch])
        if not notch.any():
            raise SystemExit("no notch detected along the top edge")
        notch_depth = float((top[notch] - (mT * cols[notch] + cT)).max())
        notch_span = (cols[notch].min(), cols[notch].max())
    else:
        mT, cT = _ransac(top, cols)
        notch_depth = 0.0
        notch_span = (0.0, 0.0)

    def intersect(mv, cv, mh, ch):
        y = (mh * cv + ch) / (1 - mh * mv)
        return np.array([mv * y + cv, y])

    quad = np.array([
        intersect(mL, cL, mT, cT),   # TL
        intersect(mR, cR, mT, cT),   # TR
        intersect(mR, cR, mB, cB),   # BR
        intersect(mL, cL, mB, cB),   # BL
    ])
    return quad, notch_depth, notch_span


def main(png_path, out_prefix, has_notch=True, erosion=EROSION_PX,
         underlay=UNDERLAY_DILATE, feather=FEATHER_PX):
    src = Image.open(png_path).convert("RGB")
    w, h = src.size
    filled = fill_holes(enclosed_screen(np.array(src.convert("L")).astype(int)))
    quad, notch_depth, notch_span = screen_geometry(filled, has_notch)

    print(f"{png_path}  {w}x{h}")
    for name, p in zip(("TL", "TR", "BR", "BL"), quad):
        print(f"  {name} ({p[0]:.1f}, {p[1]:.1f})")
    print(f"  notch cols {notch_span[0]:.0f}-{notch_span[1]:.0f}, depth {notch_depth:.1f}px")
    print(f"  erosion {erosion}px, underlay dilate {underlay}px, feather {feather}px")

    cw, ch = CANVAS
    sx, sy = cw / w, ch / h

    m = filled
    if erosion > 0:
        m = erode(filled, erosion)
    elif erosion < 0:
        m = dilate(filled, -erosion)

    base = src.resize(CANVAS, Image.LANCZOS)
    filled_c = (
        np.array(
            Image.fromarray((filled * 255).astype(np.uint8)).resize(CANVAS, Image.NEAREST)
        )
        > 127
    )
    underlay_c = max(1, int(round(underlay * sx)))

    # The flood fill returns a hard boundary, so downscaling alone leaves the
    # video edge visibly stepped next to the render's own antialiased ones.
    # Feathering first turns the staircase into a ramp.
    def soften(binary):
        img = Image.fromarray((binary * 255).astype(np.uint8))
        if feather > 0:
            img = img.filter(ImageFilter.GaussianBlur(feather))
        return img.resize(CANVAS, Image.LANCZOS)

    soften(m).save(f"{out_prefix}_mask.png")

    # The flood fill halts at the bezel's grey inner lip, which belongs to the
    # glass rather than the chassis, so the video stops short of it and the lip
    # reads as a pale strip — widest at the top corners, where the rotation
    # shows most of the bezel's inner wall. Sink it into the bezel by laying a
    # bezel-coloured bed over it, feathered rather than thresholded so the edge
    # keeps the render's antialiasing instead of a resampled staircase.
    bed = dilate(m, underlay)
    bed_a = np.asarray(soften(bed)).astype(np.float32)[..., None] / 255.0
    lip = bed & ~m
    dark = lip & (np.asarray(src.convert("L")) < 60)
    bezel_rgb = np.median(np.asarray(src)[dark], axis=0) if dark.any() else np.zeros(3)
    arr = np.asarray(base).astype(np.float32) * (1 - bed_a) + bezel_rgb * bed_a
    Image.fromarray(arr.round().clip(0, 255).astype(np.uint8)).save(f"{out_prefix}_base.png")

    # Dark bar hugging the top of the screen, as tall as the notch is deep.
    # Extend a few px past the top edge so it also sits under the bezel lip.
    # Notchless chassis get a fully transparent bar, so the render chain is
    # identical either way and the video reaches the top edge of the screen.
    stripe = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if notch_depth > 0:
        TL, TR, BR, BL = quad
        down_l = (BL - TL) / np.linalg.norm(BL - TL)
        down_r = (BR - TR) / np.linalg.norm(BR - TR)
        up_l, up_r = -down_l, -down_r
        drop = notch_depth + 2
        lift = float(underlay + 2)
        ImageDraw.Draw(stripe).polygon(
            [
                tuple(TL + up_l * lift),
                tuple(TR + up_r * lift),
                tuple(TR + down_r * drop),
                tuple(TL + down_l * drop),
            ],
            fill=STRIPE_RGB + (255,),
        )
    stripe = stripe.resize(CANVAS, Image.LANCZOS)
    # Clip stripe to the dilated screen so it can't spill past the chassis.
    dil = dilate(filled_c, underlay_c)
    under_mask = Image.fromarray((dil * 255).astype(np.uint8))
    r, g, b, a = stripe.split()
    a = ImageChops.multiply(a, under_mask.convert("L"))
    Image.merge("RGBA", (r, g, b, a)).save(f"{out_prefix}_stripe.png")

    # perspective wants TL, TR, BL, BR in canvas coordinates.
    q = quad * [sx, sy]
    with open(f"{out_prefix}_quad.txt", "w") as fh:
        fh.write(f"{q[0][0]:.1f}:{q[0][1]:.1f}:{q[1][0]:.1f}:{q[1][1]:.1f}:"
                 f"{q[3][0]:.1f}:{q[3][1]:.1f}:{q[2][0]:.1f}:{q[2][1]:.1f}")

    check = Image.open(f"{out_prefix}_base.png").convert("RGB")
    d = ImageDraw.Draw(check)
    d.line([tuple(p) for p in q] + [tuple(q[0])], fill=(255, 0, 0), width=3)
    check.resize((1000, int(1000 * ch / cw))).save(f"{out_prefix}_check.png")


if __name__ == "__main__":
    argv = sys.argv[1:]
    has_notch = "--no-notch" not in argv
    argv = [a for a in argv if a != "--no-notch"]
    erosion, underlay, feather = EROSION_PX, UNDERLAY_DILATE, FEATHER_PX
    positional = []
    i = 0
    while i < len(argv):
        if argv[i] == "--erosion" and i + 1 < len(argv):
            erosion = int(argv[i + 1]); i += 2
        elif argv[i] == "--underlay" and i + 1 < len(argv):
            underlay = int(argv[i + 1]); i += 2
        elif argv[i] == "--feather" and i + 1 < len(argv):
            feather = float(argv[i + 1]); i += 2
        else:
            positional.append(argv[i]); i += 1
    main(positional[0], positional[1], has_notch=has_notch, erosion=erosion,
         underlay=underlay, feather=feather)
