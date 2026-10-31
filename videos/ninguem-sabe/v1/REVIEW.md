# REVIEW · Vídeo 1 · "E se você acordasse e TODO MUNDO tivesse sumido?"

## Arquivos gerados

Tudo em `videos/ninguem-sabe/v1/`. Os MP4 estão em `renders/` (a pasta fica no `.gitignore` para os renders de teste; os finais entram com `git add -f`).

| Arquivo | Formato | Duração |
|---|---|---|
| `renders/v1-parte01.mp4` | 1920x1080, 30 fps | 40,9 s |
| `renders/v1-parte02.mp4` | 1920x1080, 30 fps | 39,0 s |
| `renders/v1-parte03.mp4` | 1920x1080, 30 fps | 38,0 s |
| `renders/v1-parte04.mp4` | 1920x1080, 30 fps | 38,8 s |
| `renders/v1-parte05.mp4` | 1920x1080, 30 fps | 40,7 s |
| `renders/v1-parte06.mp4` | 1920x1080, 30 fps | 28,5 s |
| `renders/v1-parte07.mp4` | 1920x1080, 30 fps | 26,5 s |
| `renders/v1-parte08.mp4` | 1920x1080, 30 fps | 19,2 s |
| `renders/v1-parte09.mp4` | 1920x1080, 30 fps | 39,4 s |
| `renders/v1-parte10.mp4` | 1920x1080, 30 fps | 36,3 s |
| `renders/v1-parte11.mp4` | 1920x1080, 30 fps | 16,1 s |
| `renders/v1-completo.mp4` | 1920x1080, 30 fps | 6 min 3,6 s |
| `renders/v1-corte1.mp4` | 1080x1920, 30 fps (partes 01+02 + cartão "Parte 2 amanhã") | 1 min 23,9 s |
| `renders/v1-corte2.mp4` | 1080x1920, 30 fps (partes 03+04 + cartão "Parte 3 amanhã") | 1 min 20,9 s |
| `renders/v1-corte3.mp4` | 1080x1920, 30 fps (partes 05+06 + cartão "Parte 4 amanhã") | 1 min 13,3 s |
| `renders/v1-corte4.mp4` | 1080x1920, 30 fps (partes 07+08 + cartão "O final só no YouTube") | 49,7 s |
| `capa/capa-v1.png` | 1280x720 | — |

O final (partes 09 e 10) e o encerramento (11) ficam só no vídeo completo do YouTube.

## Decisões de criação
- Um mundo e um boneco para tudo: os cenários estão em `assets/js/mundo.js` e `mundo2.js`, o personagem em `personagem.js`, e o motor de cena comum em `assets/js/cena.js`. A mulher, a mãe e o pai usam o mesmo boneco-base com cabelo e roupa diferentes. A mulher tem casaco cinza e cachecol vermelho.
- Uma cena Three.js por parte, com os planos como trocas de câmera e de cenário dentro dela. O Chrome aceita uns 16 contextos WebGL por página.
- Os cortes caem nas pausas reais da voz. Os tempos por palavra vêm do Whisper, encaixados nos trechos de fala medidos no áudio, e cada plano está amarrado à palavra que o dispara.
- O vermelho fica nos objetos que contam a história: relógio, 03:33, a frase na parede, o "20" da escada, o carro do shopping, o farol da torre, o cachecol da mulher.
- Os títulos DIA 3, DIA 5, DIA 7 e NOITE 10 usam o mesmo cartão branco com barra vermelha.
- Para o mundo paralelo há um pós-efeito: onda leve, separação de cor e tom azulado. Ele fica fraco o tempo todo no apartamento (partes 07 a 09). Fica forte em "passou para o outro lado" e em "preso no mundo paralelo". Em "está entre os dois lados" ele pisca entre o normal e o azul.
- A contagem da parte 09 entra no instante da fala: 2:50 no relógio do apartamento, depois 3:20, 3:30, 3:32 e 3:33 no relógio do quarto. Em 3:33 a imagem distorce e o quadro apaga.
- Na parte 10, a família aparece só de longe e de costas. A mensagem chega do "Meu número" às 03:33, com a frase em vermelho na tela.
- Cortes verticais: são as mesmas cenas renderizadas de novo em 1080x1920, não o 16:9 com fundo desfocado. O campo da câmera abre até a largura mostrar o miolo quadrado do quadro 16:9. O plano da frase na parede ganhou um enquadramento vertical próprio. As legendas são as mesmas, em letra grande no centro. Nos 4 s finais entra o cartão "Parte X amanhã" + "História completa no YouTube: NINGUÉM SABE". Não existe `cta.mp3` no repositório, então o cartão fica com a cauda da trilha ambiente.

