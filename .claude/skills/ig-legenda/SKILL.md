---
name: ig-legenda
description: "Escreve a legenda de um post de imagem única ou Reels para o Instagram da Ramos Corp (gestão de contas no Mercado Livre), com o gancho nos primeiros 125 caracteres, corpo fácil de ler e um único CTA, usando uma fórmula de gancho escolhida pelo objetivo (salvamentos, compartilhamentos, comentários, seguidores). Use quando pedirem uma legenda ou um post simples. Não serve para carrossel (use ig-carrossel). Só cria o conteúdo: não publica."
---

# Legenda para Instagram (Ramos Corp)

Adaptado de `ig-caption-writer`, de Sergey Bulaev (MIT). Ver `../CREDITOS.md`.

O Instagram esconde tudo depois de ~125 caracteres atrás do "mais", então o gancho faz o trabalho inteiro na primeira linha.
Esta skill coloca o gancho na frente, deixa o corpo fácil de ler e fecha com um único CTA.

## Antes de começar

1. Leia `../_referencias/perfil-ramoscorp.md` e `../_referencias/regras-de-voz.md`.
2. **Nunca invente detalhes.** Número, data, nome de cliente ou resultado só entram se o usuário disse na conversa.
   Se faltar, pergunte uma vez; se continuar faltando, tire a afirmação.

## Fórmulas usadas (legenda)

| Código | Fórmula | Objetivo |
|---|---|---|
| IG1 | Resultado em número | salvamentos |
| IG2 | Verdade contrária | compartilhamentos |
| IG3 | Cena que todo vendedor reconhece | comentários |
| IG4 | Mini-história verdadeira | comentários, seguidores |

Modelos completos em `../_referencias/formulas-de-gancho.md`. Para Reels, o gancho está no vídeo; esta skill escreve a legenda de apoio.

## Passos

1. **Coletar:** tema, ângulo, que imagem/vídeo vai junto, público (por padrão, vendedores do Mercado Livre) e objetivo.
2. **Escolher a fórmula:** sugira 2 ou 3 que combinem com objetivo e tema e deixe o usuário escolher.
3. **Gancho (até 125 caracteres):** entrega o ganho, a tensão ou o número antes do "mais" e faz sentido sozinho.
4. **Corpo:** linhas curtas, respiro entre elas, uma ideia só. Entregue o que o gancho prometeu. Até 2.200 caracteres no total.
5. **Um CTA:** pedido de salvar ou enviar com motivo ("salva para revisar seus títulos no fim de semana"),
   pergunta real, ou um próximo passo (conversar com a Ramos Corp). Nunca "o que vocês acham?".
6. **Hashtags:** 3 a 5 no fim, usando `ig-hashtags` ou `../_referencias/hashtags.md`.
7. **Revisão de voz:** aplique a checagem de `../_referencias/regras-de-voz.md` (travessões, vocabulário de IA, frases proibidas,
   emojis, números só reais). Corrija só o que soa artificial; não fabrique ritmo.
8. **Cartão de aprovação:** mostre fórmula, gancho (avise se passar de 125 caracteres), legenda completa, contagem de caracteres,
   hashtags, objetivo e qual imagem precisa ir junto.

## Depois que o usuário aprovar o texto

1. Salve em `posts/<AAAA-MM-DD-tema>/legenda.txt` (hashtags no fim).
2. A imagem `.jpg` (1080×1350) vai na mesma pasta. Se não houver imagem, avise que o post não pode ser publicado sem ela.
3. Mostre a prévia com `python3 publicar.py posts/<pasta>`.
4. Siga o fluxo do `CLAUDE.md`: **"aprovado GitHub"** só envia a pasta para o repositório; **"publicar"** publica no Instagram.
   Nunca publique sem a palavra "publicar".

## Regras fixas

- Os primeiros 125 caracteres param a rolagem sozinhos.
- Uma ideia por legenda.
- Um número concreto quando houver um real.
- 3 a 5 hashtags; 0 a 3 emojis.
- Sem venda forçada: no máximo uma menção ao serviço da Ramos Corp.

## A skill recusa

- Gancho que só faz sentido depois do "mais".
- Travessões acima do limite, ou travessão trocado por ponto final.
- Aberturas "Vamos falar sobre..", "A verdade é que..", e "O resultado?" como revelação.
- Pilhas telegráficas ("Sem X. Sem Y. Só Z.").
- 20 a 30 hashtags; isca de engajamento.
- Resultado garantido ou número inventado.
