# REVIEW · Vídeo 2 · "E se o seu reflexo parasse de te copiar?"

## Arquivos gerados

Tudo em `videos/ninguem-sabe/v2/`. Os MP4 estão em `renders/` (a pasta fica no `.gitignore` para os renders de teste; os finais entram com `git add -f`).

| Arquivo | Formato | Duração |
|---|---|---|
| `renders/v2-parte01.mp4` | 1920x1080, 30 fps | 48,7 s |
| `renders/v2-parte02.mp4` | 1920x1080, 30 fps | 44,2 s |
| `renders/v2-parte03.mp4` | 1920x1080, 30 fps | 44,5 s |
| `renders/v2-parte04.mp4` | 1920x1080, 30 fps | 43,2 s |
| `renders/v2-parte05.mp4` | 1920x1080, 30 fps | 39,8 s |
| `renders/v2-parte06.mp4` | 1920x1080, 30 fps | 40,9 s |
| `renders/v2-parte07.mp4` | 1920x1080, 30 fps | 41,2 s |
| `renders/v2-parte08.mp4` | 1920x1080, 30 fps | 37,4 s |
| `renders/v2-parte09.mp4` | 1920x1080, 30 fps | 38,3 s |
| `renders/v2-parte10.mp4` | 1920x1080, 30 fps | 41,7 s |
| `renders/v2-completo.mp4` | 1920x1080, 30 fps | 7 min 0,0 s |
| `renders/v2-corte1.mp4` | 1080x1920, 30 fps (partes 01+02 + cartão "Parte 2 amanhã") | 1 min 37,0 s |
| `renders/v2-corte2.mp4` | 1080x1920, 30 fps (partes 03+04 + cartão "Parte 3 amanhã") | 1 min 31,7 s |
| `renders/v2-corte3.mp4` | 1080x1920, 30 fps (partes 05+06 + cartão "Parte 4 amanhã") | 1 min 24,7 s |
| `renders/v2-corte4.mp4` | 1080x1920, 30 fps (partes 07+08 + cartão "O final só no YouTube") | 1 min 22,6 s |
| `capa/capa-v2.png` | 1280x720, "ELE NÃO É VOCÊ" em vermelho | — |

As partes 09 e 10 (a reviravolta e o final) ficam só no vídeo completo do YouTube.

## Ordem dos áudios
Os 20 trechos foram transcritos com Whisper e organizados pela história. As 10 partes resultantes estão em `ORDEM.md`. Não faltou nem sobrou trecho.

## O que mudou em relação ao vídeo 1 (qualidade maior)
- **Nada pixelado.** Render em 1920x1080 com antialiasing (MSAA 4x no pós-efeito), tone mapping ACES e sombras PCF em 1024–4096 px. As texturas das telas e placas são desenhadas em canvas na resolução certa, de 700 a 1200 px por metro. O render final usa `--quality looks --crf 14`.
- **Nada se sobrepõe.** Toda parte passou por `tools/colisoes.mjs` antes do render, sem nenhuma sobreposição acima de 2 cm. A checagem testa cada vértice dos personagens contra cada móvel e parede, e cada objeto contra os outros, em passos de 0,25 s e de 0,1 s nos trechos de contato. Isso incluiu ajustes no próprio cenário:
  - lençóis que agora passam na frente da torneira, da cuba e dos puxadores;
  - cortinas mais curtas, que não atravessam a escrivaninha;
  - postura na pia calculada pelo alcance do boneco;
  - cadeiras empurradas para abrir passagem.
- **Prévia 720p de cada parte antes do render** (`previas/pNN/folha.jpg`), conferida e corrigida até ficar boa. Os cortes verticais também tiveram prévia (`previas/corteN/folha.jpg`).
- **Cenários mais cheios e claros.** Os cômodos são banheiro, quarto, cozinha (com janela para a rua e o ônibus), rua com padaria e vitrine, e ônibus por dentro. A luz de preenchimento é ajustada por plano, e o banheiro de manhã fica com a luz acesa.
- **Personagem mais expressivo.** Ele pisca, mexe a cabeça o tempo todo e tem sobrancelhas de medo e de susto. Tem sorriso normal e o "sorriso grande demais" (com dentes), mostra a língua, fala com a boca sincronizada às palavras e anda e corre com passos. A mãe usa o mesmo boneco com cardigã, saia e coque.
- **Espelho com reflexo de verdade.** O espelho do banheiro e o da cozinha são um mundo espelhado inteiro atrás do vidro, com um dublê que copia com atraso, pisca e sorri fora de hora. O guarda-roupa, a janela, a vitrine, a janela do ônibus e a tela do celular são reflexos planos. O vidro do banheiro tem anéis de toque, vira água e estoura em cacos com física.

