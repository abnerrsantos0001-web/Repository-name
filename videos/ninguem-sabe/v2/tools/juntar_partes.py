"""Ordena os 20 trechos brutos do vídeo 2 pela história e junta em pares: 10 partes.

A ordem vem do texto transcrito (transcricao/brutos.json), não do nome do arquivo.
Entre os dois trechos de cada parte entra uma pausa de fim de frase: o silêncio que já existe no fim
do primeiro trecho é completado até PAUSA segundos (as pausas depois de ponto na narração ficam em 0,4–0,65 s).
Uso: python3 tools/juntar_partes.py
Escreve assets/audio/v2-parteNN.flac e transcricao/ordem.json.
"""
import json
import re
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BRUTOS = RAIZ / "assets" / "audio" / "brutos"
PAUSA = 0.65
TAXA = 44100

# (parte, cena, trecho A, trecho B) na ordem da história
PARTES = [
    (1, "7:12 no banheiro: o reflexo passa a mão no cabelo um segundo atrasado",
     "v2 p14.mp3", "eu-2026-11-01-07-50-Levanta-a-mão-de-novo,-devagar.-Ele-levanta-junt.mp3"),
    (2, "dia normal: celular, vitrine da padaria e a janela do ônibus",
     "v2 p9.mp3", "eu-2026-11-01-07-52-Até-que,-no-ônibus,-encostado-na-janela,-você-ol.mp3"),
    (3, "o teste no espelho à noite e o sorriso grande demais",
     "v2 p15.mp3", "v2 p11.mp3"),
    (4, "3:33, toc toc no vidro: o espelho vazio e o barulho em todo vidro",
     "eu-2026-11-01-07-53-Você-não-dorme.-Às-3-e-33-da-madrugada,-você-esc.mp3", "v2 p1.mp3"),
    (5, "espelhos cobertos, a mãe preocupada e os relatos no mundo todo",
     "v2 p3.mp3", "v2 p13.mp3"),
    (6, "sétima noite: tira o lençol, a mão no vidro e a sua voz",
     "v2 p6.mp3", "eu-2026-11-01-07-56-E-você-escuta-a-sua-própria-voz,-só-que-vindo-de.mp3"),
    (7, "o vidro vira água, a luta na pia e o secador quebra o espelho",
     "eu-2026-11-01-07-56-O-vidro-começa-a-ficar-mole,-como-água.-A-mão-de.mp3", "v2 p2.mp3"),
    (8, "acorda às 7:12: espelho inteiro, mãe fazendo café, rádio ligado",
     "v2 p4.mp3", "v2 p7.mp3"),
    (9, "o mundo espelhado e o sósia tomando café no seu lugar",
     "v2 p5.mp3", "v2 p10.mp3"),
    (10, "preso no espelho, copiando ele; pergunta e cartão do canal",
     "v2 p8.mp3", "v2 p12.mp3"),
]


def pcm(arq):
    return subprocess.run(["ffmpeg", "-v", "error", "-i", str(arq), "-f", "s16le", "-ac", "1", "-ar", str(TAXA), "-"],
                          capture_output=True, check=True).stdout


def silencio_final(arq):
    log = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(arq), "-af", "silencedetect=n=-40dB:d=0.1",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    inicios = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    fins = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    if inicios and len(inicios) > len(fins):  # silêncio até o fim do arquivo
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                    str(arq)], capture_output=True, text=True).stdout)
        return dur - inicios[-1]
    return 0.0


usados = set()
ordem = []
for n, cena, a, b in PARTES:
    pa, pb = BRUTOS / a, BRUTOS / b
    extra = max(0.05, PAUSA - silencio_final(pa))
    dados = pcm(pa) + b"\x00\x00" * int(extra * TAXA) + pcm(pb)
    destino = RAIZ / "assets" / "audio" / f"v2-parte{n:02d}.flac"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ac", "1", "-ar", str(TAXA), "-i", "-",
                    "-c:a", "flac", str(destino)], input=dados, check=True)
    dur = len(dados) / 2 / TAXA
    usados.update([a, b])
    ordem.append({"parte": n, "cena": cena, "trechos": [a, b], "pausaInserida": round(extra, 3), "duracao": round(dur, 3)})
    print(f"parte {n:02d}  {dur:5.2f} s  ({a[:28]} + {b[:28]})")

sobras = sorted(p.name for p in BRUTOS.glob("*.mp3") if p.name not in usados)
(RAIZ / "transcricao" / "ordem.json").write_text(json.dumps({"partes": ordem, "naoUsados": sobras}, ensure_ascii=False, indent=1))
print("não usados:", sobras or "nenhum")
