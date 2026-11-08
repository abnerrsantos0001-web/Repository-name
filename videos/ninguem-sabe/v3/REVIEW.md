# REVIEW · Vídeo 3 · "E se você soubesse o dia da sua morte?"

## Arquivos

Tudo fica em `videos/ninguem-sabe/v3/`. Os MP4 estão em `renders/`. A pasta está no `.gitignore` por causa dos renders de teste, e os finais entram com `git add -f`.

| Arquivo | Formato | Duração |
|---|---|---|
| `renders/v3-parte01.mp4` | 1920x1080, 30 fps | 44,6 s |
| `renders/v3-parte02.mp4` | 1920x1080, 30 fps | 45,7 s |
| `renders/v3-parte03.mp4` | 1920x1080, 30 fps | 43,8 s |
| `renders/v3-parte04.mp4` | 1920x1080, 30 fps | 51,5 s |
| `renders/v3-parte05.mp4` | 1920x1080, 30 fps | 44,8 s |
| `renders/v3-parte06.mp4` | 1920x1080, 30 fps | 44,1 s |
| `renders/v3-parte07.mp4` | 1920x1080, 30 fps | 42,4 s |
| `renders/v3-parte08.mp4` | 1920x1080, 30 fps | 44,9 s |
| `renders/v3-parte09.mp4` | 1920x1080, 30 fps | 46,0 s |
| `renders/v3-parte10.mp4` | 1920x1080, 30 fps | 42,5 s |
| `renders/v3-parte11.mp4` | 1920x1080, 30 fps | 44,9 s |
| `renders/v3-parte12.mp4` | 1920x1080, 30 fps | 47,5 s |
| `renders/v3-parte13.mp4` | 1920x1080, 30 fps | 52,6 s |
| `renders/v3-completo.mp4` | 1920x1080, 30 fps: gancho (7,0 s) + preto com grave (0,7 s) + as 13 partes; 92 MB | 10 min 2,9 s |
| `renders/v3-corte1.mp4` | 1080x1920, parte 01, capa "VOCÊ TEM 7 DIAS" | 46,9 s |
| `renders/v3-corte2.mp4` | 1080x1920, parte 02, capa "ELE TINHA 3 DIAS" | 50,3 s |
| `renders/v3-corte3.mp4` | 1080x1920, parte 04, capa "14:07" | 56,1 s |
| `renders/v3-corte4.mp4` | 1080x1920, parte 05, capa "O MEU TAMBÉM TEM HORA" | 49,4 s |
| `renders/v3-corte5.mp4` | 1080x1920, parte 07, capa "4.320 MINUTOS" (1 quadro a mais no fim, sobre o cartão final, por arredondamento) | 47,0 s |
| `renders/v3-corte6.mp4` | 1080x1920, parte 10, capa "A DATA MUDOU?" | 47,1 s |
| `capa/capa-v3.png` | 1280x720, "VOCÊ TEM 7 DIAS" sobre o celular e o despertador às 3:33 | — |
| `capa/corte1-capa.png` … `corte6-capa.png` | 1080x1920, o quadro de capa de cada corte | — |

O final (partes 11, 12 e 13) fica só no vídeo completo do YouTube. Todos os arquivos foram conferidos com ffprobe: resolução e número de quadros batem com `assets/audio/mix/partes.json`.

## Áudios
- **Transcrição:** os 26 trechos foram transcritos com Whisper e ordenados pela história do HANDOFF. Ficaram 2 trechos por parte, 13 partes. Não faltou nem sobrou nenhum. Os detalhes estão em `ORDEM.md`.
- **CTAs trocados:** os dois áudios de CTA estavam com os nomes trocados em relação à regra, e foram renomeados:
  - `cta1.mp3` = "se inscreve no Ninguém Sabe" (o trecho usado tem 2,2 s);
  - `cta2.mp3` = "a história completa já está no canal" (2,7 s).

## As regras (REGRAS.md), uma por uma
1. **Gancho.** O completo abre com 7,0 s da parte 4, no instante em que o Lucas encosta a cabeça às 14:07. Depois vem um corte seco para o preto, com um grave, e só então começa a parte 1.
2. **Legendas.**
   - No 16:9 ficam no terço de baixo. Nos verticais ficam entre 65% e 70% da altura (uma frase de duas linhas começa um pouco mais alto).
   - Os letreiros vermelhos ficam no alto.
   - Cada enquadramento foi conferido na prévia para a legenda não cobrir rosto, celular nem relógio. Nos planos de ponto de vista do celular, no máximo a borda de baixo do aparelho encosta na faixa da legenda.
3. **Luz.** Tudo está ~30% mais claro que no vídeo 1.
   - Cada quadro das prévias tem luminância média (YAVG) ≥ 70 (de 72 a 160).
   - Planos noturnos abertos, onde a luz da câmera não chega, ganharam exposição própria.
4. **1080p real e nada atravessando nada.**
   - Cada parte passou por `tools/colisoes.mjs`, sem nenhuma sobreposição acima de 2 cm.
   - Antes de cada render houve uma prévia 720p (`previas/pNN/folha.jpg` e `previas/corteN/folha.jpg`).
5. **Som e textos.**
   - Todo o som é feito por código: `tools/sons.py` e `tools/audio.py`, com 149 efeitos presos às palavras, trilha e uma camada de esperança.
   - Os textos na tela são vermelhos e entram na hora da fala, inclusive o cartão "NINGUÉM SABE" da parte 13.
