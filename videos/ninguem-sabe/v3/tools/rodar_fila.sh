#!/usr/bin/env bash
# Roda uma fila de renders (tools/fila.sh) e faz commit + push de cada MP4 pronto (tools/commit_render.sh).
# Uso (em segundo plano, no máximo ~2 h por fila; termine a fila com a linha "fim"):
#   TMPDIR=<pasta temporária grande> RODAPE="<atribuição do commit>" tools/rodar_fila.sh fila.txt fila.log
# fila.txt: uma linha "alvo saída.mp4" por render (ex.: "01 renders/v3-parte01.mp4", "corte1 renders/v3-corte1.mp4").
cd "$(dirname "$0")/.."
APOS="$(pwd)/tools/commit_render.sh" tools/fila.sh "$1" "$2"
