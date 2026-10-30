# REVIEW · Vídeo 1 · Parte 01

## Decisões de criação
- Uma cena Three.js por parte (`compositions/parte01.html`), com os 14 planos como trocas de câmera e de cenário dentro dela. O motivo é o limite de cerca de 16 contextos WebGL por página do Chrome: com 11 partes, um contexto por plano estouraria esse limite.
- Mundo e personagem são módulos compartilhados (`assets/js/mundo.js`, `assets/js/personagem.js`): o boneco é o mesmo objeto em todas as partes.
- Os cortes caem nas pausas reais da voz. Os tempos por palavra vêm do Whisper medium (pt), encaixados nos trechos de fala medidos no áudio. O Whisper sozinho errava até 0,5 s nas bordas das frases.
- O vermelho só aparece em objetos que contam algo: 7:12 no relógio, porta da casa, tigela do cachorro, 03:33, semáforos, pisca-alerta e farol da torre.
- A única luz quente é a janela acesa da torre, que fica visível no fim da avenida (35,5 a 37 s).
- "Nada." virou um plano do ponto de vista dele: o corredor vazio até a porta da mãe. "Descobre" e "sumiu" viraram um plano contínuo que sobe até ver o boneco sozinho de cima.
- Legenda palavra por palavra: o grupo aparece no lugar e cada palavra surge quando é falada. "7 e 12" e "3 e 33" aparecem como 7:12 e 3:33, iguais ao relógio e ao post.

## O que foi medido e o que foi só olhado
- `hyperframes check`: ok, sem erros. Os avisos estão listados abaixo.
- Quadros conferidos em 0.6, 2.5, 5.5, 8.0, 10.5, 11.5, 13.3, 15.3, 16.6, 17.6, 19, 21, 24, 27.8, 30.5, 33, 35.5, 37.2, 38.4 e 40.6 s, mais a folha de revisão e a versão em largura de celular (as legendas se leem a 360 px).
- Narração tratada: -16,6 LUFS com pico de -1,8 dBTP. Trilha: -16,7 LUFS, tocando a 0,13 de volume (cerca de 18 dB abaixo da voz).
- O som foi medido, não ouvido. A trilha do MusicGen tem volume estável e quase nenhum pico (é um fundo ambiente, sem bateria), mas ninguém a escutou ainda.

## Plano mais fraco
- "Nenhum vizinho" (14,5 a 16,15 s): casas apagadas do outro lado da rua, mas a composição é plana. Com mais tempo, enquadraria uma casa com a porta aberta e o carro na garagem.
- O plano de cima no fim é escuro. O boneco aparece (cabeça clara), mas pequeno de propósito, para passar a ideia de "sozinho".

## Avisos mantidos de propósito
- `composition_file_too_large` (parte01.html): é preciso um contexto WebGL por parte, então a cena fica num arquivo só.
- `timeline_track_too_dense` (legendas): a regra da skill pede todas as legendas num host só, na trilha de legendas.
- `GPU stall due to ReadPixels`: aviso do driver de software durante a captura, não muda o resultado.
