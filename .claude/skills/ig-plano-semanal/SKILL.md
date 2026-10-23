---
name: ig-plano-semanal
description: "Monta o plano semanal de conteúdo do Instagram da Ramos Corp (gestão de contas no Mercado Livre) a partir de um tema e dos pilares (educativo, bastidores e resultados, engajamento, oferta). Gera um calendário de 7 dias com formato (Reels, carrossel, imagem, stories), pilar, fórmula de gancho, ângulo, horário e objetivo, mais a meta de salvamentos e compartilhamentos e uma checagem de equilíbrio. Use para planejar a semana. Para escrever um post do plano, use ig-legenda ou ig-carrossel. Só cria conteúdo: não publica."
---

# Plano semanal do Instagram (Ramos Corp)

Adaptado de `ig-content-planner`, de Sergey Bulaev (MIT). Ver `../CREDITOS.md`.

Reels para alcance, carrossel para salvamento, stories para relacionamento.
A meta da semana é **salvamentos + compartilhamentos**, não curtidas.

## Antes de começar

Leia `../_referencias/perfil-ramoscorp.md`, `../_referencias/formulas-de-gancho.md` e `../_referencias/algoritmo.md`.

## Entrada

- **Tema da semana** (opcional): ex. "reputação no Mercado Livre", "preparação para a Black Friday".
- **Pilares:** padrão do perfil: 40% Educativo, 30% Bastidores e resultados, 20% Engajamento, 10% Oferta.
- **Frequência:** padrão 4 a 5 posts no feed + stories diários.
- **Material real disponível:** casos, números e prints que o usuário pode usar (sem isso, nada de post de resultado).

## Saída

### Calendário de 7 dias

| Dia | Formato | Pilar | Fórmula | Ângulo (1 linha) | Objetivo | Horário (Brasília) |
|---|---|---|---|---|---|---|

Exemplo de forma (ângulos ilustrativos, ajuste ao tema):

| Dia | Formato | Pilar | Fórmula | Ângulo | Objetivo | Horário |
|---|---|---|---|---|---|---|
| Seg | Carrossel | Educativo | IG5 Lista | "6 erros de título que escondem seu anúncio" | salvamentos | 11h |
| Ter | Reels | Educativo | IG9 Quebra de padrão | "baixar preço não é o primeiro passo" | compartilhamentos | 12h30 |
| Qua | Stories | Engajamento | enquete + caixa de pergunta | "qual seu maior problema hoje no ML?" | comentários | 19h |
| Qui | Carrossel | Bastidores | IG6 Antes e depois | caso real de conta gerida (se houver dados) | seguidores | 10h |
| Sex | Imagem | Engajamento | IG3 Cena reconhecível | "o termômetro amarelo na segunda de manhã" | comentários | 13h |
| Dom | Carrossel | Oferta | IG8 Método | "o checklist que usamos para revisar uma conta" | seguidores | 19h |

### Meta da semana

- Pelo menos 3 posts de salvar (IG1, IG5, IG6, IG8, IG10) e 2 de enviar (IG2, IG7, IG9).
- Métrica principal: salvamentos + compartilhamentos.

### Stories diários

- 2 a 4 telas por dia: bastidores da gestão, uma enquete ou pergunta, e o repost de um post recente do feed.

### Checagem de equilíbrio

- [ ] Pelo menos 2 carrosséis e, se houver vídeo, 2 Reels; stories todo dia
- [ ] 3+ posts de salvar e 2+ de enviar
- [ ] Pelo menos 1 post de bastidores/história real
- [ ] Nenhum pilar acima de 50% dos posts do feed
- [ ] Nenhuma fórmula repetida mais de 2 vezes
- [ ] Oferta em no máximo 1 ou 2 posts
- [ ] Objetivos distribuídos entre salvamentos, compartilhamentos, comentários e seguidores

## Passos

1. Coletar entrada; perguntar o que faltar (principalmente que material real existe).
2. Conferir que os pilares somam 100% e nenhum passa de 50%.
3. Para cada dia, escolher formato, pilar, fórmula (sem repetir demais), ângulo, horário e objetivo.
4. Definir a meta da semana e os stories.
5. Rodar a checagem de equilíbrio e sinalizar o que faltar.
6. Entregar em markdown. Se o usuário quiser guardar, salvar em `planos/<AAAA-MM-DD>-semana.md`.

## Regras

- Constância vence frequência: não encher a semana de post fraco.
- Post de resultado só com dado real e autorização do cliente.
- O plano não publica nada. Cada post do plano vira uma pasta em `posts/` pelas skills `ig-legenda` ou `ig-carrossel`
  e segue as duas aprovações do `CLAUDE.md`.
