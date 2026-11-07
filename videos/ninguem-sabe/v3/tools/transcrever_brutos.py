"""Transcreve cada áudio bruto do vídeo 3 (assets/audio/brutos/) com faster-whisper medium (pt), com tempo por palavra.

Os nomes dos arquivos não seguem a ordem da história; a ordem sai do texto (tools/ordenar.py).
Uso: <python com faster-whisper> tools/transcrever_brutos.py
Escreve transcricao/brutos.json: [{arquivo, duracao, texto, palavras: [{text, start, end}]}].
"""
import json
import subprocess
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

RAIZ = Path(__file__).resolve().parent.parent
BRUTOS = RAIZ / "assets" / "audio" / "brutos"

modelo = WhisperModel("medium", device="cpu", compute_type="int8", cpu_threads=4)
def transcrever(arquivos):
  saida = []
  for arq in arquivos:
      pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(arq), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                           capture_output=True, check=True).stdout
      sinal = np.frombuffer(pcm, dtype=np.float32)
      segmentos, _ = modelo.transcribe(sinal, language="pt", word_timestamps=True, beam_size=5,
                                       condition_on_previous_text=False)
      palavras = [{"text": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
                  for s in segmentos for w in s.words if w.word.strip()]
      texto = " ".join(p["text"] for p in palavras)
      saida.append({"arquivo": arq.name, "duracao": round(len(sinal) / 16000, 3), "texto": texto, "palavras": palavras})
      print(f"{arq.name[:40]:40s} {len(sinal) / 16000:6.2f}s  {texto}", flush=True)
  return saida


(RAIZ / "transcricao" / "brutos.json").write_text(json.dumps(transcrever(sorted(BRUTOS.glob("*.mp3"))), ensure_ascii=False, indent=1))
# CTAs gravados pelo usuário (cta1 = inscrição, cta2 = "a história completa já está no canal")
(RAIZ / "transcricao" / "ctas.json").write_text(json.dumps(transcrever(sorted((RAIZ / "assets" / "audio").glob("cta*.mp3"))), ensure_ascii=False, indent=1))

