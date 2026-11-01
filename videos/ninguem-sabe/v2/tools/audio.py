"""Áudio do vídeo 2, todo gerado por código (sem modelos de IA, sem faixas de terceiros).

- Narração: as 10 partes (assets/audio/v2-parteNN.flac) juntas e niveladas (ffmpeg loudnorm); cada parte ganha
  uma pausa no fim (pelo menos 0,8 s depois da última palavra) para a troca de parte não atropelar a fala.
- Trilha: drone grave, uma camada "de vidro" (agudos desafinados, bem baixos) e ar de quarto, com numpy;
  a intensidade muda por parte e some no silêncio depois que o espelho quebra.
- Efeitos sintetizados, presos às palavras (transcricao/v2-parteNN.json): despertador, torneira, toc no vidro,
  porta, interruptor, coração, rua, ônibus, lençol, água, objetos caindo, vidro estourando, respiração,
  rádio e cafeteira.
- Mix mestre do filme inteiro, fatiado na grade de quadros de cada parte (30 fps = 1600 amostras a 48 kHz).

Saídas em assets/audio/mix/: v2-parteNN.flac, corteN.flac (com o cartão final), v2-completo.flac, partes.json.
Uso: <python com numpy, scipy e soundfile> tools/audio.py
"""
import json
import re
import subprocess
import tempfile
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

RAIZ = Path(__file__).resolve().parent.parent
SR = 48000
FPS = 30
AMOSTRAS_QUADRO = SR // FPS
SAIDA = RAIZ / "assets" / "audio" / "mix"
rng = np.random.default_rng(2027)


def decodificar(caminho):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(caminho), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).copy()


def loudnorm(x, alvo=-16.0, pico=-1.5):
    with tempfile.TemporaryDirectory() as d:
        a, b = Path(d) / "a.wav", Path(d) / "b.wav"
        sf.write(a, x, SR, subtype="FLOAT")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a), "-af",
                        f"loudnorm=I={alvo}:TP={pico}:LRA=11", "-ar", str(SR), str(b)], check=True)
        y, _ = sf.read(b, dtype="float32")
    return y


# ------------------------------------------------------------ narração e tempos
partes = sorted((RAIZ / "assets" / "audio").glob("v2-parte*.flac"))
palavras = []
vozes = []
for k, arq in enumerate(partes):
    dados = json.loads((RAIZ / "transcricao" / f"v2-parte{k + 1:02d}.json").read_text())
    palavras.append(dados["palavras"])
    v = decodificar(arq)
    folga = 2.2 if k == len(partes) - 1 else 0.8
    fim_fala = int((dados["palavras"][-1]["end"] + folga) * SR)
    vozes.append(np.pad(v, (0, max(0, fim_fala - len(v)))))
inicio_s = np.cumsum([0] + [len(v) for v in vozes])  # amostras
G = inicio_s / SR  # início de cada parte na narração (s)
narracao = loudnorm(np.concatenate(vozes))
narracao = narracao[: inicio_s[-1]]
quadros = [round(g * FPS) for g in G]  # cada parte vai do quadro F[k] ao F[k+1]
TOTAL = quadros[-1] * AMOSTRAS_QUADRO
narracao = np.pad(narracao, (0, max(0, TOTAL - len(narracao))))[:TOTAL]


def chave(s):
    return re.sub(r"[^\w:]", "", unicodedata.normalize("NFC", s).lower())


def T(parte, texto, n=1, fim=False):
    """Tempo global (s) da n-ésima ocorrência de `texto` na parte (1 a 10)."""
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


# ------------------------------------------------------------ trilha: drone + vento
def ruido_suave(n, corte_hz, semente):
    r = np.random.default_rng(semente)
    sos = signal.butter(2, corte_hz, "low", fs=SR, output="sos")
    x = signal.sosfilt(sos, r.standard_normal(n))
    return x / (np.abs(x).max() + 1e-9)


