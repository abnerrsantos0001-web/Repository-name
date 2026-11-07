"""Ordena os 26 trechos brutos do vídeo 3 pela história e junta em pares: 13 partes.

A ordem vem do texto transcrito (transcricao/brutos.json), não do nome do arquivo.
Entre os dois trechos de cada parte entra uma pausa de fim de frase: o silêncio que já existe no fim
do primeiro trecho é completado até PAUSA segundos (as pausas depois de ponto na narração ficam em 0,4–0,65 s).
Uso: python3 tools/juntar_partes.py
Escreve assets/audio/v3-parteNN.flac e transcricao/ordem.json.
"""
import json
import re
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BRUTOS = RAIZ / "assets" / "audio" / "brutos"
PAUSA = 0.65
TAXA = 44100
# respiro de abertura de cada parte (plano de ambientação, sem voz, com o som do lugar; "DIA N" em vermelho
# quando o dia muda). A parte 1 abre com o título. Sem esticar a voz, o completo passa de 10 min.
ABERTURA = {1: 5.5}
ABERTURA_PADRAO = 3.2

# (parte, cena, trecho A, trecho B) na ordem da história
PARTES = [
    (1, "3:33 no quarto: o celular vibra; o e-mail chega em todos os celulares; \"Você tem 7 dias\"",
     "V3P01.mp3",
     "V3P02.mp3"),
    (2, "cozinha de manhã: a mãe e os \"38 anos\"; grupo da escola; Lucas: \"3 dias kkkkk\"",
     "V3P03.mp3",
     "eu-2026-11-06-16-32-[pause]-[calm]-É-golpe,-ela-diz.-Apaga-isso.-No.mp3"),
    (3, "jornal na TV: \"ataque hacker\"; o mapa do mundo; videogame e lanche com o Lucas",
     "eu-2026-11-06-16-34-[serious]-No-jornal,-especialistas-explicam-que.mp3",
     "eu-2026-11-06-16-34-[pause]-[serious]-Você-decide-não-pensar-nisso..mp3"),
    (4, "terceiro dia, sala de aula: o horário 14:07; \"valeu por tudo, mano\"; às 14:07 o Lucas encosta a cabeça na carteira",
     "eu-2026-11-06-16-35-[tense]-No-terceiro-dia,-o-Lucas-vai-pra-escola.mp3",
     "eu-2026-11-06-16-36-[pause]-[tense]-Às-14-e-05,-ele-te-manda-uma-men.mp3"),
    (5, "sirenes (só as luzes); o jornal à noite; o seu e-mail com 3:33 embaixo dos 7 dias",
     "eu-2026-11-06-16-36-[low-voice,-slow]-O-resto-do-dia-é-sirene,-gente.mp3",
     "eu-2026-11-06-16-36-[pause]-[serious]-Às-onze-da-noite,-ninguém-mais.mp3"),
    (6, "quarto dia: aeroportos e igrejas lotados; datas nos perfis; jantar, a mãe segura a mão, o pai chora",
     "eu-2026-11-06-16-36-[tense]-No-quarto-dia,-o-mundo-vira-de-cabeça-pr.mp3",
     "eu-2026-11-06-16-37-[tense]-Nas-redes,-as-pessoas-colocam-a-data-no.mp3"),
    (7, "trancado no quarto: 72 h, 4.320 min; 3:33, novo e-mail \"Faltam 3 dias\"",
     "eu-2026-11-06-16-37-[anxious]-Você-se-tranca-no-quarto.-Fica-olhando.mp3",
     "eu-2026-11-06-16-37-[pause]-[anxious]-Às-3-e-33,-o-celular-vibra-de.mp3"),
    (8, "quinto dia: a lista no caderno (o mar, a Júlia, o pai, a mãe); dobra, guarda no bolso, desliga o celular",
     "eu-2026-11-06-16-37-[calm,-slowly-getting-stronger]-No-quinto-dia,-v.mp3",
     "eu-2026-11-06-16-38-[calm,-slowly-getting-stronger]-Pedir-desculpa-p.mp3"),
    (9, "ônibus para a praia, o mar pela primeira vez; a porta da Júlia, \"52 anos\" e o abraço",
     "eu-2026-11-06-16-38-[soft,-hopeful]-Você-pega-o-primeiro-ônibus-pra.mp3",
     "eu-2026-11-06-16-38-[pause]-[soft,-hopeful]-Na-volta,-você-para-na-c.mp3"),
    (10, "garagem com o pai e o carro velho; o boato \"a data mudou\"; a caixa de entrada sem abrir",
     "eu-2026-11-06-16-38-[calm]-À-noite,-você-encontra-o-seu-pai-na-garag.mp3",
     "eu-2026-11-06-16-39-[mysterious]-Algumas-pessoas-estão-dizendo-que-a.mp3"),
    (11, "sétimo dia: café com a mãe; a família dorme no sofá; o relógio 3:30, 3:31, 3:32, 3:33",
     "eu-2026-11-06-16-39-[soft,-melancholic]-O-sétimo-dia-amanhece-bonito.mp3",
     "eu-2026-11-06-16-39-[pause]-[soft,-melancholic]-À-noite,-a-família-i.mp3"),
    (12, "o celular vibra: \"Data atualizada\"; \"A partir de agora, você não vai mais saber.\"; o choro em silêncio",
     "eu-2026-11-06-16-40-[whisper]-O-celular-vibra-no-seu-bolso.-[pause].mp3",
     "eu-2026-11-06-16-40-[long-pause]-[tense]-Você-abre.-E-não-tem-data-n.mp3"),
    (13, "epílogo: a folha riscada e reescrita; pergunta para os comentários; NINGUÉM SABE; o celular às 3:33",
     "eu-2026-11-06-16-40-[calm,-reflective]-Até-hoje,-ninguém-descobriu-q.mp3",
     "eu-2026-11-06-16-41-[pause]-[friendly,-natural-tone]-Agora-me-fala-a.mp3"),
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
    abertura = ABERTURA.get(n, ABERTURA_PADRAO)
    dados = b"\x00\x00" * int(abertura * TAXA) + pcm(pa) + b"\x00\x00" * int(extra * TAXA) + pcm(pb)
    destino = RAIZ / "assets" / "audio" / f"v3-parte{n:02d}.flac"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ac", "1", "-ar", str(TAXA), "-i", "-",
                    "-c:a", "flac", str(destino)], input=dados, check=True)
    dur = len(dados) / 2 / TAXA
    usados.update([a, b])
    ordem.append({"parte": n, "cena": cena, "trechos": [a, b], "abertura": abertura, "pausaInserida": round(extra, 3), "duracao": round(dur, 3)})
    print(f"parte {n:02d}  {dur:5.2f} s  ({a[:28]} + {b[:28]})")

sobras = sorted(p.name for p in BRUTOS.glob("*.mp3") if p.name not in usados)
(RAIZ / "transcricao" / "ordem.json").write_text(json.dumps({"partes": ordem, "naoUsados": sobras}, ensure_ascii=False, indent=1))
print("não usados:", sobras or "nenhum")
