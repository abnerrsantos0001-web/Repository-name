#!/usr/bin/env bash
# Fila de renders: lê alvos de FILA (um por linha: "alvo saída.mp4"), renderiza um de cada vez
# e escreve "PRONTO alvo saída" ou "FALHOU alvo" no LOG. Termina ao ler a linha "fim".
# Uso: tools/fila.sh fila.txt fila.log  (com APOS=comando, roda "comando alvo saída.mp4" depois de cada render pronto)
set -uo pipefail
cd "$(dirname "$0")/.."
FILA="$1"
LOG="$2"
feitos=0
while true; do
  linha=$(sed -n "$((feitos + 1))p" "$FILA" 2>/dev/null || true)
  if [ -z "$linha" ]; then sleep 15; continue; fi
  [ "$linha" = "fim" ] && break
  alvo=$(echo "$linha" | awk '{print $1}')
  saida=$(echo "$linha" | awk '{print $2}')
  echo "INICIO $alvo $(date +%T)" >> "$LOG"
  if tools/renderizar.sh "$alvo" "$saida" > "$LOG.$alvo" 2>&1; then
    echo "PRONTO $alvo $saida $(date +%T)" >> "$LOG"
    if [ -n "${APOS:-}" ]; then $APOS "$alvo" "$saida" >> "$LOG" 2>&1; fi
  else
    echo "FALHOU $alvo $(date +%T)" >> "$LOG"
  fi
  feitos=$((feitos + 1))
done
echo "FILA_FIM $(date +%T)" >> "$LOG"
