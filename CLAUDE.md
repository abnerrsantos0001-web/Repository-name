# Fluxo de postagem no Instagram

Cada post fica em `posts/<pasta>/` (imagens `.jpg` + `legenda.txt`). A prévia é `python3 publicar.py posts/<pasta>`.

O fluxo tem duas aprovações, sempre nesta ordem:

1. **"aprovado GitHub"**: só fazer commit e push da pasta do post para o repositório. Não publicar nada no Instagram.
2. **"publicar"**: só então rodar `python3 publicar.py posts/<pasta> --publicar`.

Nunca publicar no Instagram sem que o usuário tenha escrito a palavra "publicar" para aquele post.
O `.env` (token) nunca vai para o repositório.
