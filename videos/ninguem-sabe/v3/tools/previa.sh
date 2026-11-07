#!/usr/bin/env bash
# Prévia em 720p de uma parte: quadros nos instantes pedidos (snapshot do HyperFrames), reduzidos para 1280x720,
# e uma folha de contato em previas/pNN/. Uso: tools/previa.sh 01 "1,3,5.5,8"
set -euo pipefail
cd "$(dirname "$0")/.."
N="$1"
python3 tools/gerar_raizes.py "$N" >/dev/null
SAIDA=$(npx --yes hyperframes@0.8.222 snapshot --at "$2" 2>&1 | grep -o '/[^ ]*/snapshots/[^/]*/' | head -1)
DEST="previas/p$N"
rm -rf "$DEST" && mkdir -p "$DEST"
for f in "$SAIDA"frame-*.png; do
  ffmpeg -v error -y -i "$f" -vf scale=1280:720:flags=lanczos "$DEST/$(basename "${f%.png}").jpg"
done
ffmpeg -v error -y -pattern_type glob -i "$DEST/frame-*.jpg" -vf "scale=640:360,tile=3x$(( ($(ls $DEST/frame-*.jpg | wc -l) + 2) / 3 ))" -frames:v 1 "$DEST/folha.jpg"
echo "$DEST"
