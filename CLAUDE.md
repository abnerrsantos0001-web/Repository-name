# Fluxo de postagem no Instagram

Cada post fica em `posts/<pasta>/` (imagens `.jpg` + `legenda.txt`). A prévia é `python3 publicar.py posts/<pasta>`.

O fluxo tem duas aprovações, sempre nesta ordem:

1. **"aprovado GitHub"**: só fazer commit e push da pasta do post para o repositório. Não publicar nada no Instagram.
2. **"publicar"**: só então rodar `python3 publicar.py posts/<pasta> --publicar`.

Nunca publicar no Instagram sem que o usuário tenha escrito a palavra "publicar" para aquele post.
O `.env` (token) nunca vai para o repositório.

## Criação de conteúdo

As skills em `.claude/skills/` (adaptadas de instagram-skills, de Sergey Bulaev, MIT; ver `.claude/skills/CREDITOS.md`)
servem só para **criar** conteúdo da Ramos Corp (gestão de contas no Mercado Livre):

- `ig-legenda`: legenda de imagem única ou Reels
- `ig-carrossel`: carrossel slide a slide
- `ig-ganchos`: opções de gancho e análise de posts de referência
- `ig-hashtags`: 3 a 5 hashtags dimensionadas
- `ig-plano-semanal`: calendário da semana

Referências compartilhadas (voz, perfil da marca, fórmulas, hashtags, algoritmo) ficam em `.claude/skills/_referencias/`.
Não usar Publora nem outro serviço de publicação: publicar é sempre pelo `publicar.py`, seguindo as duas aprovações acima.
