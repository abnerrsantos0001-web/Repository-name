"""Biblioteca de sons do canal "Ninguém Sabe", todos feitos por código (numpy/scipy, sem IA, sem faixas de terceiros).

Trilha (drone, pad, ar do cômodo, camada de vidro, camada de esperança) e efeitos sintetizados. Cada função devolve um
array float32 mono a 48 kHz. Os vídeos importam daqui (tools/audio.py) e só escrevem as pistas da sua história.
"""
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
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




# ============================================================ vídeo 3: efeitos novos
def _borda(n, s=0.15):
    return np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / max(1, int(s * SR)))


def esperanca(n, t0=0.0):
    """pad maior e quente (lá maior com 9ª), para as partes da lista, do mar, da Júlia e do café"""
    t = t0 + np.arange(n) / SR
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t)
    x = np.zeros(n)
    for f, a in ((110.0, 0.5), (220.0, 0.35), (277.18, 0.3), (329.63, 0.28), (493.88, 0.12)):
        x += a * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t + 0.6))
    x = signal.sosfilt(signal.butter(2, 900, "low", fs=SR, output="sos"), x) * (0.75 + 0.25 * lfo)
    return (x / (np.abs(x).max() + 1e-9)).astype(np.float32)


def grave_gancho():
    """o corte seco para preto: subgrave curto (38 Hz caindo) com um baque por cima"""
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f = 38 + 22 * np.exp(-t * 7)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.002, 0.55)
    x += 0.35 * signal.sosfilt(signal.butter(2, 180, "low", fs=SR, output="sos"), rng.standard_normal(n)) * env_exp(n, 0.001, 0.08)
    return (0.95 * x / np.abs(x).max()).astype(np.float32)


def hit_capa():
    """pancada da capa dos cortes: impacto grave + chiado que sobe e corta"""
    n = int(0.8 * SR)
    t = np.arange(n) / SR
    sobe = faixa_ruido(0.8, [1500, 9000], semente=201) * np.clip(t / 0.25, 0, 1) * (t < 0.3)
    imp = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-t * 5) + 32) / SR) * env_exp(n, 0.002, 0.3) * (t > 0.28)
    x = 0.35 * sobe + imp
    return (0.85 * x / np.abs(x).max()).astype(np.float32)


def sininho():
    """o sininho do botão INSCREVA-SE: duas batidas de sino pequeno"""
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k, t0 in enumerate((0.0, 0.32)):
        i = int(t0 * SR)
        tt = t[: n - i]
        som = sum(a * np.sin(2 * np.pi * f * tt) for f, a in ((1760, 1.0), (2637, 0.5), (4186, 0.3), (5600, 0.12)))
        x[i:] += (0.8 if k else 1.0) * som * env_exp(n - i, 0.001, 0.35)
    return (0.4 * x / np.abs(x).max()).astype(np.float32)


def whoosh(dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = faixa_ruido(dur, [400, 6000], semente=203) * np.sin(np.pi * t / dur) ** 2
    return (0.4 * x).astype(np.float32)


def sirene_ambulancia(dur, longe=True):
    """sirene subindo e descendo (650–1350 Hz), filtrada como se viesse de fora"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 1000 + 340 * np.sin(2 * np.pi * 0.42 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + np.sin(2 * np.pi * np.cumsum(f) / SR)
    if longe:
        x = signal.sosfilt(signal.butter(2, [500, 2200], "band", fs=SR, output="sos"), x)
    return (0.22 * x / (np.abs(x).max() + 1e-9) * _borda(n, 1.0)).astype(np.float32)


def mar(dur):
    """ondas: ruído grave que cresce e quebra a cada ~6 s, mais o chiado da espuma"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    onda = (0.5 + 0.5 * np.sin(2 * np.pi * t / 6.3 - 1.4)) ** 3
    grave = signal.sosfilt(signal.butter(2, [60, 600], "band", fs=SR, output="sos"), rng.standard_normal(n))
    espuma = signal.sosfilt(signal.butter(2, [1500, 8000], "band", fs=SR, output="sos"), rng.standard_normal(n))
    quebra = (0.5 + 0.5 * np.sin(2 * np.pi * t / 6.3 - 2.6)) ** 6
    x = grave / np.abs(grave).max() * (0.35 + 0.65 * onda) + 0.5 * espuma / np.abs(espuma).max() * quebra
    return (0.5 * x * _borda(n, 1.2)).astype(np.float32)


def gaivota():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 1400 + 500 * np.sin(np.pi * t / 0.5) - 300 * t
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.02, 0.25)
    return (0.12 * x).astype(np.float32)


