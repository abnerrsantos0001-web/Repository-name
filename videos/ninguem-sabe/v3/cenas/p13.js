      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, trilha } from "./assets/js/cena.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { PRAIA } from "./assets/js/mundo4.js";
      import { PI, ALT, eixos, em, no, noColo, celularExtra, criarFolha, figurante, segurandoCelular } from "./assets/js/v3.js";
      import { telaBloqueio, telaEmail, telaCaixa, telaApagada } from "./assets/js/telas3.js";
      import { PALAVRAS } from "./assets/js/tempos/v3-parte13.js";

      // Parte 13 (epílogo, meses depois): a cidade; ninguém descobriu quem mandou os e-mails. Na praia, uma mulher com
      // uma data nova, um homem com a caixa vazia, gente olhando o mar; ele também mudou. A folha do caderno continua no
      // bolso: toda semana ele risca uma coisa e escreve outra. A pergunta para os comentários (olhando para a câmera),
      // "Se inscreve", e a madrugada: o celular vibra às 3:33. NINGUÉM SABE. Última imagem: a tela acesa, vibrando.
      const T = tempos(PALAVRAS);
      const FIM = 52.5667;
      const t = {
        cidade: T("Até") - 0.15,
        datas: T("Algumas") - 0.15,
        dataTela: T("datas") - 0.05,
        pararam: T("outras") - 0.15,
        gente: T("e muita") - 0.15,
        voce: T("Você também") - 0.15,
        folha: T("A folha") - 0.15,
        mesa: T("Toda") - 0.15,
        risca: T("risca") - 0.45,
        fala: T("Agora me") - 0.15,
        pergunta: T("o que") - 0.15,
        inscreve: T("Se inscreve") - 0.15,
        noite: T("e se") - 0.15,
        vibra: T("vibrar") - 0.05,
        card: 44.9,
        final: FIM - 3.95,
      };
      const VIBRA = [[T("vibrar"), T("vibrar") + 1.1], [FIM - 3.6, FIM - 2.5], [FIM - 2.4, FIM - 1.3]];
      const vibrando = (tt) => VIBRA.some(([a, b]) => tt >= a && tt <= b);
      const acesa = (tt) => (tt >= VIBRA[0][0] && tt < t.card) || tt >= VIBRA[1][0];
      // praia: a areia sobe para longe do mar (y = 0,055 z); a água começa perto de z = 0
      const A = (x, z) => [x, ALT + PRAIA.areia(z), z];
      const ELE_P = A(1.2, 3.0);
      // quarto: escrivaninha (de frente para a janela, +x), a folha na mesa, a cama e o criado-mudo
      const MESA = [1.38, 0.57, 0.4];
      const GIRO_FALA = PI / 2 + 1.25; // virado para o quarto (para a câmera)
      const FOLHA = [1.9, 0.7625, 0.36];
      const DEITADO = [-1.78, 0.79, -0.84];
      const CEL_CRIADO = [-1.13, 0.5555, -1.58];
      // a lista da folha: as quatro da parte 8 e mais duas, todas riscadas; nesta semana risca "Aprender a nadar"
      // e escreve, em vermelho, "Ver a neve"
      const RISCA = [T("risca"), T("risca") + 0.75];
      const ESCREVE = [T("escreve"), T("escreve") + 1.4];
      const BASE = ["Ver o mar", "Falar pra Júlia", "Desculpa pro pai", "Dizer tudo pra mãe", "Pescar com o Lucas", "Aprender a nadar"];
      const NOVO = "Ver a neve";
      const k01 = (tt, [a, b]) => Math.max(0, Math.min(1, (tt - a) / (b - a)));
      const lista = (tt) => {
        const itens = BASE.map((texto, i) => ({ texto, riscado: i < 5 ? 1 : k01(tt, RISCA) }));
        itens.push({ texto: NOVO, novo: true });
        const antes = BASE.reduce((n, s) => n + s.length, 0);
        const escrito = (antes + NOVO.length * k01(tt, ESCREVE)) / (antes + NOVO.length);
        return { itens, escrito };
      };
      // ponto da folha (deitada na mesa, topo para +x) em que a caneta está: linha i, avanço k
      const linhaX = (i) => FOLHA[0] + 0.297 * (0.5 - (0.12 + 0.07 * (i * 1.5 + 1)));
      const pontoCaneta = (tt) => {
        const riscando = tt >= RISCA[0] && tt < RISCA[1];
        const escrevendo = tt >= ESCREVE[0] && tt < ESCREVE[1];
        let i = 5;
        let k = 0;
        if (riscando) k = k01(tt, RISCA) * 0.95;
        else if (tt >= RISCA[1] && tt < ESCREVE[0]) (i = 6), (k = 0);
        else if (escrevendo) (i = 6), (k = k01(tt, ESCREVE) * 0.6);
        else if (tt >= ESCREVE[1]) (i = 6), (k = 0.65);
        const toca = riscando || escrevendo;
        const x = linhaX(i) + (riscando ? 0.008 : 0);
        const z = FOLHA[2] - 0.07 + 0.15 * k;
        return new THREE.Vector3(x - 0.01, FOLHA[1] + 0.015 + (toca ? 0.004 * Math.abs(Math.sin(tt * 22)) : 0.03), z);
      };
      const presa = (quem, f, d, c, ac = 0, fov = 38) => (tt, ctx) => {
        const b = quem === "ele" ? ctx.boneco : ctx.outros[quem].boneco;
        const { cabeca } = pontosDoBoneco(b);
        const { frente, direita, cima } = eixos(b);
        return { pos: em(cabeca, [frente, f], [direita, d], [cima, c]), alvo: em(cabeca, [cima, ac]), fov };
      };
      // de frente para a tela de um celular extra (perto = distância; desce = o celular sobe no quadro)
      const naTela = (qual, perto, desce, fov = 34) => (tt, ctx) => {
        const c = ctx[qual].obj;
        c.updateMatrixWorld(true);
        const alvo = c.localToWorld(new THREE.Vector3(0, -desce, 0));
        const n = new THREE.Vector3(0, 0, 1).transformDirection(c.matrixWorld);
        return { pos: alvo.clone().addScaledVector(n, perto), alvo, fov };
      };
      // figurantes da praia segurando o celular na frente do peito
      const lendo = (tt, pts, ctx, b) => segurandoCelular(pts, b, 0.48, 0.38);

      iniciarParte({
        host: "__parte13",
        cenarios: ["noite", "praia", "quarto2"],
        planos: [
          { de: 0, cenario: "noite", nome: "abre", exposicao: 1.3 }, //                                            (MESES DEPOIS)
          { de: t.cidade, cenario: "noite", nome: "cidade", exposicao: 1.3 }, //                                   Até hoje, ninguém descobriu quem mandou aqueles e-mails.
          { de: t.datas, cenario: "praia", nome: "datas", modo: "tarde" }, //                      Algumas pessoas receberam
          { de: t.dataTela, cenario: "praia", nome: "dataTela", modo: "tarde" }, //                datas novas,
          { de: t.pararam, cenario: "praia", nome: "pararam", modo: "tarde" }, //                  outras pararam de receber,
          { de: t.gente, cenario: "praia", nome: "gente", modo: "tarde" }, //                      e muita gente nunca mais viveu do mesmo jeito.
          { de: t.voce, cenario: "praia", nome: "voce", modo: "tarde" }, //                        Você também não.
          { de: t.folha, cenario: "praia", nome: "folha", modo: "tarde" }, //                      A folha do caderno continua no seu bolso.
          { de: t.mesa, cenario: "quarto2", nome: "mesa", modo: "manha" }, //                      Toda semana
          { de: t.risca, cenario: "quarto2", nome: "risca", modo: "manha" }, //                    você risca uma coisa e escreve outra.
          { de: t.fala, cenario: "quarto2", nome: "fala", modo: "manha" }, //                      Agora me fala aqui nos comentários, se você recebesse esse e-mail hoje,
          { de: t.pergunta, cenario: "quarto2", nome: "pergunta", modo: "manha" }, //              o que você faria nos seus 7 dias?
          { de: t.inscreve, cenario: "quarto2", nome: "inscreve", modo: "manha" }, //              Se inscreve no Ninguém Sabe,
          { de: t.noite, cenario: "quarto2", nome: "cama", modo: "noite", preenchimento: 0.7 }, // e se o seu celular
          { de: t.vibra, cenario: "quarto2", nome: "vibra", modo: "noite", preenchimento: 0.35 }, // vibrar às 3h33, talvez seja melhor não abrir.
          { de: t.card, cenario: "quarto2", nome: "card", modo: "noite", preenchimento: 2.6, exposicao: 1.25 }, //  NINGUÉM SABE
          { de: t.final, cenario: "quarto2", nome: "final", modo: "noite", preenchimento: 0.3 }, //  (o celular vibra às 3:33)
        ],
        cortesEscuros: [t.datas, t.mesa, t.noite, t.card],
        cameras: {
          abre: { k: [[0, [-36, 2.4, 4], [-20, 4.6, -8], 48], [t.cidade, [-34.5, 2.6, 3.2], [-18.5, 4.7, -8], 46]], tremor: 0.0015 },
          cidade: { k: [[t.cidade, [-34.5, 2.6, 3.2], [-18.5, 4.7, -8], 46], [t.datas, [-31, 3.4, 1.5], [-14, 5.2, -9], 46]], tremor: 0.0015 },
          datas: presa("mulher", 1.1, 0.45, -0.1, -0.12, 38),
          dataTela: naTela("celA", 0.3, 0.02, 44),
          pararam: naTela("celB", 0.3, 0.02, 44),
          gente: { k: [[t.gente, [7.5, 1.9, 11.5], [-1.0, 1.0, 0.5], 46], [t.voce, [5.5, 1.85, 11.0], [-1.5, 1.0, 0.5], 46]], tremor: 0.0015 },
          voce: presa("ele", 1.15, -0.3, -0.04, -0.1, 38),
          folha: (tt, ctx) => {
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            const { frente, direita, cima } = eixos(ctx.boneco);
            const k = trilha([[t.folha, 0], [t.mesa, 1]], tt);
            return { pos: em(cabeca, [frente, 1.45 - 0.2 * k], [direita, -0.55], [cima, -0.12]), alvo: em(cabeca, [cima, -0.32], [frente, 0.2]), fov: 42 };
          },
          mesa: { k: [[t.mesa, [1.0, 1.78, 1.45], [1.92, 0.8, 0.3], 46], [t.risca, [1.06, 1.74, 1.4], [1.92, 0.8, 0.3], 44]], tremor: 0.0015 },
          risca: { k: [[t.risca, [1.66, 1.3, 0.4], [1.86, 0.7625, 0.38], 32], [t.fala, [1.68, 1.26, 0.4], [1.86, 0.7625, 0.38], 31]], tremor: 0.001 },
          // ele vira na cadeira para a câmera (para o quarto) e fala com quem está assistindo
          fala: (tt, ctx) => {
            const k = trilha([[t.fala, 0], [t.pergunta, 1]], tt);
            return presa("ele", 1.3, 0, 0.0, -0.02, 52 - 2 * k)(tt, ctx);
          },
          pergunta: (tt, ctx) => {
            const k = trilha([[t.pergunta, 0], [t.inscreve, 1, "suave"]], tt);
            return presa("ele", 1.3, 0, 0.0, 0.03, 50 - 2 * k)(tt, ctx);
          },
          inscreve: { k: [[t.inscreve, [0.8, 1.45, -1.1], [1.42, 1.3, 0.3], 48], [t.noite, [0.85, 1.44, -1.03], [1.42, 1.3, 0.3], 46]], tremor: 0.0015 },
          cama: { k: [[t.noite, [-0.25, 1.75, 0.75], [-1.75, 0.72, -1.15], 44], [t.vibra, [-0.32, 1.7, 0.62], [-1.75, 0.72, -1.2], 42]], tremor: 0.0018 },
          vibra: { k: [[t.vibra, [-0.78, 1.0, -1.18], [-1.08, 0.57, -1.62], 32], [t.card, [-0.86, 0.94, -1.27], [-1.08, 0.57, -1.62], 27]], tremor: 0.0015 },
          card: { k: [[t.card, [0.55, 1.45, 0.45], [2.3, 1.55, 0.4], 50], [t.final, [0.75, 1.47, 0.42], [2.3, 1.55, 0.4], 47]], tremor: 0.0012 },
          final: { k: [[t.final, [-1.128, 0.86, -1.575], [-1.13, 0.556, -1.605], 25], [FIM, [-1.129, 0.79, -1.58], [-1.13, 0.556, -1.605], 21]], tremor: 0.0008 },
        },
        semCabeca: (tt, p) => p.nome === "risca",
        personagem: {
          semente: 13,
          onde: [[0, "praia"], [t.mesa, "quarto2"]],
          pos: [[0, ELE_P], [t.mesa, MESA, "corte"], [t.noite, DEITADO, "corte"]],
          pose: {
            giro: [[0, PI], [t.mesa, PI / 2, "corte"], [t.fala, GIRO_FALA, "corte"], [t.noite, 0, "corte"]],
            deitar: [[0, 0], [t.noite, -1.45, "corte"]],
            quadril: [[0, 0], [t.mesa, -PI / 2, "corte"], [t.noite, 0, "corte"]],
            joelho: [[0, 0], [t.mesa, 1.5, "corte"], [t.noite, 0, "corte"]],
            inclinar: [[0, 0.03], [t.folha + 0.5, 0.03], [t.folha + 1.2, 0.08, "ambos"], [t.mesa, 0.3, "corte"], [t.fala, 0.3], [t.fala + 0.7, 0.08, "ambos"], [t.noite, 0, "corte"]],
            cabecaInclina: [[0, 0.02], [t.folha + 0.6, 0.02], [t.folha + 1.3, 0.42, "ambos"], [t.mesa, 0.45, "corte"], [T("Agora me") + 0.1, 0.45], [T("Agora me") + 0.8, 0.03, "ambos"], [t.noite, -0.1, "corte"]],
            cabecaGiro: [[0, 0], [t.noite, 0.15, "corte"]],
            olhos: [[0, 1], [t.noite, 0.04, "corte"]],
            sorriso: [[0, 0.1], [t.voce, 0.1, "corte"], [T("não.") - 0.1, 0.1], [T("não.") + 0.4, 0.4, "ambos"], [t.folha, 0.3, "corte"], [t.mesa, 0.15, "corte"], [T("escreve"), 0.15], [T("outra.") + 0.2, 0.45, "ambos"], [t.fala, 0.25, "corte"], [t.pergunta, 0.12, "corte"], [T("dias?"), 0.12], [T("dias?") + 0.4, 0.3, "ambos"], [t.inscreve, 0.5, "corte"], [t.noite, 0, "corte"]],
            sobrancelha: [[0, 0], [t.voce, 0.1, "corte"], [t.fala, 0.2, "corte"], [t.pergunta, 0.4, "corte"], [t.inscreve, 0.15, "corte"], [t.noite, 0, "corte"]],
          },
          semPiscar: [[t.noite, FIM + 1]],
          maos: (tt, pts, ctx, b) => {
            if (tt < t.folha || tt >= t.noite) return null;
            const { frente, cima, direita } = eixos(b);
            if (tt < t.mesa) {
              // tira a folha dobrada do bolso do moletom e abre na frente do peito
              const bolso = trilha([[T("folha") - 0.05, 1], [T("caderno") + 0.25, 0, "ambos"]], tt);
              const abre = trilha([[T("continua") - 0.1, 0], [T("bolso.") + 0.1, 1, "ambos"]], tt);
              const c = em(pts.cabeca, [frente, 0.38 - 0.12 * bolso], [cima, -0.4 - 0.23 * bolso]);
              return { alvoE: em(c, [direita, -0.07 - 0.04 * abre + 0.05 * bolso]), pesoE: 1, alvoD: em(c, [direita, 0.07 + 0.04 * abre]), pesoD: 1 - 0.5 * bolso };
            }
            if (tt >= t.fala) return noColo(b);
            const o = ctx.cenarios.quarto2.grupo.position;
            const esquerda = new THREE.Vector3(FOLHA[0] - 0.08, FOLHA[1] + 0.04, FOLHA[2] - 0.14).add(o);
            return { alvoE: esquerda, pesoE: 1, alvoD: pontoCaneta(tt).add(o), pesoD: 1 };
          },
        },
        outros: [
          figurante("mulher", "mulher", "praia", A(-2.4, 5.2), PI / 2 + 0.35, {
            semente: 1301, inclinar: 0.05, cabecaInclina: [[0, 0.36]],
            pose: { sorriso: [[0, 0.7]], choro: [[0, 0.45]], sobrancelhaMedo: [[0, 0.35]] },
            maos: lendo,
          }),
          figurante("homem", "passageiro", "praia", A(4.4, 4.0), -PI / 2 - 0.3, {
            semente: 1302, inclinar: 0.06, cabecaInclina: [[0, 0.38]], cabecaGiro: [[0, 0]],
            pose: { sobrancelha: [[0, -0.2]], sorriso: [[0, 0]] },
            maos: lendo,
          }),
          figurante("idosa", "idosa", "praia", A(-9, 2.2), PI / 2, {
            semente: 1303, posK: [[0, A(-9, 2.2)], [t.gente - 0.6, A(-9, 2.2)], [t.voce + 0.6, A(-3.5, 2.2), "linear"]], passos: [[t.gente - 0.6, t.voce + 0.6, 0.7, 0.5]],
            inclinar: 0.06, cabecaGiro: [[0, -0.5]], pose: { sorriso: [[0, 0.35]] },
          }),
          figurante("ela", "aluna", "praia", A(-0.9, 2.6), PI + 0.15, { semente: 1304, cabecaInclina: [[0, 0.02]], cabecaGiro: [[0, -0.2]] }),
          figurante("eleB", "aluno", "praia", A(-0.1, 2.6), PI - 0.1, { semente: 1305, cabecaInclina: [[0, 0.02]], cabecaGiro: [[0, 0.25]] }),
        ],
        celular: (tt) => {
          const tremer = vibrando(tt) ? 0.0025 * Math.sin(tt * 190) : 0;
          return { cenario: "quarto2", pos: [CEL_CRIADO[0] + tremer, CEL_CRIADO[1], CEL_CRIADO[2]], rot: [-PI / 2, 0, 0.15 + tremer * 8] };
        },
        tela: (g, tt, desenhar) => {
          let k = "apagada";
          let fn = () => telaApagada(g, 600, 1302);
          if (acesa(tt)) (k = "notif"), (fn = () => telaBloqueio(g, 600, 1302, { hora: "3:33", data: "terça-feira, 9 de março", notificacao: { texto: "1 mensagem nova" } }));
          if (desenhar) fn();
          return k;
        },
        montar: (ctx) => {
          const q = ctx.cenarios.quarto2;
          q.cobertor.visible = false;
          ctx.folha = criarFolha(ctx.cena);
          const caneta = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.004, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0x1c3a8a, roughness: 0.4 }));
          caneta.userData.passavel = true;
          ctx.cena.add(caneta);
          ctx.caneta = caneta;
          ctx.celA = celularExtra(ctx.cena);
          ctx.celA.mostrar("data", (g, W, H) => telaEmail(g, W, H, { hora: "16:20", assunto: "Data atualizada", frase: "Você tem 41 anos." }));
          ctx.celB = celularExtra(ctx.cena);
          ctx.celB.mostrar("vazia", (g, W, H) => telaCaixa(g, W, H, { hora: "16:21", emails: [], vazio: "Nenhum|e-mail novo" }));
          // brilho frio da tela no criado-mudo quando ela acende
          const brilho = new THREE.PointLight(0xbcd0ff, 0, 2.2, 1.6);
          ctx.cena.add(brilho);
          ctx.brilhoTela = brilho;
        },
        quadro: (tt, plano, ctx, fase) => {
          const q = ctx.cenarios.quarto2;
          if (fase === "antes") {
            q.cortinas(0);
            // a cadeira gira junto com ele quando ele se vira para a câmera
            const g = tt >= t.fala && tt < t.noite ? GIRO_FALA : PI / 2;
            q.cadeira.rotation.y = g;
            q.cadeira.position.x = MESA[0] - 0.23 * Math.sin(g);
            q.cadeira.position.z = MESA[2] - 0.23 * Math.cos(g);
            q.relogio.userData.mostrar(tt < t.noite ? "9:40" : "3:33");
            // a cidade: as janelas que ainda acendem de madrugada vão se apagando
            ctx.cenarios.noite.acender(trilha([[0, 0.5], [t.datas, 0.18, "suave"]], tt), 0);
            return;
          }
          const o = q.grupo.position;
          // celulares dos figurantes (só na praia)
          if (plano.cenario === "praia") {
            ctx.celA.naMao(ctx.outros.mulher.boneco, pontosDoBoneco(ctx.outros.mulher.boneco).cabeca);
            ctx.celB.naMao(ctx.outros.homem.boneco, pontosDoBoneco(ctx.outros.homem.boneco).cabeca);
          } else {
            ctx.celA.esconder();
            ctx.celB.esconder();
          }
          // a folha: no bolso -> aberta na mão (praia) -> na escrivaninha (quarto) -> some à noite
          const f = ctx.folha;
          const b = ctx.boneco;
          if (tt >= T("folha") - 0.05 && tt < t.mesa) {
            f.grupo.visible = true;
            const pE = new THREE.Vector3();
            const pD = new THREE.Vector3();
            b.userData.rig.bracoE.pega.getWorldPosition(pE);
            b.userData.rig.bracoD.pega.getWorldPosition(pD);
            f.grupo.position.copy(pE.lerp(pD, 0.5)).add(new THREE.Vector3(0, 0.05, 0));
            f.grupo.rotation.set(-0.55, b.rotation.y + PI, 0, "YXZ");
            f.dobrar(1 - trilha([[T("continua") - 0.1, 0], [T("bolso.") + 0.1, 1, "ambos"]], tt));
          } else if (tt >= t.mesa && tt < t.noite) {
            f.grupo.visible = true;
            f.grupo.position.set(...FOLHA).add(o);
            f.grupo.rotation.set(-PI / 2, 0, -PI / 2, "XYZ");
            f.dobrar(0);
          } else f.grupo.visible = false;
          const l = lista(tt);
          const riscado = Math.round(k01(tt, RISCA) * 20);
          f.mostrar("r" + riscado + "e" + Math.round(l.escrito * 400) + (tt < t.mesa ? "d" : ""), { ...l, dobras: true });
          // a caneta na mão direita, na escrivaninha
          const c = ctx.caneta;
          c.visible = tt >= t.mesa && tt < t.fala;
          if (c.visible) {
            const p = new THREE.Vector3();
            b.userData.rig.bracoD.pega.getWorldPosition(p);
            c.position.copy(p).add(new THREE.Vector3(0.02, 0.03, 0));
            c.rotation.set(0.5, 0, -0.6);
          }
          ctx.brilhoTela.position.set(CEL_CRIADO[0], CEL_CRIADO[1] + 0.25, CEL_CRIADO[2]).add(o);
          ctx.brilhoTela.intensity = acesa(tt) && plano.cenario === "quarto2" ? (vibrando(tt) ? 1.8 : 1.2) : 0;
        },
      });
