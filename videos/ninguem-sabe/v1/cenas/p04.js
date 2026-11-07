      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, MEDIDAS, trilha } from "./assets/js/cena.js";
      import { lanterna as telaLanterna } from "./assets/js/telas.js";
      import { PALAVRAS } from "./assets/js/tempos/v1-parte04.js";

      const T = tempos(PALAVRAS);
      const PI = Math.PI;
      const ALT = MEDIDAS.quadrilEmPe;
      const FIM = 38.8333;
      const degrau = (z) => Math.min(2.66, Math.max(0, 0.19 * (1 + (2.2 - z) / 0.35)));
      const naEscada = (z) => [-3.55, degrau(z) + ALT, z];
      const t = {
        percebe: T("e você") - 0.15,
        acender: T("ninguém") - 0.2,
        apagam: T("uma por") - 0.2,
        pretos: T("os prédios") - 0.2,
        observando: T("o silêncio") - 0.15,
        tranca: T("você volta") - 0.2,
        acordado: T("e fica") - 0.15,
        tres33: T("Porque") - 0.2,
        barulho: T("você ouve") - 0.25,
        desce: T("Você desce") - 0.2,
        cozinha: T("a cozinha") - 0.15,
        xicara: T("mas a") - 0.2,
      };
      const XICARA_GIRO = Math.atan2(0.62 - 0.25, 0.18 - 1.25);

      iniciarParte({
        host: "__parte04",
        cenarios: ["cidade", "terreo", "quarto"],
        planos: [
          { de: 0, cenario: "cidade", nome: "sol", modo: "entardecer" }, //                 Mas aí o sol se põe
          { de: t.percebe, cenario: "cidade", nome: "percebe", modo: "entardecer" }, //     e você percebe uma coisa que não tinha pensado,
          { de: t.acender, cenario: "cidade", nome: "acender", modo: "entardecer" }, //     ninguém vai acender as luzes,
          { de: t.apagam, cenario: "cidade", nome: "apagam", modo: "entardecer" }, //       uma por uma as ruas apagam,
          { de: t.pretos, cenario: "cidade", nome: "pretos", modo: "noite" }, //            os prédios ficam pretos,
          { de: t.observando, cenario: "cidade", nome: "observando", modo: "noite" }, //    o silêncio ... está te observando,
          { de: t.tranca, cenario: "terreo", nome: "tranca", modo: "noite" }, //            você volta pra casa, tranca a porta
          { de: t.acordado, cenario: "quarto", nome: "acordado", modo: "noite" }, //        e fica acordado.
          { de: t.tres33, cenario: "quarto", nome: "tres33", modo: "noite" }, //            Porque às 3 e 33 da madrugada
          { de: t.barulho, cenario: "quarto", nome: "barulho", modo: "noite" }, //          você ouve um barulho no andar de baixo.
          { de: t.desce, cenario: "terreo", nome: "desce", modo: "noite", preenchimento: 0 }, //    Você desce,
          { de: t.cozinha, cenario: "terreo", nome: "cozinha", modo: "noite", preenchimento: 0 }, // a cozinha está vazia,
          { de: t.xicara, cenario: "terreo", nome: "xicara", modo: "noite", preenchimento: 0 }, //  mas a xícara de café que estava cheia agora está vazia também.
        ],
        cortesEscuros: [t.tranca, t.desce],
        cameras: {
          sol: { k: [[0, [2.5, 6.5, 22], [0, 9, -60], 50], [t.percebe, [2.2, 6.0, 19], [0, 8.5, -60], 50]], tremor: 0.002 },
          percebe: { k: [[t.percebe, [0.85, 1.55, -1.75], [0.5, 1.5, 0], 34], [t.acender, [0.75, 1.55, -1.45], [0.5, 1.5, 0], 32]], tremor: 0.003 },
          acender: { k: [[t.acender, [3.2, 1.2, 9], [0, 5, -60], 46], [t.apagam, [3.0, 1.3, 8], [0, 5, -60], 46]], tremor: 0.003 },
          apagam: { k: [[t.apagam, [6, 14, 16], [0, 4, -60], 50], [t.pretos, [5.5, 13, 13], [0, 4, -60], 50]], tremor: 0.002 },
          pretos: { k: [[t.pretos, [0, 30.5, 71], [0, 12, -60], 50], [t.observando, [0, 30.0, 70], [0, 11, -60], 48]], tremor: 0.002 },
          observando: { k: [[t.observando, [-9.6, 9.5, -9.5], [0.5, 1.0, 0], 26], [t.tranca, [-9.2, 9.0, -8.2], [0.5, 1.0, 0], 18]], tremor: 0.006 },
          tranca: { k: [[t.tranca, [3.0, 1.5, 2.0], [2.1, 1.15, 3.5], 42], [t.acordado, [2.9, 1.45, 2.2], [2.1, 1.15, 3.5], 40]], tremor: 0.003 },
          acordado: { k: [[t.acordado, [1.8, 1.15, 0.25], [0.0, 1.05, -1.05], 40], [t.tres33, [1.6, 1.15, 0.05], [0.0, 1.08, -1.05], 38]], tremor: 0.003 },
          tres33: { k: [[t.tres33, [0.24, 0.57, -1.22], [0.454, 0.505, -1.617], 30], [t.barulho, [0.3, 0.55, -1.33], [0.454, 0.505, -1.617], 30]], tremor: 0.002 },
          barulho: { k: [[t.barulho, [0.75, 1.32, 0.35], [0.0, 1.25, -0.95], 36], [t.desce, [0.6, 1.3, 0.15], [0.0, 1.25, -0.95], 34]], tremor: 0.003 },
          desce: { k: [[t.desce, [-3.4, 3.3, -2.3], [-3.5, 1.0, 1.6], 50], [t.cozinha, [-3.4, 3.2, -1.9], [-3.5, 0.8, 2.0], 50]], tremor: 0.005 },
          cozinha: { k: [[t.cozinha, [3.4, 1.7, 2.9], [0.5, 0.8, -1.5], 52], [t.xicara, [3.2, 1.65, 2.6], [0.5, 0.8, -1.5], 50]], tremor: 0.004 },
          xicara: { k: [[t.xicara, [0.38, 1.28, 0.55], [0.62, 0.84, 0.19], 34], [FIM, [0.52, 1.18, 0.36], [0.62, 0.84, 0.19], 28]], tremor: 0.002 },
        },
        personagem: {
          onde: [[0, "cidade"], [t.tranca, "terreo"], [t.acordado, "quarto"], [t.desce, "terreo"]],
          pos: [
            [0, [0.5, ALT, 0]],
            [t.tranca - 0.01, [0.5, ALT, 0]],
            [t.tranca, [1.9, ALT, 2.85]],
            [t.acordado - 0.01, [1.9, ALT, 2.85]],
            [t.acordado, [0.0, 0.43, -0.95]],
            [t.desce - 0.01, [0.0, 0.43, -0.95]],
            [t.desce, naEscada(-0.4)],
            [t.desce + 0.6, naEscada(0.3), "linear"],
            [t.cozinha, naEscada(1.0), "linear"],
            [t.cozinha + 0.01, [0.4, ALT, 2.2]],
            [t.xicara - 0.01, [0.4, ALT, 1.6], "linear"],
            [t.xicara, [0.25, ALT, 1.25]],
          ],
          passos: [[t.desce, t.cozinha, 0.7], [t.cozinha + 0.01, t.xicara - 0.05, 0.8]],
          visivel: (tt, p) => !["sol", "acender", "apagam", "pretos", "tres33", "xicara"].includes(p.nome),
          pose: {
            giro: [[0, PI], [t.tranca, 0, "corte"], [t.acordado, PI / 2, "corte"], [t.desce, 0, "corte"], [t.cozinha, PI, "corte"], [t.xicara, XICARA_GIRO, "corte"]],
            cabecaInclina: [[0, 0.1], [t.percebe, 0.0], [t.observando, 0.05], [t.tranca, 0.25], [t.acordado, 0.0], [t.barulho, 0.0], [T("barulho"), 0.12, "sai"], [t.desce, 0.35], [t.cozinha, 0.2], [t.xicara, 0.45]],
            cabecaGiro: [[0, 0], [t.percebe + 1.5, 0.15], [t.observando, -0.3], [t.observando + 3, 0.35, "ambos"], [t.acordado, 0.3], [t.barulho, 0.3], [T("barulho") + 0.1, -1.0, "sai"], [t.desce, 0]],
            olhos: [[0, 1], [t.percebe + 0.6, 1], [t.percebe + 0.66, 0.05], [t.percebe + 0.74, 1]],
            apertar: [[0, 0.1], [t.percebe + 1.2, 0.0], [T("pensado,") , -0.2], [t.acordado, 0.0], [t.barulho, 0.0], [T("barulho") + 0.05, -0.25]],
            quadril: [[0, 0], [t.acordado, -PI / 2], [t.desce, 0]],
            joelho: [[0, 0], [t.acordado, 1.5], [t.desce, 0]],
            ombro: [[0, 0], [t.acordado, -0.55], [t.desce, 0]],
            cotovelo: [[0, 0.15], [t.acordado, 0.9], [t.desce, 0.15]],
            inclinar: [[0, 0], [t.acordado, 0.08], [T("barulho"), -0.06, "sai"], [t.desce, 0.05]],
          },
          // mão direita no ferrolho; mão esquerda com o celular-lanterna na frente do corpo
          maos: (tt, pts, ctx) => {
            if (tt >= t.tranca && tt < t.acordado) {
              const alvo = new THREE.Vector3(2.2, 1.15, 3.5).add(ctx.cenarios.terreo.grupo.position);
              return { alvoD: alvo, pesoD: trilha([[t.tranca, 0], [T("tranca") - 0.2, 1, "ambos"]], tt) };
            }
            if (tt >= t.desce) {
              const g = trilha([[0, 0], [t.cozinha, PI], [t.xicara, XICARA_GIRO]].map(([a, b], i) => [a, b, i ? "linear" : undefined]), tt);
              const giro = tt >= t.xicara ? XICARA_GIRO : tt >= t.cozinha ? PI : 0;
              const frente = new THREE.Vector3(Math.sin(giro), 0, Math.cos(giro));
              return { alvoE: pts.cabeca.clone().addScaledVector(frente, 0.32).add(new THREE.Vector3(0, -0.28, 0)), pesoE: 1 };
            }
            return null;
          },
        },
        celular: (tt) => (tt >= t.desce ? "mao" : null),
        tela: (ctx2d, tt, desenhar) => {
          if (desenhar) telaLanterna(ctx2d, 600, 1302);
          return "lanterna";
        },
        lanterna: (tt) => (tt >= t.xicara ? 0.06 : tt >= t.desce ? 0.7 : 0),
        chacoalhar: (tt) => (tt >= T("barulho") && tt < T("barulho") + 0.45 ? 1 : 0),
        quadro: (tt, plano, ctx) => {
          const c = ctx.cenarios;
          // as luzes da cidade: acesas no pôr do sol, apagando uma a uma, prédios pretos à noite
          c.cidade.luzes(trilha([[0, 1], [t.apagam, 0.95], [t.pretos, 0.25, "linear"], [t.pretos + 1.6, 0.0, "linear"]], tt));
          c.cidade.semaforos(true);
          c.cidade.fumaca(false);
          c.terreo.trancar(trilha([[T("tranca") - 0.1, 0], [T("tranca") + 0.4, 1, "sai"]], tt));
          c.terreo.cafe(tt < t.desce);
          c.terreo.lampada(0);
          c.terreo.porta(0);
          c.quarto.cobertor(1);
          c.quarto.escrita(null);
          c.quarto.luzCorredor(0.2);
          c.quarto.relogio.userData.mostrar(tt < t.tres33 ? "2:47" : "3:33");
        },
      });
