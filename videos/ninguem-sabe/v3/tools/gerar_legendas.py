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
H33 = [(["3h33"], ["3:33"])]
PARTES = {
    "01": {"correcoes": H33, "grupos": "auto", "destaques": ["3:33", "vibra.", "e-mail,", "frase.", "sete", "dias.", "ninguém,", "ainda."]},
    # a transcrição desta parte veio sem pontuação: grupos escritos à mão
    "02": {"correcoes": [(["kkk"], ["kkkkk."]), (["em"], ["hein?"])], "grupos": [
        "De manhã,", "a sua mãe está na cozinha", "rindo, com o celular na mão.", "Olha que besteira, filho.",
        "Disseram que eu tenho", "*38* *anos.*", "Ela vira a tela para você,", "e você mostra a sua.", "O sorriso dela",
        "some um pouquinho.", "É *golpe,* ela diz.", "Apaga isso.", "No grupo da escola,", "todo mundo está postando",
        "o próprio número.", "*61* *anos.*", "*44.*", "*70.*", "Vira meme.", "Até que o Lucas,", "o seu melhor amigo,",
        "manda uma foto da tela dele.", "*Três* *dias* *kkkkk.*", "Vou aproveitar, hein?", "Todo mundo manda risada.",
        "Você também manda."]},
    "03": {"correcoes": [], "grupos": "auto", "destaques": ["ataque", "hacker,", "segundo,", "desligados,", "internet.", "faltam", "dois"]},
    "04": {"correcoes": [(["14h07."], ["14:07."]), (["14h05,"], ["14:05,"]), (["14h07"], ["14:07."])], "grupos": "auto",
           "destaques": ["relógio,", "pequenas,", "14:07.", "14:05,", "valeu", "tudo,", "mano.", "rindo.", "carteira,", "mais."]},
    "05": {"correcoes": [(["3", "e", "33."], ["3:33."])], "grupos": "auto",
           "destaques": ["sirene,", "pararam.", "param.", "golpe,", "tremendo.", "7", "horário,", "3:33."]},
    "06": {"correcoes": [], "grupos": "auto", "destaques": ["cabeça", "baixo.", "lotam,", "50", "data", "mão.", "chorar."]},
    "07": {"correcoes": H33 + [(["Um", "e", "meio", "novo."], ["Um", "e-mail", "novo."])], "grupos": "auto",
           "destaques": ["relógio.", "72", "4.320", "minutos.", "diminui.", "3:33", "Faltam", "três", "dias.", "medo,"]},
    "08": {"correcoes": [(["Julia"], ["Júlia"])], "grupos": "auto", "destaques": ["mar.", "Júlia", "pai", "mãe,", "bolso,", "celular."]},
    "09": {"correcoes": [], "grupos": "auto", "destaques": ["mar", "maior", "roupa", "Júlia.", "52", "anos.", "abraça."]},
    "10": {"correcoes": [(["A", "noite"], ["À", "noite,"]), (["passo"], ["passa"])], "grupos": "auto",
           "destaques": ["chave", "inglesa", "nunca", "andar.", "sexto", "boato", "mudou,", "nada."]},
    "11": {"correcoes": [(["A", "noite"], ["À", "noite,"]), (["no", "sala,"], ["no", "sofá", "da", "sala,"]),
                         (["3", "e", "30,"], ["3:30,"]), (["3", "e", "31,"], ["3:31,"]), (["3", "e", "32,"], ["3:32,"]), (["3", "e", "33."], ["3:33."])],
           "grupos": "auto", "destaques": ["melhor", "mãe", "ama", "chora", "ri", "3:30,", "3:31,", "3:32,", "3:33."]},
    "12": {"correcoes": [(["Um", "e", "meio", "novo."], ["Um", "e-mail", "novo."])], "grupos": "auto",
           "destaques": ["vibra", "respirando.", "tremendo.", "Data", "atualizada.", "frase.", "saber.", "chorar", "ninguém", "sabe."]},
    "13": {"correcoes": H33, "grupos": "auto", "destaques": ["risca", "outra.", "7", "dias?", "Ninguém", "Sabe,", "3:33", "abrir."]},
}

