# ESTILO · canal "E Agora?"

Vale para todos os vídeos do canal. É um canal separado do Ninguém Sabe: não usa o motor 3D nem o boneco cinza de lá.
Em cada história, o vídeo para no momento mais tenso, e o público decide o final nos comentários (A ou B). A opção mais votada vira a parte 2.

## Identidade
- **2D cartoon, não 3D.**
  - Contorno preto grosso e cores chapadas.
  - Personagens recortados e animados por partes: cabeça, tronco, braços, pernas, boca e piscar.
  - Cenários em camadas com parallax.
  - Tudo desenhado por código (SVG/Canvas) dentro do HyperFrames: sem imagens geradas e sem banco de imagens.
- **Cores fixas:**

  | Uso | Cor |
  |---|---|
  | Fundo, noite | roxo-noite `#2B1B4A` |
  | Zumbis e perigo | verde-tóxico `#7CFF4F` |
  | Opções A e B, capas, letreiros | amarelo `#FFD23F` |
  | Contorno | preto `#0B0B0C` |

- **Protagonista fixo:** rapaz de jaqueta amarela, mochila e curativo no braço. Aparece em todos os vídeos e em todas as capas.
- **Zumbis:**
  - pele verde-acinzentada e roupas rasgadas;
  - sem sangue e sem violência explícita: as mordidas acontecem fora de cena, ou cobertas por um corte ou por um objeto na frente.
- **Legendas** no terço de baixo, com contorno preto. Nos verticais, entre 65% e 70% da altura. Nunca cobrem rosto, mão com objeto, celular ou placa.
- **Som feito por código** (numpy/scipy), como no Ninguém Sabe: trilha, ambiente e efeitos presos às palavras, mixagem em −15 LUFS.

## Como o desenho é feito (regras técnicas)
- **Rig por parâmetros.** Cada personagem é um conjunto de valores no tempo: posição, escala, giro, ângulo de cada braço e perna, estado do olho e da boca. As mudanças de humor são estados com tempo (`[[t0,"normal"],[t1,"assustado"]]`), e o rig passa de um para o outro com uma transição.
- **Vida:**
  - os personagens respiram e piscam;
  - a cabeça vai na frente e os braços vêm depois;
  - nunca mexe os dois braços, os dois olhos ou uma multidão ao mesmo tempo e do mesmo jeito.
- **Traço vivo:** o contorno é redesenhado ~12 vezes por segundo com um tremor de semente `Math.floor(t * 12)`, o mesmo em todo render.
- **Pés no chão, objetos na mão, olhos no que olham.** Nada atravessa nada.
- **Determinístico:** sem `Math.random()` sem semente e sem `Date.now()`. Tudo é função do tempo da timeline.
- **Planos:** 1920x1080 a 30 fps, e cortes verticais 1080x1920 reenquadrados da mesma cena.

## O que vem do Ninguém Sabe (REGRAS.md, no que couber)
- Gancho de 5 a 7 s no começo do completo, com corte seco, grave e a parte 1 em seguida.
- 1080p real, prévia em 720p antes de cada render e nada atravessando objetos.
- Cortes de 40 a 60 s, terminando no suspense, cada um com uma capa de 0,8 s. As capas aqui são em amarelo.
- Botão INSCREVA-SE animado perto de 70% de cada corte e cartão final de 4 s com seta.
- Commit e push de cada arquivo assim que fica pronto. No fim, a lista com as durações e os planos mais fracos.

## Diferenças do Ninguém Sabe
- Texto de capa e letreiros em **amarelo**, não em vermelho.
- O final é sempre uma **escolha A ou B**: a tela congela com dois cartões grandes e o texto "COMENTA A OU B".
- O cartão final dos cortes diz "O FINAL QUEM DECIDE É VOCÊ" + "Vídeo completo no link aqui embaixo", com seta.
