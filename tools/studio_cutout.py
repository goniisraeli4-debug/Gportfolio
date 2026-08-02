"""Build a silhouette alpha mask for a laptop mockup video, so the studio
background can be dropped without touching the laptop's own pixels.

Both modes assume the laptop never moves — only the screen content does.

  temporal : the studio background changes brightness over time, so background
             pixels are the ones that both vary and reach the frame edge.
  flat     : the studio background is one constant colour, so background is
             measured as colour distance from it and the contact shadow keeps a
             soft alpha ramp.

  studio_cutout.py <video> <out-mask.png> --mode temporal|flat
"""

import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

FF = "/tmp/ffmpeg-bin/ffmpeg"
SAMPLES = 24
STD_MAX = 4.0        # temporal: a pixel this steady belongs to the chassis
TOL = 14             # flat: colour distance that counts as subject
SOFT = 26            # flat: ramp width for the contact shadow
NOISE_FLOOR = 4      # flat: ignore codec noise around the background colour
FEATHER_PX = 1.0


def duration(video):
    out = subprocess.run(
        [FF, "-hide_banner", "-i", str(video)],
        capture_output=True, text=True,
    ).stderr
    for line in out.splitlines():
        if "Duration:" in line:
            hh, mm, ss = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(hh) * 3600 + int(mm) * 60 + float(ss)
    raise SystemExit("could not read duration")


def sample_frames(video, count):
    dur = duration(video)
    frames = []
    with tempfile.TemporaryDirectory() as tmp:
        for i in range(count):
            t = dur * (i + 0.5) / count
            path = Path(tmp) / f"f{i}.png"
            subprocess.run(
                [FF, "-y", "-hide_banner", "-loglevel", "error",
                 "-ss", f"{t:.3f}", "-i", str(video),
                 "-frames:v", "1", "-update", "1", str(path)],
                check=True,
            )
            frames.append(np.asarray(Image.open(path).convert("RGB")).astype(np.int16))
    return np.stack(frames)


def flood(binary, seeds):
    """Region of `binary` reachable from any of `seeds`. The copy() matters:
    floodfill silently no-ops on the read-only image fromarray hands back."""
    img = Image.fromarray(np.where(binary, 255, 0).astype(np.uint8)).copy()
    for seed in seeds:
        if img.getpixel(seed) == 255:
            ImageDraw.floodfill(img, seed, 128)
    return np.asarray(img) == 128


def fill_holes(mask):
    h, w = mask.shape
    outside = flood(~mask, border_seeds(h, w, step=1))
    return ~outside


def open_specks(mask, n=2):
    m = mask.copy()
    for _ in range(n):
        m = (m & np.roll(m, 1, 0) & np.roll(m, -1, 0)
               & np.roll(m, 1, 1) & np.roll(m, -1, 1))
    for _ in range(n):
        m = (m | np.roll(m, 1, 0) | np.roll(m, -1, 0)
               | np.roll(m, 1, 1) | np.roll(m, -1, 1))
    return m


def border_seeds(h, w, step=16):
    seeds = [(x, 0) for x in range(0, w, step)] + [(x, h - 1) for x in range(0, w, step)]
    seeds += [(0, y) for y in range(0, h, step)] + [(w - 1, y) for y in range(0, h, step)]
    return seeds


def smooth_boundary(mask, sigma=3.0):
    """Compression ringing along the chassis leaves the flood boundary ragged;
    blurring and re-thresholding straightens it without moving the edge."""
    img = Image.fromarray((mask * 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(sigma)
    )
    return np.asarray(img).astype(np.float32) / 255 > 0.5


def temporal_alpha(frames):
    h, w = frames.shape[1:3]
    steady = frames.astype(np.float32).std(axis=0).max(axis=2) <= STD_MAX
    # Letterbox bars are steady too, so drop everything steady that the frame
    # edge can reach; what's left is the chassis.
    subject = open_specks(steady & ~flood(steady, border_seeds(h, w)))
    return fill_holes(smooth_boundary(fill_holes(subject))).astype(np.float32)


def flat_alpha(frames):
    plate = np.median(frames, axis=0).astype(np.float32)
    h, w = plate.shape[:2]
    # Skip black letterbox bars — they sit at the frame edge and would
    # otherwise be mistaken for the studio colour.
    row_lit = plate.max(axis=(1, 2)) > 16
    col_lit = plate.max(axis=(0, 2)) > 16
    inset_y = int((~row_lit).sum() // 2) + 12
    inset_x = int((~col_lit).sum() // 2) + 12
    inset_y = min(inset_y, h // 4)
    inset_x = min(inset_x, w // 4)
    ring = np.concatenate([
        plate[inset_y:inset_y + 8].reshape(-1, 3),
        plate[-(inset_y + 8):-inset_y or None].reshape(-1, 3),
        plate[:, inset_x:inset_x + 8].reshape(-1, 3),
        plate[:, -(inset_x + 8):-inset_x or None].reshape(-1, 3),
    ])
    bg = np.median(ring, axis=0)
    print(f"  background {bg.round().astype(int)}  (inset {inset_x},{inset_y})")

    dist = np.abs(plate - bg).max(axis=2)
    core = fill_holes(open_specks(dist > TOL))
    shadow = np.clip((dist - NOISE_FLOOR) / SOFT, 0, 1)
    alpha = np.maximum(core.astype(np.float32), shadow)
    alpha[~row_lit, :] = 0
    alpha[:, ~col_lit] = 0
    return alpha


def main(video, out_path, mode):
    frames = sample_frames(video, SAMPLES)
    print(f"{video}  {frames.shape[2]}x{frames.shape[1]}  {SAMPLES} samples")
    alpha = temporal_alpha(frames) if mode == "temporal" else flat_alpha(frames)
    img = Image.fromarray((alpha * 255).round().clip(0, 255).astype(np.uint8))
    if FEATHER_PX:
        img = img.filter(ImageFilter.GaussianBlur(FEATHER_PX))
    img.save(out_path)
    print(f"  coverage {(alpha > 0.5).mean():.3f} -> {out_path}")


if __name__ == "__main__":
    argv = sys.argv[1:]
    mode = "temporal"
    if "--mode" in argv:
        i = argv.index("--mode")
        mode = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    main(argv[0], argv[1], mode)
