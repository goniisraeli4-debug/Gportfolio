#!/usr/bin/env bash
# Composite a screen recording into a laptop mockup with a transparent studio
# background (laptop + shadow only). Outputs WebM VP9 with alpha.
#
#   mockup_render_alpha.sh <video> <mockup.png> <asset-prefix> <silhouette-mask> <duration> <out.webm>
set -euo pipefail

FF=${FF:-/tmp/ffmpeg-bin/ffmpeg}
VIDEO=$1
MOCKUP=$2
PREFIX=$3
SILHOUETTE=$4
DUR=$5
OUT=$6

QUAD=$(cat "${PREFIX}_quad.txt")
MASK="${PREFIX}_mask.png"
STRIPE="${PREFIX}_stripe.png"
BASE="${PREFIX}_base.png"
CANVAS=2560:1920

# BASE has the blank screen painted black so the inset mask never leaves a
# white hairline between the bezel and the video.
"$FF" -y -hide_banner \
  -i "$VIDEO" \
  -loop 1 -t "$DUR" -i "$BASE" \
  -loop 1 -t "$DUR" -i "$MASK" \
  -loop 1 -t "$DUR" -i "$STRIPE" \
  -loop 1 -t "$DUR" -i "$SILHOUETTE" \
  -an -t "$DUR" \
  -filter_complex "\
[0:v]setpts=PTS-STARTPTS,fps=24,scale=${CANVAS}:flags=lanczos,setsar=1,format=rgba,\
perspective=${QUAD}:sense=destination:interpolation=cubic[vid];\
[2:v]fps=24,format=gray[smk];\
[vid][smk]alphamerge[screen];\
[1:v]fps=24,scale=${CANVAS}:flags=lanczos,format=rgba[laptop_rgb];\
[4:v]fps=24,scale=${CANVAS}:flags=lanczos,format=gray[sil];\
[laptop_rgb][sil]alphamerge[laptop];\
[laptop][screen]overlay=0:0:format=auto[mid];\
[3:v]fps=24,format=rgba[bar];\
[mid][bar]overlay=0:0:format=auto,format=yuva420p[out]" \
  -map "[out]" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 28 -auto-alt-ref 0 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  "$OUT"
