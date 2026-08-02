#!/usr/bin/env bash
# Composite a screen recording into a laptop mockup render.
#
#   mockup_render.sh <video> <mockup.png> <asset-prefix> <duration> <out.mp4>
#   mockup_render.sh <video> <mockup.png> <asset-prefix> frame <out.png> [seek]
#
# <asset-prefix> is the prefix passed to mockup_prep.py, which supplies the
# screen mask, the notch bar and the perspective corners.
#
# Set CROP=w:h:x:y to trim the studio margin around the laptop, so the subject
# fills the frame instead of being sized up in CSS.
set -euo pipefail

FF=${FF:-/tmp/ffmpeg-bin/ffmpeg}
CROP=${CROP:-}
VIDEO=$1
MOCKUP=$2
PREFIX=$3
MODE=$4
OUT=$5
SEEK=${6:-8}

QUAD=$(cat "${PREFIX}_quad.txt")
MASK="${PREFIX}_mask.png"
STRIPE="${PREFIX}_stripe.png"
BASE="${PREFIX}_base.png"
CANVAS=2560:1920

# The video's four corners land on the screen's four corners, so stretching it
# to the canvas first is undone by the warp. setpts is required because overlay
# drops the video layer when a seek leaves its first PTS ahead of the stills.
# BASE has the blank screen painted black so the inset mask never leaves a
# white hairline between the bezel and the video.
chain="\
[0:v]setpts=PTS-STARTPTS,FPS scale=${CANVAS}:flags=lanczos,setsar=1,format=rgba,\
perspective=${QUAD}:sense=destination:interpolation=cubic[vid];\
[2:v]format=gray[mk];\
[vid][mk]alphamerge[fg];\
[1:v]scale=${CANVAS}:flags=lanczos,format=rgba[bg];\
[bg][fg]overlay=0:0:format=auto[mid];\
[3:v]format=rgba[bar];\
[mid][bar]overlay=0:0:format=auto,${CROP:+crop=$CROP,}format=PIXFMT"

if [ "$MODE" = frame ]; then
  filter=${chain/FPS /}
  filter=${filter/PIXFMT/rgb24}
  "$FF" -y -hide_banner -loglevel error \
    -ss "$SEEK" -i "$VIDEO" -i "$BASE" -i "$MASK" -i "$STRIPE" \
    -an -frames:v 1 -update 1 -filter_complex "$filter" "$OUT"
else
  filter=${chain/FPS /fps=24,}
  filter=${filter/PIXFMT/yuv420p}
  "$FF" -y -hide_banner \
    -i "$VIDEO" \
    -loop 1 -t "$MODE" -i "$BASE" \
    -loop 1 -t "$MODE" -i "$MASK" \
    -loop 1 -t "$MODE" -i "$STRIPE" \
    -an -t "$MODE" -filter_complex "$filter" \
    -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -movflags +faststart \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    "$OUT"
fi
