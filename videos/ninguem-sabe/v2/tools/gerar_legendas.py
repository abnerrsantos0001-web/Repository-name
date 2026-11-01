"""Gera compositions/legendas-pNN.html a partir de transcricao/v2-parteNN.json.

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
    "01": {
        "correcoes": [(["7", "e", "12"], ["7:12"])],
        "grupos": [
            "São *7:12* da manhã,", "você acorda, levanta", "e vai para o banheiro,", "como todo dia,", "lava o rosto,",
            "levanta a cabeça", "e olha para o *espelho.*", "Tudo normal,", "você passa a mão no cabelo",
            "e o seu reflexo passa também,", "só que um *segundo* *depois,*", "você *congela.*", "Levanta a mão de novo,",
            "devagar,", "ele levanta junto,", "perfeito,", "sem atraso nenhum,", "você ri sozinho,", "sono,",
            "só pode ser sono,", "você dormiu tarde ontem,", "de novo,", "mas antes de sair do banheiro,",
            "alguma coisa te faz", "olhar mais uma vez,", "e por meio segundo,", "você jura que ele",
            "ainda estava *te* *olhando.*",
        ],
    },
    "02": {
        "correcoes": [],
        "grupos": [
            "O dia segue normal.", "Escola, celular, almoço.", "Mas tem umas", "coisinhas *estranhas.*",
            "Na tela preta do celular,", "o seu reflexo *pisca*", "quando você não piscou.", "Na vitrine da padaria,",
            "ele *demora*", "pra virar a cabeça.", "Você tenta não", "pensar nisso.", "Até que, no ônibus,",
            "encostado na janela,", "você olha pro vidro", "e o reflexo", "*não* está encostado.", "Ele está sentado reto,",
            "*olhando* para você.", "Você pisca", "e ele está encostado de novo,", "igual a você.",
            "Você desce dois pontos antes", "e vai andando para casa,", "sem olhar para", "nenhuma *janela.*",
        ],
    },
    "03": {
        "correcoes": [],
        "grupos": [
            "À noite, você decide", "provar pra você mesmo", "que está ficando *louco.*", "Fecha a porta do banheiro,",
            "acende a luz", "e para na frente do espelho.", "Levanta a mão direita.", "Ele levanta.", "Abaixa,",
            "ele abaixa.", "Você faz uma careta,", "ele faz.", "Mostra a língua,", "ele mostra.", "Você respira aliviado.",
            "Tá tudo bem.", "E aí você *sorri.*", "E ele *não* sorri.", "Ele fica parado, sério,", "com a cara que você tinha",
            "um segundo atrás,", "e então, bem devagar,", "ele *sorri,*", "um sorriso", "que não é o seu,", "grande *demais,*",
            "você apaga a luz", "e sai *correndo.*",
        ],
    },
    "04": {
        "correcoes": [(["3h33"], ["3:33"]), (["toque"], ["toc"]), (["vendo", "o"], ["vem", "do"])],
        "grupos": [
            "Você não dorme.", "Às *3:33* da madrugada,", "você escuta", "um barulho baixinho", "vindo do banheiro.",
            "*Toc,* *toc,* *toc,*", "como alguém batendo", "com o dedo no vidro.", "Você liga a lanterna", "do celular",
            "e vai até a porta.", "O espelho está lá,", "*vazio.*", "Só o banheiro", "escuro refletido.", "Nenhuma pessoa,",
            "nem *você.*", "Você está bem", "na frente dele,", "e o espelho", "*não* mostra você.", "Aí você escuta de novo",
            "o *toc,* *toc,* *toc,*", "só que agora vem", "do espelho do seu quarto,", "e da janela,", "e da tela do celular",
            "na sua mão.",
        ],
    },
    "05": {
        "correcoes": [],
        "grupos": [
            "No dia seguinte,", "você cobre todos os espelhos", "da casa com *lençol.*", "Vira o celular para baixo.",
            "Feche as cortinas.", "Sua mãe pergunta", "o que aconteceu", "e você não sabe", "o que responder.",
            "Então você pesquisa", "e descobre", "que *não* é o único.", "Tem gente no mundo inteiro",
            "relatando a mesma coisa.", "Reflexos *atrasando,*", "piscando sozinhos,", "*sorrindo.*", "E todos os relatos",
            "param de repente.", "As pessoas *somem* das redes", "depois de uma semana.", "O último post", "de todos eles",
            "diz a mesma coisa.", "Ele quer *trocar* *de* *lugar.*",
        ],
    },
    "06": {
        "correcoes": [],
        "grupos": [
            "Na *sétima* noite,", "você não aguenta mais.", "Tira o lençol", "do espelho do banheiro.", "Ele está lá,",
            "*esperando,*", "como se soubesse", "que você viria.", "E pela primeira vez,", "ele *não* finge mais",
            "te copiar.", "Ele encosta a mão no vidro,", "do lado dele.", "E você escuta", "sua própria *voz,*",
            "só que vindo", "de dentro do espelho.", "Você nunca se perguntou", "porque é sempre você", "que está desse lado?",
            "Você recua.", "Ele continua.", "Eu fiquei a vida inteira", "repetindo tudo", "que você fazia.", "Cada passo.",
            "Cada careta.", "Agora é a *sua* *vez.*",
        ],
    },
    "07": {
        "correcoes": [],
        "grupos": [
            "O vidro começa", "a ficar mole,", "como *água.*", "A mão dele atravessa", "e segura o seu pulso.",
            "Ela é *gelada.*", "Você puxa com toda a força,", "bate na pia,", "derruba as coisas no chão.", "Ele puxa de volta.",
            "Metade do seu braço", "já está do outro lado.", "E lá dentro é *frio,*", "silencioso,", "sem cheiro,",
            "sem *nada.*", "Você pega a primeira coisa", "que encontra,", "o secador de cabelo,", "e acerta o espelho.",
            "O vidro *estoura*", "em mil pedaços,", "e tudo fica quieto.", "Você cai sentado no chão,", "respirando forte.",
            "*Acabou.*",
        ],
    },
    "08": {
        "correcoes": [(["7h12."], ["7:12."])],
        "grupos": [
            "Você acorda", "no chão do banheiro.", "São *7:12.*", "A luz da manhã", "entra pela janelinha.",
            "Os cacos *sumiram.*", "O espelho está *inteiro,*", "como se nada", "tivesse acontecido.", "Você levanta devagar",
            "e se olha.", "Ele te copia.", "*Perfeitamente.*", "Você levanta a mão.", "Ele levanta.", "Sem atraso.",
            "Você sorri.", "E ele sorri junto.", "Do mesmo tamanho.", "Você desce.", "Sua mãe está fazendo o café,",
            "o rádio está ligado,", "tudo normal,", "mas tem uma coisa *estranha*", "que você ainda não percebeu.",
        ],
    },
    "09": {
        "correcoes": [],
        "grupos": [
            "O relógio da cozinha.", "Os números estão", "ao *contrário.*", "O nome na caixa de leite", "está ao *contrário.*",
            "O seu nome no caderno,", "ao *contrário.*", "Você corre até a janela", "e o ônibus passa",
            "com o letreiro *espelhado.*", "Você não quebrou o espelho", "pra fugir.", "Você quebrou o espelho",
            "do lado de *dentro.*", "E do outro lado do vidro,", "na sua casa de verdade,", "alguém está tomando café",
            "no seu *lugar,*", "com a sua cara,", "a sua voz,", "a sua mãe,", "e sorrindo,", "um sorriso", "só um pouquinho",
            "grande *demais.*",
        ],
    },
    "10": {
        "correcoes": [(["3h33?"], ["3:33?"])],
        "grupos": [
            "Desde aquele dia,", "você vive aqui,", "copiando cada movimento dele.", "Toda vez que ele passa",
            "por um espelho,", "você é obrigado", "a aparecer e repetir.", "Mas às vezes,", "quando ele está distraído,",
            "você *atrasa*", "só um segundinho,", "só pra ver", "se ele *percebe.*", "E agora me fala uma coisa,",
            "da última vez", "que você se olhou no espelho,", "você tem certeza", "que ele te copiou", "na hora certa?",
            "Comenta aqui,", "você teria coragem", "de encarar o seu reflexo", "às *3:33?*", "Se inscreve no *Ninguém* *Sabe,*",
            "porque a próxima história", "pode ser sobre *você.*",
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


def main(n, vertical=False):
    # na vertical (cortes 9:16): letras maiores, quebra de linha e o bloco perto do centro da tela
    v = "v" if vertical else ""
    sufixo = "-v" if vertical else ""
    cfg = PARTES[n]
    dados = json.loads((RAIZ / "transcricao" / f"v2-parte{n}.json").read_text())
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
        gid = f"lg{n}{v}-g{gi:02d}"
        spans = []
        for wi, it in enumerate(itens):
            classe = "lg-palavra lg-impacto" if it["destaque"] else "lg-palavra"
            t = max(ini, it["start"])
            spans.append(
                f'<span id="{gid}-w{wi}" class="{classe}" data-t="{t:.3f}">{html.escape(it["text"])}</span>'
            )
        blocos.append(
            f'    <div id="{gid}" class="lg-grupo lg{n}{v}-grupo clip" data-start="{ini:.3f}" '
            f'data-duration="{fim - ini:.3f}" data-track-index="0">\n      ' + "".join(spans) + "\n    </div>"
        )
        roteiro.append(f"{ini:6.2f}–{fim:6.2f}  " + " ".join(("*" + i["text"] + "*") if i["destaque"] else i["text"] for i in itens))

    pagina = f"""<!-- Gerado por tools/gerar_legendas.py a partir de transcricao/v2-parte{n}.json. Edite os grupos lá. -->