## Áudio (tudo por código, sem MusicGen e sem IA)
- `tools/audio.py` (numpy/scipy). A trilha soma um drone grave (55/82/110 Hz), um pad filtrado e vento em ruído de banda com rajadas, com intensidade por parte. Nas partes 07 e 08 entra um tom fino com tremolo. A trilha da parte 01 foi refeita do mesmo jeito.
- Efeitos sintetizados: tique-taque, coração, vibração do celular, despertador e notificação. Também foram feitos chamada e linha caindo, batidas na porta, baque, estalos da lâmpada e carro passando. Todos entraram.
- Na mixagem, a trilha baixa sob a voz (ducking). As faixas de `assets/audio/mix/` medem −15,5 a −15,9 LUFS, com pico de −1,5 dBTP. A cauda do cartão dos cortes ficou em −34,8 LUFS.
- O `v1-completo.mp4` usa a faixa contínua do filme e mede −15,7 LUFS, com pico de −1,3 dBTP.
- Nos MP4 que o HyperFrames renderiza (partes e cortes), o áudio sai normalizado e limitado pelo próprio render: −12 a −13 LUFS, com pico de −1,2 dBTP. Para Reels e Shorts isso está na faixa usual. Se quiser os cortes no mesmo volume do filme, dá para trocar o áudio deles pela faixa `corteN.flac` com ffmpeg, sem renderizar de novo.

## O que foi medido e o que foi só olhado
- O som foi medido, não ouvido: volume, pico e posição de cada efeito em relação à palavra. Nenhum efeito foi escutado por alguém. Se algum soar artificial, ele sai em `tools/audio.py` (lista `por(...)`).
- Conferi quadros de cada parte em snapshots, de 4 a 14 por parte, nos planos que mudam. Na vertical, conferi folhas dos 4 cortes antes do render.
- Cada MP4 foi conferido no ffprobe: resolução, 30 fps e número de quadros igual ao da parte. A parte 02 saiu com um quadro a mais (1170 em vez de 1169), e o vídeo completo corta cada parte no quadro exato: são 10.908 quadros, a soma das 11 partes, em 64,7 MB.
- O `hyperframes check` completo (com amostragem de layout) não rodou em todas as partes, porque leva mais de 10 min por parte com o WebGL em software. Rodei no corte 1 e na parte 01 vertical, e os dois erros que ele achou foram corrigidos.

## Planos mais fracos
- Parte 06, escada: escura demais. O personagem se lê pela lanterna e pelo "20" vermelho, mas não muito bem.
- Parte 09, "pega o primeiro carro": ele chega correndo no carro parado e os faróis acendem em "ignição". Não tem animação de entrar no carro: o plano seguinte já é o carro de cima, na avenida.
- Parte 10: a cozinha de manhã ficou menos clara do que eu queria. O bairro e o quarto estão claros.
- Na vertical, as legendas no centro cobrem parte do relógio e da tela do celular em alguns closes. Alguns planos por cima do ombro perdem a borda do quadro.

## Avisos mantidos de propósito
- `composition_file_too_large` (parte01.html): a parte 01 tem o motor antigo embutido, um contexto WebGL por parte.
- `timeline_track_too_dense` (legendas): as legendas de cada parte ficam num host só, na trilha de legendas.
- `GPU stall due to ReadPixels`: aviso do driver de software durante a captura, não muda o resultado.
- `container_overflow` em cortes verticais antigos: resolvido. A raiz da cena agora assume 1080x1920 no host vertical.
