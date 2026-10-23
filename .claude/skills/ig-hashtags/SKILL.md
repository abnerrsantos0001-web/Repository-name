---
name: ig-hashtags
description: "Monta um conjunto de 3 a 5 hashtags dimensionadas para um post da Ramos Corp (gestão de contas no Mercado Livre): 2 a 3 de nicho (menos de 50 mil posts), 1 a 2 médias (50 mil a 500 mil) e no máximo 1 ampla, todas ligadas ao conteúdo real e variando de post para post. Use para escolher hashtags de legenda, carrossel ou Reels. Não escreve a legenda (use ig-legenda). Só cria conteúdo: não publica."
---

# Hashtags para Instagram (Ramos Corp)

Adaptado de `ig-hashtag-strategist`, de Sergey Bulaev (MIT). Ver `../CREDITOS.md`.

Modelo completo e candidatas em `../_referencias/hashtags.md`.

## Passos

1. **Pegar o post:** legenda, tema do carrossel ou assunto do Reels.
2. **Extrair os temas:** 3 a 5 assuntos reais do post (ex.: reputação, Mercado Ads, Full, título de anúncio).
3. **Gerar candidatas por nível** para cada tema. Nicho = específica e combinada (`#reputacaomercadolivre`);
   ampla = uma palavra comum (`#ecommerce`).
4. **Estimar o tamanho** pela especificidade e pedir para o usuário conferir a contagem na busca do Instagram.
   Remova hashtags de troca de engajamento (`#sigodevolta`, `#follow4follow`, `#like4like`).
5. **Montar:** 2 a 3 nicho + 1 a 2 médias + 0 a 1 ampla, total 3 a 5. Sem ampla se nada encaixar.
6. **Conferir o encaixe:** descarte a que for popular mas fora do tema.
7. **Variar:** troque as de nicho conforme o tema; não repita o mesmo bloco em todo post.

## Formato da resposta

```
Conjunto (4 hashtags):
  #reputacaomercadolivre   nicho   exatamente o tema do post
  #vendedormercadolivre    nicho   a comunidade que o post atende
  #ecommercebrasil         média   público próximo, concorrência vencível
  #mercadolivre            ampla   etiqueta de categoria

Onde colocar: no fim da legenda.txt. Conferir as contagens na busca do Instagram.
```

## Regras

- 3 a 5 no total; nunca um bloco de 30.
- Toda hashtag descreve o conteúdo real.
- No máximo uma ampla.
- `#RamosCorp` pode ocupar uma vaga de nicho.
- No fim da legenda, nunca no meio da frase.