<template id="legendas-p{n}{sufixo}-template">
  <style>
    #root {{
      position: absolute;
      inset: 0;
      pointer-events: none;
    }}
    .lg-grupo {{
      position: absolute;
      left: {70 if vertical else 0}px;
      right: {70 if vertical else 0}px;
      bottom: {740 if vertical else 104}px;
      text-align: center;
      white-space: {"normal" if vertical else "nowrap"};
      overflow: visible;
      font-family: Montserrat;
      font-weight: 800;
      font-size: {96 if vertical else 76}px;
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
  <div id="root" data-composition-id="legendas-p{n}{sufixo}" data-width="{1080 if vertical else 1920}" data-height="{1920 if vertical else 1080}">
{chr(10).join(blocos)}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      document.querySelectorAll(".lg{n}{v}-grupo").forEach((grupo) => {{
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
      window.__timelines["legendas-p{n}{sufixo}"] = tl;
    }})();
  </script>
</template>
"""
    destino = RAIZ / "compositions" / f"legendas-p{n}{sufixo}.html"
    destino.write_text(pagina)
    print(f"{destino.relative_to(RAIZ)}: {len(grupos)} grupos")
    print("\n".join(roteiro))


if __name__ == "__main__":
    main(sys.argv[1].zfill(2), vertical="--vertical" in sys.argv)
