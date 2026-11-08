#!/usr/bin/env bash
# Junta o vídeo longo renderizado em renders/v3-completo.mp4 (16:9), na ordem da regra 1 (REGRAS.md):
#   gancho (os 5–7 s mais fortes, da parte 4: o Lucas às 14:07) -> corte seco para o preto com um grave
#   (21 quadros) -> as 13 partes.
# O vídeo de cada parte é cortado no número exato de quadros (assets/audio/mix/partes.json) e o áudio é a mixagem
# contínua do filme inteiro (assets/audio/mix/v3-completo.flac, que já tem o gancho, o grave e o preto), sem emendas.
# Duas passadas com a taxa calculada para o arquivo ficar em ~95 MB (abaixo dos 100 MB do GitHub) com 10 min de filme.
# Uso: tools/montar_completo.sh
set -euo pipefail
cd "$(dirname "$0")/.."
read -r GP GI GF PRETO TOTAL < <(python3 -c 'import json; d=json.load(open("assets/audio/mix/partes.json")); g=d["gancho"]; p=d["partes"][g["parte"]-1]; print(g["parte"], g["quadro_inicio"]-p["quadro_inicial"], g["quadro_fim"]-p["quadro_inicial"], g["preto_quadros"], d["completo_quadros"])')
mapfile -t QUADROS < <(python3 -c 'import json; [print(p["quadros"]) for p in json.load(open("assets/audio/mix/partes.json"))["partes"]]')
N=${#QUADROS[@]}
entradas=()
for i in "${!QUADROS[@]}"; do entradas+=(-i "renders/v3-parte$(printf "%02d" $((i + 1))).mp4"); done
entradas+=(-i "renders/v3-parte$(printf "%02d" "$GP").mp4")
filtro="[$N:v]trim=start_frame=$GI:end_frame=$GF,setpts=PTS-STARTPTS[g];"
filtro+="color=c=black:s=1920x1080:r=30,trim=end_frame=$PRETO,setpts=PTS-STARTPTS,format=yuv420p[p];"
for i in "${!QUADROS[@]}"; do filtro+="[$i:v]trim=end_frame=${QUADROS[$i]},setpts=PTS-STARTPTS[v$i];"; done
filtro+="[g][p]"
for i in "${!QUADROS[@]}"; do filtro+="[v$i]"; done
filtro+="concat=n=$((N + 2)):v=1:a=0[v]"
DUR=$(python3 -c "print($TOTAL / 30)")
KBPS=$(python3 -c "print(int(95 * 8000 / $DUR - 128))")
echo "gancho: parte $GP, quadros $GI–$GF; preto: $PRETO quadros; total: $TOTAL quadros ($DUR s); vídeo a ${KBPS} kbps"
LOG="${TMPDIR:-/tmp}/v3-completo-2pass"
ffmpeg -v error -stats -y "${entradas[@]}" -filter_complex "$filtro" -map "[v]" \
  -c:v libx264 -preset slow -tune animation -b:v "${KBPS}k" -pass 1 -passlogfile "$LOG" -pix_fmt yuv420p -r 30 -an -f mp4 /dev/null
ffmpeg -v error -stats -y "${entradas[@]}" -i assets/audio/mix/v3-completo.flac \
  -filter_complex "$filtro" -map "[v]" -map "$((N + 1)):a" \
  -c:v libx264 -preset slow -tune animation -b:v "${KBPS}k" -pass 2 -passlogfile "$LOG" -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 128k -movflags +faststart -shortest renders/v3-completo.mp4
ls -la renders/v3-completo.mp4
