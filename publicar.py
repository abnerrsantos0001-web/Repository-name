#!/usr/bin/env python3
"""Publica um post da pasta posts/<nome> no Instagram.

Uso:
    python3 publicar.py posts/<nome>            # mostra a prévia (não publica)
    python3 publicar.py posts/<nome> --publicar # publica de verdade

Cada pasta de post contém:
    - uma ou mais imagens .jpg/.jpeg (em ordem alfabética; 2+ imagens = carrossel)
    - legenda.txt com o texto do post

As imagens precisam estar no repositório público do GitHub (git push) antes de
publicar, porque o Instagram baixa a imagem a partir da URL pública.
"""
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
API = "https://graph.instagram.com/v23.0"
EXTENSOES = {".jpg", ".jpeg"}


def carregar_env():
    env = {}
    for linha in (RAIZ / ".env").read_text().splitlines():
        linha = linha.strip()
        if linha and not linha.startswith("#") and "=" in linha:
            chave, valor = linha.split("=", 1)
            env[chave.strip()] = valor.strip()
    return env


def chamar(metodo, caminho, params):
    dados = urllib.parse.urlencode(params).encode()
    url = f"{API}/{caminho}"
    if metodo == "GET":
        req = urllib.request.Request(f"{url}?{dados.decode()}")
    else:
        req = urllib.request.Request(url, data=dados, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        sys.exit(f"Erro da API ({e.code}): {e.read().decode()}")


def url_publica(env, arquivo):
    caminho = arquivo.relative_to(RAIZ).as_posix()
    repo = env["GITHUB_REPO"]
    branch = env.get("GITHUB_BRANCH", "main")
    return f"https://raw.githubusercontent.com/{repo}/{branch}/{urllib.parse.quote(caminho)}"


def conferir_url(url):
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status == 200
    except urllib.error.URLError:
        return False


def esperar_container(container_id, token):
    for _ in range(30):
        status = chamar("GET", container_id, {"fields": "status_code", "access_token": token})
        if status.get("status_code") == "FINISHED":
            return
        if status.get("status_code") in ("ERROR", "EXPIRED"):
            sys.exit(f"Container {container_id} falhou: {status}")
        time.sleep(3)
    sys.exit(f"Container {container_id} não ficou pronto a tempo.")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    publicar = "--publicar" in sys.argv
    if len(args) != 1:
        sys.exit(__doc__)

    pasta = (RAIZ / args[0]).resolve()
    imagens = sorted(p for p in pasta.iterdir() if p.suffix.lower() in EXTENSOES)
    legenda = (pasta / "legenda.txt").read_text().strip()
    if not imagens:
        sys.exit(f"Nenhuma imagem .jpg em {pasta}")
    if len(imagens) > 10:
        sys.exit("O Instagram aceita no máximo 10 imagens por carrossel.")
    if len(legenda) > 2200:
        sys.exit(f"Legenda com {len(legenda)} caracteres (máximo 2200).")
    if (pasta / "publicado.json").exists():
        sys.exit(f"Este post já foi publicado: {(pasta / 'publicado.json').read_text()}")

    env = carregar_env()
    token = env["IG_ACCESS_TOKEN"]
    urls = [url_publica(env, img) for img in imagens]

    print(f"Post: {pasta.name}")
    print(f"Tipo: {'carrossel' if len(urls) > 1 else 'imagem única'}")
    for url in urls:
        print(f"  {url}  [{'ok' if conferir_url(url) else 'NÃO ACESSÍVEL'}]")
    print(f"\nLegenda ({len(legenda)} caracteres):\n{legenda}\n")

    if not publicar:
        print("Prévia apenas. Rode com --publicar para postar.")
        return
    if not all(conferir_url(u) for u in urls):
        sys.exit("Há imagens sem URL pública. Faça git push antes de publicar.")

    if len(urls) == 1:
        criado = chamar("POST", "me/media", {"image_url": urls[0], "caption": legenda, "access_token": token})
    else:
        filhos = []
        for url in urls:
            filho = chamar("POST", "me/media", {"image_url": url, "is_carousel_item": "true", "access_token": token})
            esperar_container(filho["id"], token)
            filhos.append(filho["id"])
        criado = chamar("POST", "me/media", {
            "media_type": "CAROUSEL", "children": ",".join(filhos),
            "caption": legenda, "access_token": token,
        })
    esperar_container(criado["id"], token)

    publicado = chamar("POST", "me/media_publish", {"creation_id": criado["id"], "access_token": token})
    info = chamar("GET", publicado["id"], {"fields": "id,permalink,timestamp", "access_token": token})
    (pasta / "publicado.json").write_text(json.dumps(info, indent=2, ensure_ascii=False) + "\n")
    print(f"Publicado! {info.get('permalink')}")


if __name__ == "__main__":
    main()