# Letreiros (regra 5: textos na tela em vermelho, no tempo da fala): (âncora, n, texto, duração[, "centro"]).
# A âncora é a palavra (transcrição corrigida) em que o letreiro entra; um número é um instante fixo da parte.
LETREIROS = {
    "01": [(0.6, 1, "E se você soubesse|o dia da sua morte?", 4.4, "centro"), ("Você tem", 1, "VOCÊ TEM 7 DIAS", 2.6)],
    "02": [(0.5, 1, "DIA 1", 2.5), ("38", 1, "38 ANOS", 1.9), ("três", 1, "3 DIAS kkkkk", 2.3)],
    "03": [("ataque", 1, "ATAQUE HACKER?", 1.9), ("faltam", 1, "FALTAM 2 DIAS", 1.7)],
    "04": [(0.5, 1, "DIA 3", 2.5), ("14:07.", 1, "14:07", 2.0), ("valeu", 1, "VALEU POR TUDO, MANO", 2.2), ("14:07.", 2, "14:07", 2.2)],
    "05": [("3:33.", 1, "3:33", 1.5)],
    "06": [(0.5, 1, "DIA 4", 2.5), ("50", 1, "50 ANOS", 1.5)],
    "07": [("72", 1, "72 HORAS", 1.9), ("4.320", 1, "4.320 MINUTOS", 2.4), ("Faltam", 1, "FALTAM 3 DIAS", 2.2)],
    "08": [(0.5, 1, "DIA 5", 2.5), ("Ver", 1, "VER O MAR", 1.6), ("Falar", 1, "JÚLIA", 1.6), ("Pedir", 1, "PAI", 1.6), ("dizer", 1, "MÃE", 1.6)],
    "09": [("52", 1, "52 ANOS", 1.9)],
    "10": [("sexto", 1, "DIA 6", 1.8), ("mudou,", 1, "A DATA MUDOU?", 2.1)],
    "11": [(0.5, 1, "DIA 7", 2.5), ("3:33.", 1, "3:33", 1.5)],
    "12": [("Data", 1, "DATA ATUALIZADA", 1.9), ("A partir", 1, "A PARTIR DE AGORA,|VOCÊ NÃO VAI MAIS SABER.", 3.4)],
    "13": [("o que você", 1, "O QUE VOCÊ FARIA|NOS SEUS 7 DIAS?", 3.2), ("Se inscreve", 1, "INSCREVA-SE", 2.0), (0.4, 1, "MESES DEPOIS", 2.6), (45.0, 1, "NINGUÉM SABE", 3.6, "centro")],
}
LETREIRO = {
    False: {"top": 92, "fonte": 100, "contorno": 7, "lados": 80, "centro_top": 380, "centro_fonte": 92},
    True: {"top": 300, "fonte": 112, "contorno": 8, "lados": 60, "centro_top": 760, "centro_fonte": 98},
}


INICIO_MINIMO = 0.12  # legenda em 0 s parece que já estava ali
FOLGA_SAIDA = 0.35  # quanto o grupo fica depois da última palavra, se houver pausa
SAIDA = 0.12


def chave(texto):
    t = unicodedata.normalize("NFC", texto).lower()
    return re.sub(r"[^\w:]", "", t)


def corrigir(palavras, correcoes):
    """Junta pedaços que o Whisper separa ("e" + "-mail", "4" + ".320") e aplica as correções da parte:
    a sequência transcrita vira a substituição; com o mesmo número de palavras os tempos ficam, senão o
    intervalo da sequência é dividido por igual entre as palavras novas."""
    base = []
    for p in palavras:
        if base and (re.match(r"^-\w", p["text"]) or re.match(r"^\.\d", p["text"])):
            base[-1] = {"text": base[-1]["text"] + p["text"], "start": base[-1]["start"], "end": p["end"]}
        else:
            base.append(dict(p))
    saida, i = [], 0
    while i < len(base):
        for seq, subst in correcoes:
            n = len(seq)
            if [chave(p["text"]) for p in base[i : i + n]] == [chave(s) for s in seq]:
                trecho = base[i : i + n]
                pont = re.sub(r"^.*?([.,?!]*)$", r"\1", trecho[-1]["text"])
                if len(subst) == n:
                    for p, s in zip(trecho, subst):
                        sp = re.sub(r"^.*?([.,?!]*)$", r"\1", p["text"])
                        saida.append({"text": s + (sp if not re.search(r"[.,?!]$", s) else ""), "start": p["start"], "end": p["end"]})
                else:
                    a0, a1 = trecho[0]["start"], trecho[-1]["end"]
                    passo = (a1 - a0) / max(1, len(subst))
                    for k, s in enumerate(subst):
                        fim = s + (pont if k == len(subst) - 1 and not re.search(r"[.,?!]$", s) else "")
                        saida.append({"text": fim, "start": a0 + k * passo, "end": a0 + (k + 1) * passo})
                i += n
                break
        else:
            saida.append(base[i])
            i += 1
    return saida


