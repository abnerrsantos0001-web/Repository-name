# Créditos

As skills desta pasta são uma adaptação de
[**instagram-skills**](https://github.com/sergebulaev/instagram-skills), de **Sergey Bulaev**,
distribuídas sob a licença MIT (texto completo em [`LICENSE`](LICENSE)).

Versão de origem: commit `6a124481d0ebe9b6d3ac1323ed2a2abc40c7e1d7` (15/10/2026).

## O que mudou na adaptação

- Traduzido para português do Brasil e adaptado para a **Ramos Corp** (gestão de contas no Mercado Livre).
- Mantidas só as partes de **criação de conteúdo**: legendas, carrosséis, ganchos, hashtags e plano semanal.
  - `ig-legenda` ← `ig-caption-writer`
  - `ig-carrossel` ← `ig-carousel-planner`
  - `ig-ganchos` ← `ig-hook-extractor` + `references/hook-formulas.md`
  - `ig-hashtags` ← `ig-hashtag-strategist`
  - `ig-plano-semanal` ← `ig-content-planner`
  - `_referencias/` ← `references/` (voz, algoritmo, hashtags, perfil) e trechos do `ig-humanizer`
- **Removido:** publicação via Publora, leitura via Apify, geração de imagens via Pixfaro, a pasta `lib/`
  e os scripts de verificação do projeto original.
- A publicação é feita pelo `publicar.py` deste repositório, com as duas aprovações descritas no `CLAUDE.md`.

Copyright (c) 2026 Sergey Bulaev. Adaptação: Ramos Corp.
