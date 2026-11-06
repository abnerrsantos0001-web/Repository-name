# Gera o index.html da composição de capas (uma capa por segundo).
# Rodar: python3 gerar.py && npx hyperframes snapshot --at 0.5,1.5,...
import json
CAPAS = [
  # id, nome (linhas), gênero, bpm, tom, fundo, tinta, destaque, símbolo
  ("madrugada",   ["MADRU","GADA"],      "TRAP",  140, "F#m", "#0b0b0b", "#f2f2ee", "#b6ff00", "sol"),
  ("beco",        ["BECO SEM","SAÍDA"],  "DRILL", 142, "C#m", "#b6ff00", "#0b0b0b", "#ff2e2e", "barras"),
  ("luz-negra",   ["LUZ","NEGRA"],       "DARK",  130, "Gm",  "#ff2e2e", "#0b0b0b", "#f2f2ee", "olho"),
  ("corre",       ["CORRE"],             "TRAP",  150, "Am",  "#f2f2ee", "#0b0b0b", "#ff2e2e", "seta"),
  ("fumaca",      ["FUMAÇA"],         "TRAP",  135, "Dm",  "#0b0b0b", "#b6ff00", "#ff2e2e", "pontos"),
  ("quebrada",    ["QUEBRADA","FRIA"],   "DRILL", 144, "Ebm", "#0b0b0b", "#f2f2ee", "#ff2e2e", "barras"),
  ("velorio",     ["VELÓ","RIO"],        "DARK",  120, "Bbm", "#0b0b0b", "#ff2e2e", "#f2f2ee", "cruz"),
  ("noite-acida", ["NOITE","ÁCIDA"],     "TRAP",  145, "Em",  "#b6ff00", "#0b0b0b", "#0b0b0b", "sol"),
  ("genero-trap", ["TRAP"],              "",      0,   "",    "#b6ff00", "#0b0b0b", "#ff2e2e", "pontos"),
  ("genero-drill",["DRILL"],             "",      0,   "",    "#f2f2ee", "#0b0b0b", "#ff2e2e", "barras"),
  ("genero-dark", ["DARK"],              "",      0,   "",    "#0b0b0b", "#ff2e2e", "#f2f2ee", "olho"),
]

def simbolo(kind, c):
    if kind == "sol":
        return f'<svg class="sym" viewBox="0 0 400 400"><circle cx="200" cy="200" r="150" fill="{c}"/><rect x="0" y="230" width="400" height="14" fill="currentColor"/><rect x="0" y="270" width="400" height="22" fill="currentColor"/><rect x="0" y="318" width="400" height="34" fill="currentColor"/></svg>'
    if kind == "barras":
        bars = "".join(f'<rect x="{i*44}" y="{400-h}" width="30" height="{h}" fill="{c}"/>' for i,h in enumerate([120,260,180,340,90,300,220,380,150]))
        return f'<svg class="sym" viewBox="0 0 400 400">{bars}</svg>'
    if kind == "olho":
        return f'<svg class="sym" viewBox="0 0 400 400"><path d="M20 200 Q200 40 380 200 Q200 360 20 200 Z" fill="{c}"/><circle cx="200" cy="200" r="70" fill="currentColor"/><circle cx="200" cy="200" r="26" fill="{c}"/></svg>'
    if kind == "seta":
        return f'<svg class="sym" viewBox="0 0 400 400"><path d="M40 160 H250 V80 L380 200 L250 320 V240 H40 Z" fill="{c}"/></svg>'
    if kind == "cruz":
        return f'<svg class="sym" viewBox="0 0 400 400"><rect x="165" y="30" width="70" height="340" fill="{c}"/><rect x="70" y="110" width="260" height="70" fill="{c}"/></svg>'
    # pontos
    dots = "".join(f'<circle cx="{20+x*40}" cy="{20+y*40}" r="{4+((x*7+y*3)%5)*3.2}" fill="{c}"/>' for x in range(10) for y in range(10))
    return f'<svg class="sym" viewBox="0 0 400 400">{dots}</svg>'

clips = []
for i,(cid,linhas,gen,bpm,tom,bg,ink,acc,sym) in enumerate(CAPAS):
    genero = cid.startswith("genero")
    # capas de gênero: só símbolo e fita, o nome fica no site
    nome = "" if genero else "".join(f'<span>{l}</span>' for l in linhas)
    size = 330 if genero else (230 if max(len(l) for l in linhas) <= 6 else 168)
    meta = "" if genero else f'<div class="meta"><span>{gen}</span><span>{bpm} BPM · {tom}</span></div>'
    tilt = [-4,3,-2,5,-3,2,-5,4,-3,3,-4][i]
    clips.append(f'''      <div id="c-{cid}" class="clip capa" data-start="{i}" data-duration="1" data-track-index="0" style="background:{bg};color:{ink}">
        <div class="tex"></div>
        <div class="symwrap{' big' if genero else ''}" style="color:{bg};transform:rotate({tilt}deg)">{simbolo(sym, acc)}</div>
        <div class="tape" style="background:{acc};color:{bg}">YUNGVITT.OG</div>
        <h2 class="nome" style="font-size:{size}px">{nome}</h2>
        {meta}
      </div>''')

html = f'''<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1000, height=1000" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      /* Capas de exemplo do site YUNGVITT.OG. Gerado por gerar.py: edite lá. */
      @font-face {{ font-family: "Anton"; src: url("assets/fonts/anton.woff2") format("woff2"); }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1000px; height: 1000px; overflow: hidden; background: #0b0b0b; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; }}
      .capa {{ position: absolute; inset: 0; overflow: hidden; font-family: "Space Mono", monospace; }}
      .tex {{ position: absolute; inset: 0; opacity: .16;
        background-image: radial-gradient(circle, currentColor 1.4px, transparent 1.8px); background-size: 12px 12px; }}
      .symwrap {{ position: absolute; right: -40px; top: 60px; width: 620px; height: 620px; }}
      .symwrap.big {{ left: 120px; right: auto; top: 180px; width: 760px; height: 760px; }}
      .sym {{ width: 100%; height: 100%; display: block; }}
      .tape {{ position: absolute; left: 56px; top: 56px; padding: 10px 22px; font-family: "Anton"; font-size: 44px;
        letter-spacing: .02em; transform: rotate(-3deg); clip-path: polygon(2% 0, 100% 6%, 98% 100%, 0 92%); }}
      .nome {{ position: absolute; left: 50px; right: 40px; bottom: 160px; font-family: "Anton"; font-weight: 400;
        line-height: 1; letter-spacing: -.01em; }}
      .nome span {{ display: block; white-space: nowrap; }}
      .meta {{ position: absolute; left: 56px; right: 56px; bottom: 56px; display: flex; justify-content: space-between;
        font-size: 40px; font-weight: 700; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{len(CAPAS)}" data-width="1000" data-height="1000">
{chr(10).join(clips)}
    </div>
    <script>
      // Capas paradas: a linha do tempo só troca de capa a cada segundo.
      const tl = gsap.timeline({{ paused: true }});
      tl.set({{}}, {{}}, {len(CAPAS)});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
'''
open("index.html","w").write(html)
json.dump([c[0] for c in CAPAS], open("ids.json","w"))
print("ok", len(CAPAS))