FUNCAO = {"a", "o", "as", "os", "do", "da", "dos", "das", "de", "e", "que", "em", "no", "na", "nos", "nas", "com", "para",
          "pra", "pro", "por", "um", "uma", "seu", "sua", "te", "se", "ao", "à", "mais", "tem", "é", "eu", "ele", "ela"}


def agrupar(palavras, destaques):
    """Grupos automáticos: frases curtas (até ~5 palavras / ~24 letras), quebrando na pontuação e nas pausas,
    sem terminar um grupo em palavra de ligação ("a", "do", "que"...)."""
    grupos, atual = [], []
    for i, p in enumerate(palavras):
        atual.append(p)
        prox = palavras[i + 1] if i + 1 < len(palavras) else None
        pausa = (prox["start"] - p["end"]) if prox else 9
        letras = len(" ".join(x["text"] for x in atual))
        if re.search(r"[.?!]$", p["text"]) or pausa > 0.45 or (p["text"].endswith(",") and len(atual) >= 2):
            grupos.append(atual)
            atual = []
        elif len(atual) >= 5 or letras >= 24:
            if prox and re.search(r"[.,?!]$", prox["text"]) and len(atual) < 6 and letras + len(prox["text"]) <= 31:
                continue
            leva = []
            while len(atual) > 2 and chave(atual[-1]["text"]) in FUNCAO:
                leva.insert(0, atual.pop())
            grupos.append(atual)
            atual = leva
    if atual:
        grupos.append(atual)
    juntos = []
    for g in grupos:
        if juntos and len(juntos[-1]) == 1 and len(juntos[-1][0]["text"]) <= 4 and not re.search(r"[.?!]$", juntos[-1][0]["text"]) and len(g) <= 4:
            juntos[-1] = juntos[-1] + g
        elif juntos and len(g) == 1 and len(juntos[-1]) <= 4 and g[0]["start"] - juntos[-1][-1]["end"] < 0.45 and not re.search(r"[.?!]$", juntos[-1][-1]["text"]):
            juntos[-1] = juntos[-1] + g
        else:
            juntos.append(g)
    return [[{"text": p["text"], "start": p["start"], "end": p["end"], "destaque": chave(p["text"]) in destaques} for p in g] for g in juntos]


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
    if cfg.get("grupos") == "auto":
        return agrupar(palavras, {chave(d) for d in cfg.get("destaques", [])}), dados["duracao"]
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


def duracao_da_parte(n, padrao):
    """duração total da parte (com a abertura e a folga do fim), de partes.json; sem ele, a da fala"""
    try:
        info = json.loads((RAIZ / "assets" / "audio" / "mix" / "partes.json").read_text())
        return max(padrao, next(p["duracao"] for p in info["partes"] if p["parte"] == int(n)))
    except (OSError, StopIteration, KeyError, ValueError):
        return padrao


def letreiros_da_parte(n, grupos, duracao):
    """[(t, texto, dur, centro)] da parte, com o instante de cada âncora (um letreiro pode passar do fim da fala,
    como o cartão do fim da parte 13, mas não do fim da parte)"""
    duracao = duracao_da_parte(n, duracao)
    plano = [it for g in grupos for it in g]
    saida = []
    for item in LETREIROS.get(n, []):
        ancora, k, texto, dur = item[:4]
        centro = len(item) > 4 and item[4] == "centro"
        if isinstance(ancora, (int, float)):
            t = float(ancora)
        else:
            alvo = [chave(w) for w in ancora.split()]
            visto, t = 0, None
            for i in range(len(plano) - len(alvo) + 1):
                if all(chave(plano[i + j]["text"]) == a for j, a in enumerate(alvo)):
                    visto += 1
                    if visto == k:
                        t = plano[i]["start"]
                        break
            if t is None:
                sys.exit(f"parte {n}: letreiro sem âncora {ancora!r} ({k})")
        saida.append((t, texto, min(dur, duracao - t), centro))
    return saida


def cronometrar(grupos, duracao):
    """[(ini, fim, itens)] com entrada, saída e o instante de cada palavra."""
    saida = []
    for gi, itens in enumerate(grupos):
        ini = max(INICIO_MINIMO, itens[0]["start"] - 0.04)
        prox = grupos[gi + 1][0]["start"] - 0.04 if gi + 1 < len(grupos) else duracao
        fim = min(prox, itens[-1]["end"] + FOLGA_SAIDA, duracao)
        saida.append((ini, fim, itens))
    return saida


