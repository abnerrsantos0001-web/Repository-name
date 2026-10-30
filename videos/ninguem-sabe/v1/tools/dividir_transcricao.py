"""Divide a transcrição da narração completa (transcricao/v1-completo.json) em uma por parte.

A narração completa é a junção, em ordem, de assets/audio/v1-parte01..11.mp3.
Cada palavra vai para a parte em que começa, com o tempo relativo ao início da parte.
Uso: python3 tools/dividir_transcricao.py
"""
import json
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
AUDIO = RAIZ / "assets" / "audio"


def duracao(arquivo):
    saida = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(arquivo)],
        capture_output=True, text=True, check=True,
    )
    return float(saida.stdout.strip())


palavras = json.loads((RAIZ / "transcricao" / "v1-completo.json").read_text())
partes = sorted(AUDIO.glob("v1-parte*.mp3"))
inicio = 0.0
resumo = []
for i, arquivo in enumerate(partes):
    dur = duracao(arquivo)
    fim = inicio + dur
    ultima = i == len(partes) - 1
    trecho = [p for p in palavras if inicio - 0.05 <= p["start"] < (fim if not ultima else 1e9) - 0.05]
    locais = [
        {
            "id": f"p{i + 1:02d}w{j}",
            "text": p["text"],
            "start": round(max(0.0, p["start"] - inicio), 3),
            "end": round(min(dur, p["end"] - inicio), 3),
        }
        for j, p in enumerate(trecho)
    ]
    destino = RAIZ / "transcricao" / f"{arquivo.stem}.json"
    destino.write_text(json.dumps({"audio": f"assets/audio/{arquivo.name}", "duracao": round(dur, 3),
                                   "inicioNaNarracao": round(inicio, 3), "palavras": locais},
                                  ensure_ascii=False, indent=1))
    resumo.append(f"{arquivo.stem}: {dur:6.2f}s, {len(locais):3d} palavras | {' '.join(p['text'] for p in locais)[:90]}")
    inicio = fim

(RAIZ / "transcricao" / "v1-completo.json").write_text(json.dumps(palavras, ensure_ascii=False, indent=1))
print("\n".join(resumo))
