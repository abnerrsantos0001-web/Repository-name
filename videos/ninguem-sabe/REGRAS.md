# REGRAS — canal "Ninguém Sabe" (valem para todos os próximos vídeos)

Definidas pelo usuário em 07/11/2026. **Estas regras têm prioridade** sobre a seção "REGRAS FIXAS DO CANAL" do
`videos/prompt-mestre/PROMPT-MESTRE.md`, sobre o resumo no `CLAUDE.md` da raiz e sobre o jeito dos vídeos 1 e 2.
Onde elas não dizem nada, vale o PROMPT-MESTRE e o `HANDOFF.md`.

"vX" é o número do vídeo. Os exemplos entre parênteses são os valores do vídeo 3.

## Áudios de entrada

- O usuário sobe os áudios pela `main`, muitas vezes com cópias repetidas e nomes errados.
- Transcrever **todos** com Whisper, ficar com **uma versão de cada trecho** (a mais completa), ordenar pela
  história e **apagar as cópias**.
- Cada parte tem 2 trechos (v3: 26 trechos, 13 partes). **Se faltar algum trecho, avisar o usuário e parar.**
- CTAs gravados pelo usuário:
  - **CTA1** = "se inscreve no Ninguém Sabe" (vai no meio dos cortes, regra 7);
  - **CTA2** = "a história completa já está no canal" (vai no cartão final, regra 8).

## As 10 regras

1. **Gancho.** O completo abre com **5 a 7 s do momento mais forte** (v3: o Lucas às 14:07), **corte seco para
   preto com som grave**, e depois a parte 1.
2. **Legendas.** No **terço inferior** no 16:9 e a **~65–70% da altura** nos verticais. **Nunca cobrir rostos,
   celulares ou relógios.**
3. **Iluminação.** Uns **30% mais clara que o vídeo 1**. Tudo tem que dar para ver no celular.
4. **Qualidade.** **1080p real**, nada atravessando objetos, **prévia em 720p antes do render final**.
5. **Som e texto.** Som feito **por código** (sem MusicGen). **Textos na tela em vermelho, no tempo da fala.**
6. **Cortes verticais.**
   - 1080x1920, de **45 a 60 s**, **terminando no suspense**.
   - Os **~2 min finais** ficam **só no YouTube** (no completo).
   - Cada corte abre com um **quadro de capa com texto em vermelho**, salvo também como `capa/corteX-capa.png`.
   - v3: cortes das **partes 1, 2, 4, 5, 7 e 10**, com as capas:

     | Corte | Parte | Capa |
     |---|---|---|
     | 1 | 1 | VOCÊ TEM 7 DIAS |
     | 2 | 2 | ELE TINHA 3 DIAS |
     | 3 | 4 | 14:07 |
     | 4 | 5 | O MEU TAMBÉM TEM HORA |
     | 5 | 7 | 4.320 MINUTOS |
     | 6 | 10 | A DATA MUDOU? |
7. **CTA no meio do corte.** Perto de **70% de cada corte**: áudio **CTA1** + botão **"INSCREVA-SE" vermelho animado
   com sininho**, de **2 a 3 s**, com a **trilha abaixada**.
8. **Cartão final dos cortes (4 s).** "**A HISTÓRIA COMPLETA JÁ ESTÁ NO CANAL**" + **seta vermelha para baixo**, com
   o áudio **CTA2**.
9. **Saídas.**
   - `renders/vX-parteNN.mp4` (uma por parte);
   - `renders/vX-completo.mp4`, com **10 min ou mais**;
   - `renders/vX-corteN.mp4` (verticais) e `capa/corteX-capa.png`;
   - `capa/capa-vX.png` (v3: "VOCÊ TEM 7 DIAS").
10. **Entrega.** **Commit e push de cada arquivo** assim que ficar pronto, **sem pedir aprovação**. No final, a lista
    dos arquivos com as **durações** e os **planos mais fracos**.

## Como aplicar (notas técnicas)

- **Gancho:** trecho contínuo da própria narração, com a imagem da parte de onde ele sai; 0,6–0,8 s de preto com
  subgrave (35–45 Hz) antes da parte 1.
- **Legendas:** 16:9 com o bloco a ~80% da altura (`bottom` ≈ 165 px de 1080); vertical a 65–70% (`bottom` ≈ 600 px
  de 1920). Montserrat 800, contorno preto, palavra-chave em vermelho. Se um plano tem rosto, celular ou relógio
  na faixa, o enquadramento muda (não a regra).
- **Luz:** medir a luminância média (YAVG) dos quadros da prévia; à noite ≥ 75/255, de dia ~95–135.
- **Colisões:** medidas por vértice (`tools/colisoes.mjs`), nenhuma sobreposição acima de 2 cm.
- **Textos na tela:** as palavras que contam a história (datas, horas, "7 dias", "14:07"…) aparecem em vermelho na
  tela do celular, na TV, no papel ou como letreiro, no instante em que a narração as diz.
- **CTA1 no corte:** a história pausa numa pausa natural da fala perto de 70% do corte; a imagem fica parada, o
  botão entra com o sininho balançando, a trilha desce ~10 dB e o CTA1 toca; depois a história continua.
- **CTA2 no cartão:** se a fala do CTA2 passar de 4 s, o cartão cresce até o fim da fala (+0,3 s), sem cortar a voz.
- **Duração do completo:** sem esticar a voz. Se a narração não chegar a 10 min, o tempo vem de respiros de imagem e
  som entre as partes (planos de abertura, cartões de "DIA N", fim com pergunta e inscrição).