def trilha(n, t0=0.0, intensidade=None, vidro=None):
    t = t0 + np.arange(n) / SR
    lfo = lambda f, fase: 0.5 + 0.5 * np.sin(2 * np.pi * f * t + fase)
    drone = (
        0.55 * np.sin(2 * np.pi * 49.0 * t) * (0.7 + 0.3 * lfo(0.05, 0.3))
        + 0.35 * np.sin(2 * np.pi * 49.12 * t + 1.1)
        + 0.30 * np.sin(2 * np.pi * 73.42 * t + 0.4) * lfo(0.031, 2.0)
        + 0.22 * np.sin(2 * np.pi * 98.0 * t + 2.2) * lfo(0.043, 1.0)
    )
    # camada média (ouve-se no celular): harmônicos de 98 Hz filtrados
    pad = sum((0.6 / h) * np.sin(2 * np.pi * 98.0 * h * t + h) for h in range(2, 9))
    pad = signal.sosfilt(signal.butter(2, 600, "low", fs=SR, output="sos"), pad) * (0.5 + 0.5 * lfo(0.021, 0.7))
    # ar do cômodo: ruído suave em faixa, com respiro lento (no lugar do vento da cidade do vídeo 1)
    ar = signal.sosfilt(signal.butter(2, [180, 700], "band", fs=SR, output="sos"), rng.standard_normal(n))
    ar = ar / (np.abs(ar).max() + 1e-9) * (0.35 + 0.65 * (0.5 + 0.5 * ruido_suave(n, 0.1, 9)) ** 2)
    x = 0.55 * drone + 0.35 * pad + 0.3 * ar
    if vidro is not None:  # o espelho: agudos desafinados, como dedo molhado na borda de um copo
        brilho = (np.sin(2 * np.pi * 1318.5 * t) + 0.8 * np.sin(2 * np.pi * 1324.0 * t) + 0.4 * np.sin(2 * np.pi * 1975.5 * t + 0.7))
        x += vidro * 0.09 * brilho * (0.4 + 0.6 * lfo(0.11, 1.2))
    if intensidade is not None:
        x *= intensidade
    return x.astype(np.float32)


def envelope(chaves, n, t0=0.0):
    """chaves [(t, valor)] em segundos globais -> curva suave amostra a amostra."""
    t = t0 + np.arange(n) / SR
    ts, vs = zip(*chaves)
    return np.interp(t, ts, vs).astype(np.float32)


fim_total = TOTAL / SR
# intensidade da trilha por parte; depois do vidro estourar, silêncio quase total ("tudo fica quieto")
quebra = T(7, "estoura")
intens = envelope([
    (0, 0.0), (1.0, 0.7), (T(1, "congela."), 1.0), (G[1], 0.75), (T(2, "Até que"), 0.9), (G[2], 0.85),
    (T(3, "E aí"), 1.0), (T(3, "apaga") + 1, 1.25), (G[3], 1.1), (G[4], 0.8), (T(5, "Ele quer"), 1.15), (G[5], 1.0),
    (T(6, "E você escuta"), 1.3), (G[6], 1.25), (quebra - 0.2, 1.4), (quebra + 0.4, 0.05), (G[7] - 0.5, 0.05),
    (G[7] + 1.5, 0.6), (T(8, "mas tem"), 0.9), (G[8], 0.9), (T(9, "Você quebrou o espelho"), 1.25), (G[9], 0.9),
    (fim_total - 3, 0.6), (fim_total, 0.0),
], TOTAL)
vidro = envelope([
    (0, 0.2), (T(1, "olha para o"), 0.5), (T(1, "congela."), 1.0), (G[1], 0.4), (G[2], 0.5), (T(3, "E aí"), 1.0),
    (G[3], 0.8), (G[4], 0.3), (G[5], 0.9), (G[6], 1.2), (quebra, 1.3), (quebra + 0.3, 0.0), (G[7], 0.0),
    (T(8, "mas tem"), 0.4), (G[8], 0.6), (G[9], 1.0), (fim_total, 0.4),
], TOTAL)
cama = trilha(TOTAL, intensidade=intens, vidro=vidro)


# ------------------------------------------------------------ efeitos
def env_exp(n, ataque, queda):
    t = np.arange(n) / SR
    return (1 - np.exp(-t / max(ataque, 1e-4))) * np.exp(-t / queda)


def tique(alto=True):
    n = int(0.03 * SR)
    x = rng.standard_normal(n) * env_exp(n, 0.0004, 0.004)
    x = signal.sosfilt(signal.butter(2, [2600, 5200] if alto else [1500, 3200], "band", fs=SR, output="sos"), x)
    return 0.5 * x / np.abs(x).max()


