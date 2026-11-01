#!/usr/bin/env bash
# Junta as 11 partes renderizadas em renders/v1-completo.mp4 (16:9).
# O vídeo de cada parte é cortado no número exato de quadros da parte (assets/audio/mix/partes.json)
# e o áudio é a mixagem contínua do filme inteiro (assets/audio/mix/v1-completo.flac), sem emendas.
# Uso: tools/montar_completo.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mapfile -t QUADROS < <(python3 -c 'import json; [print(p["quadros"]) for p in json.load(open("assets/audio/mix/partes.json"))["partes"]]')
entradas=()
filtro=""
for i in "${!QUADROS[@]}"; do
  n=$(printf "%02d" $((i + 1)))
  entradas+=(-i "renders/v1-parte$n.mp4")
  filtro+="[$i:v]trim=end_frame=${QUADROS[$i]},setpts=PTS-STARTPTS[v$i];"
done
for i in "${!QUADROS[@]}"; do filtro+="[v$i]"; done
filtro+="concat=n=${#QUADROS[@]}:v=1:a=0[v]"
ffmpeg -v error -stats -y "${entradas[@]}" -i assets/audio/mix/v1-completo.flac \
  -filter_complex "$filtro" -map "[v]" -map "${#QUADROS[@]}:a" \
  -c:v libx264 -preset medium -crf 21 -maxrate 2400k -bufsize 4800k -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -movflags +faststart -shortest renders/v1-completo.mp4
ls -la renders/v1-completo.mp4
