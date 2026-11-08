# HANDOFF — canal "Ninguém Sabe"

Tudo o que uma conversa nova precisa para continuar o canal sem perder nada. Atualizado em 08/11/2026.

> **Leia nesta ordem:**
> 1. este arquivo;
> 2. `videos/prompt-mestre/PROMPT-MESTRE.md` (o manual completo; a seção **REGRAS FIXAS DO CANAL** manda);
> 3. o `CLAUDE.md` da raiz do repositório (fluxo do Instagram + resumo das regras fixas dos vídeos);
> 4. `videos/ninguem-sabe/REGRAS.md` (as regras mais novas, com prioridade);
> 5. `videos/ninguem-sabe/v3/REVIEW.md` (como o vídeo 3 foi feito, decisões e planos fracos).
>
> O `CLAUDE.md` que fica dentro de cada `vN/` é o texto padrão do HyperFrames (como usar o CLI), não as regras do canal.

---

## 1. Estado em uma olhada

| Vídeo | Título | Situação |
|---|---|---|
| v1 | "E se você acordasse e TODO MUNDO tivesse sumido?" | **Pronto e enviado:** 11 partes, completo, 4 cortes, capa, REVIEW. |
| v2 | "E se o seu reflexo parasse de te copiar?" | **Pronto e enviado:** 10 partes, completo (7 min, 88,9 MB), 4 cortes, capa, REVIEW. |
| v3 | "E se você soubesse o dia da sua morte?" | **Produzido** (13 cenas, 6 cortes, capas, CTA). Partes 01–10 renderizadas; 11–13, a parte 01 de novo e os 6 cortes na fila de render; depois o completo. Detalhes na seção 10.2 e em `v3/REVIEW.md`. |

- **Branch de trabalho:** `claude/sharp-pasteur-25n0b1`. Ela **não** foi mergeada na `main`.
- **PR:** nenhum foi aberto, e não abra sem pedido.

---

## 2. Git e entrega

- Trabalhe e faça push **só** na branch `claude/sharp-pasteur-25n0b1`, com `git push -u origin claude/sharp-pasteur-25n0b1`. Se der erro de rede, tente de novo esperando 2, 4, 8 e 16 s.
- **Os áudios chegam pela `main`:** o usuário sobe pelo site, e aparece um commit "Add files via upload" com os arquivos na raiz.
  1. `git fetch origin main && git merge origin/main`
  2. `git mv "<arquivo>" videos/ninguem-sabe/vN/assets/audio/brutos/`
- **Antes de começar,** confira se a branch não foi mergeada: `git merge-base --is-ancestor origin/claude/sharp-pasteur-25n0b1 origin/main`. Se foi, recomece a branch a partir da `main` (instruções do ambiente).
- **Commit e push de cada arquivo assim que ficar pronto, sem pedir aprovação** (regra fixa 10).
- **Os MP4 entram com `git add -f`,** porque `renders/` está no `.gitignore`.
- **Limite do GitHub:** menos de 100 MB por arquivo. O GitHub só avisa a partir de 50 MB. `tools/commit_render.sh` recomprime o que passar de 95 MB.
- **Rodapé do commit:** use o que o ambiente da sessão indicar. Nunca ponha identificador de modelo no texto do commit.
- **Nunca faça commit de `.env` ou de tokens.** Nunca publique no Instagram sem a palavra "publicar" (regra do `CLAUDE.md` da raiz).

---

## 3. Estrutura de pastas e nomes

```
videos/
  prompt-mestre/PROMPT-MESTRE.md          # manual completo + REGRAS FIXAS DO CANAL
  ninguem-sabe/
    HANDOFF.md                            # este arquivo
    v1/  v2/  v3/                         # um projeto HyperFrames por vídeo
```

Dentro de cada `vN/`:

