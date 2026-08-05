#!/usr/bin/env python3
"""Report whether a WebM track carries an alpha channel.

ffmpeg writes VP8/VP9 alpha into a Matroska side channel that its own decoder
cannot read back, so `ffmpeg -i` always reports yuv420p and frame exports come
out opaque. Walking the EBML tree to TrackEntry > Video > AlphaMode is the only
reliable local check.

    webm_alpha_probe.py <file.webm> [...]
"""
import sys

MASTER = {
    0x18538067,  # Segment
    0x1654AE6B,  # Tracks
    0xAE,  # TrackEntry
    0xE0,  # Video
}
ALPHA_MODE = 0x53C0
TRACKS = 0x1654AE6B
CODEC_ID = 0x86


def read_vint(buf, pos, keep_marker):
    """Decode an EBML variable-length integer at pos."""
    first = buf[pos]
    if first == 0:
        raise ValueError("invalid vint")
    length = 1
    mask = 0x80
    while not first & mask:
        mask >>= 1
        length += 1
    value = first if keep_marker else first & (mask - 1)
    for i in range(1, length):
        value = (value << 8) | buf[pos + i]
    return value, pos + length


def walk(buf, start, end, depth, out, state):
    pos = start
    while pos < end:
        try:
            eid, pos = read_vint(buf, pos, True)
            size, pos = read_vint(buf, pos, False)
        except (IndexError, ValueError):
            return
        # Unknown-size elements only appear on Segment/Cluster; treat as rest.
        if size >= (1 << 56) - 1:
            size = end - pos
        stop = min(pos + size, end)
        if eid in MASTER or eid == TRACKS:
            walk(buf, pos, stop, depth + 1, out, state)
        elif eid == CODEC_ID:
            state["codec"] = buf[pos:stop].decode("ascii", "replace").strip("\x00")
        elif eid == ALPHA_MODE:
            out.append(int.from_bytes(buf[pos:stop], "big"))
        pos = stop


def probe(path):
    with open(path, "rb") as fh:
        # Alpha metadata lives in the header; no need to read whole video.
        buf = fh.read(4 * 1024 * 1024)
    found, state = [], {"codec": "?"}
    walk(buf, 0, len(buf), 0, found, state)
    alpha = any(v == 1 for v in found)
    print(
        "%-38s codec=%-12s AlphaMode=%-18s -> %s"
        % (
            path,
            state["codec"],
            found or "absent",
            "HAS ALPHA" if alpha else "opaque",
        )
    )
    return alpha


if __name__ == "__main__":
    for p in sys.argv[1:]:
        try:
            probe(p)
        except FileNotFoundError:
            print("%-38s missing" % p)
