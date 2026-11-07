#!/usr/bin/env bash
# Commit + push de um MP4 pronto (a fila chama depois de cada render). Uso: tools/commit_render.sh alvo saida.mp4
# Recomprime se passar de 95 MB (o GitHub recusa arquivos acima de 100 MB). O rodapé do commit vem de RODAPE
# (a atribuição que o ambiente da sessão pedir); sem RODAPE, usa só o Co-Authored-By genérico.
set -uo pipefail
cd "$(dirname "$0")/.."
alvo="$1"; saida="$2"
VIDEO=$(basename "$PWD"); N="${VIDEO#v}"
RAMO=$(git rev-parse --abbrev-ref HEAD)
RODAPE="${RODAPE:-Co-Authored-By: Claude <noreply@anthropic.com>}"
tam=$(stat -c %s "$saida")
if [ "$tam" -gt 95000000 ]; then
  ffmpeg -v error -y -i "$saida" -c:v libx264 -crf 24 -preset slow -c:a copy "${saida%.mp4}-c.mp4" && mv "${saida%.mp4}-c.mp4" "$saida"
fi
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$saida")
case "$alvo" in
  corte*) msg="Vídeo $N: ${alvo} vertical renderizado (${dur%.*} s)";;
  todas) msg="Vídeo $N: filme completo renderizado";;
  *) msg="Vídeo $N: parte ${alvo} renderizada (${dur%.*} s)";;
esac
for i in 1 2 3 4 5 6; do
  if git add -f "$saida" && git commit -q -m "$msg

$RODAPE" -- "$saida"; then break; fi
  sleep $((i * 5))
done
for d in 2 4 8 16 32; do
  git push -q -u origin "$RAMO" && { echo "PUSH_OK $alvo $(date +%T)"; exit 0; }
  sleep $d
done
echo "PUSH_FALHOU $alvo"