| Caminho | O que é |
|---|---|
| `index.html` | Raiz gerada por `tools/gerar_raizes.py` (uma parte, um corte ou a capa). **Não edite à mão.** Restaure com `git checkout index.html` antes de commitar. |
| `compositions/parteNN.html` | Cena da parte: esqueleto (`tools/nova_parte.py`) + "miolo" (módulo JS da cena). |
| `cenas/pNN.js` (+ `pNN-extra.html`) | **Código-fonte das cenas** (os miolos). Edite aqui e gere a composição de novo. v1 e v2 têm os seus. |
| `compositions/legendas-pNN.html`, `legendas-pNN-v.html` | Legendas 16:9 e vertical (geradas). |
| `compositions/legendas-corteN.html` | Legendas de cada corte por intervalo (v3 em diante, gerada). |
| `compositions/partecapa.html` | Capa do vídeo longo (2 s; o quadro usado é o de t = 1 s). |
| `compositions/partecapacorteN.html` | Capa vertical de cada corte (v3 em diante). |
| `compositions/cartao-final.html` | Cartão final dos cortes (regra fixa 8; v3 em diante). |
| `compositions/cartao-corte.html` | Cartão antigo "Parte X amanhã" (v1 e v2). **Não use mais.** |
| `assets/js/cena.js` | Motor de cena. |
| `assets/js/personagem.js` | Boneco-base e variantes. |
| `assets/js/mundo.js`, `mundo2.js`, `mundo3.js` | Cenários. |
| `assets/js/reflexo.js` | Espelhos: mundo espelhado, espelho plano, vidro com shader. |
| `assets/js/telas.js` | Telas do celular em canvas. |
| `assets/js/tempos/vN-parteNN.js` | `PALAVRAS = [{text, start, end}]` de cada parte (gerado). |
| `assets/audio/brutos/` | Áudios originais do usuário. |
| `assets/audio/vN-parteNN.flac` | Narração de cada parte já montada (pares juntados). |
| `assets/audio/mix/` | `vN-parteNN.flac`, `vN-completo.flac`, `corteN.flac` e **`partes.json`** (fonte única de quadros e durações). |
| `transcricao/` | `brutos.json`, `ordem.json`, `vN-parteNN.json`. |
| `ORDEM.md` | Ordem dos áudios. |
| `CORTES.md` + `cortes.json` | Gancho e intervalos dos cortes (v3 em diante). |
| `REVIEW.md` | Revisão final. |
| `previas/pNN/folha.jpg`, `previas/corteN/folha.jpg` | Folhas de contato 720p (vão para o git; os quadros soltos não). |
| `renders/vN-parteNN.mp4`, `vN-completo.mp4`, `vN-corteN.mp4` | Vídeos finais. |
| `capa/capa-vN.png` (1280x720), `capa/corteX-capa.png` (1080x1920) | Capas. |
| `tools/` | Scripts (seção 6). `tools/diag/` tem os diagnósticos de colisão e pose. |

---

## 4. Estilo visual 3D

### 4.1 Personagem (boneco-base low-poly, `personagem.js`)

**Medidas** (ESCALA 0,86):

| Medida | Valor |
|---|---|
| Altura total | ~1,56 m |
| Quadril | 0,757 m |
| Tronco | 0,52 m |
| Raio do tronco | 0,25 m |
| Alcance do braço | **~0,56 m** (+4 cm de dedos) |
| Cabeça (icosaedro, com capuz) | ~0,7 m de largura |

A cabeça é **enorme**. Quando ele se debruça numa pia, o rosto fica a ~8 cm do espelho. Planeje gestos e câmera com essas medidas.

**Cores base** (`COR_PERSONAGEM`): pele `0xcfcbc4`, moletom `0x1b1c20`, cordões `0x8c8c8c`, calça `0x2c2e34`, tênis `0x0d0d0e`.

**Rosto:**
- olhos pretos com brilho (escala Y = abertura);
- sobrancelhas: `sobrancelha` −1 franzida / +1 susto; `sobrancelhaMedo`;
- boca redonda (0 a 1);
- `sorriso` em fita curva e `sorrisoLargo` (sorriso grande demais, com dentes);
- `lingua`.

**Pose** (cada parâmetro é uma trilha de chaves):
- corpo: `giro`, `deitar`, `inclinar`;
- cabeça: `cabecaGiro`, `cabecaInclina`, `cabecaTomba`;
- pernas: `quadril`, `joelho` (com E/D);
- braços: `ombro`, `abertura`, `cotovelo` (com E/D);
- rosto: `olhos`, `apertar`, `boca`, `sorriso`, `sorrisoLargo`, `lingua`, `sobrancelha`, `sobrancelhaMedo`;
- respiração: `ofegar`.

