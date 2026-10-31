"""Escreve compositions/parteNN.html: o esqueleto comum (canvas, vinheta, relógio da parte) + o miolo
da cena (o script de módulo com os planos, a câmera e o personagem), lido de um arquivo .js.

Uso: python3 tools/nova_parte.py NN "descrição" miolo.js [extra.html]
O extra.html (opcional) entra dentro da raiz, acima do canvas (cartões de texto, títulos).
"""
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
n = sys.argv[1].zfill(2)
descricao = sys.argv[2]
miolo = Path(sys.argv[3]).read_text()
extra = Path(sys.argv[4]).read_text() if len(sys.argv) > 4 else ""
dur = next(p["duracao"] for p in json.loads((RAIZ / "assets/audio/mix/partes.json").read_text())["partes"] if p["parte"] == int(n))

html = f"""<!doctype html>
<!--
  Ninguém Sabe · Vídeo 1 · Parte {n}: {descricao}
  Motor em assets/js/cena.js; esqueleto gerado por tools/nova_parte.py.
-->
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Parte {n}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      #p{n}-raiz {{ position: absolute; inset: 0; overflow: hidden; background: #0c0d0f; }}
      #p{n}-tela {{ position: absolute; left: 0; top: 0; display: block; }}
      #p{n}-vinheta {{ position: absolute; inset: 0; background: radial-gradient(ellipse 72% 68% at 50% 46%, rgba(0, 0, 0, 0) 52%, rgba(0, 0, 0, 0.6) 100%); }}
      #p{n}-escuro {{ position: absolute; inset: 0; background: #000; opacity: 0; }}
      #p{n}-fonte {{ position: absolute; left: 0; top: 0; opacity: 0; font-family: Inter; font-weight: 700; font-size: 20px; }}
    </style>
  </head>
  <body>
    <div id="p{n}-raiz" data-composition-id="parte{n}" data-width="1920" data-height="1080" data-duration="{dur}">
      <canvas id="p{n}-tela" width="1920" height="1080"></canvas>
      <div id="p{n}-vinheta"></div>
{extra}      <div id="p{n}-escuro"></div>
      <div id="p{n}-fonte" data-layout-ignore>Aa 0123456789</div>
    </div>
    <script>
      (function () {{
        // relógio da parte: tween linear que chama host.render(t); o motor (cena.js) pendura a cena nele.
        // O HyperFrames roda este script mais de uma vez (cópia escondida e cópia visível): cada passada avisa o motor.
        var id = "parte{n}";
        var raiz = document.getElementById("p{n}-raiz");
        var duracao = parseFloat(raiz.dataset.duration) || {dur};
        var relogio = {{ t: 0 }};
        var host = {{
          relogio: relogio,
          duracao: duracao,
          tela: document.getElementById("p{n}-tela"),
          escuro: document.getElementById("p{n}-escuro"),
          // vertical quando o host que monta a cena é mais alto que largo (cortes 9:16)
          vars: {{ formato: raiz.parentElement && Number(raiz.parentElement.dataset.height) > Number(raiz.parentElement.dataset.width) ? "vertical" : "horizontal" }},
          render: null,
        }};
        window["__" + id] = host;
        window.__hf = window.__hf || {{}};
        window.__hf.buildReady = window.__hf.buildReady || {{}};
        window.__hf.buildReady[id] = new Promise(function (resolve) {{
          host.pronto = resolve;
        }});
        var tl = gsap.timeline({{ paused: true }});
        tl.to(relogio, {{ t: duracao, duration: duracao, ease: "none", onUpdate: function () {{ if (host.render) host.render(relogio.t); }} }});
        host.tl = tl;
        if (window.__extras && window.__extras[id]) window.__extras[id](tl, raiz);
        window.__timelines = window.__timelines || {{}};
        window.__timelines[id] = tl;
        if (window.__aoHost && window.__aoHost[id]) window.__aoHost[id](host);
      }})();
    </script>
    <script type="module">
{miolo}
    </script>
  </body>
</html>
"""
(RAIZ / "compositions" / f"parte{n}.html").write_text(html)
print(f"compositions/parte{n}.html ({dur}s)")
