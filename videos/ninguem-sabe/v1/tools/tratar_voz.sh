#!/usr/bin/env bash
# Leva a narração de uma parte a -16 LUFS com pico de -1.5 dBTP (loudnorm em duas passadas).
# Os originais em assets/audio/ ficam intactos; a cópia tratada vai para assets/audio/tratado/.
# Uso: tools/tratar_voz.sh 01
set -euo pipefail
cd "$(dirname "$0")/.."
N="$1"
IN="assets/audio/v1-parte${N}.mp3"
OUT="assets/audio/tratado/v1-parte${N}.mp3"
mkdir -p assets/audio/tratado
M=$(ffmpeg -hide_banner -nostats -i "$IN" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
val() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$IN" -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(val input_i):measured_TP=$(val input_tp):measured_LRA=$(val input_lra):measured_thresh=$(val input_thresh):offset=$(val target_offset):linear=true" \
  -ar 48000 -ac 1 -c:a libmp3lame -b:a 192k "$OUT"
