      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, MEDIDAS, trilha } from "./assets/js/cena.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { semConexao, lanterna as telaLanterna } from "./assets/js/telas.js";
      import { PALAVRAS } from "./assets/js/tempos/v1-parte05.js";

      const T = tempos(PALAVRAS);
      const PI = Math.PI;
      const ALT = MEDIDAS.quadrilEmPe;
      const FIM = 40.7333;
      const FRASE = ["SE ALGUÉM LER ISSO,", "EU ESTOU VIVO."];
      const t = {
        internet: T("a internet") - 0.15,
        lanterna: T("o celular") - 0.15,
        quinto: T("No quinto") - 0.2,
        escreve: T("No sétimo") - 0.2,
        frase: T("se alguém") - 0.2,
        tres33: T("E todo") - 0.2,
        muda: T("alguma") - 0.2,
        porta: T("Uma porta") - 0.2,
        cadeira: T("uma cadeira") - 0.15,
        pisca: T("uma luz") - 0.15,
        ninguem: T("como se") - 0.15,
      };
      // quanto da frase já está na parede
      const escrito = (tt) => trilha([[T("escreve"), 0], [t.frase, 0.12, "linear"], [T("isso,") + 0.3, 0.58, "linear"], [T("vivo.") + 0.2, 1, "linear"]], tt);
      // ponta da mão na parede: primeira linha, depois a segunda (o texto corre rumo a z-)
      function caneta(k) {
        const corte = FRASE[0].length / (FRASE[0].length + FRASE[1].length);
        if (k < corte) return [-2.3, 1.79, 0.4 - 2.3 * (k / corte)];
        return [-2.3, 1.36, 0.4 - 1.8 * ((k - corte) / (1 - corte))];
      }
      // piscar irregular da lâmpada (determinístico)
      const pisca = (tt) => {
        const k = Math.floor(tt * 11);
        return Math.abs(Math.sin(k * 12.9898) * 43758.5453) % 1 > 0.45 ? 1 : 0;
      };
      function cameraPOV(tt, ctx) {
        const { cabeca } = pontosDoBoneco(ctx.boneco);
        ctx.celular.updateMatrixWorld(true);
        const alvo = ctx.celular.localToWorld(new THREE.Vector3(0, -0.03, 0));
        const dir = alvo.clone().sub(cabeca).normalize();
        return { pos: alvo.clone().addScaledVector(dir, -0.42).add(new THREE.Vector3(0, 0.01, 0)), alvo, fov: 34 };
      }
      const giroCadeira = Math.atan2(2.2 - 3.5, 1.55 - 2.2);

      iniciarParte({
        host: "__parte05",
        cenarios: ["quarto", "terreo"],
        planos: [
          { de: 0, cenario: "quarto", nome: "energia", modo: "noite" }, //                  No terceiro dia, a energia cai de vez,
          { de: t.internet, cenario: "quarto", nome: "internet", modo: "noite" }, //        a internet some,
          { de: t.lanterna, cenario: "quarto", nome: "lanterna", modo: "noite", preenchimento: 0.2 }, // o celular vira só uma lanterna.
          { de: t.quinto, cenario: "quarto", nome: "quinto" }, //                           No quinto dia, você começa a falar sozinho, só pra ouvir uma voz.
          { de: t.escreve, cenario: "quarto", nome: "escreve" }, //                         No sétimo dia, você escreve na parede do quarto,
          { de: t.frase, cenario: "quarto", nome: "frase" }, //                             se alguém ler isso, eu estou vivo.
          { de: t.tres33, cenario: "quarto", nome: "tres33", modo: "noite" }, //            E todo dia, às 3h33 da madrugada,
          { de: t.muda, cenario: "terreo", nome: "muda", modo: "noite", preenchimento: 0 }, // alguma coisa muda dentro da casa.
          { de: t.porta, cenario: "quarto", nome: "porta", modo: "noite", preenchimento: 0.3 }, // Uma porta aberta,
          { de: t.cadeira, cenario: "terreo", nome: "cadeira", modo: "noite", preenchimento: 0 }, // uma cadeira fora do lugar,
          { de: t.pisca, cenario: "quarto", nome: "pisca", modo: "noite", preenchimento: 0 }, //  uma luz que pisca mesmo sem energia,
          { de: t.ninguem, cenario: "quarto", nome: "ninguem", modo: "noite", preenchimento: 0.7 }, // como se alguém estivesse ali, só que você não consegue ver.
        ],
        cortesEscuros: [t.quinto, t.tres33, t.muda],
        cameras: {
          energia: { k: [[0, [-0.8, 1.5, -0.7], [1.05, 1.3, 3.6], 44], [t.internet, [-0.6, 1.5, -0.4], [1.05, 1.3, 3.6], 42]], tremor: 0.003 },
          internet: cameraPOV,
          lanterna: { k: [[t.lanterna, [2.0, 1.65, -1.9], [0.9, 1.15, 1.4], 46], [t.quinto, [1.8, 1.6, -1.6], [0.9, 1.15, 1.6], 44]], tremor: 0.004 },
          quinto: { k: [[t.quinto, [1.6, 1.2, -0.1], [0.0, 1.12, -1.0], 40], [t.escreve, [1.15, 1.2, -0.45], [0.0, 1.15, -1.0], 36]], tremor: 0.003 },
          escreve: { k: [[t.escreve, [-0.1, 1.65, 1.0], [-2.38, 1.55, -0.6], 48], [t.frase, [-0.2, 1.62, 0.9], [-2.38, 1.55, -0.7], 46]], tremor: 0.003 },
          frase: { k: [[t.frase, [-0.25, 1.6, 0.95], [-2.38, 1.55, -0.85], 52], [t.tres33, [-0.05, 1.58, 0.5], [-2.38, 1.55, -0.85], 56]], v: [[t.frase, [0.55, 1.7, 1.75], [-2.38, 1.5, -0.95], 64], [t.tres33, [0.7, 1.68, 1.5], [-2.38, 1.5, -1.05], 68]], tremor: 0.002 },
          tres33: { k: [[t.tres33, [0.24, 0.57, -1.22], [0.454, 0.505, -1.617], 30], [t.muda, [0.3, 0.55, -1.33], [0.454, 0.505, -1.617], 30]], tremor: 0.002 },
          muda: { k: [[t.muda, [-2.7, 1.6, 3.0], [1.5, 0.9, -1.5], 52], [t.porta, [-2.2, 1.55, 2.3], [1.5, 0.9, -1.5], 48]], tremor: 0.004 },
          porta: { k: [[t.porta, [1.2, 1.6, 2.86], [0.4, 1.05, 5.5], 52], [t.cadeira, [1.19, 1.59, 2.93], [0.4, 1.05, 5.5], 48]], tremor: 0.005 },
          cadeira: { k: [[t.cadeira, [3.65, 1.75, 3.25], [2.0, 0.55, 1.3], 50], [t.pisca, [3.6, 1.72, 3.15], [2.0, 0.55, 1.3], 47]], tremor: 0.004 },
          pisca: { k: [[t.pisca, [1.05, 1.0, 3.0], [1.05, 2.6, 4.6], 50], [t.ninguem, [1.05, 1.05, 3.4], [1.05, 2.6, 4.7], 50]], tremor: 0.004 },
          ninguem: { k: [[t.ninguem, [0.7, 1.72, 2.6], [1.0, 1.35, 7.5], 44], [FIM, [0.75, 1.68, 3.7], [1.0, 1.35, 7.5], 40, "linear"]], tremor: 0.005 },
        },
        personagem: {
          onde: [[0, "quarto"], [t.muda, "terreo"], [t.porta, "quarto"], [t.cadeira, "terreo"], [t.pisca, "quarto"]],
          pos: [
            [0, [1.05, ALT, 1.35]],
            [t.quinto - 0.01, [1.05, ALT, 1.35]],
            [t.quinto, [0.0, 0.43, -0.95]],
            [t.escreve - 0.01, [0.0, 0.43, -0.95]],
            [t.escreve, [-1.85, ALT, 0.85]],
            ...Array.from({ length: 9 }, (_, i) => {
              const tt = T("escreve") + ((T("vivo.") - T("escreve")) * i) / 8;
              return [tt, [-1.85, ALT, caneta(escrito(tt))[2] + 0.25], "linear"];
            }),
            [T("vivo.") + 0.3, [-1.85, ALT, -1.6]],
            [t.tres33 - 0.01, [-1.55, ALT, -1.95], "sai"],
            [t.muda, [3.0, ALT, 3.0], "corte"],
            [t.porta, [1.2, ALT, 2.9], "corte"],
            [t.cadeira, [3.5, ALT, 2.2], "corte"],
            [t.pisca, [1.35, ALT, 4.9], "corte"],
          ],
          visivel: (tt, p) => ["energia", "lanterna", "quinto", "escreve", "frase", "porta", "cadeira", "ninguem"].includes(p.nome),
          pose: {
            giro: [[0, 0], [t.quinto, PI / 2, "corte"], [t.escreve, -PI / 2, "corte"], [T("vivo.") + 0.3, -PI / 2], [T("vivo.") + 0.8, -1.2], [t.muda, PI, "corte"], [t.porta, -0.33, "corte"], [t.cadeira, giroCadeira, "corte"], [t.pisca, 0, "corte"]],
            cabecaInclina: [[0, 0.15], [t.internet, 0.4], [t.lanterna, 0.1], [t.quinto, 0.3], [t.escreve, -0.1], [t.frase, -0.05], [t.ninguem, 0.0]],
            cabecaGiro: [[0, 0], [t.quinto, 0.2], [t.quinto + 2.5, -0.25, "ambos"], [t.escreve, 0], [t.ninguem, 0], [T("não") , 0], [T("ver."), 1.35, "sai"]],
            boca: [[0, 0], ...Array.from({ length: 34 }, (_, i) => [T("você") + i * 0.1, i % 3 === 2 ? 0.05 : 0.2 + 0.25 * ((i * 7) % 5) / 4]), [T("voz.") + 0.4, 0]],
            apertar: [[0, 0.2], [t.quinto, 0.35], [t.escreve, 0.25], [t.ninguem, 0.0], [T("ver."), -0.2]],
            quadril: [[0, 0], [t.quinto, -PI / 2], [t.escreve, 0]],
            joelho: [[0, 0], [t.quinto, 1.5], [t.escreve, 0]],
            ombro: [[0, 0], [t.quinto, -0.45], [t.escreve, 0]],
            cotovelo: [[0, 0.15], [t.quinto, 0.9], [t.escreve, 0.15]],
            inclinar: [[0, 0], [t.quinto, 0.2], [t.escreve, 0.0]],
          },
          maos: (tt, pts, ctx) => {
            const r = {};
            if (tt >= T("escreve") - 0.3 && tt < T("vivo.") + 0.3) {
              const [x, y, z] = caneta(escrito(tt));
              r.alvoD = new THREE.Vector3(x, y, z).add(ctx.cenarios.quarto.grupo.position);
              r.pesoD = trilha([[T("escreve") - 0.3, 0], [T("escreve"), 1, "ambos"], [T("vivo."), 1], [T("vivo.") + 0.3, 0]], tt);
            }
            if (tt >= t.internet && tt < t.quinto || tt >= t.muda) {
              const giro = ctx.boneco.rotation.y;
              const frente = new THREE.Vector3(Math.sin(giro), 0, Math.cos(giro));
              r.alvoE = pts.cabeca.clone().addScaledVector(frente, 0.32).add(new THREE.Vector3(0, -0.28, 0));
              r.pesoE = 1;
            }
            return r.alvoD || r.alvoE ? r : null;
          },
        },
        semCabeca: (tt, p) => p.nome === "internet" || p.nome === "porta",
        celular: (tt) => (tt >= t.internet && tt < t.quinto) || tt >= t.muda ? "mao" : null,
        tela: (ctx2d, tt, desenhar) => {
          const chave = tt < t.lanterna ? "semConexao" : "lanterna";
          if (desenhar) chave === "semConexao" ? semConexao(ctx2d, 600, 1302, "21:40") : telaLanterna(ctx2d, 600, 1302);
          return chave;
        },
        lanterna: (tt) => (tt >= t.lanterna && tt < t.quinto ? 0.7 : tt >= t.porta && tt < t.pisca ? 0.9 : tt >= t.ninguem ? 0.6 : 0),
        quadro: (tt, plano, ctx) => {
          const c = ctx.cenarios;
          const q = c.quarto;
          q.cobertor(1);
          q.relogio.userData.mostrar("3:33");
          // a energia cai: o corredor apaga; às 3:33 a lâmpada pisca sem energia
          q.luzCorredor(tt < T("cai") ? 1 : tt >= t.pisca ? pisca(tt) : 0);
          q.portaLateral(trilha([[t.porta, 0], [T("aberta,") - 0.3, 0], [T("aberta,") + 0.7, -1.25, "sai"]], tt));
          q.escrita(tt >= t.escreve && tt < t.tres33 ? FRASE : null, escrito(tt));
          c.terreo.cadeiraFora(tt >= t.cadeira ? 1 : 0);
          c.terreo.cafe(false);
          c.terreo.lampada(0);
        },
      });
