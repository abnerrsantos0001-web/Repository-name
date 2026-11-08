"""Gera as composições raiz do vídeo 3 (as páginas que o HyperFrames renderiza).

- pNN.html: uma parte em 16:9 (cena + legendas + áudio da parte).
- index.html: o filme inteiro em sequência (para abrir no Studio), ou uma parte só durante o trabalho.
- corteN: cortes verticais 1080x1920 (capa + uma parte reenquadrada com o CTA no meio + cartão final de 4 s).

Tempos e quadros vêm de assets/audio/mix/partes.json (tools/audio.py).
Uso: python3 tools/gerar_raizes.py 02|todas|corte1 [--saida pasta]  (escreve pasta/index.html)
"""
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
INFO = json.loads((RAIZ / "assets" / "audio" / "mix" / "partes.json").read_text())
FPS = INFO["fps"]
PARTES = {p["parte"]: p for p in INFO["partes"]}
CARTAO = 4.0
# Cortes verticais (REGRAS FIXAS DO CANAL): intervalos da história de 45–60 s terminando no suspense,
# com a capa (0,5–1 s) na frente e o cartão final de 4 s. Os intervalos vêm de cortes.json e os quadros
# exatos, de partes.json (tools/audio.py encaixa tudo na grade de quadros).

CABECA = """<!doctype html>
<!-- Gerado por tools/gerar_raizes.py. {descricao} -->
<html lang="pt-BR" data-resolution="{resolucao}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={w}, height={h}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {w}px; height: {h}px; overflow: hidden; background: #0c0d0f; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{dur}" data-width="{w}" data-height="{h}">
{corpo}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""


def host(id_, src, ini, dur, faixa, tipo, w, h, z, variaveis=None):
    v = f"\n        data-variable-values='{json.dumps(variaveis)}'" if variaveis else ""
    return f"""      <div
        id="{id_}"
        class="clip"
        data-composition-id="{id_}"
        data-composition-src="{src}"
        data-start="{ini:.4f}"
        data-duration="{dur:.4f}"
        data-track-index="{faixa}"
        data-track-kind="{tipo}"
        data-width="{w}"
        data-height="{h}"{v}
        style="z-index: {z}"
      ></div>"""


def audio(id_, src, ini, dur):
    return f"""      <audio id="{id_}" class="clip" src="{src}" data-start="{ini:.4f}" data-duration="{dur:.4f}" data-track-index="9" data-volume="1"></audio>"""


def existe(n):
    return (RAIZ / "compositions" / f"parte{n:02d}.html").exists()


def parte_16x9(n):
    p = PARTES[n]
    d = p["duracao"]
    corpo = "\n".join([
        host(f"parte{n:02d}", f"compositions/parte{n:02d}.html", 0, d, 1, "graphics", 1920, 1080, 1),
        host(f"legendas-p{n:02d}", f"compositions/legendas-p{n:02d}.html", 0, d, 2, "captions", 1920, 1080, 2),
        audio(f"audio-p{n:02d}", f"assets/audio/mix/v3-parte{n:02d}.flac", 0, d),
    ])
    return CABECA.format(descricao=f"Parte {n:02d} em 16:9.", resolucao="landscape", w=1920, h=1080, dur=f"{d:.4f}", corpo=corpo)


def filme(numeros):
    blocos, t = [], 0.0
    for n in numeros:
        d = PARTES[n]["duracao"]
        blocos += [
            host(f"parte{n:02d}", f"compositions/parte{n:02d}.html", t, d, 1, "graphics", 1920, 1080, 1),
            host(f"legendas-p{n:02d}", f"compositions/legendas-p{n:02d}.html", t, d, 2, "captions", 1920, 1080, 2),
            audio(f"audio-p{n:02d}", f"assets/audio/mix/v3-parte{n:02d}.flac", t, d),
        ]
        t += d
    desc = "Vídeo 3 inteiro (partes " + ", ".join(f"{n:02d}" for n in numeros) + ")."
    return CABECA.format(descricao=desc, resolucao="landscape", w=1920, h=1080, dur=f"{t:.4f}", corpo="\n".join(blocos))


def corte(c):
    """Corte vertical (regras 6–8): capa -> a parte a partir de "inicio" -> pausa com o CTA1 (botão INSCREVA-SE) perto
    de 70% -> o resto da parte -> cartão final (CTA2) sobre o último quadro congelado. Uma instância só da cena:
    a pausa e o congelamento são variáveis da composição (pausaEm/pausaDur, ate)."""
    k = next(x for x in INFO["cortes"] if x["corte"] == c)
    n = k["parte"]
    capa, cta, cartao = k["capa"], k["cta"], k["cartao"]
    a, b, m = k["inicio_na_parte"], k["fim_na_parte"], k["cta_na_parte"]
    historia = (b - a) + cta
    total = k["quadros"] / FPS
    variaveis = {"inicio": a, "ate": round(b - 1 / FPS, 4), "pausaEm": m, "pausaDur": cta}
    blocos = [f"""      <img id="capa-corte{c}" class="clip" src="capa/corte{c}-capa.png" data-start="0" data-duration="{capa:.4f}"
        data-track-index="4" style="position: absolute; inset: 0; width: 1080px; height: 1920px; object-fit: cover; z-index: 6" />"""]
    blocos.append(host(f"parte{n:02d}", f"compositions/parte{n:02d}.html", capa, total - capa, 1, "graphics", 1080, 1920, 1, variaveis))
    blocos.append(host(f"legendas-corte{c}", f"compositions/legendas-corte{c}.html", 0, capa + historia, 2, "captions", 1080, 1920, 2))
    blocos.append(host("cta-inscreva", "compositions/cta-inscreva.html", capa + (m - a), cta, 3, "graphics", 1080, 1920, 3))
    blocos.append(host("cartao-final", "compositions/cartao-final.html", capa + historia, total - capa - historia, 3, "graphics", 1080, 1920, 4))
    blocos.append(audio(f"audio-corte{c}", f"assets/audio/mix/corte{c}.flac", 0, total))
    desc = f"Corte vertical {c}: capa + parte {n:02d} ({a:.2f}–{b:.2f} s) com o CTA em {m:.2f} s + cartão final."
    return CABECA.format(descricao=desc, resolucao="portrait", w=1080, h=1920, dur=f"{total:.4f}", corpo="\n".join(blocos))


if __name__ == "__main__":
    # alvo: NN (uma parte), "todas" (o filme), "corteN" (vertical). Escreve <saida>/index.html.
    alvo = sys.argv[1]
    saida = Path(sys.argv[sys.argv.index("--saida") + 1]) if "--saida" in sys.argv else RAIZ
    if alvo == "todas":
        html = filme([n for n in PARTES if existe(n)])
    elif alvo == "capa":
        corpo = host("partecapa", "compositions/partecapa.html", 0, 2.0, 1, "graphics", 1920, 1080, 1)
        html = CABECA.format(descricao="Capa do vídeo longo (quadro em t=1 s).", resolucao="landscape", w=1920, h=1080, dur="2.0000", corpo=corpo)
    elif alvo.startswith("capacorte"):
        # capa vertical de um corte: compositions/partecapacorteN.html, quadro em t=1 s
        c = alvo[9:]
        corpo = host(f"partecapacorte{c}", f"compositions/partecapacorte{c}.html", 0, 2.0, 1, "graphics", 1080, 1920, 1)
        html = CABECA.format(descricao=f"Capa do corte {c} (quadro em t=1 s).", resolucao="portrait", w=1080, h=1920, dur="2.0000", corpo=corpo)
    elif alvo.startswith("corte"):
        html = corte(int(alvo[5:]))
    else:
        html = parte_16x9(int(alvo))
    (saida / "index.html").write_text(html)
    print(saida / "index.html", "->", alvo)
