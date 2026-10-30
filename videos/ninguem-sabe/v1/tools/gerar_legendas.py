"""Gera compositions/legendas-pNN.html a partir de transcricao/v1-parteNN.json.

Legenda palavra por palavra: cada grupo (frase curta) aparece inteiro no lugar, e cada palavra
surge no instante em que é falada. Palavras de impacto (marcadas com *) ficam em vermelho.
Os grupos e as correções de texto de cada parte ficam em PARTES, abaixo.

Uso: python3 tools/gerar_legendas.py 01
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
    "01": {
        "correcoes": [
            (["7", "e", "12"], ["7:12"]),
            (["3", "e", "33"], ["3:33"]),
            (["da", "a", "madrugada."], ["da", "madrugada."]),
            (["terra"], ["Terra"]),
        ],
        "grupos": [
            "Você acorda.",
            "São *7:12* da manhã.",
            "O despertador não tocou.",
            "E tem alguma coisa",
            "*errada.*",
            "Não tem barulho.",
            "Nenhum carro.",
            "Nenhum cachorro latindo.",
            "Nenhum vizinho.",
            "Você pega o celular.",
            "*Zero* mensagens.",
            "*Zero* notificações.",
            "O último post",
            "de qualquer pessoa",
            "no mundo.",
            "Foi às *3:33*",
            "da madrugada.",
            "Você grita o nome",
            "da sua mãe.",
            "*Nada.*",
            "E é aí que",
            "você descobre.",
            "Todo mundo da Terra",
            "*sumiu.*",
            "*Menos* *você.*",
        ],
    },
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
                if len(subst) == 1:
                    saida.append({"text": subst[0], "start": trecho[0]["start"], "end": trecho[-1]["end"]})
                else:
                    # mesma quantidade ou menos: mantém os tempos das palavras que continuam
                    restantes = [p for p in trecho if chave(p["text"]) in {chave(s) for s in subst}]
                    for p, s in zip(restantes, subst):
                        saida.append({"text": s, "start": p["start"], "end": p["end"]})
                i += n
                break
        else:
            saida.append(dict(palavras[i]))
            i += 1
    return saida


def main(n):
    cfg = PARTES[n]
    dados = json.loads((RAIZ / "transcricao" / f"v1-parte{n}.json").read_text())
    duracao = dados["duracao"]
    palavras = corrigir(dados["palavras"], cfg["correcoes"])

    # casa as palavras dos grupos com as transcritas, pela posição
    grupos, k = [], 0
    for texto in cfg["grupos"]:
        itens = []
        for bruto in texto.split():
            destaque = bruto.startswith("*") and bruto.endswith("*")
            limpo = bruto.strip("*")
            p = palavras[k]
            if chave(p["text"]) != chave(limpo):
                sys.exit(f"grupo {texto!r}: esperava {limpo!r}, transcrição tem {p['text']!r} (palavra {k})")
            itens.append({"text": limpo, "start": p["start"], "end": p["end"], "destaque": destaque})
            k += 1
        grupos.append(itens)
    if k != len(palavras):
        sys.exit(f"sobraram palavras sem grupo: {' '.join(p['text'] for p in palavras[k:])}")

    blocos, roteiro = [], []
    for gi, itens in enumerate(grupos):
        ini = max(INICIO_MINIMO, itens[0]["start"] - 0.04)
        prox = grupos[gi + 1][0]["start"] - 0.04 if gi + 1 < len(grupos) else duracao
        fim = min(prox, itens[-1]["end"] + FOLGA_SAIDA, duracao)
        gid = f"lg{n}-g{gi:02d}"
        spans = []
        for wi, it in enumerate(itens):
            classe = "lg-palavra lg-impacto" if it["destaque"] else "lg-palavra"
            t = max(ini, it["start"])
            spans.append(
                f'<span id="{gid}-w{wi}" class="{classe}" data-t="{t:.3f}">{html.escape(it["text"])}</span>'
            )
        blocos.append(
            f'    <div id="{gid}" class="lg-grupo lg{n}-grupo clip" data-start="{ini:.3f}" '
            f'data-duration="{fim - ini:.3f}" data-track-index="0">\n      ' + "".join(spans) + "\n    </div>"
        )
        roteiro.append(f"{ini:6.2f}–{fim:6.2f}  " + " ".join(("*" + i["text"] + "*") if i["destaque"] else i["text"] for i in itens))

    pagina = f"""<!-- Gerado por tools/gerar_legendas.py a partir de transcricao/v1-parte{n}.json. Edite os grupos lá. -->
<template id="legendas-p{n}-template">
  <style>
    #root {{
      position: absolute;
      inset: 0;
      pointer-events: none;
    }}
    .lg-grupo {{
      position: absolute;
      left: 0;
      right: 0;
      bottom: 104px;
      text-align: center;
      white-space: nowrap;
      overflow: visible;
      font-family: Montserrat;
      font-weight: 800;
      font-size: 76px;
      line-height: 1.1;
      letter-spacing: 0.005em;
      text-transform: uppercase;
      color: #f4f2ee;
    }}
    .lg-palavra {{
      display: inline-block;
      margin: 0 0.13em;
      text-shadow:
        0 4px 0 rgba(0, 0, 0, 0.55),
        0 0 22px rgba(0, 0, 0, 0.65);
    }}
    .lg-impacto {{
      color: #e3262d;
    }}
  </style>
  <div id="root" data-composition-id="legendas-p{n}" data-width="1920" data-height="1080">
{chr(10).join(blocos)}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      document.querySelectorAll(".lg{n}-grupo").forEach((grupo) => {{
        const ini = parseFloat(grupo.dataset.start);
        const fim = ini + parseFloat(grupo.dataset.duration);
        grupo.querySelectorAll(".lg-palavra").forEach((palavra) => {{
          const t = parseFloat(palavra.dataset.t);
          if (palavra.classList.contains("lg-impacto")) {{
            tl.fromTo(
              palavra,
              {{ opacity: 0, scale: 1.18, filter: "blur(6px)" }},
              {{ opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.22, ease: "expo.out" }},
              t,
            );
          }} else {{
            tl.fromTo(
              palavra,
              {{ opacity: 0, filter: "blur(6px)" }},
              {{ opacity: 1, filter: "blur(0px)", duration: 0.13, ease: "power2.out" }},
              t,
            );
          }}
        }});
        tl.fromTo(grupo, {{ opacity: 1 }}, {{ opacity: 0, duration: {SAIDA}, ease: "power2.in" }}, fim - {SAIDA});
      }});
      window.__timelines["legendas-p{n}"] = tl;
    }})();
  </script>
</template>
"""
    destino = RAIZ / "compositions" / f"legendas-p{n}.html"
    destino.write_text(pagina)
    print(f"{destino.relative_to(RAIZ)}: {len(grupos)} grupos")
    print("\n".join(roteiro))


if __name__ == "__main__":
    main(sys.argv[1].zfill(2))
