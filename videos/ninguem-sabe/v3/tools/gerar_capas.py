"""Capas do vídeo 3 (regras 7 e 9): um quadro forte da cena (capa/fundos/*.png, tirado com tools/diag/quadros.mjs)
com o texto curto em vermelho, contorno preto. Escreve as composições que o gerar_raizes.py usa:
- compositions/partecapacorteN.html (1080x1920) -> capa/corteN-capa.png (o primeiro 0,8 s de cada corte)
- compositions/partecapa.html (1920x1080) -> capa/capa-v3.png (1280x720, a capa do vídeo longo)
O PNG sai de um snapshot do HyperFrames em t=1 s (as fontes são as mesmas do vídeo). Uso: python3 tools/gerar_capas.py
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
# texto (linhas com |), fundo, onde fica o texto ("alto" ou "baixo"), deslocamento vertical extra (px), fração da largura
CAPAS = {
    "corte1": ("VOCÊ TEM|7 DIAS", "capa/fundos/corte1.png", "alto", 0, 1.0),
    "corte2": ("ELE TINHA|3 DIAS", "capa/fundos/corte2.png", "alto", 0, 1.0),
    "corte3": ("14:07", "capa/fundos/corte3.png", "alto", 0, 1.0),
    "corte4": ("O MEU|TAMBÉM|TEM HORA", "capa/fundos/corte4.png", "alto", -100, 1.0),
    "corte5": ("4.320|MINUTOS", "capa/fundos/corte5.png", "alto", 0, 1.0),
    "corte6": ("A DATA|MUDOU?", "capa/fundos/corte6.png", "alto", -90, 0.84),
    "capa": ("VOCÊ TEM|7 DIAS", "capa/fundos/capa-v3.png", "alto", 0, 0.5),
}

MODELO = """<!doctype html>
<!--
  Ninguém Sabe · Vídeo 3 · {titulo}: "{texto_simples}" em vermelho sobre um quadro da cena. Gerado por tools/gerar_capas.py.
-->
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={w}, height={h}" />
    <title>{titulo}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      #{p}-raiz {{ position: absolute; inset: 0; overflow: hidden; background: #0c0d0f; font-family: Montserrat; }}
      #{p}-fundo {{ position: absolute; inset: 0; width: {w}px; height: {h}px; object-fit: cover; }}
      #{p}-vinheta {{ position: absolute; inset: 0; background: {vinheta}; }}
      #{p}-texto {{ position: absolute; left: {lados}px; right: {lados}px; top: {top}px; text-align: {alinhar}; font-weight: 900; font-size: {fonte}px;
        line-height: 0.96; letter-spacing: -0.01em; text-transform: uppercase; color: #e3121b; -webkit-text-stroke: {contorno}px #0b0b0c;
        paint-order: stroke fill; text-shadow: 0 {sombra}px 0 rgba(0, 0, 0, 0.7), 0 0 60px rgba(0, 0, 0, 0.65); }}
      .{p}-linha {{ display: block; }}
    </style>
  </head>
  <body>
    <div id="{p}-raiz" data-composition-id="{id}" data-width="{w}" data-height="{h}" data-duration="2">
      <img id="{p}-fundo" src="{fundo}" alt="" />
      <div id="{p}-vinheta"></div>
      <div id="{p}-texto">{linhas}</div>
    </div>
    <script>
      (function () {{
        var raiz = document.getElementById("{p}-raiz");
        var tl = gsap.timeline({{ paused: true }});
        // parado: a capa é um quadro só (o snapshot é em t=1 s); o set dá duração à timeline
        tl.set(raiz.querySelector("#{p}-texto"), {{ opacity: 1 }}, 0).set({{}}, {{}}, 2);
        window.__timelines = window.__timelines || {{}};
        window.__timelines["{id}"] = tl;
      }})();
    </script>
  </body>
</html>
"""


def escrever(chave, texto, fundo, onde, desloca, fracao=1.0):
    vertical = chave.startswith("corte")
    w, h = (1080, 1920) if vertical else (1920, 1080)
    linhas = texto.split("|")
    maior = max(len(l) for l in linhas)
    largura = (w - (2 * 70 if vertical else 2 * 90)) * fracao
    fonte = int(min(250 if vertical else 200, largura / (0.72 * maior)))
    altura = fonte * 0.96 * len(linhas)
    if vertical:
        top = (250 if onde == "alto" else int(h * 0.62 - altura / 2)) + desloca
        vinheta = "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 38%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.5) 100%)"
        alinhar, lados = "center", 70
    else:
        top = (90 if onde == "alto" else int(h - 90 - altura)) + desloca
        vinheta = "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)"
        alinhar, lados = "left", 90
    id_ = "partecapa" if chave == "capa" else f"partecapa{chave}"
    html = MODELO.format(
        titulo="Capa do vídeo longo" if chave == "capa" else f"Capa do {chave}",
        texto_simples=" ".join(linhas),
        w=w, h=h, p="pc" + chave, id=id_, fundo=fundo, vinheta=vinheta, lados=lados, top=top, alinhar=alinhar,
        fonte=fonte, contorno=max(6, fonte // 22), sombra=max(8, fonte // 16),
        linhas="".join(f'<span class="pc{chave}-linha">{l}</span>' for l in linhas),
    )
    (RAIZ / "compositions" / f"{id_}.html").write_text(html)
    print(f"compositions/{id_}.html  ({texto!r}, fonte {fonte}px, topo {top}px)")


if __name__ == "__main__":
    for chave, item in CAPAS.items():
        escrever(chave, *item)
