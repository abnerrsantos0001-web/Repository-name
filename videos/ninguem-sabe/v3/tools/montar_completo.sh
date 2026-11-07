#!/usr/bin/env bash
# Junta as 10 partes renderizadas em renders/v3-completo.mp4 (16:9).
# O vídeo de cada parte é cortado no número exato de quadros da parte (assets/audio/mix/partes.json)
# e o áudio é a mixagem contínua do filme inteiro (assets/audio/mix/v3-completo.flac), sem emendas.
# Duas passadas a ~1,55 Mbps: o arquivo fica abaixo dos 100 MB do GitHub (7 min de filme).
# Uso: tools/montar_completo.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mapfile -t QUADROS < <(python3 -c 'import json; [print(p["quadros"]) for p in json.load(open("assets/audio/mix/partes.json"))["partes"]]')
entradas=()
filtro=""
for i in "${!QUADROS[@]}"; do
  n=$(printf "%02d" $((i + 1)))
  entradas+=(-i "renders/v3-parte$n.mp4")
  filtro+="[$i:v]trim=end_frame=${QUADROS[$i]},setpts=PTS-STARTPTS[v$i];"
done
for i in "${!QUADROS[@]}"; do filtro+="[v$i]"; done
filtro+="concat=n=${#QUADROS[@]}:v=1:a=0[v]"
LOG="${TMPDIR:-/tmp}/v3-completo-2pass"
ffmpeg -v error -stats -y "${entradas[@]}" -filter_complex "$filtro" -map "[v]" \
  -c:v libx264 -preset slow -b:v 1550k -pass 1 -passlogfile "$LOG" -pix_fmt yuv420p -r 30 -an -f mp4 /dev/null
ffmpeg -v error -stats -y "${entradas[@]}" -i assets/audio/mix/v3-completo.flac \
  -filter_complex "$filtro" -map "[v]" -map "${#QUADROS[@]}:a" \
  -c:v libx264 -preset slow -b:v 1550k -pass 2 -passlogfile "$LOG" -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 128k -movflags +faststart -shortest renders/v3-completo.mp4
ls -la renders/v3-completo.mp4
