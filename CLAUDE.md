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

## Site e vídeo

- Site: usar a skill `taste-skill` (design-taste-frontend) para criar, revisar e tirar a "cara de IA". Arquivos de trabalho dela ficam em `.taste-skill/` (fora do git).
- Vídeo/Reels: skills `hyperframes` e `hyperframes-cli`. O `publicar.py` ainda não publica vídeo.

## Vídeos do Ninguém Sabe (regras fixas)

Todo vídeo novo segue `videos/ninguem-sabe/REGRAS.md` (regras mais novas, com prioridade) e `videos/prompt-mestre/PROMPT-MESTRE.md`. A seção "REGRAS FIXAS DO CANAL" de lá tem prioridade sobre o resto do prompt e sobre o jeito dos vídeos 1 e 2. Em resumo:
1. Vídeo longo de 10 min ou mais.
2. O completo abre com 5–7 s do momento mais forte, corte seco para preto com um grave, e depois começa a história.
3. Legendas fora do centro: ~80% da altura no 16:9 e 65–70% nos verticais, fonte menor, contorno preto, sem cobrir rosto, espelho, celular ou relógio.
4. Sombrio, mas ~30% mais claro, com a luminância medida na prévia.
5. 1080p real, nada atravessando nada (colisões medidas) e prévia 720p antes de cada render.
6. Cortes verticais de 45–60 s terminando no suspense. Os ~2 min finais ficam só no longo.
7. Cada corte abre com 0,5–1 s de capa (texto curto vermelho), salva também como `capa/corteX-capa.png`.
8. Cartão final dos cortes (4 s): "A HISTÓRIA COMPLETA JÁ ESTÁ NO CANAL" + "Toque no link aqui embaixo" + seta vermelha animada para baixo, com `cta.mp3` se existir.
9. Som feito por código.
10. Commit e push de cada arquivo assim que ficar pronto. No fim, a lista com as durações e os planos mais fracos.
