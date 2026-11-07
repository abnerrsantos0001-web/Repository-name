"""Gera compositions/legendas-pNN.html a partir de transcricao/v3-parteNN.json.

Legenda palavra por palavra: cada grupo (frase curta) aparece inteiro no lugar, e cada palavra
surge no instante em que é falada. Palavras de impacto (marcadas com *) ficam em vermelho.
Os grupos e as correções de texto de cada parte ficam em PARTES, abaixo.

Uso: python3 tools/gerar_legendas.py 01 [--vertical]
"""
import html
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# Correções do texto do Whisper: (sequência transcrita, substituição). Os tempos da sequência
# viram os da substituição (primeira palavra começa, última termina). Lista vazia = remover.
# Grupos: o texto de cada legenda, em ordem; *palavra* = destaque vermelho.
PARTES = {
    # preenchido depois da transcrição (tools/transcrever_brutos.py + tools/alinhar_parte.py):
    # "01": {"correcoes": [(["3h33"], ["3:33"])], "grupos": ["São *3:33*", "da madrugada,", ...]},
}

INICIO_MINIMO = 0.12  # legenda em 0 s parece que já estava ali
FOLGA_SAIDA = 0.35  # quanto o grupo fica depois da última palavra, se houver pausa
SAIDA = 0.12


def chave(texto):
    t = unicodedata.normalize("NFC", texto).lower()
    return re.sub(r"[^\w:]", "", t)


def corrigir(palavras, correcoes):
    saida, i = [], 0
    while i < len(palavras):
        for seq, subst in correcoes:
            n = len(seq)
            if [chave(p["text"]) for p in palavras[i : i + n]] == [chave(s) for s in seq]:
                trecho = palavras[i : i + n]
                pont = re.sub(r"^.*?([.,?!]*)$", r"\1", trecho[-1]["text"])
                if len(subst) == n:
                    for p, s in zip(trecho, subst):
                        sp = re.sub(r"^.*?([.,?!]*)$", r"\1", p["text"])
                        saida.append({"text": s + (sp if not re.search(r"[.,?!]$", s) else ""), "start": p["start"], "end": p["end"]})
                elif len(subst) == 1:
                    saida.append({"text": subst[0], "start": trecho[0]["start"], "end": trecho[-1]["end"]})
                elif n == 1:
                    # uma palavra transcrita que na fala são várias: divide o tempo dela
                    a0, a1 = trecho[0]["start"], trecho[0]["end"]
                    passo = (a1 - a0) / len(subst)
                    for j, s in enumerate(subst):
                        saida.append({"text": s + (pont if j == len(subst) - 1 else ""), "start": a0 + j * passo, "end": a0 + (j + 1) * passo})
                else:
                    # menos palavras: mantém os tempos das palavras que continuam
                    restantes = [p for p in trecho if chave(p["text"]) in {chave(s) for s in subst}]
                    for p, s in zip(restantes, subst):
                        saida.append({"text": s, "start": p["start"], "end": p["end"]})
                i += n
                break
        else:
            saida.append(dict(palavras[i]))
            i += 1
    return saida


# REGRAS FIXAS DO CANAL (legendas fora do centro, fonte menor, contorno preto):
# 16:9 no terço inferior, bloco a ~80% da altura; vertical a 65–70% da altura.
ESTILO = {
    False: {"bottom": 165, "fonte": 66, "contorno": 5, "lados": 0, "quebra": "nowrap", "w": 1920, "h": 1080},
    True: {"bottom": 600, "fonte": 86, "contorno": 6, "lados": 70, "quebra": "normal", "w": 1080, "h": 1920},
}
# exceção por plano (só dentro da faixa permitida): {"NN": [(t0, t1, bottom_16x9, bottom_vertical), ...]}
FAIXA = {False: (120, 220), True: (520, 680)}
LEGENDA_POR_PLANO = {}


def montar_grupos(n):
    """Grupos de uma parte, com o tempo de cada palavra (segundos dentro da parte)."""
    cfg = PARTES[n]
    dados = json.loads((RAIZ / "transcricao" / f"v3-parte{n}.json").read_text())
    palavras = corrigir(dados["palavras"], cfg["correcoes"])
    grupos, k = [], 0
    for texto in cfg["grupos"]:
        itens = []
        for bruto in texto.split():
            destaque = bruto.startswith("*") and bruto.endswith("*")
            limpo = bruto.strip("*")
            p = palavras[k]
            if chave(p["text"]) != chave(limpo):
                sys.exit(f"parte {n}, grupo {texto!r}: esperava {limpo!r}, transcrição tem {p['text']!r} (palavra {k})")
            itens.append({"text": limpo, "start": p["start"], "end": p["end"], "destaque": destaque})
            k += 1
        grupos.append(itens)
    if k != len(palavras):
        sys.exit(f"parte {n}: sobraram palavras sem grupo: {' '.join(p['text'] for p in palavras[k:])}")
    return grupos, dados["duracao"]


def cronometrar(grupos, duracao):
    """[(ini, fim, itens)] com entrada, saída e o instante de cada palavra."""
    saida = []
    for gi, itens in enumerate(grupos):
        ini = max(INICIO_MINIMO, itens[0]["start"] - 0.04)
        prox = grupos[gi + 1][0]["start"] - 0.04 if gi + 1 < len(grupos) else duracao
        fim = min(prox, itens[-1]["end"] + FOLGA_SAIDA, duracao)
        saida.append((ini, fim, itens))
    return saida


