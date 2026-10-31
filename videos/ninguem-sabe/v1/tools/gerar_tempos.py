"""Gera assets/js/tempos/v1-parteNN.js (as palavras com tempo de cada parte) para as cenas importarem.

Uso: python3 tools/gerar_tempos.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
for arq in sorted((RAIZ / "transcricao").glob("v1-parte*.json")):
    d = json.loads(arq.read_text())
    palavras = [{"text": p["text"], "start": p["start"], "end": p["end"]} for p in d["palavras"]]
    js = ("// Gerado por tools/gerar_tempos.py a partir de transcricao/" + arq.name + "\n"
          "export const PALAVRAS = " + json.dumps(palavras, ensure_ascii=False) + ";\n")
    (RAIZ / "assets" / "js" / "tempos" / (arq.stem + ".js")).write_text(js)
print("ok")