## Decisões de criação
- Parte 06: o reflexo encosta a mão no vidro debruçando-se sobre a pia do lado de lá, porque o braço do boneco não alcança de outro jeito. Na hora de tirar o lençol, o lençol refletido aparece sem ninguém segurando, e isso foi intencional.
- Parte 07: a mão do reflexo segura a dele no plano da água. Como a cabeça do boneco é grande, quando ele se debruça o rosto fica a poucos centímetros do vidro. Por isso o secador bate no canto direito do espelho, por baixo do queixo, e são dois golpes: o primeiro solta o braço, o segundo estoura o vidro no instante do som.
- Partes 08 e 09 (do lado de dentro do espelho): a cozinha é construída ao contrário. O relógio, a caixa de leite, o caderno e o letreiro do ônibus saem espelhados. Pelo espelho da cozinha aparece a casa de verdade, onde as letras ficam certas, já que são invertidas duas vezes. Lá estão o sósia e a mãe tomando café, e as cadeiras do lado de cá ficam vazias.
- Parte 10: a câmera passa para o lado de dentro do espelho. "Você" é o reflexo, que atrasa 1 s quando o sósia vira a cabeça e depois encara a câmera. O cartão "COMENTA AQUI" e o cartão "NINGUÉM SABE / INSCREVA-SE" seguem o padrão do vídeo 1. No silêncio final o cartão sai e fica só o reflexo sorrindo.
- Cortes verticais: são as mesmas cenas renderizadas de novo em 1080x1920, com as legendas grandes no centro e o cartão de 4 s no fim. Os relógios das partes 01 e 04 ganharam enquadramento vertical próprio.

## Áudio (tudo por código, sem MusicGen)
- `tools/audio.py` (numpy/scipy) faz a trilha (drone, pad, ar do cômodo e uma camada de vidro) e 216 efeitos presos às palavras, entre eles:
  - toc no vidro, mão no vidro, lençol, torneira, interruptor;
  - passos, ônibus, carro passando, água;
  - objetos caindo, vidro estourando;
  - respiração, coração, rádio e cafeteira.
- A trilha quase some depois que o vidro estoura. A mixagem fica em −15 LUFS, fatiada na grade de quadros (`assets/audio/mix/partes.json`).
- Legendas palavra por palavra, no mesmo estilo do vídeo 1, com as correções de transcrição (7:12, 3:33, "toc").

## Correções feitas durante o trabalho
- Parte 06 (renderizada de novo): duas marcas de tempo apontavam para a primeira ocorrência de uma palavra repetida ("lado", "vez"). Por isso a boca do reflexo não mexia em duas falas e o sorriso grande começava cedo demais. Uma auditoria de todas as partes achou só esses dois casos e o da parte 07 (antes do render).
- O letreiro do ônibus da janela da cozinha estava dentro da carroceria e foi para a lateral. O ônibus da cópia espelhada da cozinha, que passaria na mesma rua, fica escondido.

## O que foi medido e o que foi só olhado
- Sobreposições: medidas (`tools/colisoes.mjs`) em todas as partes.
- Imagem: conferida em folhas de quadros 720p de cada parte e dos 4 cortes.
- Som: medido (volume, pico, posição de cada efeito), não ouvido.
- Cada MP4 conferido no ffprobe: resolução, 30 fps e número de quadros.

## Planos mais fracos
- **Parte 01, "olhar":** o reflexo na pia aparece pouco atrás dele. A lavagem do rosto é vista de lado.
- **Parte 02:** o reflexo na tela do celular mostra só um olho e parte do rosto. O plano "estranhas" ficou perto demais.
- **Parte 03:** no interruptor, a cabeça dele fica muito perto da câmera.
- **Parte 04:** em "de novo" o rosto aparece de perfil, e o plano da tela do celular é escuro.
- **Parte 05:**
  - "vira o celular" é visto pelas costas, sem o rosto;
  - o lençol do guarda-roupa parece uma porta clara;
  - no corte vertical, a legenda cobre parte do texto das telas do celular.
- **Parte 06:** o reflexo alcança o vidro no limite, bem debruçado sobre a pia. A entrada no corredor escuro tem pouca leitura.
- **Parte 07:**
  - a luta aparece mais pela cabeça e pelo braço, porque a cabeça grande esconde as mãos em alguns ângulos;
  - em "metade do braço" só a mão atravessa a água, já que o braço curto do boneco não vence a fundura da pia;
  - o secador bate no canto do espelho, não no centro.
- **Parte 08:** ele levanta do chão rápido, passando de sentado para em pé em 0,9 s.
- **Parte 09:** a rua vista da janela é simples, com blocos cinza. "Pra fugir" é um perfil bem fechado.
- **Parte 10:** no espelho do guarda-roupa o reflexo aparece pequeno. Os cartões finais escurecem a cena, como no vídeo 1.
- **Som:** o interruptor da parte 06 (quando ele acende a luz) não tem efeito sonoro. A mixagem já estava fechada quando a cena foi feita.
