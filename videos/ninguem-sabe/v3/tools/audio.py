"""Áudio do vídeo 3 ("E se você soubesse o dia da sua morte?"), todo feito por código (tools/sons.py).

- Narração: as 13 partes (assets/audio/v3-parteNN.flac, já com a abertura sem voz) juntas e niveladas; cada parte
  ganha uma folga no fim (0,8 s; 8 s na última, para o cartão final e o celular vibrando às 3:33).
- Trilha: drone grave + pad + ar do cômodo, uma camada aguda de tensão (relógio, 14:07, 3:33) e uma camada maior,
  quente ("esperança") nas partes da lista, do mar, da Júlia, da garagem e do café.
- Efeitos presos às palavras (transcricao/v3-parteNN.json).
- Completo (regra 1): gancho de 5–7 s (o Lucas às 14:07, parte 4) + corte seco para preto com grave + o filme.
- Cortes (regras 6–8): capa com pancada + trecho da parte + CTA1 ("se inscreve no Ninguém Sabe", trilha abaixada,
  sininho) perto de 70% + o resto do trecho + cartão de 4 s com o CTA2 ("a história completa já está no canal").

Saídas em assets/audio/mix/: v3-parteNN.flac, v3-completo.flac, corteN.flac e partes.json (quadros de tudo).
Uso: <python com numpy, scipy e soundfile> tools/audio.py
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sons import *  # noqa: E402,F401,F403
from sons import SR, decodificar, loudnorm, trilha, envelope, esperanca  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
FPS = 30
AQ = SR // FPS  # amostras por quadro
SAIDA = RAIZ / "assets" / "audio" / "mix"
ORDEM = json.loads((RAIZ / "transcricao" / "ordem.json").read_text())
ABERTURA = {p["parte"]: p["abertura"] for p in ORDEM["partes"]}
N = 13

# ------------------------------------------------------------ narração e tempos
palavras, vozes = [], []
for k in range(N):
    dados = json.loads((RAIZ / "transcricao" / f"v3-parte{k + 1:02d}.json").read_text())
    palavras.append(dados["palavras"])
    v = decodificar(RAIZ / "assets" / "audio" / f"v3-parte{k + 1:02d}.flac")
    folga = 8.0 if k == N - 1 else 0.8
    fim = int((dados["palavras"][-1]["end"] + folga) * SR)
    vozes.append(np.pad(v, (0, max(0, fim - len(v))))[:fim])
# cada parte começa num quadro inteiro
quadros = [0]
for v in vozes:
    quadros.append(quadros[-1] + int(np.ceil(len(v) / AQ)))
G = [q / FPS for q in quadros]  # início de cada parte (s)
TOTAL = quadros[-1] * AQ
narr = np.zeros(TOTAL, dtype=np.float32)
for k, v in enumerate(vozes):
    narr[quadros[k] * AQ : quadros[k] * AQ + len(v)] = v
narr = loudnorm(narr, alvo=-16.0, pico=-1.5)
narr = np.pad(narr, (0, max(0, TOTAL - len(narr))))[:TOTAL].astype(np.float32)


def chave(s):
    return re.sub(r"[^\w:]", "", unicodedata.normalize("NFC", s).lower())


def T(parte, texto, n=1, fim=False):
    """tempo global (s) da n-ésima ocorrência de `texto` na parte (1 a 13)"""
    alvo = [chave(w) for w in texto.split()]
    ws = palavras[parte - 1]
    visto = 0
    for i in range(len(ws) - len(alvo) + 1):
        if all(chave(ws[i + j]["text"]) == a for j, a in enumerate(alvo)):
            visto += 1
            if visto == n:
                w = ws[i + len(alvo) - 1] if fim else ws[i]
                return G[parte - 1] + (w["end"] if fim else w["start"])
    raise SystemExit(f"não achei '{texto}' ({n}) na parte {parte}")


def L(parte, s):
    """tempo global de um instante local da parte"""
    return G[parte - 1] + s


FIM = TOTAL / SR

# ------------------------------------------------------------ trilha
intens = envelope([
    (0, 0.0), (1.2, 0.55), (T(1, "vibra."), 0.8), (T(1, "Mas no"), 0.95), (T(1, "Você tem"), 1.2), (G[1], 0.7),
    (T(2, "sorriso"), 0.85), (T(2, "três dias"), 1.0), (G[2], 0.75), (T(3, "Você decide"), 0.55), (G[3], 0.7),
    (T(4, "detalhe"), 1.0), (T(4, "14h07."), 1.2), (T(4, "não está"), 1.15), (T(4, "14h07", 2), 1.35),
    (T(4, "mais.", fim=True) + 0.3, 0.3), (G[4], 0.5), (G[4] + 1, 0.9), (T(5, "pararam."), 1.2), (T(5, "Às 11"), 0.75),
    (T(5, "3 e 33."), 1.25), (G[5], 0.9), (T(6, "Na mesa"), 0.7), (G[6], 0.85), (T(7, "4 .320"), 1.1),
    (T(7, "Faltam"), 1.3), (G[7], 0.55), (T(8, "Ver o"), 0.45), (G[8], 0.5), (T(9, "Na volta"), 0.4),
    (T(9, "52"), 0.35), (G[9], 0.5), (T(10, "boato"), 0.85), (T(10, "decide"), 1.0), (G[10], 0.4),
    (T(11, "A noite"), 0.7), (T(11, "3 e 30,"), 1.0), (T(11, "3 e 33."), 1.35), (T(11, "3 e 33.") + 0.6, 0.2),
    (G[11], 0.25), (T(12, "Data atualizada."), 1.1), (T(12, "A partir"), 1.35), (T(12, "saber.", fim=True) + 0.4, 0.4),
    (T(12, "Afinal,"), 0.9), (G[12], 0.6), (T(13, "Agora me"), 0.5), (FIM - 4.5, 0.9), (FIM, 0.0),
], TOTAL)
# camada aguda de tensão (reaproveita a camada "de vidro" da biblioteca)
agudo = envelope([
    (0, 0.0), (T(1, "Você tem") - 0.5, 0.0), (T(1, "Você tem"), 0.6), (G[1], 0.1), (T(4, "detalhe"), 0.4),
    (T(4, "14h07", 2), 1.0), (T(4, "mais.", fim=True), 0.0), (T(5, "3 e 33."), 0.7), (G[5], 0.1),
    (T(7, "Faltam"), 0.8), (G[7], 0.0), (T(11, "3 e 31,"), 0.4), (T(11, "3 e 33."), 0.9), (G[11], 0.2),
    (T(12, "A partir"), 1.0), (T(12, "Afinal,"), 0.2), (FIM, 0.0),
], TOTAL)
cama = trilha(TOTAL, intensidade=intens, vidro=agudo)
# esperança: entra quando ele decide parar de contar e some na madrugada do sétimo dia
luz = envelope([
    (0, 0), (T(8, "Você não vai"), 0), (T(8, "Ver o"), 0.8), (G[8], 0.9), (T(9, "maior"), 1.0), (T(9, "Na volta"), 0.6),
    (T(9, "52"), 1.0), (G[9], 0.6), (T(10, "boato") - 1, 0.6), (T(10, "boato") + 1.5, 0.0), (G[10], 0.0),
    (G[10] + 1.5, 0.9), (T(11, "chora rindo,"), 1.0), (T(11, "A noite"), 0.0), (T(13, "A folha"), 0.0),
    (T(13, "risca"), 0.7), (T(13, "Agora me"), 0.5), (FIM - 4.5, 0.0), (FIM, 0),
], TOTAL)
quente = esperanca(TOTAL) * luz

# ------------------------------------------------------------ efeitos
efeitos = np.zeros(TOTAL, dtype=np.float32)
pistas = []


def por(t, som, ganho=1.0, nome=""):
    i = int(round(t * SR))
    j = min(TOTAL, i + len(som))
    if 0 <= i < TOTAL:
        efeitos[i:j] += (ganho * som[: j - i]).astype(np.float32)
        pistas.append({"t": round(float(t), 3), "efeito": nome})


def coracao_ate(t, fim, passo=0.85, minimo=0.45, ganho=0.7):
    while t < fim:
        por(t, coracao(), ganho, "coração")
        t += passo
        passo = max(minimo, passo * 0.93)


# parte 1: a rua dormindo, 3:33, o celular vibra; o e-mail em todos os celulares do planeta
por(L(1, 0.0), grilos(G[1] - G[0] - 4), 1.0, "grilos")
por(L(1, 0.25), grave_susto(), 0.35, "título")
for k in (0, 1):
    por(T(1, "vibra.") - 0.25 + 1.2 * k, vibracao(1.0), 0.9, "vibração")
for k in range(9):
    por(T(1, "todos os") + 0.3 * k + 0.07 * (k % 3), notificacao(), 0.18 + 0.03 * (k % 4), "notificações pelo mundo")
por(T(1, "chega o"), grave_susto(), 0.45, "susto grave")
por(T(1, "Você tem") - 0.1, grave_susto(), 0.85, "susto grave")
# parte 2: cozinha de manhã, o grupo da escola, o "3 dias kkkkk"
por(L(2, 0.0), cafeteira(3.6), 0.9, "cafeteira")
por(L(2, 0.0), rua(10.0), 0.25, "rua lá fora")
por(T(2, "38"), grave_susto(), 0.35, "susto grave")
for w in ("61", "44", "70", "vira meme"):
    por(T(2, w) - 0.15, notificacao(), 0.5, "notificação")
por(T(2, "manda uma") + 0.4, notificacao(), 0.65, "notificação")
por(T(2, "três dias") - 0.1, grave_susto(), 0.55, "susto grave")
for k in range(4):
    por(T(2, "risada") + 0.18 * k, notificacao(), 0.3, "notificação")
por(T(2, "também") + 0.5, notificacao(), 0.55, "notificação")
# parte 3: o jornal na TV, depois videogame e o lanche
por(L(3, 0.0), jornal_tv(T(3, "Você decide") - G[2] + 0.2), 1.0, "jornal na TV")
por(T(3, "ataque"), grave_susto(), 0.3, "susto grave")
por(T(3, "mesmo segundo,") , grave_susto(), 0.45, "susto grave")
por(T(3, "joga") - 0.2, videogame(T(3, "você paga.", fim=True) - T(3, "joga") + 0.6), 1.0, "videogame")
por(T(3, "lanche"), papel(0.6, 621), 0.6, "embalagem do lanche")
# parte 4: a sala de aula, o relógio, o 14:07
por(L(4, 0.0), multidao(T(4, "Na hora") - G[3], 0.6, 311) , 0.35, "sala de aula")
por(T(4, "relógio,") - 0.6, tique_relogio(3.2, 1.0, 0.7), 1.0, "relógio")
por(T(4, "intervalo") - 0.2, sinal_escola(2.0), 0.7, "sinal da escola")
por(T(4, "intervalo") + 0.5, multidao(T(4, "Às 14h05,") - T(4, "intervalo"), 0.9, 313), 0.3, "intervalo")
por(T(4, "14h07."), grave_susto(), 0.8, "susto grave")
por(T(4, "Às 14h05,") - 0.2, tique_relogio(T(4, "14h07", 2) - T(4, "Às 14h05,") + 0.2, 1.0, 0.55), 1.0, "relógio")
por(T(4, "manda uma") + 0.2, vibracao(0.5), 0.6, "mensagem")
coracao_ate(T(4, "não está"), T(4, "14h07", 2) + 0.2, passo=0.8, minimo=0.5)
por(T(4, "14h07", 2), grave_susto(), 0.9, "susto grave")
# parte 5: só as luzes da ambulância (o som de longe), o jornal à noite, o 3:33 dele
por(L(5, 0.0), sirene_ambulancia(T(5, "mas o") - G[4] + 1.0), 1.0, "sirene")
por(T(5, "gente") - 0.2, multidao(3.4, 1.4, 321), 0.45, "gente gritando")
por(T(5, "jornal.") - 0.3, jornal_tv(T(5, "Às 11") - T(5, "jornal.") + 0.3, 531), 1.0, "jornal na TV")
por(T(5, "pararam."), grave_susto(), 0.7, "susto grave")
por(T(5, "tremendo.") - 0.4, respiracao(3.2, 0.45), 0.5, "respiração")
por(T(5, "3 e 33."), grave_susto(), 0.95, "susto grave")
# parte 6: aeroporto e igreja lotados, as redes, o jantar
por(L(6, 0.0), multidao(T(6, "as igrejas") - G[5], 1.5, 331), 0.5, "aeroporto")
por(L(6, 0.5), notificacao(), 0.3, "aviso do aeroporto")
por(T(6, "as igrejas") - 0.3, sino_igreja(), 0.8, "sino da igreja")
por(T(6, "as igrejas") - 0.3, multidao(T(6, "Nas redes") - T(6, "as igrejas"), 1.0, 333), 0.35, "fila da igreja")
for k in range(5):
    por(T(6, "Nas redes") + 0.6 * k, notificacao(), 0.3, "notificação")
for k in range(6):
    por(T(6, "Na mesa") + 0.25 + 0.9 * k, talheres(811 + k), 0.8, "talheres")
# parte 7: trancado no quarto, o relógio, a conta; 3:33 de novo
por(L(7, 0.0), tique_relogio(T(7, "Às 3h33") - G[6], 1.0, 0.65), 1.0, "relógio")
por(T(7, "72"), grave_susto(), 0.3, "susto grave")
por(T(7, "4 .320"), grave_susto(), 0.45, "susto grave")
por(T(7, "vibra") - 0.4, vibracao(1.2), 0.95, "vibração")
por(T(7, "Faltam") - 0.1, grave_susto(), 0.85, "susto grave")
coracao_ate(T(7, "E você entende"), G[7] - 0.4, passo=0.8, minimo=0.55, ganho=0.6)
# parte 8: a lista no caderno
por(L(8, 0.0), rua(T(8, "Pega") - G[7]), 0.3, "manhã lá fora")
por(T(8, "folha") - 0.1, papel(0.7, 631), 0.8, "folha")
for w, d in (("escreve", 2.4), ("Ver o", 0.9), ("Falar", 2.6), ("Pedir", 3.4), ("dizer", 3.0)):
    por(T(8, w), caneta(d, 640 + len(w)), 1.0, "caneta")
por(T(8, "dobra") - 0.05, papel(0.9, 651), 0.9, "folha dobrando")
por(T(8, "guarda") + 0.1, lencol(), 0.35, "bolso")
por(T(8, "desliga") + 0.2, interruptor(), 0.7, "desliga o celular")
# parte 9: o ônibus, o mar, a Júlia
por(L(9, 0.0), onibus_motor(T(9, "porta") - G[8] + 0.6), 0.6, "ônibus")
por(T(9, "abre,") - 0.1, porta_onibus(), 0.8, "porta do ônibus")
por(T(9, "abre,"), mar(T(9, "Na volta") - T(9, "abre,") + 0.3), 0.75, "mar")
for k, w in enumerate(("cheiro", "fica parado", "maior")):
    por(T(9, w) + 0.3, gaivota(), 0.8, "gaivota")
por(T(9, "fica parado") - 1.2, passos(1.4, 0.5, 0.2, "areia"), 1.0, "passos na areia")
por(T(9, "entra") + 0.2, agua_entrando(T(9, "Na volta") - T(9, "entra")), 0.9, "entrando no mar")
por(T(9, "Na volta") - 0.2, grilos(G[9] - T(9, "Na volta") + 0.2, 711), 0.8, "rua à noite")
por(T(9, "Treme") - 0.6, porta_abrindo(), 0.5, "porta da Júlia")
por(T(9, "52") - 0.1, sininho(), 0.25, "brilho")
por(T(9, "abraça.") - 0.2, lencol(), 0.45, "abraço")
# parte 10: a garagem, a chave inglesa, o carro que nunca vai andar; o boato
por(L(10, 0.0), grilos(G[10] - G[9], 721), 0.7, "grilos")
for s in (0.8, 2.3, 6.4, 7.6):
    por(L(10, s), ferramenta(), 0.7, "ferramenta")
por(T(10, "chave") + 0.4, ferramenta(), 0.9, "chave inglesa")
for s in (16.9, 18.2):
    por(L(10, s), ferramenta(), 0.5, "ferramenta")
por(T(10, "nunca vai") - 0.3, motor_tentando(2.0), 0.7, "motor tentando pegar")
por(T(10, "boato"), grave_susto(), 0.55, "susto grave")
for k in range(4):
    por(T(10, "Algumas") + 1.2 * k + 0.3, notificacao(), 0.3, "notificação")
por(T(10, "liga") + 0.35, sininho(), 0.25, "celular ligando")
# parte 11: café com a mãe; a madrugada no sofá, o relógio na parede
por(L(11, 0.0), cafeteira(4.0), 0.8, "cafeteira")
por(L(11, 0.0), rua(T(11, "A noite") - G[10]), 0.3, "manhã lá fora")
for k in range(3):
    por(T(11, "café") + 0.6 + 2.8 * k, talheres(851 + k), 0.6, "xícara")
por(T(11, "relógio") - 0.3, tique_relogio(T(11, "3 e 33.") - T(11, "relógio") + 0.3, 1.0, 0.75), 1.0, "relógio")
coracao_ate(T(11, "3 e 32,"), T(11, "3 e 33.") - 0.1, passo=0.7, minimo=0.5, ganho=0.65)
por(T(11, "3 e 33."), grave_susto(), 0.7, "susto grave")
# parte 12: o celular vibra no bolso; "Data atualizada"; "A partir de agora, você não vai mais saber."
por(T(12, "vibra") - 0.45, vibracao(1.3), 1.0, "vibração")
por(T(12, "respirando."), respiracao(2.5, 0.6), 0.45, "respiração")
por(T(12, "ronca"), respiracao(2.4, 1.2) * 0.6, 0.6, "a mãe ronca")
por(T(12, "Um e") - 0.2, notificacao(), 0.5, "e-mail novo")
por(T(12, "Data"), grave_susto(), 0.6, "susto grave")
por(T(12, "A partir") - 0.1, grave_gancho(), 0.7, "grave")
por(T(12, "chorar"), respiracao(T(12, "Afinal,") - T(12, "chorar"), 0.9), 0.4, "choro em silêncio")
# parte 13: a folha riscada e reescrita; a pergunta; o celular vibrando às 3:33
por(T(13, "risca"), caneta(0.8, 661), 1.0, "caneta riscando")
por(T(13, "escreve"), caneta(1.2, 663), 1.0, "caneta")
por(T(13, "Se inscreve") + 0.2, sininho(), 0.35, "sininho")
por(T(13, "vibrar"), vibracao(1.1), 0.7, "vibração")
por(FIM - 3.6, vibracao(1.1), 0.9, "vibração final")
por(FIM - 2.4, vibracao(1.1), 0.9, "vibração final")

# ------------------------------------------------------------ mix
voz_env = np.convolve(np.abs(narr), np.ones(int(0.3 * SR)) / int(0.3 * SR), "same")
ducking = 1.0 - 0.35 * np.clip(voz_env / (np.percentile(voz_env, 90) + 1e-9), 0, 1)
cama_n = cama / (np.sqrt(np.mean(cama**2)) + 1e-9)
quente_n = quente / (np.sqrt(np.mean(esperanca(SR * 10) ** 2)) + 1e-9)
voz_rms = np.sqrt(np.mean(narr[np.abs(narr) > 1e-4] ** 2))
mix = narr + 0.13 * voz_rms * cama_n * ducking + 0.06 * voz_rms * quente_n * ducking + 0.55 * efeitos
mix = loudnorm(mix, alvo=-15.0, pico=-1.5)
mix = np.pad(mix, (0, max(0, TOTAL - len(mix))))[:TOTAL].astype(np.float32)
# a cama sozinha (para os trechos sem história: CTA e cartão dos cortes)
cama_mix = (0.13 * voz_rms * cama_n).astype(np.float32)

SAIDA.mkdir(parents=True, exist_ok=True)
info = {"fps": FPS, "taxa": SR, "partes": [], "efeitos": pistas}
for k in range(N):
    a, b = quadros[k] * AQ, quadros[k + 1] * AQ
    sf.write(SAIDA / f"v3-parte{k + 1:02d}.flac", mix[a:b], SR, subtype="PCM_16")
    info["partes"].append({
        "parte": k + 1, "quadro_inicial": quadros[k], "quadros": quadros[k + 1] - quadros[k],
        "duracao": round((quadros[k + 1] - quadros[k]) / FPS, 4), "inicio_global": round(G[k], 4),
        "abertura": ABERTURA[k + 1],
    })

# ------------------------------------------------------------ completo: gancho + preto com grave + filme
GANCHO = {"parte": 4, "de": T(4, "O Lucas", 2) - 0.45 - G[3], "ate": T(4, "mais.", fim=True) + 0.2 - G[3]}
g0 = quadros[3] + round(GANCHO["de"] * FPS)
g1 = quadros[3] + round(GANCHO["ate"] * FPS)
PRETO = 21  # 0,7 s
gancho = mix[g0 * AQ : g1 * AQ].copy()
gancho[: int(0.04 * SR)] *= np.linspace(0, 1, int(0.04 * SR))
preto = np.zeros(PRETO * AQ, dtype=np.float32)
cauda = np.zeros(PRETO * AQ + 2 * SR, dtype=np.float32)
gg = grave_gancho()
cauda[: len(gg)] += 0.9 * gg
completo = np.concatenate([gancho, preto, mix]).astype(np.float32)
completo[len(gancho) : len(gancho) + len(cauda)] += cauda[: len(completo) - len(gancho)]
completo = np.clip(completo, -0.95, 0.95)
sf.write(SAIDA / "v3-completo.flac", completo, SR, subtype="PCM_16")
info["gancho"] = {"parte": 4, "quadro_inicio": g0, "quadro_fim": g1, "quadros": g1 - g0, "preto_quadros": PRETO,
                  "inicio_na_parte": round((g0 - quadros[3]) / FPS, 4), "fim_na_parte": round((g1 - quadros[3]) / FPS, 4)}
info["completo_quadros"] = (g1 - g0) + PRETO + quadros[-1]

# ------------------------------------------------------------ cortes verticais
CAPA, CTA, CARTAO = 0.8, 2.6, 4.0
CORTES = [(1, 1, "VOCÊ TEM 7 DIAS"), (2, 2, "ELE TINHA 3 DIAS"), (3, 4, "14:07"), (4, 5, "O MEU TAMBÉM TEM HORA"),
          (5, 7, "4.320 MINUTOS"), (6, 10, "A DATA MUDOU?")]
cta1 = decodificar(RAIZ / "assets" / "audio" / "cta1.mp3")[int(2.42 * SR) : int(4.62 * SR)]
cta2 = decodificar(RAIZ / "assets" / "audio" / "cta2.mp3")[: int(2.70 * SR)]
for x in (cta1, cta2):
    x[: int(0.03 * SR)] *= np.linspace(0, 1, int(0.03 * SR))
    x[-int(0.12 * SR) :] *= np.linspace(1, 0, int(0.12 * SR))
# os CTAs no mesmo volume da narração
ref = np.sqrt(np.mean(mix[np.abs(narr) > 1e-3] ** 2))
cta1 = cta1 * ref / (np.sqrt(np.mean(cta1[np.abs(cta1) > 1e-3] ** 2)) + 1e-9) * 1.05
cta2 = cta2 * ref / (np.sqrt(np.mean(cta2[np.abs(cta2) > 1e-3] ** 2)) + 1e-9) * 1.05
fim_historia = G[9] + (quadros[10] - quadros[9]) / FPS  # o fim da parte 10: o que vem depois fica só no longo
for c, parte, texto in CORTES:
    p0 = quadros[parte - 1]
    ws = palavras[parte - 1]
    q0 = p0 + round((ABERTURA[parte] - 0.4) * FPS)
    q1 = quadros[parte]
    # CTA numa pausa da fala perto de 70% do corte
    dur_total = CAPA + (q1 - q0) / FPS + CTA + CARTAO
    alvo = (0.70 * dur_total - CAPA) + (q0 - p0) / FPS  # instante local da parte
    pausas = [((ws[i]["end"] + ws[i + 1]["start"]) / 2, ws[i + 1]["start"] - ws[i]["end"]) for i in range(len(ws) - 1)]
    pausas = [(m, g) for m, g in pausas if g >= 0.3]
    meio = min(pausas, key=lambda mg: abs(mg[0] - alvo) - 0.4 * min(mg[1], 1.0))[0]
    qc = p0 + round(meio * FPS)
    a = mix[q0 * AQ : qc * AQ]
    b = mix[qc * AQ : q1 * AQ]
    # capa: pancada; CTA: cama baixa (-10 dB) + whoosh + sininho + CTA1; cartão: cama que some + CTA2
    capa = np.zeros(round(CAPA * FPS) * AQ, dtype=np.float32)
    h = hit_capa()
    capa[: min(len(capa), len(h))] += 0.9 * h[: len(capa)]
    n_cta = round(CTA * FPS) * AQ
    meio_cta = cama_mix[qc * AQ : qc * AQ + n_cta] * 0.32
    meio_cta = np.pad(meio_cta, (0, n_cta - len(meio_cta)))
    w = whoosh(0.45)
    meio_cta[: len(w)] += 0.8 * w
    s_ = sininho()
    i_s = int(0.35 * SR)
    meio_cta[i_s : i_s + len(s_)] += 0.7 * s_[: n_cta - i_s]
    i_v = int(0.25 * SR)
    meio_cta[i_v : i_v + len(cta1)] += cta1[: n_cta - i_v]
    n_car = round(CARTAO * FPS) * AQ
    cartao = cama_mix[q1 * AQ : q1 * AQ + n_car] * 0.45
    cartao = np.pad(cartao, (0, n_car - len(cartao))) * np.linspace(1, 0, n_car) ** 1.2
    i_v = int(0.35 * SR)
    cartao[i_v : i_v + len(cta2)] += cta2[: n_car - i_v]
    trecho = np.concatenate([capa, a, meio_cta, b, cartao]).astype(np.float32)
    trecho = np.clip(trecho, -0.95, 0.95)
    sf.write(SAIDA / f"corte{c}.flac", trecho, SR, subtype="PCM_16")
    qd = len(trecho) // AQ
    fora = G[parte - 1] + (q1 - p0) / FPS > fim_historia + 0.01
    info.setdefault("cortes", []).append({
        "corte": c, "parte": parte, "capa_texto": texto, "capa": CAPA, "cta": CTA, "cartao": CARTAO,
        "quadro_inicio": q0, "quadro_fim": q1, "cta_quadro": qc,
        "inicio_na_parte": round((q0 - p0) / FPS, 4), "fim_na_parte": round((q1 - p0) / FPS, 4), "cta_na_parte": round((qc - p0) / FPS, 4),
        "cta_no_corte": round(CAPA + (qc - q0) / FPS, 4), "quadros": qd, "duracao": round(qd / FPS, 3),
        "cta_fracao": round((CAPA + (qc - q0) / FPS) / (qd / FPS), 3),
    })
    aviso = "" if 45 <= qd / FPS <= 60 and not fora else "  <-- FORA DA REGRA"
    print(f"corte {c}: parte {parte}, {qd / FPS:.2f} s, CTA em {CAPA + (qc - q0) / FPS:.2f} s ({info['cortes'][-1]['cta_fracao']:.0%}){aviso}")

(SAIDA / "partes.json").write_text(json.dumps(info, ensure_ascii=False, indent=1))
print("partes:", [round((quadros[k + 1] - quadros[k]) / FPS, 2) for k in range(N)])
print(f"filme {quadros[-1] / FPS:.2f} s; completo {info['completo_quadros'] / FPS:.2f} s ({info['completo_quadros']} quadros); {len(pistas)} efeitos")