**Comportamento:**
- mãos por IK (`maos()` → `alvoE/D`, `pesoE/D`);
- piscadas sorteadas por semente, com `semPiscar` e `piscadas`;
- "cabeça viva" (balanço leve por semente);
- passos (`passos: [[t0, t1, amplitude, meioPasso]]`).

**Variantes** (`VARIANTES`):

| Variante | Como é |
|---|---|
| `ele` | Moletom preto com capuz. |
| `mae` | Cardigã `0x8a7a6b`, blusa `0xcdc6b8`, saia `0x41444f`, botões, coque `0x3d3029`. |
| `pai` | Moletom `0x3d4048`, cabelo curto. |
| `mulher` | Cabelo comprido, cachecol vermelho `0x7a1418`. |
| `passageiro`, `passageira`, `idosa`, `padeiro` | Figurantes (só roupa e cabelo mudam). |

### 4.2 Cores
- **Fundo e véus:** `#0c0d0f`. **Texto:** `#f4f2ee`.
- **Vermelho** (`#e3121b` / `#c4161c` / `#e3262d`) **só no que conta a história:** palavra-chave da legenda, relógio 3:33, títulos de capa, aviso.
- Cenários em cinzas, madeira e azulejo, sem cor saturada fora o vermelho da história.

### 4.3 Iluminação
- **Motor:** tone mapping ACES e sombras PCF (`radius` 3), com mapas de 1024 px no interior e até 4096 px no sol.
- **Materiais:** Lambert para o fosco; Standard só para metal, louça e vidro.
- **Luzes por cenário:** cada cenário tem modos (`manha`, `dia`, `noite`, `noiteAcesa`, `apagada`). Cada plano tem `preenchimento` (luz presa à câmera).
- **v3 (regra fixa 4):** já está no `v3/assets/js/cena.js` a `CLARIDADE = 1,3`, que multiplica a exposição (1,1 vira ~1,43) e o preenchimento, e a `AMBIENTE = 1,3`, que multiplica as luzes hemisféricas e ambiente a cada troca de modo.
- **Meta:** luminância média (YAVG) de cada quadro da prévia ≥ 75/255 à noite e ~95–135 de dia; abaixo de 70 é proibido.
- **Noite:** o clima vem de contraste e cor (azul frio, corredor aceso, tela do celular), nunca de escuridão.

### 4.4 Câmera
- Chaves `[t, posição, alvo, fov, curva?]` por plano, ou uma função `(tt, ctx) => {pos, alvo, fov}`.
- **Fov:** 28–56 nos planos normais e 12–26 no telefoto pelo espelho.
- **Tremor:** 0,001–0,009.
- **Planos:** um plano por frase ou ideia, com cortes nas pausas. `cortesEscuros` escurece 0,14 s antes de trocar de cenário.
- **Distâncias:** a câmera fica sempre **≥ 0,4 m do centro da cabeça**. Calcule a separação angular entre a cabeça e o assunto, porque a cabeça tapa tudo.
- **POV do celular:** `cameraTela(perto)` + `semCabeca`.
- **Vertical:** `fovVertical(fov)` mostra o miolo do quadro 16:9; planos com relógio ou letreiro ganham chaves `v` próprias.
- **Repertório que funciona:**
  - por cima do ombro para o espelho;
  - do lado do espelho, de frente para ele;
  - de dentro do mundo espelhado (tom frio);
  - POV do celular;
  - planos largos altos depois do clímax;
  - close telefoto pelo espelho.

---

## 5. Motor, cenários e espelho (o kit)

- **`cena.js`:** `iniciarParte({...})`. O formato completo do miolo está no PROMPT-MESTRE, seção 6.2. Os pontos principais:
  - `planos`, `cameras`, `personagem` (`onde`, `pos`, `passos`, `pose`, `maos`, `visivel`), `outros` (com `espelho: true` para reflexos de outros personagens);
  - `reflexo` (`atraso(t)`, `janelas`), `celular`, `tela`, `montar`, `quadro(tt, plano, ctx, fase)`;
  - `pos` (pós-efeito: `onda` e `tom`), `opcoesCenario` (por exemplo `{cozinha: {invertida: true}}` para os textos espelhados);
  - `ctx.colisoes(tol)`: a checagem por vértice.
