      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, MEDIDAS, trilha } from "./assets/js/cena.js";
      import { PALAVRAS } from "./assets/js/tempos/v2-parte10.js";

      const T = tempos(PALAVRAS);
      const PI = Math.PI;
      const ALT = MEDIDAS.quadrilEmPe;
      const FIM = 41.7;
      const t = {
        espelho: T("Toda vez") - 0.15,
        distraido: T("Mas às") - 0.15,
        atrasa: T("você atrasa") - 0.15,
        percebe: T("só pra") - 0.15,
        fala: T("E agora") - 0.15,
        certeza: T("você tem") - 0.15,
        comenta: T("Comenta") - 0.2,
      };
      // agora "ele" é o sósia (do lado de fora) e "você" é o reflexo, preso no espelho
      const PIA = [0, ALT, -0.6];
      const GR = [1.1, ALT, -0.9];
      const VIRA1 = T("segundinho,") - 0.5; // o sósia olha para um lado e para o outro
      const ATRASO_FIM = VIRA1 + 1.45 + 1.05; // o reflexo termina o mesmo movimento 1 s depois e volta a copiar
      const OLHA_CAMERA = T("E agora") + 0.2;

      const eixos = (b) => {
        const g = b.rotation.y;
        return { frente: new THREE.Vector3(Math.sin(g), 0, Math.cos(g)), direita: new THREE.Vector3(-Math.cos(g), 0, Math.sin(g)), cima: new THREE.Vector3(0, 1, 0) };
      };
      const em = (base, ...pares) => pares.reduce((v, [d, k]) => v.addScaledVector(d, k), base.clone());
      const noBanheiro = (ctx, x, y, z) => new THREE.Vector3(x, y, z).add(ctx.cenarios.banheiro.grupo.position);

      iniciarParte({
        host: "__parte10",
        cenarios: ["banheiro", "quarto2"],
        exposicao: 1.15,
        planos: [
          { de: 0, cenario: "banheiro", nome: "aqui", modo: "manha", preenchimento: 0.45 }, //               Desde aquele dia, você vive aqui, copiando cada movimento dele.
          { de: t.espelho, cenario: "quarto2", nome: "espelho", modo: "dia", preenchimento: 0.55 }, //      Toda vez que ele passa por um espelho, você é obrigado a aparecer e repetir.
          { de: t.distraido, cenario: "banheiro", nome: "distraido", modo: "manha", preenchimento: 0.45 }, // Mas às vezes, quando ele está distraído,
          { de: t.atrasa, cenario: "banheiro", nome: "atrasa", modo: "manha", preenchimento: 0.45 }, //     você atrasa só um segundinho,
          { de: t.percebe, cenario: "banheiro", nome: "percebe", modo: "manha", preenchimento: 0.5 }, //    só pra ver se ele percebe.
          { de: t.fala, cenario: "banheiro", nome: "fala", modo: "manha", preenchimento: 0.5 }, //          E agora me fala uma coisa, da última vez que você se olhou no espelho,
          { de: t.certeza, cenario: "banheiro", nome: "certeza", modo: "manha", preenchimento: 0.5 }, //    você tem certeza que ele te copiou na hora certa?
          { de: t.comenta, cenario: "banheiro", nome: "comenta", modo: "noiteAcesa", preenchimento: 0.4 }, // Comenta aqui... às 3h33? Se inscreve no Ninguém Sabe...
        ],
        cortesEscuros: [t.comenta],
        cameras: {
          // de dentro do espelho: atrás do reflexo (você), olhando o sósia pelo vidro
          aqui: { k: [[0, [-0.42, 1.72, -2.95], [0.05, 1.42, -0.6], 44], [t.espelho, [-0.36, 1.7, -2.82], [0.05, 1.42, -0.6], 40]], tremor: 0.002 },
          espelho: { k: [[t.espelho, [-0.4, 1.5, 0.55], [0.9, 1.15, -1.4], 50], [t.distraido, [-0.25, 1.48, 0.42], [1.0, 1.15, -1.4], 46]], tremor: 0.002 },
          distraido: { k: [[t.distraido, [0.55, 1.62, 0.18], [0.0, 1.42, -1.5], 42], [t.atrasa, [0.5, 1.6, 0.08], [0.0, 1.42, -1.5], 39]], tremor: 0.002 },
          atrasa: { k: [[t.atrasa, [-0.56, 1.6, 0.12], [0.05, 1.45, -1.5], 42], [t.percebe, [-0.5, 1.58, 0.02], [0.05, 1.45, -1.5], 39]], tremor: 0.002 },
          percebe: { k: [[t.percebe, [0.13, 1.5, -1.24], [0.0, 1.44, -2.4], 32], [t.fala, [0.12, 1.5, -1.27], [0.0, 1.44, -2.4], 28]], tremor: 0.002 },
          fala: { k: [[t.fala, [0.45, 1.48, -0.96], [0.0, 1.42, -2.4], 40], [t.certeza, [0.42, 1.48, -1.0], [0.0, 1.42, -2.4], 36]], tremor: 0.002 },
          certeza: { k: [[t.certeza, [0.3, 1.47, -1.15], [0.0, 1.43, -2.4], 28], [t.comenta, [0.29, 1.47, -1.18], [0.0, 1.43, -2.4], 22]], tremor: 0.002 },
          comenta: { k: [[t.comenta, [0.0, 1.55, 0.6], [0.0, 1.42, -1.5], 44], [FIM, [0.0, 1.52, 0.1], [0.0, 1.42, -1.5], 36]], tremor: 0.002 },
        },
        pos: (tt, p) => ({ tom: p.nome === "aqui" ? 0.6 : 0, onda: 0 }),
        personagem: {
          semente: 9,
          onde: [[0, "banheiro"], [t.espelho, "quarto2"], [t.distraido, "banheiro"]],
          // o sósia sai do banheiro no fim: só o reflexo fica no espelho
          visivel: (tt) => tt < t.comenta,
          pos: [
            [0, PIA],
            [t.espelho, [-0.4, ALT, -0.85], "corte"],
            [T("passa") + 0.9, [1.1, ALT, -0.85], "linear"],
            [T("passa") + 1.2, GR, "sai"],
            [t.distraido, PIA, "corte"],
          ],
          passos: [[t.espelho, T("passa") + 1.2, 1, 0.62]],
          pose: {
            giro: [[0, PI], [t.espelho, PI / 2, "corte"], [T("passa") + 0.8, PI / 2], [T("passa") + 1.25, PI, "ambos"], [t.distraido, PI, "corte"]],
            inclinar: [[0, 0.02], [t.distraido, 0.08, "corte"], [t.fala, 0.25, "corte"]],
            cabecaInclina: [
              [0, 0.02], [t.espelho, 0.05, "corte"], [t.distraido, 0.42, "corte"], [VIRA1 - 0.2, 0.42], [VIRA1, 0.12, "ambos"],
              [ATRASO_FIM + 0.1, 0.12], [ATRASO_FIM + 0.5, 0.0, "ambos"], [t.fala, 0.5, "corte"],
            ],
            cabecaGiro: [[0, 0], [t.espelho, 0, "corte"], [T("passa"), 0.0], [T("passa") + 0.4, -0.55, "ambos"], [T("passa") + 1.25, 0, "ambos"], [t.distraido, 0, "corte"], [VIRA1, 0], [VIRA1 + 0.4, 0.55, "ambos"], [VIRA1 + 1.0, -0.45, "ambos"], [VIRA1 + 1.45, 0, "ambos"]],
            apertar: [[0, 0], [ATRASO_FIM + 0.3, 0], [T("percebe.") , 0.6, "ambos"], [t.fala, 0, "corte"]],
            sobrancelha: [[0, 0.1], [ATRASO_FIM + 0.3, 0.1], [T("percebe."), -0.5, "ambos"], [t.fala, 0, "corte"]],
            sorriso: [[0, 0.3], [t.espelho, 0.3], [t.distraido, 0.1, "corte"], [t.fala, 0.25, "corte"]],
            olhos: [[0, 1.0]],
          },
          maos: (tt, pts, ctx, b) => {
            const { frente, direita, cima } = eixos(b);
            // passa a mão no cabelo (no banheiro, e de novo na frente do espelho do quarto)
            for (const [a, z] of [[0.6, 3.4], [T("repetir.") - 0.5, T("repetir.") + 0.9]]) {
              if (tt >= a && tt < z) {
                const p = trilha([[a, 0], [a + 0.5, 1, "ambos"], [z - 0.5, 1], [z, 0, "ambos"]], tt);
                const vai = trilha([[a + 0.5, 0], [z - 0.5, 1]], tt);
                return { alvoD: em(pts.cabeca, [direita, 0.22 - 0.3 * vai], [cima, 0.05], [frente, -0.05]), pesoD: p };
              }
            }
            // o celular na mão, olhando para baixo
            if (tt >= t.distraido && tt < ATRASO_FIM + 0.7) {
              // ao guardar o celular, a mão desce pelo lado do corpo (longe da pia) antes de soltar
              const desce = trilha([[ATRASO_FIM, 0], [ATRASO_FIM + 0.4, 1, "ambos"]], tt);
              const p = trilha([[ATRASO_FIM + 0.4, 1], [ATRASO_FIM + 0.7, 0, "ambos"]], tt);
              const alvo = em(pts.cabeca, [frente, 0.33], [cima, -0.42], [direita, -0.04]).lerp(em(b.position, [direita, -0.3], [cima, 0.06]), desce);
              return { alvoE: alvo, pesoE: p };
            }
            // lavando as mãos na pia (de cabeça baixa)
            if (tt >= t.fala) {
              const lava = 0.02 * Math.sin(tt * 9);
              return { alvoE: noBanheiro(ctx, -0.11 + lava, 1.12, -1.1), pesoE: 1, alvoD: noBanheiro(ctx, 0.11 - lava, 1.12, -1.1), pesoD: 1 };
            }
            return null;
          },
        },
        celular: (tt) => (tt >= t.distraido && tt < ATRASO_FIM + 0.45 ? "mao" : null),
        tela: (g, tt, desenhar) => {
          if (desenhar) {
            g.fillStyle = "#15171b";
            g.fillRect(0, 0, 600, 1302);
          }
          return "tela";
        },
        montar: (ctx) => ctx.celular.scale.setScalar(2.2),
        // você (o reflexo): copia; quando ele se distrai, atrasa um segundo; depois olha para a câmera
        reflexo: {
          cenario: "banheiro",
          atraso: (tt) => (tt >= VIRA1 - 0.05 && tt < ATRASO_FIM ? 1.0 : 0),
          janelas: [
            {
              de: t.fala - 0.05,
              ate: FIM + 1,
              pos: [[0, PIA]],
              passos: [],
              semPiscar: [[t.fala, FIM + 1]],
              pose: {
                giro: [[0, PI]],
                inclinar: [[0, 0]],
                quadril: [[0, 0]],
                joelho: [[0, 0]],
                // olha para a câmera (a câmera do lado de cá, espelhada: o olhar acompanha cada plano)
                cabecaGiro: [[0, 0], [OLHA_CAMERA - 0.3, 0], [OLHA_CAMERA + 0.4, -0.3, "ambos"], [t.certeza, -0.235, "corte"], [t.comenta, 0, "corte"]],
                cabecaInclina: [[0, 0.0], [OLHA_CAMERA + 0.4, -0.02, "ambos"]],
                cabecaTomba: [[0, 0], [T("certa?"), 0.0], [T("certa?") + 0.4, 0.14, "ambos"], [t.comenta, 0.08, "corte"]],
                olhos: [[0, 1.0], [OLHA_CAMERA + 0.4, 1.08]],
                apertar: [[0, 0]],
                sobrancelha: [[0, 0], [T("certa?"), 0.25, "ambos"], [t.comenta, 0.1, "corte"]],
                sobrancelhaMedo: [[0, 0]],
                sorriso: [[0, 0], [T("certa?") - 0.2, 0], [T("certa?") + 0.4, 0.55, "ambos"], [t.comenta, 0.2, "corte"], [T("sobre"), 0.25], [T("sobre") + 0.6, 1.0, "ambos"]],
                sorrisoLargo: [[0, 0], [T("sobre"), 0], [T("sobre") + 0.8, 0.45, "ambos"]],
                boca: [[0, 0]],
                ofegar: [[0, 0]],
              },
              maos: () => null,
            },
          ],
        },
        quadro: (tt, plano, ctx) => {
          const b = ctx.cenarios.banheiro;
          const q = ctx.cenarios.quarto2;
          b.porta(1.5);
          b.corredor(tt >= t.comenta ? 0.6 : 0);
          b.torneira(tt >= t.fala && tt < t.comenta);
          b.tecla(true);
          b.lencol(0);
          b.derrubar(0);
          b.quebrar(-1);
          b.espelhoVisivel(true);
          q.lencolEspelho(false);
          q.cortinas(0.1);
          q.relogio.userData.mostrar("7:40");
          q.porta(1.3);
        },
      });
