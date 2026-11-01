#!/usr/bin/env bash
# Renderiza um alvo (02, todas, corte1...) numa cópia do projeto, para o index.html daqui ficar livre.
# Uso: tools/renderizar.sh <alvo> <saída.mp4>
set -euo pipefail
cd "$(dirname "$0")/.."
ALVO="$1"
SAIDA="$(realpath -m "$2")"
COPIA="${TMPDIR:-/tmp}/render-v2-$ALVO"
mkdir -p "$COPIA"
rm -rf "$COPIA" && mkdir -p "$COPIA"
tar --exclude=./renders --exclude=./.hyperframes --exclude=./previas --exclude=./assets/audio/brutos --exclude=./transcricao -cf - . | tar -xf - -C "$COPIA"
python3 tools/gerar_raizes.py "$ALVO" --saida "$COPIA" >/dev/null
mkdir -p "$(dirname "$SAIDA")"
(cd "$COPIA" && npx --yes hyperframes@0.8.222 render --quality looks --crf 14 --output "$COPIA/saida.mp4" --skill hyperframes --player-ready-timeout 240000)
cp "$COPIA/saida.mp4" "$SAIDA"
echo "pronto: $SAIDA"