def coracao():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    lub = np.sin(2 * np.pi * 58 * t) * env_exp(n, 0.008, 0.06)
    dub = np.zeros(n)
    k = int(0.27 * SR)
    dub[k:] = (np.sin(2 * np.pi * 72 * t[: n - k]) * env_exp(n - k, 0.006, 0.045))[: n - k]
    x = lub + 0.75 * dub
    return 0.9 * signal.sosfilt(signal.butter(2, 160, "low", fs=SR, output="sos"), x) / np.abs(x).max()


def vibracao(dur=1.1):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ligado = ((t % 0.5) < 0.36).astype(float)
    ligado = np.convolve(ligado, np.ones(240) / 240, "same")
    x = (np.sin(2 * np.pi * 172 * t) + 0.35 * np.sin(2 * np.pi * 344 * t) + 0.08 * rng.standard_normal(n)) * ligado
    return 0.45 * x / np.abs(x).max()


def despertador(dur=2.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fase = t % 1.0
    bip = np.zeros(n)
    for i in range(4):
        bip += ((fase >= i * 0.14) & (fase < i * 0.14 + 0.07)).astype(float)
    bip = np.convolve(bip, np.ones(96) / 96, "same")
    x = np.tanh(2.5 * np.sin(2 * np.pi * 2400 * t)) * bip
    return 0.32 * x


def notificacao():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    a = (np.sin(2 * np.pi * 1046.5 * t) + 0.2 * np.sin(2 * np.pi * 2093 * t)) * env_exp(n, 0.003, 0.12)
    b = np.zeros(n)
    k = int(0.11 * SR)
    b[k:] = ((np.sin(2 * np.pi * 1568 * t) + 0.2 * np.sin(2 * np.pi * 3136 * t)) * env_exp(n, 0.003, 0.18))[: n - k]
    return 0.35 * (a + b) / 1.2


def toque_chamada(dur=0.45):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.clip(np.minimum(t / 0.01, (dur - t) / 0.02), 0, 1)
    return 0.22 * np.sin(2 * np.pi * 425 * t) * env


def ocupado():
    partes_ = [np.concatenate([toque_chamada(0.25), np.zeros(int(0.25 * SR))]) for _ in range(3)]
    return np.concatenate(partes_)


def batida():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n) * env_exp(n, 0.0005, 0.012)
    x = signal.sosfilt(signal.butter(2, 1400, "low", fs=SR, output="sos"), x)
    x = x / np.abs(x).max() + 0.8 * np.sin(2 * np.pi * 165 * t) * env_exp(n, 0.001, 0.03)
    return 0.6 * x / np.abs(x).max()


def baque():
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 48 * t) * env_exp(n, 0.004, 0.22) + 0.5 * rng.standard_normal(n) * env_exp(n, 0.001, 0.05)
    x = signal.sosfilt(signal.butter(3, 260, "low", fs=SR, output="sos"), x)
    return 0.8 * x / np.abs(x).max()


def estalo():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 100 * t) + 0.5 * np.sin(2 * np.pi * 300 * t)) * ((t < 0.18).astype(float))
    x += 0.6 * rng.standard_normal(n) * env_exp(n, 0.0005, 0.006)
    return 0.18 * x * env_exp(n, 0.002, 0.1)


def carro_passando(dur=3.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    perto = np.exp(-((t - dur / 2) / (dur / 4.5)) ** 2)
    ruido = signal.sosfilt(signal.butter(2, [120, 1500], "band", fs=SR, output="sos"), rng.standard_normal(n))
    f = 75 - 12 * np.tanh((t - dur / 2) * 3)
    motor = np.sin(2 * np.pi * np.cumsum(f) / SR)
    x = (0.8 * ruido / np.abs(ruido).max() + 0.4 * motor) * perto
    return 0.3 * x


def toc_vidro():
    """dedo batendo no vidro: clique curto com ressonância aguda"""
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    clique = rng.standard_normal(n) * env_exp(n, 0.0002, 0.0025)
    clique = signal.sosfilt(signal.butter(2, [1800, 7000], "band", fs=SR, output="sos"), clique)
    som = (np.sin(2 * np.pi * 2350 * t) + 0.6 * np.sin(2 * np.pi * 3710 * t + 1) + 0.35 * np.sin(2 * np.pi * 5230 * t)) * env_exp(n, 0.0005, 0.035)
    x = clique / (np.abs(clique).max() + 1e-9) + 0.5 * som
    return 0.55 * x / np.abs(x).max()


def mao_no_vidro():
    """palma encostando no vidro: baque abafado"""
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 140 * t) * env_exp(n, 0.002, 0.05) + 0.4 * rng.standard_normal(n) * env_exp(n, 0.001, 0.02)
    x = signal.sosfilt(signal.butter(2, 900, "low", fs=SR, output="sos"), x)
    return 0.5 * x / np.abs(x).max()