- **Variáveis por instância** (v3, nas composições de parte): `inicio` (começa X s dentro da parte) e `ate` (congela nesse instante). Elas são lidas por `window.__hyperframes.getVariables()` e são o que permite os cortes por intervalo.
- **Cenários existentes** (cada um num deslocamento próprio no espaço):

| Arquivo | Cenários |
|---|---|
| `mundo.js` | `quarto`, `bairro`, `cidade` |
| `mundo2.js` | `terreo`, `apartamento`, `escadaria`, `shopping`, `concessionaria` |
| `mundo3.js` | `banheiro` (espelho com mundo espelhado, pia com cuba, secador, lençol, cacos), `quarto2` (cama, guarda-roupa com espelho, escrivaninha, janela com cortinas), `cozinha` (mesa com 4 cadeiras, cafeteira, rádio, relógio digital, espelho, janela com rua e ônibus; opção `invertida`), `rua` (padaria com vitrine, lojas, ponto de ônibus), `onibus` (por dentro, paisagem passando) |

- **Peças avulsas:** `criarCarro`, `criarOnibus`, `criarPoste`, `criarSemaforo`, `criarArvoreSeca`, `criarCasa`, `criarPredio`, `criarCelular`, `criarRelogio` e `criarCachorro`.
- **Espelho de verdade:** `comEspelho()` cria uma cópia do cômodo com `scale.z = −1` atrás de um vão. O reflexo é um "dublê" posado a partir de um "fantasma". `EspelhoPlano` faz o reflexo plano por render target com corte oblíquo. O vidro tem `toques`, `agua`, `opaco` e `quebrar(dt)`.
- **Telas do celular:** canvas 600x1302 (busca, feed, perfil, chamada, lanterna, "último post"…).

---

## 6. Ferramentas e comandos

**Ambiente da nuvem** (já instalado na sessão anterior):

| Ferramenta | Versão |
|---|---|
| Node | 22 |
| Python | 3.13 |
| ffmpeg | 6.1 |
| Chromium + Playwright | pré-instalados (`require('playwright')` funciona; não reinstale) |
| HyperFrames CLI | **0.8.222**, sempre com `npx --yes hyperframes@0.8.222 …` (o `package.json` ainda diz 0.8.221; os scripts usam 0.8.222) |

**Ambientes Python (venvs):** os da sessão anterior ficavam na área temporária e **somem** com o container. Recrie:
```bash
S=<pasta temporária da sessão>
python3 -m venv $S/whisper-venv && $S/whisper-venv/bin/pip install faster-whisper==1.2.1
python3 -m venv $S/audio-venv && $S/audio-venv/bin/pip install numpy scipy soundfile
```

**Pipeline** (rodar dentro de `videos/ninguem-sabe/vN/`):

