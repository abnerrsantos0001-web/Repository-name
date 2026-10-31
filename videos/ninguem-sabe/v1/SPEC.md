# SPEC · Ninguém Sabe · Vídeo 1

"E se você acordasse e TODO MUNDO tivesse sumido?" Narração em 11 partes (`assets/audio/v1-parte01..11.mp3`, 6 min 3 s no total). Cada parte vira um trecho de até 1 minuto (`compositions/parteNN.html`); o filme inteiro, os 4 cortes verticais e a capa saem das mesmas cenas. A tabela SHOTS abaixo é a da parte 01; os planos das outras partes estão comentados no próprio arquivo de cada uma, linha a linha com a fala.

```text
GOAL:    o espectador sente o silêncio de um mundo vazio e fica para saber por que só ele sobrou
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps
TIME:    parte 01 = 40.93 s x 30 = 1228 quadros (o vídeo inteiro ≈ 363.6 s)
LOOK:    3D low-poly, sombreamento chapado (flatShading), sem texturas.
         Chão/névoa: quarto #0c0d0f, bairro #50545a, cidade #4c5056. Prédios #222428–#393b40.
         Tinta: cinzas e preto. Acento: vermelho #c4161c / #e01b22, só em detalhes que contam a história:
         dígitos do relógio 7:12, porta da casa dele, tigela do cachorro, bandeira da caixa de correio,
         semáforo travado no vermelho, pisca-alerta, farol da torre, horário 03:33 do último post.
         Única luz quente: a janela acesa da torre (#efe2c4), que fura a névoa.
         Legendas: Montserrat 800, 76 px, caixa alta, #f4f2ee, sombra preta; impacto em #e3262d.
         Vinheta radial 60 % nas bordas; névoa linear por cenário.
OBJECTS: personagem = cabeça icosaédrica clara (#cfcbc4), olhos pretos, boca que abre no grito,
         moletom #1b1c20 com capuz caído, bolso e cordões, calça #2c2e34, tênis pretos
         (assets/js/personagem.js, o mesmo em todas as partes);
         quarto com cama, criado-mudo, relógio digital de 7 segmentos, celular com tela desenhada;
         casa de dois andares com a porta vermelho-escura, casinha de cachorro com corrente e coleira vazia;
         centro com carros e ônibus largados, portas abertas, semáforos no vermelho, postes apagados,
         papéis no chão e a torre no fim da avenida com uma janela acesa.
MOTION:  câmera com curvas suave/ambos (smoothstep, cúbica in-out); grua final entra/sai;
         palavras da legenda: blur 6→0 e opacidade em 0.13 s (impacto: escala 1.18→1 em 0.22 s, expo.out);
         grupo sai em 0.12 s. Tremor de mão 0.002–0.005 rad, maior no grito.
         Personagem: cabeça antes do corpo, piscadas nas viradas, respiração, passo sem escorregar.
SHOTS:   cortes nas pausas reais da voz (transcricao/v1-parte01.json)
         0.00  acorda    de cima, na cama; olhos abrem em "acorda"
         1.40  relogio   close no relógio 7:12
         3.70  senta     ele senta e olha o relógio
         6.30  rosto     close; vira para a janela e aperta os olhos em "errada"
         9.00  janela    (escurece) casa escura de fora; ele na janela de cima; zoom lento 27→17°
         10.70 rua       rua do bairro, carros largados
         12.20 casinha   casinha vazia, corrente, coleira, tigela vermelha
         14.50 vizinhos  casas da frente, todas apagadas
         16.15 pega      (escurece) sentado na beirada, pega o celular
         18.05 tela      ponto de vista: Mensagens vazio → Notificações vazio (desliza em 19.9)
         22.05 feed      "Recentes": puxa para atualizar, "Nenhuma publicação nova",
                         câmera chega no 03:33 vermelho, sublinhado em "3h33"
         29.40 grito     do corredor escuro: ele grita na porta, mãos em concha
         32.40 nada      ponto de vista: corredor vazio até a porta da mãe
         33.70 avenida   (escurece) atrás dele andando na avenida vazia, torre com a janela acesa
                         no fundo; ele para em "descobre"; a câmera sobe e termina de cima, ele sozinho
SOUND:   tudo gerado por código (tools/audio.py, numpy/scipy), sem música de terceiros nem IA:
         trilha = drone grave (55/82/110 Hz) + pad filtrado + vento (ruído em banda 220–900 Hz com rajadas),
         intensidade por parte; nas partes 07–08 um tom fino (880 Hz) com tremolo para o "outro lado".
         Efeitos sintetizados nos momentos-chave: chamada caindo (02), tique-taque e baque (04),
         estalos da lâmpada e coração (05), coração e 3 batidas na porta (06), tique-taque e coração
         acelerando (09), despertador, carro passando, vibração e notificação (10).
         Mix: voz + trilha com ducking + efeitos, normalizado a −15 LUFS (pico −1,5 dBTP), fatiado no
         grid de 30 fps por parte (assets/audio/mix/), mais a faixa contínua do filme e a de cada corte.
BANNED:  vazio escuro com coisas pequenas flutuando; brilho/bloom/partículas; degradês roxos;
         títulos que deslizam; tudo entrando com fade + subida; logo no canto;
         vermelho como decoração (só em objeto que conta algo); câmera dentro da cabeça do personagem;
         partes do corpo atravessando o cobertor.
QA:      0.6 olhos abrindo · 2.5 relógio legível · 8.0 rosto inteiro no quadro · 10.5 ele visível na janela ·
         13.3 tigela vermelha e coleira · 19.0/21.0 tela inteira, sem a mão na frente ·
         27.8 03:33 vermelho sublinhado · 30.5 boca aberta e mãos · 35.5 janela acesa visível ·
         40.6 ele visível de cima, sozinho
```

## Como tudo é montado

- `tools/alinhar_parte.py NN` gera os tempos por palavra da parte (Whisper + pausas reais do áudio);
  `tools/gerar_tempos.py` exporta para `assets/js/tempos/v1-parteNN.js`.
- `tools/gerar_legendas.py NN [--vertical]` gera `compositions/legendas-pNN.html` (16:9) e `legendas-pNN-v.html`
  (9:16, letras grandes no centro) a partir dos grupos escritos em `PARTES`.
- `tools/audio.py` gera trilha, efeitos e mixagens (`assets/audio/mix/`, com `partes.json`: duração e quadros de cada parte).
- Cada cena `compositions/parteNN.html` (02–11) é o esqueleto de `tools/nova_parte.py` com o roteiro de planos,
  câmeras e poses; o motor comum é `assets/js/cena.js` (cenários de `mundo.js`/`mundo2.js`, personagem de `personagem.js`).
  A parte 01 tem o motor antigo embutido, com o mesmo resultado, e também aceita o formato vertical.
- `tools/gerar_raizes.py NN|todas|corteN|capa` escreve o `index.html` (uma parte, o filme, um corte ou a capa);
  `tools/renderizar.sh` renderiza a partir de uma cópia do projeto; `tools/fila.sh` enfileira os renders.
- Vertical (cortes): a mesma cena com o host em 1080x1920; o campo da câmera abre até a largura mostrar o miolo
  quadrado do quadro 16:9 (`fovVertical` em cena.js), e um plano pode ter enquadramento próprio (`v`).
- `tools/montar_completo.sh` junta as 11 partes (vídeo cortado no quadro exato) com a faixa contínua do filme.