def faixa_ruido(dur, faixa, mod=0.0, semente=1):
    n = int(dur * SR)
    r = np.random.default_rng(semente)
    x = signal.sosfilt(signal.butter(2, faixa, "band", fs=SR, output="sos"), r.standard_normal(n))
    x = x / (np.abs(x).max() + 1e-9)
    if mod:
        x *= 0.6 + 0.4 * ruido_suave(n, mod, semente + 1)
    borda = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.15 * SR))
    return x * borda


def torneira(dur=2.4):
    return 0.35 * faixa_ruido(dur, [700, 7000], mod=6, semente=11)


def interruptor():
    n = int(0.06 * SR)
    x = rng.standard_normal(n) * env_exp(n, 0.0002, 0.003)
    x = signal.sosfilt(signal.butter(2, [1500, 6000], "band", fs=SR, output="sos"), x)
    return 0.5 * x / np.abs(x).max()


def porta_fechando():
    t_ = baque() * 0.7
    c = np.zeros(int(0.12 * SR))
    c = np.concatenate([c, interruptor() * 0.8])
    x = np.zeros(max(len(t_), len(c)))
    x[: len(t_)] += t_
    x[: len(c)] += c
    return x


def passos_correndo(dur=1.6):
    x = np.zeros(int(dur * SR))
    t = 0.0
    while t < dur - 0.15:
        s_ = baque()[: int(0.15 * SR)] * 0.35
        i = int(t * SR)
        x[i : i + len(s_)] += s_[: len(x) - i]
        t += 0.27
    return x


def rua(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    longe = 0.5 * faixa_ruido(dur, [80, 900], mod=0.3, semente=21)
    # passarinhos: piados curtos
    aves = np.zeros(n)
    r = np.random.default_rng(5)
    for k in range(int(dur * 1.2)):
        i = int(r.uniform(0, dur - 0.3) * SR)
        m = int(0.12 * SR)
        tt = np.arange(m) / SR
        f = 3200 + 900 * np.sin(2 * np.pi * 14 * tt)
        aves[i : i + m] += 0.15 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(m, 0.005, 0.04)
    return 0.4 * longe + aves


def onibus_motor(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 42 + 3 * np.sin(2 * np.pi * 0.2 * t)
    motor = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR)
    estrada = faixa_ruido(dur, [100, 1200], mod=0.8, semente=31)
    borda = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.3 * SR))
    return (0.35 * motor * borda + 0.45 * estrada)


def lencol():
    n = int(0.7 * SR)
    x = faixa_ruido(0.7, [600, 5000], semente=41) * np.exp(-((np.arange(n) / SR - 0.25) / 0.16) ** 2)
    return 0.5 * x