| Etapa | Comando |
|---|---|
| Transcrever todos os brutos (faster-whisper medium, pt, tempo por palavra) | `$S/whisper-venv/bin/python tools/transcrever_brutos.py` → `transcricao/brutos.json` |
| Ordenar pela história e juntar em pares (editar a lista `PARTES`; pausa 0,65 s com `silencedetect`) | `python3 tools/juntar_partes.py` → `assets/audio/vN-parteNN.flac` |
| Realinhar palavras na parte montada | `$S/whisper-venv/bin/python tools/alinhar_parte.py NN` → `transcricao/vN-parteNN.json` |
| Tempos para as cenas | `python3 tools/gerar_tempos.py` → `assets/js/tempos/vN-parteNN.js` |
| Legendas (editar `PARTES` com grupos e correções) | `python3 tools/gerar_legendas.py NN` / `NN --vertical` / `corteN` |
| Som (narração + trilha + efeitos + mix + fatias) | `$S/audio-venv/bin/python tools/audio.py` → `assets/audio/mix/*` + `partes.json` |
| Gerar a composição de uma cena | `python3 tools/nova_parte.py NN "descrição" cenas/pNN.js [cenas/pNN-extra.html]` |
| Servidor local para as checagens | `python3 -m http.server 8766 &` (dentro de `vN/`) |
| Checar colisões (meta: "nenhuma sobreposição acima de 0.02 m") | `node tools/colisoes.mjs NN 0.25 [tol]` (passo 0,1 nos contatos) |
| Diagnóstico de colisão (qual malha, onde) | `node tools/diag/qual.mjs NN t peça` (cenário real) / `node tools/diag/outro.mjs NN t idOutro peça` (outro personagem ou dublê) |
| Posição de ombros, mãos e celular | `node tools/diag/maos.mjs NN "t1,t2"` |
| Caixas da cabeça, do tronco e do secador | `node tools/diag/cabeca.mjs NN "t1,t2"` |
| Erros de JavaScript da página | `node tools/diag/erros.mjs NN` |
| Prévia 720p | `tools/previa.sh NN "t1,t2,…"` → `previas/pNN/folha.jpg` (sempre olhe) |
| Prévia vertical | `tools/previa_vertical.sh N "t1,…"` → `previas/corteN/folha.jpg` |
| Render de um alvo | `tools/renderizar.sh NN renders/vN-parteNN.mp4` (copia o projeto para `$TMPDIR`, `--quality looks --crf 14`) |
| Fila de renders com commit e push automático | `TMPDIR=$S RODAPE="<atribuição>" tools/rodar_fila.sh fila.txt fila.log` |
| Filme completo | `tools/montar_completo.sh` |
| Capa do longo | `python3 tools/gerar_raizes.py capa && npx --yes hyperframes@0.8.222 snapshot --at 1.0`, depois `ffmpeg -vf scale=1280:720:flags=lanczos` → `capa/capa-vN.png` |
| Conferências | `ffprobe -count_packets -show_entries stream=nb_read_packets` (quadros iguais aos do `partes.json`), `ffmpeg -af ebur128=peak=true` (volume) |

**Sobre a fila de renders:**
- Cada linha é `alvo saída.mp4`, e a fila termina na linha `fim`.
- Rode em **segundo plano**, com limite de **2 h por fila**.
- **Não renderize em paralelo** (são só 4 núcleos).
- **Tempos de referência:** 1,2–2 quadros/s. Uma parte de 40 s leva 20–30 min; um corte de 60 s leva ~20–35 min.

---

## 7. Som feito por código

- **Nada de MusicGen ou som por IA.** Tudo sai de numpy e scipy.
- **Trilha:**
  - drone de 49/49,12/73,42/98 Hz, pad e "ar do cômodo" (ruído em faixa);
  - camada de "vidro" (1318/1324/1975 Hz) nos momentos de espelho;
  - envelope de intensidade preso às palavras.
- **Efeitos que já existem** (nas funções do `tools/audio.py`): tique, coração, vibração, despertador, notificação, toque de chamada, ocupado, batida na porta, baque, estalo, carro passando, toc no vidro, mão no vidro, torneira, interruptor, porta fechando, passos correndo, rua, motor de ônibus, lençol, água, objeto caindo, vidro quebrando, respiração, rádio, cafeteira e grave de susto.
- **Pistas:** `por(T(parte, "palavra"), som(), ganho, "nome")`.
- **Mixagem:**
  - narração nivelada; folga de 0,8 s no fim de cada parte (2,2 s na última);
  - a trilha abaixa sob a voz (ducking);
  - `loudnorm` a **−15 LUFS** com pico de **−1,5 dBTP**;
  - fatias na **grade de quadros** (30 fps a 48 kHz = 1600 amostras por quadro).
- **Volume medido no completo do v2:** −16,0 LUFS, pico de −1,0 dBTP.
- **CTA:** o usuário subiu **`cta1.mp3` (6,84 s)** e **`cta2.mp3` (7,26 s)** na `main` (07/11, raiz do repositório). Eles são o áudio do cartão final dos cortes (regra fixa 8), no lugar do som feito por código.
  - Transcreva os dois para saber o que dizem e alterne entre os cortes (ímpares cta1, pares cta2), a não ser que o conteúdo peça outra coisa.
  - **Conflito de duração:** a regra fixa 8 diz "últimos 4 s", mas os CTAs têm ~7 s. Não corte a fala. O cartão deve durar o tempo do CTA + ~0,3 s. **Avise o usuário** dessa mudança na entrega.

