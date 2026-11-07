      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, MEDIDAS, trilha } from "./assets/js/cena.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { toquesNoVidro } from "./assets/js/reflexo.js";
      import { lanterna as telaLanterna } from "./assets/js/telas.js";
      import { PALAVRAS } from "./assets/js/tempos/v2-parte04.js";

      const T = tempos(PALAVRAS);
      const PI = Math.PI;
      const ALT = MEDIDAS.quadrilEmPe;
      const FIM = 43.1667;
      const DEITADO = [-1.78, 0.52 + MEDIDAS.raioTronco + 0.06, -0.82];
      const SENTADO_CAMA = [-1.45, 0.6, -0.9];
      const PIA = [0, ALT, -0.56];
      const t = {
        relogio: T("Às") - 0.15,
        escuta: T("você escuta") - 0.15,
        toc: T("toque") - 0.15,
        dedo: T("como") - 0.15,
        lanterna: T("Você liga") - 0.15,
        porta: T("e vai") - 0.15,
        vazio: T("O espelho") - 0.15,
        refletido: T("Só") - 0.15,
        ninguem: T("Nenhuma") - 0.15,
        frente: T("você está") - 0.15,
        deNovo: T("aí") - 0.15,
        quarto: T("só que") - 0.15,
        janela: T("e da janela") - 0.1,
        tela: T("e da tela") - 0.1,
      };
      const LUZ_CEL = T("liga") + 0.25;
      // toques no vidro: [u, v, instante, força]
      const TOQUES_BANHEIRO = [[0.46, 0.55, T("toque", 1), 1], [0.55, 0.62, T("toque", 2), 1], [0.42, 0.5, T("toque", 3), 1], [0.6, 0.4, T("vidro."), 0.8]];
      const TOQUES_QUARTO = [[0.5, 0.62, T("espelho do seu") , 1], [0.44, 0.55, T("espelho do seu") + 0.35, 0.9], [0.56, 0.5, T("quarto"), 0.9]];
      const TOQUES_JANELA = [[0.4, 0.55, T("janela"), 1], [0.55, 0.45, T("janela") + 0.3, 0.9]];
      const TOQUES_TELA = [[0.5, 0.45, T("tela"), 1], [0.45, 0.6, T("tela") + 0.3, 1], [0.58, 0.52, T("celular", 2), 1]];

      const eixos = (b) => {
        const g = b.rotation.y;
        return { frente: new THREE.Vector3(Math.sin(g), 0, Math.cos(g)), direita: new THREE.Vector3(-Math.cos(g), 0, Math.sin(g)), cima: new THREE.Vector3(0, 1, 0) };
      };
      const em = (base, ...pares) => pares.reduce((v, [d, k]) => v.addScaledVector(d, k), base.clone());
      function cameraTela(perto, alto = 0.0) {
        return (tt, ctx) => {
          const { cabeca } = pontosDoBoneco(ctx.boneco);
          ctx.celular.updateMatrixWorld(true);
          const alvo = ctx.celular.localToWorld(new THREE.Vector3(0, -0.01, 0));
          const dir = alvo.clone().sub(cabeca).normalize();
          return { pos: alvo.clone().addScaledVector(dir, -perto).add(new THREE.Vector3(0, alto, 0)), alvo, fov: 34 };
        };
      }
      // anéis do toque desenhados na tela do celular
      function aneis(g, W, H, tt) {
        for (const [u, v, t0] of TOQUES_TELA) {
          const dt = tt - t0;
          if (dt < 0 || dt > 1.4) continue;
          g.strokeStyle = `rgba(232, 236, 240, ${0.9 * (1 - dt / 1.4)})`;
          g.lineWidth = 10;
          g.beginPath();
          g.arc(u * W, v * H, 20 + dt * 260, 0, Math.PI * 2);
          g.stroke();
        }
      }

      iniciarParte({
        host: "__parte04",
        cenarios: ["quarto2", "banheiro"],
        exposicao: 1.2,
        planos: [
          { de: 0, cenario: "quarto2", nome: "dorme", modo: "noite", preenchimento: 0.7 }, //            Você não dorme.
          { de: t.relogio, cenario: "quarto2", nome: "relogio", modo: "noite", preenchimento: 0.5 }, //  Às 3h33 da madrugada,
          { de: t.escuta, cenario: "quarto2", nome: "escuta", modo: "noite", preenchimento: 0.7 }, //    você escuta um barulho baixinho vindo do banheiro.
          { de: t.toc, cenario: "banheiro", nome: "toc", modo: "apagada", preenchimento: 0.25 }, //       Toque, toque, toque,
          { de: t.dedo, cenario: "banheiro", nome: "dedo", modo: "apagada", preenchimento: 0.25 }, //     como alguém batendo com o dedo no vidro.
          { de: t.lanterna, cenario: "quarto2", nome: "lanterna", modo: "noite", preenchimento: 0.7 }, // Você liga a lanterna do celular
          { de: t.porta, cenario: "banheiro", nome: "porta", modo: "apagada", preenchimento: 0.4 }, //    e vai até a porta.
          { de: t.vazio, cenario: "banheiro", nome: "vazio", modo: "apagada", preenchimento: 0.35 }, //   O espelho está lá, vazio.
          { de: t.refletido, cenario: "banheiro", nome: "refletido", modo: "apagada", preenchimento: 0.35 }, // Só o banheiro escuro refletido.
          { de: t.ninguem, cenario: "banheiro", nome: "ninguem", modo: "apagada", preenchimento: 0.75 }, // Nenhuma pessoa, nem você.
          { de: t.frente, cenario: "banheiro", nome: "frente", modo: "apagada", preenchimento: 0.4 }, //  Você está bem na frente dele e o espelho não mostra você.
          { de: t.deNovo, cenario: "banheiro", nome: "deNovo", modo: "apagada", preenchimento: 0.75 }, // Aí você escuta de novo o toc, toc, toc,
          { de: t.quarto, cenario: "quarto2", nome: "quarto", modo: "noite", preenchimento: 0.4 }, //    só que agora vem do espelho do seu quarto,
          { de: t.janela, cenario: "quarto2", nome: "janela", modo: "noite", preenchimento: 0.4 }, //    e da janela,
          { de: t.tela, cenario: "banheiro", nome: "tela", modo: "apagada", preenchimento: 0.3 }, //     e da tela do celular na sua mão.
        ],
        cortesEscuros: [t.toc, t.lanterna, t.porta, t.quarto, t.tela],
        cameras: {
          dorme: { k: [[0, [-1.55, 1.85, -1.05], [-1.78, 0.88, -1.55], 40], [t.relogio, [-1.57, 1.8, -1.1], [-1.78, 0.88, -1.55], 37]], tremor: 0.003 },
          relogio: { k: [[t.relogio, [-1.12, 0.67, -1.36], [-0.95, 0.607, -1.69], 28], [t.escuta, [-1.1, 0.66, -1.42], [-0.95, 0.607, -1.69], 23]], v: [[t.relogio, [-1.15, 0.69, -1.3], [-0.95, 0.607, -1.69], 62], [t.escuta, [-1.13, 0.68, -1.36], [-0.95, 0.607, -1.69], 54]], tremor: 0.002 },
          escuta: { k: [[t.escuta, [-0.3, 1.32, -1.3], [-1.45, 1.25, -0.9], 44], [t.toc, [-0.36, 1.3, -1.25], [-1.45, 1.25, -0.9], 40]], tremor: 0.003 },
          toc: { k: [[t.toc, [0.0, 1.5, -0.55], [0.0, 1.47, -1.5], 52], [t.dedo, [0.0, 1.5, -0.7], [0.0, 1.47, -1.5], 48]], tremor: 0.002 },
          dedo: { k: [[t.dedo, [0.04, 1.5, -0.9], [0.0, 1.47, -1.5], 44], [t.lanterna, [0.03, 1.5, -1.0], [0.0, 1.47, -1.5], 40]], tremor: 0.002 },
          lanterna: { k: [[t.lanterna, [-0.5, 1.3, -0.5], [-1.4, 1.12, -0.9], 46], [t.porta, [-0.55, 1.3, -0.52], [-1.4, 1.12, -0.9], 42]], tremor: 0.003 },
          porta: { k: [[t.porta, [-0.6, 1.5, -0.65], [0.33, 1.4, 1.8], 46], [t.vazio, [-0.55, 1.5, -0.6], [0.3, 1.35, 1.2], 44]], tremor: 0.003 },
          vazio: { k: [[t.vazio, [1.25, 1.78, 0.45], [-0.05, 1.45, -1.5], 44], [t.refletido, [1.22, 1.76, 0.3], [-0.05, 1.45, -1.5], 42]], tremor: 0.003 },
          refletido: { k: [[t.refletido, [0.95, 1.7, -0.2], [-0.05, 1.45, -1.5], 42], [t.ninguem, [0.9, 1.68, -0.32], [-0.05, 1.45, -1.5], 38]], tremor: 0.003 },
          ninguem: { k: [[t.ninguem, [0.0, 1.55, -1.44], [0.0, 1.5, -0.56], 44], [t.frente, [0.0, 1.55, -1.42], [0.0, 1.5, -0.56], 38]], tremor: 0.002 },
          frente: { k: [[t.frente, [0.85, 1.72, 0.48], [-0.12, 1.45, -1.4], 46], [t.deNovo, [0.78, 1.7, 0.3], [-0.12, 1.45, -1.4], 42]], tremor: 0.003 },
          deNovo: { k: [[t.deNovo, [0.32, 1.56, -1.32], [0.0, 1.5, -0.56], 44], [t.quarto, [0.3, 1.56, -1.28], [0.0, 1.5, -0.56], 40]], tremor: 0.004 },
          quarto: { k: [[t.quarto, [1.05, 1.32, -0.35], [1.1, 1.18, -1.443], 46], [t.janela, [1.08, 1.3, -0.5], [1.1, 1.18, -1.443], 42]], tremor: 0.003 },
          janela: { k: [[t.janela, [1.45, 1.55, 0.4], [2.29, 1.55, 0.4], 48], [t.tela, [1.55, 1.55, 0.4], [2.29, 1.55, 0.4], 44]], tremor: 0.003 },
          tela: cameraTela(0.6, 0.03),
        },
        semCabeca: (tt, p) => p.nome === "tela",
        personagem: {
          semente: 3,
          onde: [[0, "quarto2"], [t.toc, "banheiro"], [t.lanterna, "quarto2"], [t.porta, "banheiro"]],
          pos: [
            [0, DEITADO],
            [t.escuta - 0.01, DEITADO],
            [t.escuta, SENTADO_CAMA, "corte"],
            [t.porta - 0.01, SENTADO_CAMA],
            [t.porta, [0.33, ALT, 2.55], "corte"],
            [t.vazio + 0.4, [0.33, ALT, 1.15], "linear"],
            [t.refletido + 1.2, PIA, "linear"],
          ],
          passos: [[t.porta, t.vazio + 0.4, 0.8, 0.55], [t.vazio + 0.4, t.refletido + 1.2, 0.7, 0.5]],
          pose: {
            giro: [[0, 0], [t.escuta, PI / 2, "corte"], [t.porta, PI, "corte"], [t.vazio + 0.4, PI], [t.vazio + 0.9, PI + 0.15, "ambos"], [t.refletido + 1.2, PI, "ambos"]],
            deitar: [[0, -PI / 2], [t.escuta, 0, "corte"]],
            quadril: [[0, 0], [t.escuta, -PI / 2, "corte"], [t.porta, 0, "corte"]],
            joelho: [[0, 0], [t.escuta, 1.5, "corte"], [t.porta, 0, "corte"]],
            cabecaGiro: [[0, 0.1], [t.escuta, 0, "corte"], [T("barulho") , 0], [T("barulho") + 0.6, -0.75, "ambos"], [t.lanterna, -0.5, "corte"], [t.porta, 0, "corte"], [t.deNovo, 0], [T("toque", 4), 0.6, "ambos"], [T("toque", 5), -0.6, "ambos"], [T("toque", 6), 0.3, "ambos"], [t.quarto, 0]],
            cabecaInclina: [[0, 0], [t.escuta, 0.05, "corte"], [t.lanterna, 0.25, "corte"], [t.porta, 0.05, "corte"]],
            olhos: [[0, 1.1], [t.escuta, 1.15], [t.ninguem, 1.25], [T("nem"), 1.4, "sai"], [t.deNovo, 1.35]],
            sobrancelha: [[0, 0.2], [t.escuta, 0.5], [t.ninguem, 0.8], [T("nem"), 1.0, "sai"]],
            sobrancelhaMedo: [[0, 0.3], [t.escuta, 0.6], [t.ninguem, 0.9]],
            boca: [[0, 0], [t.ninguem, 0], [T("nem"), 0.22, "sai"], [t.deNovo, 0.15]],
            ofegar: [[0, 0.4], [t.ninguem, 1.0], [FIM, 1.3]],
          },
          semPiscar: [[t.ninguem, FIM]],
          maos: (tt, pts, ctx, b) => {
            const { frente, direita, cima } = eixos(b);
            // sentado na beira da cama: mãos nas coxas (não afundam no colchão)
            const coxa = (l) => em(b.position, [frente, 0.3], [direita, 0.11 * l]).setY(b.position.y + 0.12);
            const sentado = tt >= t.escuta && tt < t.porta;
            if (tt < t.lanterna) return sentado ? { alvoE: coxa(-1), pesoE: 1, alvoD: coxa(1), pesoD: 1 } : null;
            // o celular-lanterna na frente do peito, virado para frente; na tela final, perto do rosto
            const perto = trilha([[t.tela - 0.05, 0], [t.tela + 0.35, 1, "ambos"]], tt);
            const alvo = em(pts.cabeca, [frente, 0.42 + 0.14 * perto], [cima, -0.42 + 0.22 * perto], [direita, -0.04]);
            return sentado ? { alvoE: alvo, pesoE: 1, alvoD: coxa(1), pesoD: 1 } : { alvoE: alvo, pesoE: 1 };
          },
        },
        celular: (tt) => (tt < t.lanterna ? { cenario: "quarto2", pos: [-0.86, 0.556, -1.66], rot: [-PI / 2, 0, 0.4] } : "mao"),
        tela: (g, tt, desenhar) => {
          const anel = TOQUES_TELA.some(([, , t0]) => tt >= t0 && tt < t0 + 1.4);
          const chave = tt < LUZ_CEL ? "apagada" : anel ? "aneis" + Math.round(tt * 30) : "lanterna";
          if (desenhar) {
            if (tt < LUZ_CEL) {
              g.fillStyle = "#020203";
              g.fillRect(0, 0, 600, 1302);
            } else {
              telaLanterna(g, 600, 1302);
              aneis(g, 600, 1302, tt);
            }
          }
          return chave;
        },
        lanterna: (tt) => (tt >= LUZ_CEL ? 0.95 : 0),
        montar: (ctx) => {
          ctx.celular.scale.setScalar(2.2);
        },
        quadro: (tt, plano, ctx) => {
          const q = ctx.cenarios.quarto2;
          const b = ctx.cenarios.banheiro;
          q.relogio.userData.mostrar("3:33");
          q.cobertor.position.set(0.78, 0.04, -0.22);
          q.cobertor.scale.set(0.45, 0.5, 0.5);
          q.cortinas(0.15);
          q.porta(1.3);
          q.lencolEspelho(false);
          b.porta(1.5);
          b.corredor(0);
          b.torneira(false);
          b.lencol(0);
          b.tecla(false);
          // toques: ondinhas no vidro do banheiro, no espelho do quarto e na janela
          toquesNoVidro(b.materialVidro, TOQUES_BANHEIRO, tt);
          q.espelho.toques(TOQUES_QUARTO, tt);
          q.janela.toques(TOQUES_JANELA, tt);
        },
      });