def agua(dur=3.0):
    """o vidro mole: borbulhas graves e um ronco por baixo"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    r = np.random.default_rng(51)
    for k in range(int(dur * 9)):
        i = int(r.uniform(0, dur - 0.2) * SR)
        m = int(0.09 * SR)
        tt = np.arange(m) / SR
        f0 = r.uniform(180, 520)
        x[i : i + m] += np.sin(2 * np.pi * (f0 + 900 * tt) * tt) * env_exp(m, 0.004, 0.025)
    ronco = signal.sosfilt(signal.butter(2, 120, "low", fs=SR, output="sos"), r.standard_normal(n))
    x = 0.6 * x / (np.abs(x).max() + 1e-9) + 0.6 * ronco / (np.abs(ronco).max() + 1e-9)
    borda = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.4 * SR))
    return 0.6 * x * borda


def objeto_caindo(semente):
    """plástico e vidro pequeno batendo no chão: 3 a 4 cliques que diminuem"""
    r = np.random.default_rng(semente)
    x = np.zeros(int(0.6 * SR))
    t = 0.0
    g = 1.0
    for k in range(4):
        n = int(0.05 * SR)
        c = r.standard_normal(n) * env_exp(n, 0.0003, 0.006)
        c = signal.sosfilt(signal.butter(2, [900, 5200], "band", fs=SR, output="sos"), c)
        i = int(t * SR)
        x[i : i + n] += g * c / (np.abs(c).max() + 1e-9)
        t += 0.09 * (0.7 ** k) + 0.03
        g *= 0.55
    return 0.45 * x


def vidro_quebrando(dur=2.2):
    """impacto, estalo e uma chuva de cacos agudos que vai rareando"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(61)
    impacto = 0.9 * baque()[: n]
    estalo_ = signal.sosfilt(signal.butter(2, 2500, "high", fs=SR, output="sos"), r.standard_normal(n)) * env_exp(n, 0.0005, 0.08)
    x = np.zeros(n)
    x[: len(impacto)] += impacto
    x += 0.8 * estalo_ / (np.abs(estalo_).max() + 1e-9)
    for k in range(70):
        t0 = 0.02 + r.exponential(0.35)
        if t0 > dur - 0.1:
            continue
        i = int(t0 * SR)
        m = int(0.06 * SR)
        tt = np.arange(m) / SR
        f = r.uniform(2800, 7800)
        x[i : i + m] += r.uniform(0.15, 0.5) * np.exp(-t0 / 0.8) * np.sin(2 * np.pi * f * tt) * env_exp(m, 0.0004, r.uniform(0.008, 0.03))
    return 0.75 * x / np.abs(x).max()


def respiracao(dur=3.0, ritmo=0.55):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sopro = faixa_ruido(dur, [300, 2500], semente=71)
    env = (0.5 + 0.5 * np.sin(2 * np.pi * t / (2 * ritmo))) ** 3
    return 0.35 * sopro * env