---

## 8. Regras fixas do canal (valem do vídeo 3 em diante)

Os valores técnicos estão no PROMPT-MESTRE (seção REGRAS FIXAS) e o resumo no `CLAUDE.md` da raiz.

1. **Duração:** vídeo longo com 10 min ou mais. O roteiro já vem dimensionado.
2. **Gancho:** o completo abre com **5–7 s do momento mais forte** (da própria narração), depois **corte seco para preto com um grave** (0,6–0,8 s), e só então a história começa do início.
3. **Legendas fora do centro:**
   - 16:9: bloco a **~80% da altura** (`bottom: 165px`), **66 px**;
   - vertical: **65–70% da altura** (`bottom: 600px`), **86 px**;
   - Montserrat 800, contorno preto de 5–6 px, a palavra-chave em vermelho;
   - **nunca cobrir rosto, espelho, celular ou relógio**: isso se resolve no enquadramento, e a exceção por plano fica dentro da faixa permitida.
4. **Iluminação:** sombrio, mas ~30% mais claro, com luz ambiente e de preenchimento. A luminância de cada quadro da prévia é medida.
5. **Qualidade:** 1080p real, antialiasing, sombras e texturas em alta. Nada se sobrepõe nem atravessa nada (colisões medidas), e cada parte tem prévia 720p antes do render.
6. **Cortes verticais:** **45–60 s**, cada um **terminando no suspense** (antes da resposta). São intervalos contínuos da história, que podem atravessar partes. Os **~2 minutos finais** ficam **só no longo**.
7. **Capa no corte:** cada corte abre com **0,5–1 s** de capa (o momento mais impactante daquele corte, 2–4 palavras grandes em vermelho), salva também como `capa/corteX-capa.png`.
8. **Cartão final dos cortes (4 s):**
   - "**A HISTÓRIA COMPLETA JÁ ESTÁ NO CANAL**" + "**Toque no link aqui embaixo**";
   - **seta vermelha animada** para baixo;
   - áudio: `cta.mp3` se existir;
   - fica sobre o último quadro congelado. Já está pronto em `v3/compositions/cartao-final.html`.
9. **Som feito por código.**
10. **Entrega:** commit e push de cada arquivo assim que ficar pronto; no fim, a lista de arquivos com as durações e os planos mais fracos.

**Fluxo com o usuário (duas mensagens):**
- **Mensagem 1:** transcrever e ordenar os áudios, montar as partes e avisar se faltar ou sobrar trecho. Propor `CORTES.md` (gancho e cortes) e montar a base, **sem renderizar**.
- **Mensagem 2:** renderizar tudo.

---

## 9. Problemas já resolvidos (não repita)

1. **`T("palavra")` pega a primeira ocorrência.** "vez," e "vez." são a mesma chave. Use frase única ou `T("x", 2)`, e audite toda chamada sem índice. Esse erro custou um re-render da parte 06 do v2. Também confira se a frase existe ("palavra não encontrada" quebra a página).
2. **Cada quadro é independente:** o render abre quadros fora de ordem. Nunca use estado do quadro anterior, como a posição do celular dentro de `maos()`. Calcule pela mesma função que define a posição.
3. **Alcance e postura:**
   - calcule o ombro e o alcance antes de qualquer contato;
   - gire o corpo (π ± 0,25–0,35) para levar um ombro à frente;
   - suba na ponta dos pés (+3–4,5 cm) para a barriga passar acima do tampo;
   - fique ao lado da cuba;
   - para soltar uma mão, leve o alvo ao peito antes de baixar o peso;
   - esquerda e direita: com `giro = π`, a direita é +x (já saiu braço cruzado por isso).
4. **Objetos na mão:** a palma fica 5,5 cm à frente do centro da mão. O bico do secador para no plano do vidro. Objetos saem do gancho para baixo e para fora, longe da cabeça.
5. **Mundo espelhado:**
   - o dublê herda as chaves que a janela não sobrescreve (sobrescreva `quadril` e `joelho`);
   - a cópia tem rua e ônibus próprios (esconda o ônibus da cópia);
   - "outros" com `espelho: true` não têm IK (use ângulos);
   - o mundo invertido espelha os textos, e pelo espelho eles voltam certos.
