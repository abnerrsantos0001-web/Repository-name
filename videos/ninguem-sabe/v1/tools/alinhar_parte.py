"""Tempos por palavra de uma parte da narração, para as legendas.

1. Transcreve a parte com faster-whisper (Whisper medium, português, tempo por palavra).
2. Mede os trechos de fala reais do áudio (ffmpeg silencedetect).
3. Encaixa as palavras de cada trecho de fala dentro dele, reescalando os tempos,
   porque o Whisper sozinho chega a errar meio segundo nas bordas das frases.

Uso: <python com faster-whisper> tools/alinhar_parte.py 01
Escreve transcricao/v1-parteNN.json (substitui a divisão da transcrição completa).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

RAIZ = Path(__file__).resolve().parent.parent
n = sys.argv[1].zfill(2)
audio = RAIZ / "assets" / "audio" / f"v1-parte{n}.mp3"

dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                            str(audio)], capture_output=True, text=True, check=True).stdout)

# decodifica com o ffmpeg (16 kHz mono float32) em vez do PyAV do faster-whisper
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True, check=True).stdout
sinal = np.frombuffer(pcm, dtype=np.float32)

modelo = WhisperModel("medium", device="cpu", compute_type="int8", cpu_threads=4)
segmentos, _ = modelo.transcribe(sinal, language="pt", word_timestamps=True, beam_size=5,
                                 condition_on_previous_text=False)
palavras = []
for s in segmentos:
    for w in s.words:
        texto = w.word.strip()
        if texto:
            palavras.append({"text": texto, "start": w.start, "end": w.end})

# trechos de fala = complemento dos silêncios
log = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(audio), "-af",
                      "silencedetect=noise=-35dB:d=0.15", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
inicios = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
fins = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
fala, cursor = [], 0.0
for a, b in zip(inicios, fins):
    if a > cursor + 0.05:
        fala.append([cursor, a])
    cursor = b
if cursor < dur - 0.05:
    fala.append([cursor, dur])

# cada palavra pertence ao trecho de fala com que mais se sobrepõe (ou ao mais próximo)
def trecho_de(p):
    meio = (p["start"] + p["end"]) / 2
    return min(range(len(fala)), key=lambda i: 0 if fala[i][0] <= meio <= fala[i][1]
               else min(abs(meio - fala[i][0]), abs(meio - fala[i][1])))

grupos = {}
for p in palavras:
    grupos.setdefault(trecho_de(p), []).append(p)
for i, ps in grupos.items():
    a, b = fala[i]
    w0, w1 = ps[0]["start"], ps[-1]["end"]
    escala = (b - a) / max(0.05, w1 - w0)
    for p in ps:
        p["start"] = a + (p["start"] - w0) * escala
        p["end"] = a + (p["end"] - w0) * escala

saida = {
    "audio": f"assets/audio/{audio.name}",
    "duracao": round(dur, 3),
    "fonte": "faster-whisper medium (pt) com tempos encaixados nos trechos de fala do áudio",
    "trechosDeFala": [[round(a, 3), round(b, 3)] for a, b in fala],
    "palavras": [{"id": f"p{n}w{j}", "text": p["text"], "start": round(p["start"], 3),
                  "end": round(p["end"], 3)} for j, p in enumerate(palavras)],
}
destino = RAIZ / "transcricao" / f"v1-parte{n}.json"
destino.write_text(json.dumps(saida, ensure_ascii=False, indent=1))
print(" ".join(p["text"] for p in palavras))
for p in saida["palavras"]:
    print(f'{p["start"]:6.2f} {p["end"]:6.2f} {p["text"]}')
