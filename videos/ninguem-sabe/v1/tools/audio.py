"""Áudio do vídeo 1, todo gerado por código (sem modelos de IA, sem faixas de terceiros).

- Narração: as 11 partes juntas e niveladas (ffmpeg loudnorm).
- Trilha: drone grave + vento filtrado, sintetizados com numpy; a intensidade muda por parte.
- Efeitos: tique-taque, coração, vibração, despertador, notificação, toque de chamada, batidas e baque,
  também sintetizados, em momentos presos às palavras da narração (transcricao/v1-parteNN.json).
- Mix mestre do filme inteiro, fatiado na grade de quadros de cada parte (30 fps = 1600 amostras a 48 kHz),
  para que o vídeo completo seja só a junção das partes, sem emendas.

Saídas em assets/audio/mix/: v1-parteNN.flac (uma por parte, duração exata da parte),
corteN.flac (cortes verticais com o cartão final), partes.json (quadros e tempos de cada parte).
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
rng = np.random.default_rng(2026)


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
partes = sorted((RAIZ / "assets" / "audio").glob("v1-parte*.mp3"))
vozes = [decodificar(p) for p in partes]
inicio_s = np.cumsum([0] + [len(v) for v in vozes])  # amostras
G = inicio_s / SR  # início de cada parte na narração (s)
narracao = loudnorm(np.concatenate(vozes))
narracao = narracao[: inicio_s[-1]]
quadros = [round(g * FPS) for g in G]  # cada parte vai do quadro F[k] ao F[k+1]
TOTAL = quadros[-1] * AMOSTRAS_QUADRO
narracao = np.pad(narracao, (0, max(0, TOTAL - len(narracao))))[:TOTAL]

palavras = []
for k in range(len(partes)):
    dados = json.loads((RAIZ / "transcricao" / f"v1-parte{k + 1:02d}.json").read_text())
    palavras.append(dados["palavras"])


def chave(s):
    return re.sub(r"[^\w:]", "", unicodedata.normalize("NFC", s).lower())


def T(parte, texto, n=1, fim=False):
    """Tempo global (s) da n-ésima ocorrência de `texto` na parte (1 a 11)."""
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


def trilha(n, t0=0.0, intensidade=None, assombro=None):
    t = t0 + np.arange(n) / SR
    lfo = lambda f, fase: 0.5 + 0.5 * np.sin(2 * np.pi * f * t + fase)
    drone = (
        0.55 * np.sin(2 * np.pi * 55.0 * t) * (0.7 + 0.3 * lfo(0.05, 0.3))
        + 0.35 * np.sin(2 * np.pi * 55.13 * t + 1.1)
        + 0.30 * np.sin(2 * np.pi * 82.41 * t + 0.4) * lfo(0.031, 2.0)
        + 0.22 * np.sin(2 * np.pi * 110.0 * t + 2.2) * lfo(0.043, 1.0)
    )
    # camada média (ouve-se no celular): harmônicos de 110 Hz filtrados
    pad = sum((0.6 / h) * np.sin(2 * np.pi * 110.0 * h * t + h) for h in range(2, 9))
    pad = signal.sosfilt(signal.butter(2, 650, "low", fs=SR, output="sos"), pad) * (0.5 + 0.5 * lfo(0.021, 0.7))
    # vento: ruído em faixa, com rajadas lentas
    vento = signal.sosfilt(signal.butter(2, [220, 900], "band", fs=SR, output="sos"), rng.standard_normal(n))
    vento = vento / (np.abs(vento).max() + 1e-9) * (0.25 + 0.75 * (0.5 + 0.5 * ruido_suave(n, 0.15, 7)) ** 2)
    x = 0.55 * drone + 0.35 * pad + 0.45 * vento
    if assombro is not None:  # mundo paralelo: tom agudo desafinado com tremolo
        x += assombro * 0.12 * (np.sin(2 * np.pi * 880 * t) + np.sin(2 * np.pi * 884.5 * t)) * lfo(5.5, 0)
    if intensidade is not None:
        x *= intensidade
    return x.astype(np.float32)


def envelope(chaves, n, t0=0.0):
    """chaves [(t, valor)] em segundos globais -> curva suave amostra a amostra."""
    t = t0 + np.arange(n) / SR
    ts, vs = zip(*chaves)
    return np.interp(t, ts, vs).astype(np.float32)


fim_total = TOTAL / SR
intens = envelope([
    (0, 0.0), (1.5, 0.8), (G[1], 0.85), (G[2], 0.6), (G[3] - 1, 0.65), (G[3] + 2, 1.0),
    (G[5], 1.05), (T(6, "Seu coração"), 1.2), (G[6], 0.95), (G[8], 1.05), (T(9, "Você olha"), 1.25),
    (G[9] + 0.5, 1.2), (G[9] + 1.5, 0.3), (T(10, "até que"), 0.35), (T(10, "Uma mensagem"), 1.1),
    (G[10], 0.8), (fim_total - 3, 0.6), (fim_total, 0.0),
], TOTAL)
assombro = envelope([(0, 0), (G[6] - 1, 0), (G[6] + 2, 1), (G[8] - 1, 1), (G[8] + 2, 0), (fim_total, 0)], TOTAL)
cama = trilha(TOTAL, intensidade=intens, assombro=assombro)


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


efeitos = np.zeros(TOTAL, dtype=np.float32)
pistas = []


def por(t, som, ganho=1.0, nome=""):
    i = int(round(t * SR))
    j = min(TOTAL, i + len(som))
    if i < TOTAL:
        efeitos[i:j] += (ganho * som[: j - i]).astype(np.float32)
        pistas.append({"t": round(float(t), 3), "efeito": nome})


# parte 2: chama, chama, chama (polícia), chama (amigo) e a ligação cai
for n in (1, 2, 3, 4):
    por(T(2, "chama", n), toque_chamada(), 1.0, "toque de chamada")
por(T(2, "cai"), ocupado(), 1.0, "ligação caindo")
# parte 4: relógio no silêncio, depois o baque no andar de baixo
t = T(4, "fica acordado")
alto = True
while t < T(4, "barulho"):
    por(t, tique(alto), 0.5, "tique-taque")
    alto = not alto
    t += 1.0
por(T(4, "barulho"), baque(), 0.9, "baque no andar de baixo")
# parte 5: a luz que pisca e o coração no fim
for k, dt in enumerate((0, 0.18, 0.42, 0.55)):
    por(T(5, "pisca") + dt, estalo(), 1.0, "estalo da luz" if k == 0 else "")
t = T(5, "como se alguém")
while t < G[5] - 0.3:
    por(t, coracao(), 0.7, "coração")
    t += 0.95
# parte 6: o coração dispara, as batidas na porta
t = T(6, "Seu coração")
while t < T(6, "Alguém") + 1.5:
    por(t, coracao(), 0.85, "coração")
    t += 0.55
for k in range(3):
    por(T(6, "Bate") + k * 0.24, batida(), 1.0, "batida na porta")
# parte 9: o relógio corre até as 3h33 e o coração acelera no fim
t = T(9, "Você olha")
alto = True
while t < G[9] - 0.2:
    por(t, tique(alto), 0.45, "tique-taque")
    alto = not alto
    t += 1.0
t = T(9, "3 e 30")
passo = 0.8
while t < G[9] - 0.3:
    por(t, coracao(), 0.8, "coração")
    t += passo
    passo = max(0.42, passo * 0.9)
# parte 10: o despertador, o carro lá fora, o celular vibra e a notificação
por(G[9] + 0.02, despertador(2.2), 0.8, "despertador")
por(T(10, "barulho") - 0.6, carro_passando(), 0.8, "carro passando")
por(T(10, "vibra") - 0.1, vibracao(), 1.0, "celular vibrando")
por(T(10, "Uma mensagem"), notificacao(), 0.9, "notificação")

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
    sf.write(SAIDA / f"v1-parte{k + 1:02d}.flac", mix[a:b], SR, subtype="PCM_16")
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
    rabo = trilha(n, t0=b / SR) * (0.13 * voz_rms / (np.sqrt(np.mean(cama**2)) + 1e-9))
    rabo *= np.linspace(1, 0, n) ** 1.5
    trecho = np.concatenate([mix[a:b], rabo.astype(np.float32) * 2.8])
    trecho[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
    sf.write(SAIDA / f"corte{c}.flac", trecho, SR, subtype="PCM_16")
    info.setdefault("cortes", []).append({"corte": c, "partes": [p1, p2], "quadros": (quadros[p2] - quadros[p1 - 1]) + int(CARTAO * FPS)})

(SAIDA / "partes.json").write_text(json.dumps(info, ensure_ascii=False, indent=1))
sf.write(SAIDA / "v1-completo.flac", mix, SR, subtype="PCM_16")
print(json.dumps(info["partes"], ensure_ascii=False))
print(len(info["efeitos"]), "efeitos;", "total", TOTAL / SR, "s")
