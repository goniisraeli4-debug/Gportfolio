"""Pads assets/logo.png into a square favicon.

Favicons are drawn in a square slot, so a non-square source gets squashed.
This centres the mark on a transparent square canvas at its native
resolution — no resampling, so nothing gets softer than the original.

Run again after replacing assets/logo.png:  python3 make_favicon.py
"""

import os
import struct
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "assets", "logo.png")
OUT = os.path.join(HERE, "assets", "favicon.png")
CANVAS = 32


def read_png(path):
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit("not a PNG")

    pos, idat, meta = 8, b"", {}
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos : pos + 4])
        kind = data[pos + 4 : pos + 8]
        body = data[pos + 8 : pos + 8 + length]
        if kind == b"IHDR":
            w, h, depth, color, _, _, interlace = struct.unpack(">IIBBBBB", body)
            meta = dict(w=w, h=h, depth=depth, color=color, interlace=interlace)
        elif kind == b"IDAT":
            idat += body
        elif kind == b"IEND":
            break
        pos += 12 + length

    if meta["depth"] != 8 or meta["color"] != 6 or meta["interlace"]:
        raise SystemExit("expected an 8-bit RGBA, non-interlaced PNG")

    raw = zlib.decompress(idat)
    w, h, stride = meta["w"], meta["h"], meta["w"] * 4
    rows, prev, pos = [], bytearray(stride), 0

    for _ in range(h):
        filt = raw[pos]
        line = bytearray(raw[pos + 1 : pos + 1 + stride])
        pos += 1 + stride

        for i in range(stride):
            a = line[i - 4] if i >= 4 else 0
            b = prev[i]
            c = prev[i - 4] if i >= 4 else 0
            if filt == 1:
                line[i] = (line[i] + a) & 0xFF
            elif filt == 2:
                line[i] = (line[i] + b) & 0xFF
            elif filt == 3:
                line[i] = (line[i] + (a + b) // 2) & 0xFF
            elif filt == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pred) & 0xFF

        rows.append(line)
        prev = line

    return w, h, rows


def write_png(path, size, rows):
    def chunk(kind, body):
        return (
            struct.pack(">I", len(body))
            + kind
            + body
            + struct.pack(">I", zlib.crc32(kind + body) & 0xFFFFFFFF)
        )

    raw = b"".join(b"\x00" + bytes(row) for row in rows)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    open(path, "wb").write(png)


w, h, rows = read_png(SRC)
if w > CANVAS or h > CANVAS:
    raise SystemExit(f"logo is {w}x{h}, larger than the {CANVAS}px canvas")

left, top = (CANVAS - w) // 2, (CANVAS - h) // 2
canvas = [bytearray(CANVAS * 4) for _ in range(CANVAS)]

for y, row in enumerate(rows):
    target = canvas[top + y]
    target[left * 4 : (left + w) * 4] = row

write_png(OUT, CANVAS, canvas)
print(f"wrote {OUT} — {w}x{h} mark centred on {CANVAS}x{CANVAS}")
