#!/usr/bin/env bash
# Drop a mockup's studio background using a silhouette mask from
# studio_cutout.py, leaving the laptop's own pixels untouched.
#
#   studio_cutout_encode.sh <video> <mask.png> <width> <duration> <out.webm> <out.mp4>
#
# The WebM carries real alpha; the MP4 fallback bakes the page paper in behind
# the laptop so engines without alpha WebM still see no studio block.
set -euo pipefail

FF=${FF:-/tmp/ffmpeg-bin/ffmpeg}
PAPER=${PAPER:-0xF4F4F4}
FPS=${FPS:-24}
VIDEO=$1
MASK=$2
WIDTH=$3
DUR=$4
OUT_WEBM=$5
OUT_MP4=$6

read -r SRC_W SRC_H <<<"$("$FF" -hide_banner -i "$VIDEO" 2>&1 |
  sed -n 's/.*, \([0-9]\{3,\}\)x\([0-9]\{3,\}\).*/\1 \2/p' | head -1)"
HEIGHT=$(( (SRC_H * WIDTH / SRC_W) / 2 * 2 ))

cut="[0:v]setpts=PTS-STARTPTS,fps=${FPS},scale=${WIDTH}:${HEIGHT}:flags=lanczos,setsar=1,format=rgba[v];\
[1:v]scale=${WIDTH}:${HEIGHT}:flags=lanczos,format=gray[m];\
[v][m]alphamerge"

"$FF" -y -hide_banner -loglevel error \
  -i "$VIDEO" -loop 1 -t "$DUR" -i "$MASK" -t "$DUR" \
  -filter_complex "${cut},format=yuva420p[out]" -map "[out]" -map 0:a? \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 32 \
  -deadline good -cpu-used 3 -row-mt 1 -auto-alt-ref 0 \
  -c:a libopus -b:a 128k -ac 2 -ar 48000 -shortest \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  "$OUT_WEBM" &
webm=$!

"$FF" -y -hide_banner -loglevel error \
  -i "$VIDEO" -loop 1 -t "$DUR" -i "$MASK" -t "$DUR" \
  -filter_complex "${cut}[fg];\
color=c=${PAPER}:s=${WIDTH}x${HEIGHT}:r=${FPS}[bg];\
[bg][fg]overlay=0:0:shortest=1,format=yuv420p[out]" -map "[out]" -map 0:a? \
  -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k -ac 2 -ar 48000 -shortest \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  "$OUT_MP4" &
mp4=$!

wait $webm && wait $mp4
ls -lh "$OUT_WEBM" "$OUT_MP4"