def escrever(comp_id, prefixo, cronogramas, vertical, ajuste=lambda t: None, letreiros=()):
    e = ESTILO[vertical]
    lt = LETREIRO[vertical]
    blocos, roteiro = [], []
    for li, (t, texto, dur, centro) in enumerate(letreiros):
        linhas = "<br>".join(html.escape(x) for x in texto.split("|"))
        classe = "lt-letreiro lt-centro" if centro else "lt-letreiro"
        blocos.append(f'    <div id="{prefixo}-lt{li:02d}" class="{classe} {prefixo}-lt clip" data-start="{t:.3f}" data-duration="{dur:.3f}" data-track-index="1">{linhas}</div>')
        roteiro.append(f"{t:6.2f}–{t + dur:6.2f}  [letreiro] {texto}")
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
    .lt-letreiro {{
      position: absolute;
      left: {lt["lados"]}px;
      right: {lt["lados"]}px;
      top: {lt["top"]}px;
      text-align: center;
      font-family: Montserrat;
      font-weight: 900;
      font-size: {lt["fonte"]}px;
      line-height: 1.04;
      letter-spacing: 0.01em;
      text-transform: uppercase;
      color: #e3121b;
      -webkit-text-stroke: {lt["contorno"]}px #000;
      paint-order: stroke fill;
      text-shadow: 0 8px 0 rgba(0, 0, 0, 0.55), 0 0 26px rgba(0, 0, 0, 0.55);
    }}
    .lt-centro {{
      top: {lt["centro_top"]}px;
      font-size: {lt["centro_fonte"]}px;
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
      document.querySelectorAll(".{prefixo}-lt").forEach((el) => {{
        const ini = parseFloat(el.dataset.start);
        const fim = ini + parseFloat(el.dataset.duration);
        tl.fromTo(el, {{ opacity: 0, scale: 1.22, filter: "blur(8px)" }}, {{ opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.24, ease: "expo.out" }}, ini);
        tl.fromTo(el, {{ opacity: 1 }}, {{ opacity: 0, duration: 0.18, ease: "power2.in" }}, fim - 0.18);
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
    escrever(f"legendas-p{n}{sufixo}", f"lg{n}{'v' if vertical else ''}", cronometrar(grupos, duracao), vertical, ajuste_da_parte(n, vertical),
             letreiros_da_parte(n, grupos, duracao))


def corte(c):
    """Legendas de um corte vertical: as frases e os letreiros da parte do corte, no tempo do corte.
    Antes vem a capa; no meio a história para (CTA) e tudo o que vem depois anda mais CTA segundos."""
    info = json.loads((RAIZ / "assets" / "audio" / "mix" / "partes.json").read_text())
    k = next(x for x in info["cortes"] if x["corte"] == c)
    n = f"{k['parte']:02d}"
    a, b, m = k["inicio_na_parte"], k["fim_na_parte"], k["cta_na_parte"]
    capa, cta = k["capa"], k["cta"]
    mapa = lambda t: capa + (t - a) + (cta if t >= m else 0.0)
    grupos, duracao = montar_grupos(n)
    crono = []
    for ini, fim, itens in cronometrar(grupos, duracao):
        dentro = [dict(it, start=mapa(it["start"]), end=mapa(it["end"])) for it in itens if a <= it["start"] < b - 0.05]
        if not dentro:
            continue
        # um grupo não atravessa o CTA: fecha antes dele ou começa depois dele
        i2 = max(capa + 0.04, mapa(max(ini, a)), dentro[0]["start"] - 0.04)
        f2 = mapa(min(fim, b))
        if ini < m <= fim:
            f2 = min(f2, mapa(m - 0.01)) if dentro[0]["start"] < mapa(m) else f2
        if f2 - i2 > 0.15:
            crono.append((i2, f2, dentro))
    lets = [(mapa(t), tx, d, ce) for t, tx, d, ce in letreiros_da_parte(n, grupos, duracao) if a <= t < b - 0.3 and not ce and not tx.startswith("DIA ")]
    escrever(f"legendas-corte{c}", f"lgc{c}", crono, True, letreiros=lets)


if __name__ == "__main__":
    if sys.argv[1].startswith("corte"):
        corte(int(sys.argv[1][5:]))
    else:
        main(sys.argv[1].zfill(2), vertical="--vertical" in sys.argv)