def escrever(comp_id, prefixo, cronogramas, vertical, ajuste=lambda t: None):
    e = ESTILO[vertical]
    blocos, roteiro = [], []
    for gi, (ini, fim, itens) in enumerate(cronogramas):
        gid = f"{prefixo}-g{gi:02d}"
        spans = []
        for wi, it in enumerate(itens):
            classe = "lg-palavra lg-impacto" if it["destaque"] else "lg-palavra"
            t = max(ini, it["start"])
            spans.append(f'<span id="{gid}-w{wi}" class="{classe}" data-t="{t:.3f}">{html.escape(it["text"])}</span>')
        b = ajuste(ini)
        estilo = f' style="bottom: {b}px"' if b is not None else ""
        blocos.append(
            f'    <div id="{gid}" class="lg-grupo {prefixo}-grupo clip" data-start="{ini:.3f}" '
            f'data-duration="{fim - ini:.3f}" data-track-index="0"{estilo}>\n      ' + "".join(spans) + "\n    </div>"
        )
        roteiro.append(f"{ini:6.2f}–{fim:6.2f}  " + " ".join(("*" + i["text"] + "*") if i["destaque"] else i["text"] for i in itens))
    pagina = f"""<!-- Gerado por tools/gerar_legendas.py. Edite os grupos lá. -->
<template id="{comp_id}-template">
  <style>
    #root {{
      position: absolute;
      inset: 0;
      pointer-events: none;
    }}
    .lg-grupo {{
      position: absolute;
      left: {e["lados"]}px;
      right: {e["lados"]}px;
      bottom: {e["bottom"]}px;
      text-align: center;
      white-space: {e["quebra"]};
      overflow: visible;
      font-family: Montserrat;
      font-weight: 800;
      font-size: {e["fonte"]}px;
      line-height: 1.12;
      letter-spacing: 0.005em;
      text-transform: uppercase;
      color: #f4f2ee;
    }}
    .lg-palavra {{
      display: inline-block;
      margin: 0 0.13em;
      -webkit-text-stroke: {e["contorno"]}px #000;
      paint-order: stroke fill;
      text-shadow:
        0 5px 0 rgba(0, 0, 0, 0.55),
        0 0 18px rgba(0, 0, 0, 0.6);
    }}
    .lg-impacto {{
      color: #e3262d;
    }}
  </style>
  <div id="root" data-composition-id="{comp_id}" data-width="{e["w"]}" data-height="{e["h"]}">
{chr(10).join(blocos)}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      document.querySelectorAll(".{prefixo}-grupo").forEach((grupo) => {{
        const ini = parseFloat(grupo.dataset.start);
        const fim = ini + parseFloat(grupo.dataset.duration);
        grupo.querySelectorAll(".lg-palavra").forEach((palavra) => {{
          const t = parseFloat(palavra.dataset.t);
          if (palavra.classList.contains("lg-impacto")) {{
            tl.fromTo(palavra, {{ opacity: 0, scale: 1.18, filter: "blur(6px)" }}, {{ opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.22, ease: "expo.out" }}, t);
          }} else {{
            tl.fromTo(palavra, {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.13, ease: "power2.out" }}, t);
          }}
        }});
        tl.fromTo(grupo, {{ opacity: 1 }}, {{ opacity: 0, duration: {SAIDA}, ease: "power2.in" }}, fim - {SAIDA});
      }});
      window.__timelines["{comp_id}"] = tl;
    }})();
  </script>
</template>
"""
    destino = RAIZ / "compositions" / f"{comp_id}.html"
    destino.write_text(pagina)
    print(f"{destino.relative_to(RAIZ)}: {len(cronogramas)} grupos")
    print("\n".join(roteiro))


def ajuste_da_parte(n, vertical):
    lo, hi = FAIXA[vertical]
    regras = LEGENDA_POR_PLANO.get(n, [])

    def f(t):
        for t0, t1, b16, bv in regras:
            if t0 <= t < t1:
                b = bv if vertical else b16
                return max(lo, min(hi, b))
        return None

    return f


def main(n, vertical=False):
    grupos, duracao = montar_grupos(n)
    sufixo = "-v" if vertical else ""
    escrever(f"legendas-p{n}{sufixo}", f"lg{n}{'v' if vertical else ''}", cronometrar(grupos, duracao), vertical, ajuste_da_parte(n, vertical))


def corte(c):
    """Legendas de um corte vertical por intervalo: as frases das partes que o intervalo toca,
    no tempo do corte (a capa vem antes, então tudo anda CAPA segundos)."""
    info = json.loads((RAIZ / "assets" / "audio" / "mix" / "partes.json").read_text())
    fps = info["fps"]
    k = next(x for x in info["cortes"] if x["corte"] == c)
    q0, q1, capa = k["quadro_inicio"], k["quadro_fim"], k["capa"]
    crono = []
    for p in info["partes"]:
        a, b = p["quadro_inicial"], p["quadro_inicial"] + p["quadros"]
        if b <= q0 or a >= q1:
            continue
        n = f"{p['parte']:02d}"
        grupos, duracao = montar_grupos(n)
        desl = (a - q0) / fps + capa  # tempo da parte -> tempo do corte
        lim0, lim1 = capa, capa + (q1 - q0) / fps
        for ini, fim, itens in cronometrar(grupos, duracao):
            dentro = [dict(it, start=it["start"] + desl, end=it["end"] + desl) for it in itens if lim0 <= it["start"] + desl < lim1 - 0.05]
            if not dentro:
                continue
            i2 = max(lim0 + 0.04, ini + desl, dentro[0]["start"] - 0.04)
            f2 = min(fim + desl, lim1)
            if f2 - i2 > 0.15:
                crono.append((i2, f2, dentro))
    escrever(f"legendas-corte{c}", f"lgc{c}", crono, True)


if __name__ == "__main__":
    if sys.argv[1].startswith("corte"):
        corte(int(sys.argv[1][5:]))
    else:
        main(sys.argv[1].zfill(2), vertical="--vertical" in sys.argv)
