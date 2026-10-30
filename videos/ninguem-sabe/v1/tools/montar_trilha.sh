#!/usr/bin/env bash
# Monta a trilha de fundo de uma parte a partir da semente do MusicGen:
# repete a semente com crossfade, corta grave embolado, abre o médio (para ouvir em celular),
# entra e sai em fade e normaliza em -16 LUFS. O volume baixo sob a voz fica no index.html (data-volume).
# Uso: tools/montar_trilha.sh <duração em s> <saída.mp3>
set -euo pipefail
cd "$(dirname "$0")/.."
DUR="$1"
OUT="$2"
SEM=assets/trilha/semente-musicgen.wav
FIM=$(python3 -c "print(max(0, $DUR - 2.2))")
ffmpeg -v error -y -i "$SEM" -i "$SEM" -i "$SEM" -filter_complex \
  "[0][1]acrossfade=d=5:c1=tri:c2=tri[a];[a][2]acrossfade=d=5:c1=tri:c2=tri,\
highpass=f=45,equalizer=f=110:t=q:w=1:g=-5,equalizer=f=420:t=q:w=1.2:g=3,equalizer=f=1500:t=q:w=1:g=2,\
atrim=0:${DUR},afade=t=in:d=1.2,afade=t=out:st=${FIM}:d=2.2,loudnorm=I=-16:TP=-2:LRA=7" \
  -ar 48000 -ac 2 -c:a libmp3lame -b:a 192k "$OUT"