def radio(dur):
    """rádio baixinho na cozinha: acordes simples com timbre de alto-falante pequeno"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    acordes = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
    x = np.zeros(n)
    for i in range(int(dur / 1.6) + 1):
        a, b = int(i * 1.6 * SR), min(n, int((i + 1) * 1.6 * SR))
        tt = t[a:b] - t[a]
        for f in acordes[i % 4]:
            x[a:b] += np.sign(np.sin(2 * np.pi * f * tt)) * 0.2 * np.exp(-tt / 1.2)
        baixo = acordes[i % 4][0] / 2
        x[a:b] += 0.5 * np.sin(2 * np.pi * baixo * tt) * np.exp(-tt / 0.6)
    x = signal.sosfilt(signal.butter(2, [350, 3200], "band", fs=SR, output="sos"), x)
    x += 0.04 * rng.standard_normal(n)
    borda = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.5 * SR))
    return 0.22 * x / (np.abs(x).max() + 1e-9) * borda


def cafeteira(dur):
    n = int(dur * SR)
    x = np.zeros(n)
    r = np.random.default_rng(81)
    for k in range(int(dur * 14)):
        i = int(r.uniform(0, dur - 0.1) * SR)
        m = int(0.05 * SR)
        tt = np.arange(m) / SR
        x[i : i + m] += np.sin(2 * np.pi * r.uniform(400, 900) * tt) * env_exp(m, 0.002, 0.012)
    chiado = faixa_ruido(dur, [2000, 8000], mod=2, semente=83)
    return 0.12 * x / (np.abs(x).max() + 1e-9) + 0.05 * chiado


def grave_susto():
    """batida grave de susto (um 'boom' curto)"""
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    f = 55 * np.exp(-t * 1.2) + 30
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.004, 0.45)
    return 0.8 * x / np.abs(x).max()


efeitos = np.zeros(TOTAL, dtype=np.float32)
pistas = []


def por(t, som, ganho=1.0, nome=""):
    i = int(round(t * SR))
    j = min(TOTAL, i + len(som))
    if i < TOTAL:
        efeitos[i:j] += (ganho * som[: j - i]).astype(np.float32)
        pistas.append({"t": round(float(t), 3), "efeito": nome})


def coracao_ate(t, fim, passo=0.85, minimo=0.45, ganho=0.75):
    while t < fim:
        por(t, coracao(), ganho, "coração")
        t += passo
        passo = max(minimo, passo * 0.93)


# parte 1: despertador, a torneira, o "congela" e o olhar no fim
por(G[0] + 0.02, despertador(1.6), 0.55, "despertador")
por(T(1, "lava") - 0.1, torneira(T(1, "levanta a cabeça") - T(1, "lava") + 0.4), 0.8, "torneira")
por(T(1, "congela."), grave_susto(), 0.8, "susto grave")
coracao_ate(T(1, "e por meio"), G[1] - 0.3, passo=0.8)
# parte 2: a rua e a vitrine, o ônibus, a volta a pé
por(T(2, "Na vitrine") - 0.3, rua(T(2, "Até que") - T(2, "Na vitrine") + 0.6), 0.55, "rua")
por(T(2, "Até que") - 0.3, onibus_motor(T(2, "Você desce") - T(2, "Até que") + 0.6), 0.5, "ônibus")
por(T(2, "olhando para") - 0.05, grave_susto(), 0.6, "susto grave")
por(T(2, "Você desce") - 0.2, rua(G[2] - T(2, "Você desce")), 0.5, "rua")
# parte 3: a porta, a luz, o teste, o sorriso e a correria no escuro
por(T(3, "Fecha a porta") + 0.3, porta_fechando(), 0.8, "porta fechando")
por(T(3, "acende"), interruptor(), 0.9, "interruptor")
por(T(3, "E ele não"), grave_susto(), 0.7, "susto grave")
coracao_ate(T(3, "Ele fica"), T(3, "apaga") + 0.2, passo=0.8)
por(T(3, "apaga") + 0.15, interruptor(), 0.9, "interruptor")
por(T(3, "sai correndo") + 0.1, passos_correndo(1.5), 0.7, "passos")
# parte 4: toc, toc, toc no vidro; a lanterna; o espelho vazio; o toc vindo de todo vidro
for n in (1, 2, 3):
    por(T(4, "toque", n), toc_vidro(), 0.9, "toc no vidro")
por(T(4, "liga"), interruptor(), 0.6, "lanterna")
por(T(4, "vazio."), grave_susto(), 0.7, "susto grave")
coracao_ate(T(4, "Nenhuma pessoa"), G[4] - 0.4, passo=0.75, minimo=0.42)
for n in (4, 5, 6):
    por(T(4, "toque", n), toc_vidro(), 0.85, "toc no vidro")
por(T(4, "espelho do seu"), toc_vidro(), 0.6, "toc no vidro")
por(T(4, "e da janela"), toc_vidro(), 0.6, "toc no vidro")
por(T(4, "e da tela"), toc_vidro(), 0.6, "toc no vidro")
# parte 5: lençóis, o fim dos relatos
por(T(5, "com lençol"), lencol(), 0.7, "lençol")
por(T(5, "Ele quer"), grave_susto(), 0.8, "susto grave")
# parte 6: tira o lençol, a mão no vidro, a voz
por(T(6, "Tira o lençol"), lencol(), 0.8, "lençol")
por(T(6, "encosta"), mao_no_vidro(), 0.9, "mão no vidro")
por(T(6, "Você recua"), grave_susto(), 0.6, "susto grave")
coracao_ate(T(6, "Você recua"), G[6] - 0.2, passo=0.7, minimo=0.4)
# parte 7: água, a luta na pia, as coisas caindo, o vidro estourando, o silêncio e a respiração
por(T(7, "mole,") - 0.2, agua(3.2), 0.8, "água")
por(T(7, "gelada.") - 0.1, agua(2.0), 0.4, "água")
por(T(7, "bate na pia"), baque(), 0.8, "baque na pia")
for k, sem in enumerate((101, 102, 103)):
    por(T(7, "derruba") + 0.15 + 0.22 * k, objeto_caindo(sem), 0.8, "objeto caindo")
coracao_ate(T(7, "Você puxa"), quebra - 0.3, passo=0.55, minimo=0.36, ganho=0.8)
por(quebra - 0.15, vidro_quebrando(), 1.0, "vidro estourando")
por(T(7, "respirando"), respiracao(G[7] - T(7, "respirando") + 0.5), 0.7, "respiração")
# parte 8: de manhã, o rádio e a cafeteira lá embaixo
por(T(8, "Você desce."), radio(G[8] - T(8, "Você desce.") + 3.0), 0.8, "rádio")
por(T(8, "Você desce.") + 0.4, cafeteira(G[8] - T(8, "Você desce.") + 2.5), 0.7, "cafeteira")
# parte 9: o ônibus passa; a revelação
por(T(9, "e o ônibus") - 0.4, carro_passando(3.4), 1.0, "ônibus passando")
por(T(9, "do lado de"), grave_susto(), 0.9, "susto grave")
coracao_ate(T(9, "e sorrindo"), G[9] - 0.4, passo=0.8)
# parte 10: um toque leve no vidro na pergunta
por(T(10, "às 3h33?"), toc_vidro(), 0.5, "toc no vidro")

# ------------------------------------------------------------ mix
# a trilha abaixa um pouco quando há voz (envelope da narração)
voz_env = np.convolve(np.abs(narracao), np.ones(int(0.3 * SR)) / int(0.3 * SR), "same")
ducking = 1.0 - 0.35 * np.clip(voz_env / (np.percentile(voz_env, 90) + 1e-9), 0, 1)
cama_n = cama / (np.sqrt(np.mean(cama**2)) + 1e-9)
voz_rms = np.sqrt(np.mean(narracao[narracao != 0] ** 2))
mix = narracao + 0.13 * voz_rms * cama_n * ducking + 0.55 * efeitos
mix = loudnorm(mix, alvo=-15.0, pico=-1.5)
mix = np.pad(mix, (0, max(0, TOTAL - len(mix))))[:TOTAL]

SAIDA.mkdir(parents=True, exist_ok=True)
info = {"fps": FPS, "taxa": SR, "partes": [], "efeitos": [p for p in pistas if p["efeito"]]}
for k in range(len(partes)):
    a, b = quadros[k] * AMOSTRAS_QUADRO, quadros[k + 1] * AMOSTRAS_QUADRO
    sf.write(SAIDA / f"v2-parte{k + 1:02d}.flac", mix[a:b], SR, subtype="PCM_16")
    info["partes"].append({
        "parte": k + 1, "quadro_inicial": quadros[k], "quadros": quadros[k + 1] - quadros[k],
        "duracao": round((quadros[k + 1] - quadros[k]) / FPS, 4), "inicio_global": round(quadros[k] / FPS, 4),
        "voz_inicio_global": round(float(G[k]), 4),
    })

# cortes verticais: duas partes + 4 s de cartão (a trilha continua e some)
CARTAO = 4.0
for c, (p1, p2) in enumerate([(1, 2), (3, 4), (5, 6), (7, 8)], start=1):
    a, b = quadros[p1 - 1] * AMOSTRAS_QUADRO, quadros[p2] * AMOSTRAS_QUADRO
    n = int(CARTAO * FPS) * AMOSTRAS_QUADRO
    rabo = trilha(n, t0=b / SR, vidro=np.full(n, 0.6, dtype=np.float32)) * (0.13 * voz_rms / (np.sqrt(np.mean(cama**2)) + 1e-9))
    rabo *= np.linspace(1, 0, n) ** 1.5
    trecho = np.concatenate([mix[a:b], rabo.astype(np.float32) * 2.8])
    trecho[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
    sf.write(SAIDA / f"corte{c}.flac", trecho, SR, subtype="PCM_16")
    info.setdefault("cortes", []).append({"corte": c, "partes": [p1, p2], "quadros": (quadros[p2] - quadros[p1 - 1]) + int(CARTAO * FPS)})

(SAIDA / "partes.json").write_text(json.dumps(info, ensure_ascii=False, indent=1))
sf.write(SAIDA / "v2-completo.flac", mix, SR, subtype="PCM_16")
print(json.dumps(info["partes"], ensure_ascii=False))
print(len(info["efeitos"]), "efeitos;", "total", TOTAL / SR, "s")
