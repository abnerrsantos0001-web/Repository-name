---
name: ig-carrossel
description: "Planeja um carrossel do Instagram da Ramos Corp (gestão de contas no Mercado Livre) slide a slide, até 10 slides: slide 1 com promessa e curiosidade, valor logo nos primeiros slides e um último slide que vale salvar. Escolhe a fórmula (lista, antes e depois, mitos, método) pelo objetivo, escreve o texto de cada slide e a legenda. Use para conteúdo em vários slides. Não serve para imagem única (use ig-legenda). Só cria o conteúdo: não publica."
---

# Carrossel para Instagram (Ramos Corp)

Adaptado de `ig-carousel-planner`, de Sergey Bulaev (MIT). Ver `../CREDITOS.md`.

O jogo inteiro é o slide 1 (que faz arrastar) e o último (que faz salvar). Esta skill mapeia cada slide,
escreve o texto que vai na imagem e a legenda.

## Antes de começar

1. Leia `../_referencias/perfil-ramoscorp.md` e `../_referencias/regras-de-voz.md`.
2. **Nunca invente detalhes.** Números, casos de clientes e resultados só se o usuário forneceu.

## Fórmulas usadas (carrossel)

| Código | Fórmula | Objetivo | Exemplo de tema para a Ramos Corp |
|---|---|---|---|
| IG5 | Lista | salvamentos | "7 erros de título que escondem seu anúncio na busca do ML" |
| IG6 | Antes e depois | salvamentos, seguidores | uma conta gerida antes e depois (só com dados reais e autorização) |
| IG7 | Derrubando mitos | compartilhamentos | "4 mitos sobre Mercado Ads" |
| IG8 | Método para copiar | salvamentos | o checklist que a Ramos Corp usa para revisar uma conta |

Modelos em `../_referencias/formulas-de-gancho.md`.

## Estrutura

| Slide | Papel | Texto na imagem |
|---|---|---|
| 1 (gancho) | promessa + curiosidade ("quase todo mundo erra a 4") | uma ideia, 6 a 12 palavras, número se couber |
| 2 a 3 | o melhor conteúdo, logo no começo | o ponto mais forte |
| 4 a N-1 | um ponto por slide | curto, legível em 2 segundos |
| N (fechamento) | resumo que vale salvar + um pedido | o resumo em um slide e "salva" ou "segue" |

- 6 a 10 slides para conteúdo educativo. Menos de 4 pontos reais: faça uma imagem única.
- Nunca encha para chegar a 10.
- Mesma fonte, margens e cor em todos os slides. Formato 1080×1350.
- Em lista, numere os slides para a curiosidade do slide 1 se pagar.

## Passos

1. **Coletar:** tema, a lista/método/transformação, público e objetivo.
2. **Escolher a fórmula:** sugira 2 ou 3 e deixe o usuário escolher.
3. **Definir quantos slides** pelo conteúdo real.
4. **Escrever o slide 1:** promessa + curiosidade.
5. **Mapear os slides de valor:** melhor ponto no 2 ou 3; cada um se sustenta sozinho.
6. **Escrever o último slide:** resumo que vale salvar + um pedido.
7. **Legenda:** pode ser curta; repete o gancho antes do "mais", dá contexto, tem o CTA e as 3 a 5 hashtags (`ig-hashtags`).
8. **Revisão de voz** em slides e legenda (`../_referencias/regras-de-voz.md`); no máximo um travessão por slide.
9. **Cartão de aprovação:** fórmula, roteiro slide a slide com o texto de cada um, legenda, hashtags, objetivo
   e o lembrete de que são necessárias de 2 a 10 imagens JPEG, nesta ordem.

## Depois que o usuário aprovar o roteiro

1. Crie `posts/<AAAA-MM-DD-tema>/` com as imagens nomeadas em ordem (`01.jpg`, `02.jpg`, ...) e a `legenda.txt`.
   Se for gerar as imagens dos slides, mostre todas ao usuário antes de seguir.
2. Mostre a prévia com `python3 publicar.py posts/<pasta>` (2+ imagens = carrossel).
3. Siga o fluxo do `CLAUDE.md`: **"aprovado GitHub"** só envia para o repositório; **"publicar"** publica.
   Nunca publique sem a palavra "publicar".

## A skill recusa

- Slide 1 só com título, sem promessa.
- Carrossel de 10 slides esticado de uma ideia de 4 pontos.
- O melhor ponto guardado para o final.
- Três CTAs no último slide.
- Foto e vídeo misturados.
- Parede de texto num slide.
- Uso da identidade visual do Mercado Livre como se fosse da Ramos Corp.