def sinal_escola(dur=2.2):
    """sinal elétrico da escola (campainha)"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 50 * t)) * (np.sin(2 * np.pi * 1100 * t) + 0.5 * np.sin(2 * np.pi * 2300 * t))
    x = signal.sosfilt(signal.butter(2, [700, 4000], "band", fs=SR, output="sos"), x)
    return (0.2 * x / np.abs(x).max() * _borda(n, 0.05)).astype(np.float32)


def multidao(dur, densidade=1.0, semente=301):
    """burburinho de muita gente: ruído com formantes de voz que sobem e descem"""
    n = int(dur * SR)
    r = np.random.default_rng(semente)
    x = np.zeros(n)
    for k in range(int(10 * densidade)):
        f0 = r.uniform(350, 1400)
        b = signal.sosfilt(signal.butter(2, [f0 * 0.8, f0 * 1.25], "band", fs=SR, output="sos"), r.standard_normal(n))
        x += b / (np.abs(b).max() + 1e-9) * (0.3 + 0.7 * ruido_suave(n, r.uniform(2, 5), int(r.integers(1e6))) ** 2)
    return (0.25 * x / (np.abs(x).max() + 1e-9) * _borda(n, 0.6)).astype(np.float32)


def sino_igreja():
    n = int(4.0 * SR)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * 220 * h * t) * np.exp(-t / d) for h, a, d in ((0.5, 0.6, 2.5), (1.0, 1.0, 1.8), (1.19, 0.5, 1.4), (1.5, 0.45, 1.2), (2.0, 0.4, 0.9), (2.74, 0.25, 0.6)))
    return (0.35 * x / np.abs(x).max()).astype(np.float32)


def videogame(dur, semente=401):
    """bleeps de onda quadrada (jogo de luta antigo): golpes, pulos e uma melodia curta"""
    n = int(dur * SR)
    r = np.random.default_rng(semente)
    x = np.zeros(n)
    t = 0.0
    notas = [523.3, 659.3, 784.0, 659.3, 587.3, 698.5, 880.0, 698.5]
    k = 0
    while t < dur - 0.2:
        m = int(r.uniform(0.06, 0.16) * SR)
        tt = np.arange(m) / SR
        f = notas[k % len(notas)]
        if r.uniform() < 0.3:
            f = r.uniform(120, 260)  # golpe
        i = int(t * SR)
        x[i : i + m] += np.sign(np.sin(2 * np.pi * f * tt)) * env_exp(m, 0.002, 0.06)
        t += r.uniform(0.12, 0.3)
        k += 1
    x = signal.sosfilt(signal.butter(2, 3500, "low", fs=SR, output="sos"), x)
    return (0.12 * x / (np.abs(x).max() + 1e-9)).astype(np.float32)


def jornal_tv(dur, semente=501):
    """TV ligada no jornal, ao fundo: vinheta de pulsos e uma voz abafada (ruído com formantes, sem palavras)"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(semente)
    voz = signal.sosfilt(signal.butter(2, [250, 1800], "band", fs=SR, output="sos"), r.standard_normal(n))
    silabas = (0.5 + 0.5 * np.sin(2 * np.pi * 4.2 * t + 3 * ruido_suave(n, 1.5, semente))) ** 2
    frases = (ruido_suave(n, 0.4, semente + 1) > -0.3).astype(float)
    frases = np.convolve(frases, np.ones(2400) / 2400, "same")
    pulso = np.sin(2 * np.pi * 110 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 2 * t))) * 0.15
    x = voz / (np.abs(voz).max() + 1e-9) * silabas * frases + pulso
    x = signal.sosfilt(signal.butter(2, [200, 3000], "band", fs=SR, output="sos"), x)
    return (0.16 * x / (np.abs(x).max() + 1e-9) * _borda(n, 0.4)).astype(np.float32)


def ferramenta():
    """metal batendo (chave no motor)"""
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in ((1830, 1.0, 0.12), (2950, 0.6, 0.08), (4410, 0.4, 0.05), (870, 0.4, 0.15)))
    x += 0.5 * rng.standard_normal(n) * env_exp(n, 0.0003, 0.004)
    return (0.3 * x / np.abs(x).max()).astype(np.float32)


