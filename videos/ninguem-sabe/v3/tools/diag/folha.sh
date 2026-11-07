#!/usr/bin/env bash
# Folha de contato dos quadros soltos + luminância média (YAVG, 0–255) de cada um. Uso: tools/diag/folha.sh previas/q/NN
set -euo pipefail
D="$1"
for f in "$D"/q-*.png; do
  y=$(ffmpeg -v error -i "$f" -vf signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=- -f null - 2>/dev/null | grep -o 'YAVG=[0-9.]*' | cut -d= -f2)
  printf "%s YAVG %.0f%s\n" "$(basename "$f" .png)" "$y" "$(awk -v y="$y" 'BEGIN{ if (y < 70) print "  <-- ESCURO" }')"
done
n=$(ls "$D"/q-*.png | wc -l)
ffmpeg -v error -y -pattern_type glob -i "$D/q-*.png" -vf "scale=640:-2,tile=3x$(( (n + 2) / 3 ))" -frames:v 1 "$D/folha.jpg" 2>/dev/null || ffmpeg -v error -y -pattern_type glob -i "$D/q-*.png" -vf "scale=640:-2,tile=3x$(( (n + 2) / 3 ))" -frames:v 1 "$D/folha.jpg"
echo "$D/folha.jpg"
