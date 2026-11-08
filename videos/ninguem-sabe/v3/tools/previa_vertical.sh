#!/usr/bin/env bash
# Prévia de um corte vertical (1080x1920): quadros nos instantes pedidos, em 720x1280 (720p), e numa folha.
# Uso: tools/previa_vertical.sh 1 "2,10,30"
set -euo pipefail
cd "$(dirname "$0")/.."
N="$1"
python3 tools/gerar_raizes.py "corte$N" >/dev/null
SAIDA=$(npx --yes hyperframes@0.8.222 snapshot --at "$2" 2>&1 | grep -o '/[^ ]*/snapshots/[^/]*/' | head -1)
DEST="previas/corte$N"
rm -rf "$DEST" && mkdir -p "$DEST"
for f in "$SAIDA"frame-*.png; do
  ffmpeg -v error -y -i "$f" -vf scale=720:1280:flags=lanczos "$DEST/$(basename "${f%.png}").jpg"
done
ffmpeg -v error -y -pattern_type glob -i "$DEST/frame-*.jpg" -vf "scale=270:480,tile=6x$(( ($(ls $DEST/frame-*.jpg | wc -l) + 5) / 6 ))" -frames:v 1 "$DEST/folha.jpg"
echo "$DEST"