def motor_tentando(dur=2.2):
    """motor de arranque girando e o carro velho que não pega"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    giro = (0.5 + 0.5 * np.sin(2 * np.pi * 7.5 * t)) ** 2
    x = signal.sosfilt(signal.butter(2, [80, 900], "band", fs=SR, output="sos"), rng.standard_normal(n)) * giro
    x += 0.5 * np.sin(2 * np.pi * 95 * t) * giro
    return (0.35 * x / (np.abs(x).max() + 1e-9) * _borda(n, 0.1)).astype(np.float32)


def papel(dur=0.8, semente=601):
    """folha de papel dobrando: estalos secos em faixa média-aguda"""
    n = int(dur * SR)
    r = np.random.default_rng(semente)
    x = np.zeros(n)
    for k in range(int(dur * 40)):
        i = int(r.uniform(0, dur - 0.03) * SR)
        m = int(0.02 * SR)
        x[i : i + m] += r.uniform(0.3, 1) * r.standard_normal(m) * env_exp(m, 0.0005, 0.004)
    x = signal.sosfilt(signal.butter(2, [1200, 8000], "band", fs=SR, output="sos"), x)
    return (0.35 * x / (np.abs(x).max() + 1e-9) * _borda(n, 0.05)).astype(np.float32)


def caneta(dur=1.5, semente=611):
    """caneta escrevendo/riscando: arrasto em rajadas"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(semente)
    tracos = (np.sin(2 * np.pi * 3.1 * t + 2 * ruido_suave(n, 2, semente)) > 0.1).astype(float)
    tracos = np.convolve(tracos, np.ones(480) / 480, "same")
    x = signal.sosfilt(signal.butter(2, [2500, 9000], "band", fs=SR, output="sos"), r.standard_normal(n)) * tracos
    return (0.14 * x / (np.abs(x).max() + 1e-9) * _borda(n, 0.05)).astype(np.float32)


def grilos(dur, semente=701):
    n = int(dur * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(semente)
    x = np.zeros(n)
    for k in range(3):
        f = r.uniform(4200, 5200)
        ritmo = (np.sin(2 * np.pi * r.uniform(2.5, 3.5) * t + k) > 0.6).astype(float)
        trem = (np.sin(2 * np.pi * 45 * t) > 0).astype(float)
        x += np.sin(2 * np.pi * f * t) * ritmo * trem * r.uniform(0.4, 1)
    return (0.05 * x / (np.abs(x).max() + 1e-9) * _borda(n, 1.0)).astype(np.float32)


def talheres(semente=801):
    r = np.random.default_rng(semente)
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f = r.uniform(2500, 4200)
    x = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 1.47 * f * t)) * env_exp(n, 0.0005, 0.04)
    return (0.12 * x).astype(np.float32)


def porta_abrindo(dur=1.3):
    """porta de madeira abrindo: rangido curto e o trinco"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 380 + 160 * np.sin(2 * np.pi * 0.9 * t) + 60 * np.sin(2 * np.pi * 7 * t)
    rangido = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.4 + 0.6 * (np.sin(2 * np.pi * 23 * t) > 0)) * np.exp(-t / 0.8)
    x = 0.3 * signal.sosfilt(signal.butter(2, [300, 2500], "band", fs=SR, output="sos"), rangido)
    x[: int(0.06 * SR)] += interruptor()[: int(0.06 * SR)] * 0.8
    return (x * _borda(n, 0.05)).astype(np.float32)


def porta_onibus():
    """porta do ônibus abrindo: ar comprimido"""
    n = int(1.0 * SR)
    t = np.arange(n) / SR
    x = faixa_ruido(1.0, [800, 7000], semente=811) * np.exp(-t / 0.35)
    return (0.4 * x).astype(np.float32)


def passos(dur, passo=0.55, ganho=0.25, chao="duro"):
    x = np.zeros(int(dur * SR))
    t = 0.05
    k = 0
    while t < dur - 0.15:
        s_ = baque()[: int(0.12 * SR)] * ganho * (1 if k % 2 else 0.85)
        if chao == "areia":
            s_ = faixa_ruido(0.12, [400, 4000], semente=900 + k) * 0.12 * np.exp(-np.arange(int(0.12 * SR)) / SR / 0.04)
        i = int(t * SR)
        x[i : i + len(s_)] += s_[: len(x) - i]
        t += passo
        k += 1
    return x.astype(np.float32)


def agua_entrando(dur=3.0):
    """entrar no mar: o corpo empurrando a água (respingos e arrasto)"""
    n = int(dur * SR)
    x = faixa_ruido(dur, [300, 5000], mod=3, semente=821) * (0.4 + 0.6 * ruido_suave(n, 1.2, 823) ** 2)
    return (0.3 * x).astype(np.float32)


def tique_relogio(dur, periodo=1.0, ganho=0.6):
    x = np.zeros(int(dur * SR))
    t = 0.0
    k = 0
    while t < dur - 0.03:
        s_ = tique(k % 2 == 0) * ganho
        i = int(t * SR)
        x[i : i + len(s_)] += s_[: len(x) - i]
        t += periodo
        k += 1
    return x.astype(np.float32)
