"""Confere a transcrição de cada áudio (transcricao/brutos.json) com o texto que ele deveria dizer (ROTEIRO.md).

Para cada Z1PNN: quanto do roteiro foi falado (palavras em comum, na ordem), os trechos do roteiro que faltam e as
palavras a mais. Avisa se faltar ou sobrar áudio (um Z1P sem arquivo, um arquivo sem Z1P) ou se um trecho do roteiro
não aparecer na fala. Uso: python3 tools/conferir_roteiro.py  ->  transcricao/conferencia.json + resumo na tela.
"""
import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9 ]+", " ", s.replace("-", " "))
    return s.split()


roteiro = {}
for linha in (RAIZ / "ROTEIRO.md").read_text().splitlines():
    m = re.match(r"\d+\. \*\*(Z1P\d\d) · [^*]+\*\* (.+)$", linha)
    if m:
        roteiro[m.group(1)] = m.group(2)

brutos = {Path(b["arquivo"]).stem: b for b in json.loads((RAIZ / "transcricao" / "brutos.json").read_text())}
saida, problemas = [], []
for cod in sorted(set(roteiro) | set(brutos)):
    if cod not in brutos:
        problemas.append(f"{cod}: está no roteiro, mas não tem áudio")
        continue
    if cod not in roteiro:
        problemas.append(f"{cod}: tem áudio, mas não está no roteiro")
        continue
    esperado = norm(roteiro[cod])
    falado = norm(brutos[cod]["texto"])
    sm = difflib.SequenceMatcher(a=esperado, b=falado, autojunk=False)
    comum = sum(b.size for b in sm.get_matching_blocks())
    faltam, sobram = [], []
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op in ("delete", "replace") and a1 - a0 >= 1:
            faltam.append(" ".join(esperado[a0:a1]))
        if op in ("insert", "replace") and b1 - b0 >= 1:
            sobram.append(" ".join(falado[b0:b1]))
    cobertura = comum / max(1, len(esperado))
    # um trecho de 4+ palavras seguidas do roteiro que não foi falado é um trecho faltando, não um erro de transcrição
    grandes = [f for f in faltam if len(f.split()) >= 4]
    saida.append({"codigo": cod, "duracao": brutos[cod]["duracao"], "cobertura": round(cobertura, 3),
                  "faltam": faltam, "sobram": sobram, "trechos_faltando": grandes})
    if cobertura < 0.9 or grandes:
        problemas.append(f"{cod}: {cobertura:.0%} do roteiro; faltando: {grandes or faltam}")

(RAIZ / "transcricao" / "conferencia.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1))
for s in saida:
    print(f"{s['codigo']}  {s['duracao']:6.2f} s  {s['cobertura']:5.0%}  faltam: {s['faltam'][:6]}  a mais: {s['sobram'][:6]}")
print(f"\ntotal: {sum(s['duracao'] for s in saida):.1f} s em {len(saida)} áudios")
if problemas:
    print("\nPROBLEMAS:")
    for p in problemas:
        print(" -", p)
    sys.exit(1)
print("nenhum trecho faltando ou sobrando")
