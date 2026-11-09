#!/usr/bin/env bash
# Prévias em imagem do vídeo 1 (compositions/previa.html, um quadro em t = 1 s): capa, elenco e capa vertical de corte.
# Uso: tools/previa_imagens.sh [capa elenco corte]  ->  previas/imagens/<qual>.png
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p previas/imagens
for QUAL in "${@:-capa elenco corte}"; do
  for q in $QUAL; do
    if [ "$q" = corte ]; then W=1080; H=1920; RES=portrait; else W=1920; H=1080; RES=landscape; fi
    cat > index.html <<HTML
<!doctype html>
<!-- raiz temporária de tools/previa_imagens.sh ($q) -->
<html lang="pt-BR" data-resolution="$RES">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=$W, height=$H" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #2b1b4a; }
      #root { position: relative; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="2" data-width="$W" data-height="$H">
      <div id="previa" class="clip" data-composition-id="previa" data-composition-src="compositions/previa.html" data-start="0" data-duration="2"
        data-track-index="1" data-track-kind="graphics" data-width="$W" data-height="$H" data-variable-values='{"qual":"$q"}' style="z-index: 1"></div>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
HTML
    SAIDA=$(npx --yes hyperframes@0.8.222 snapshot --at 1 2>&1 | grep -o '/[^ ]*/snapshots/[^/]*/' | head -1)
    cp "$(ls "$SAIDA"frame-*.png | head -1)" "previas/imagens/$q.png"
    echo "previas/imagens/$q.png"
  done
done
git checkout -q -- index.html 2>/dev/null || true