6. **Cortes de 45 a 60 s, terminando no suspense.**
   - São as partes 1, 2, 4, 5, 7 e 10.
   - Cada um abre com 0,8 s de capa (texto vermelho), salva também em `capa/corteN-capa.png`.
7. **CTA1 perto de 70% de cada corte** (entre 67,5% e 71,5%).
   - A cena para e toca o áudio "se inscreve no Ninguém Sabe".
   - Na tela aparece o botão vermelho INSCREVA-SE com o sininho balançando. Um dedo toca o botão e ele vira INSCRITO.
   - Dura 2,6 s, com a música abaixada.
8. **Cartão final dos cortes (4 s).**
   - Mostra "A HISTÓRIA COMPLETA JÁ ESTÁ NO CANAL", "Toque no link aqui embaixo" e uma seta vermelha animada.
   - O áudio é o CTA2, sobre o último quadro congelado.
9. **Saídas.**
   - `v3-parteNN.mp4`, `v3-completo.mp4` (10 min 2,9 s), `v3-corteN.mp4` e `capa-v3.png`.
   - O completo passa de 10 min sem esticar a voz. O tempo extra vem das aberturas de cada parte (com os letreiros "DIA N") e do final.
10. **Commits.** Cada arquivo foi para o GitHub assim que ficou pronto.

## A história em cena
- **Parte 1.** A rua dormindo, o título e 3:33 no quarto. O celular vibra no criado-mudo e ele nem acorda. As janelas da cidade acendem, uma a uma ("em todos os celulares do planeta"). Aparece "Você tem 7 dias". De manhã ele lê e ri.
- **Parte 2.** A mãe rindo na cozinha com os "38 anos" e o grupo da escola. O Lucas manda "3 dias kkkkk".
- **Parte 3.** O jornal fala em "ataque hacker" e mostra o mapa do mundo. Depois, videogame e lanche com o Lucas.
- **Parte 4.** A sala de aula e o relógio. O Lucas mostra o horário escondido no e-mail, 14:07. Às 14:05 chega "valeu por tudo, mano". Às 14:07 ele encosta a cabeça na carteira e não levanta. Não há violência: é só isso.
- **Parte 5.** As sirenes aparecem só como luzes na janela. À noite, o jornal. Ele abre o próprio e-mail e vê 3:33 embaixo dos 7 dias.
- **Parte 6.** Aeroportos e igrejas lotados e as datas nos perfis. No jantar, a mãe segura a mão dele e o pai chora.
- **Parte 7.** Ele se tranca no quarto e faz a conta: 72 h, 4.320 min. Às 3:33 chega "Faltam 3 dias".
- **Parte 8.** A lista no caderno: o mar, a Júlia, o pai, a mãe. Ele dobra a folha, guarda no bolso e desliga o celular.
- **Parte 9.** O mar pela primeira vez e a porta da Júlia. Ela tem 52 anos, e eles se abraçam.
- **Parte 10.** A garagem com o pai e o carro que nunca anda. Começa o boato "a data mudou?", e ele decide não abrir a caixa de entrada.
- **Parte 11.** O café com a mãe e a família dormindo no sofá. O relógio passa de 3:30 a 3:33.
- **Parte 12.** O celular vibra no bolso com "Data atualizada": "A partir de agora, você não vai mais saber." Ele chora em silêncio.
- **Parte 13.** "MESES DEPOIS".
  - A cidade.
  - Na praia, uma mulher recebe uma data nova ("Você tem 41 anos.") e um homem fica com a caixa vazia. Há gente olhando o mar.
  - Ele tira a folha do bolso, risca "Aprender a nadar" e escreve "Ver a neve" em vermelho.
  - Vira na cadeira para a câmera e faz a pergunta dos comentários.
  - "INSCREVA-SE", e de novo 3:33 no criado-mudo.
  - O cartão NINGUÉM SABE. A última imagem é a tela acesa, vibrando: "1 mensagem nova".

## Os planos mais fracos
1. **Parte 6, filas do aeroporto e da igreja.** Os figurantes são pequenos, parados e pouco variados, e o plano lê como maquete. A agitação vem quase só do som.
2. **Parte 6, perfis com as datas ("E, …").** O celular fica pequeno no meio do chão, e as datas não dão para ler. Além disso, o letreiro "50 ANOS" encosta na placa "PAPELARIA".
3. **Parte 5, "gente gritando" na sala de aula.** Os alunos estão amontoados e quase parados, e a correria fica por conta do som e das luzes da sirene.
4. **Parte 10, a garagem de madrugada.** Em dois planos, o capô aberto ocupa uma faixa grande em primeiro plano. A composição fica pesada.
5. **Parte 13, "Toda semana" (por cima do ombro, na escrivaninha).** A cabeça dele cobre metade da folha. No close seguinte, a mão cobre a linha no instante em que ela é riscada, e o risco só aparece inteiro depois.
6. **Parte 13, as telas dos celulares na praia.** O aparelho fica inclinado e há pernas de figurantes ao fundo. "Você tem 41 anos." e "Nenhum e-mail novo" dão para ler, mas sem folga.
7. **Parte 9, o abraço na porta da Júlia.** Os braços do boneco low-poly se cruzam de um jeito duro. O plano funciona pela expressão, não pelo gesto.
8. **Parte 12, os pontos de vista do celular ("Data atualizada", o e-mail).** A borda de baixo do aparelho encosta na faixa da legenda. O texto da tela fica livre.
9. **Corte 1, o zoom no celular (~26 s).** No vertical, o "3:33" da tela fica cortado em cima durante a aproximação.