6. **Geometria de cenário:**
   - lençol do banheiro inclinado por cima da torneira e acima da cuba;
   - lençol do guarda-roupa na frente dos puxadores;
   - cortinas mais curtas que não atravessam a escrivaninha;
   - letreiro do ônibus na lateral visível (estava dentro da carroceria);
   - a cuba é de apoio, com borda a 0,98 m.
7. **Caminhos:** passe pelo meio do vão da porta e só vire depois do batente. Comece a caminhada no meio do passo (chave em t < 0), senão o tênis afunda no chão. Entre cadeiras e aparador, empurre as cadeiras para baixo da mesa.
8. **Colisão por caixa é conservadora.** Até um botão do cardigã a 2 cm da borda da mesa conta. Afaste a pessoa e a cadeira juntas.
9. **Câmeras:** a cabeça tapa o assunto (calcule a separação angular); POV com `semCabeca`. Na vertical, relógios cortados ganham chaves `v`, e legenda sobre tela de celular é resolvida por posição por plano.
10. **Luz:**
    - manhã com a luz do teto apagada fica escura (se a história permitir, deixe acesa);
    - a rua vista pela janela fica preta (ponha um sol pontual lá fora);
    - o mundo espelhado deixa o render até 3,4× mais caro (só a luz principal faz sombra na cópia; luzes apagadas ficam invisíveis).
11. **Shell:** `pgrep -f` e `pkill -f` acham o próprio comando. Espere pelo log (`until grep -q FILA_FIM log`).
12. **Snapshot do HyperFrames** sempre acrescenta o último quadro. `gerar_raizes.py` reescreve `index.html`. O `.hyperframes/` já está no `.gitignore` da raiz.
13. **Proxy:** o Playwright usa `proxy: {server: HTTPS_PROXY, bypass: "localhost,127.0.0.1"}` e `ignoreHTTPSErrors` (sem isso, localhost dá 405).
14. **Filme completo:** para caber em menos de 100 MB, use duas passadas com `KBPS ≈ 95·8000/duração − 128`. Para 7 min foram 1550 kbps e 88,9 MB. Para 10 min ou mais, use `-tune animation` e avise se a qualidade cair.
15. **Limites da sessão:** 2 h por tarefa em segundo plano (filas fecham com `fim`). Se o usuário atingir o limite de uso, a fila morre: confira o log e o `git log` e retome do ponto em que parou.

---

## 10. Vídeo 3 — "E se você soubesse o dia da sua morte?"

### 10.1 Pedido do usuário (mensagem 1, ainda sem a mensagem 2)

- **Áudios:** 26 áudios **V3P01 a V3P26**. Cada par forma uma parte: V3P01+V3P02 = parte 1 … V3P25+V3P26 = parte 13. Se algum nome estiver errado, transcrever com Whisper e ordenar pela história.
- **Ainda NÃO renderizar:** esperar a segunda mensagem.
- **Personagens** (mesmo boneco-base):

| Personagem | Como é |
|---|---|
| Você | Moletom escuro, **cordões vermelhos** |
| Mãe | Variante `mae` |
| Pai | Variante `pai` |
| Lucas | Melhor amigo, **boné** |
| Júlia | **Cabelo comprido** |

- **Cenas por parte:**
  1. Quarto às **3:33**, celular vibrando; e-mail "**Você tem 7 dias**"; celulares acendendo em várias casas e cidades.
  2. Cozinha de manhã, a mãe mostrando o celular ("**38 anos**"); grupo da escola com números; Lucas: "**3 dias kkkkk**".
  3. Jornal na TV ("**ataque hacker?**"), mapa do mundo com e-mails chegando; videogame com o Lucas; lanche.
  4. Sala de aula; Lucas olhando o relógio; e-mail com "**14:07**" em letras pequenas; mensagem "**valeu por tudo, mano**". Às 14:07 ele encosta a cabeça na carteira. **Sem violência, sem mostrar nada além disso.**
  5. Ambulância lá fora (**só as luzes**); jornal à noite; o seu e-mail com "**3:33**" embaixo de "7 dias".
  6. Mundo em caos: filas em aeroporto e igreja, perfis com datas; jantar com a mãe segurando a mão e o pai chorando.
  7. Quarto trancado, relógio, contas na tela (**72 h, 4.320 min**); 3:33, novo e-mail "**Faltam 3 dias**".
  8. Folha do caderno com a lista (**ver o mar, Júlia, pai, mãe**); dobra e guarda no bolso; desliga o celular.
  9. Ônibus para a praia, primeira vez vendo o mar, entra de roupa; porta da Júlia, ela mostra "**52 anos**" e abraça.
  10. Garagem com o pai consertando o carro velho; telas com o boato "**a data mudou**"; caixa de entrada sem abrir.
  11. Café da manhã com a mãe; família dormindo no sofá com a TV sem som; relógio da parede 3:30, 3:31, 3:32, **3:33**.
  12. Celular vibra; e-mail "**Data atualizada**"; tela: "**A partir de agora, você não vai mais saber.**"; ele chorando em silêncio.
  13. Epílogo: a folha no bolso sendo riscada e reescrita; pergunta para os comentários; cartão "NINGUÉM SABE"; última imagem: celular vibrando às 3:33.

### 10.2 Estado (08/11/2026): produzido; renders na fila

O pedido da mensagem 2 (ver `REGRAS.md`, que vale para todos os próximos vídeos) foi feito inteiro. Tudo está em `videos/ninguem-sabe/v3/` e foi enviado nesta branch:

- **Áudios.** Foram transcritos com Whisper e ordenados pela história: 26 trechos, 2 por parte, 13 partes. Os detalhes estão em `ORDEM.md`. Os dois CTAs estavam com os nomes trocados: `cta1.mp3` agora é "se inscreve no Ninguém Sabe" e `cta2.mp3` é "a história completa já está no canal".
- **Cenas p01–p13** (`cenas/pNN.js`, que viram `compositions/parteNN.html` com `tools/nova_parte.py`):
  - todas com colisões sem nada acima de 2 cm;
  - todas com prévia 720p (`previas/pNN/folha.jpg`) e YAVG ≥ 70 em todos os quadros.
  - Motor: `mundo4.js` (sala, escola, garagem, praia, casa da Júlia, aeroporto, igreja, cidade à noite), `telas3.js` (telas, TV e a folha do caderno) e `v3.js` (apoio comum).
- **Som.** `tools/sons.py` é a biblioteca e `tools/audio.py` tem as pistas do v3 (149 efeitos). O gancho dura 7,0 s (parte 4, o Lucas às 14:07), seguido de 0,7 s de preto com um grave. O completo tem 602,9 s (18087 quadros).
- **Cortes** (partes 1, 2, 4, 5, 7 e 10):
  - capas em `capa/corteN-capa.png`, feitas por `tools/gerar_capas.py`, que gera `partecapacorteN` + snapshot;
  - legendas em `compositions/legendas-corteN.html`;
  - CTA1 em `compositions/cta-inscreva.html`: a cena para em ~70% com o botão INSCREVA-SE e o sininho;
  - cartão final em `compositions/cartao-final.html`;
  - prévias verticais 720p em `previas/corteN/folha.jpg`.
- **Capa do longo:** `capa/capa-v3.png` (1280x720).
- **Renders prontos e enviados:** partes 01–10.
- **Na fila (`$S/fila-v3c.txt`):** 11, 12, 13, 01 de novo (o e-mail desalinhado da manhã e o título agora em vermelho), corte1–corte6.
  - Depois da fila: `tools/montar_completo.sh` → `renders/v3-completo.mp4` (~95 MB).
  - Por último: conferir com ffprobe e fechar o `REVIEW.md` (durações e planos mais fracos).
- **Se a fila morrer** (o limite é 2 h por tarefa em segundo plano), crie um arquivo de fila novo só com as linhas que faltam e rode:

```bash
cd videos/ninguem-sabe/v3 && TMPDIR=$S/rv3 RODAPE=$'Co-Authored-By: ...\nClaude-Session: ...' tools/rodar_fila.sh $S/fila-nova.txt $S/fila-nova.log
```

  - O servidor das prévias precisa estar rodando: `nohup python3 -m http.server 8766` dentro de `v3/`.
  - O venv do áudio fica em `$S/audio-venv` (numpy, scipy, soundfile).
