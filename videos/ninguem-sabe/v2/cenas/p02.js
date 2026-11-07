      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, MEDIDAS, trilha } from "./assets/js/cena.js";
      import { EspelhoPlano } from "./assets/js/reflexo.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { fonte, barraDeStatus } from "./assets/js/telas.js";
      import { PALAVRAS } from "./assets/js/tempos/v2-parte02.js";

      const T = tempos(PALAVRAS);
      const PI = Math.PI;
      const ALT = MEDIDAS.quadrilEmPe;
      const C = 0.12; // altura da calçada
      const FIM = 44.2333;
      const t = {
        escola: T("Escola,") - 0.15,
        celular: T("celular,") - 0.12,
        almoco: T("almoço.") - 0.12,
        estranhas: T("Mas tem") - 0.15,
        tela: T("Na tela") - 0.15,
        pisca: T("pisca") - 0.35,
        rosto: T("quando você") - 0.1,
        vitrine: T("Na vitrine") - 0.15,
        tenta: T("Você tenta") - 0.15,
        onibus: T("Até que,") - 0.15,
        olha: T("você olha") - 0.15,
        naoEsta: T("e o reflexo") - 0.15,
        reto: T("Ele está sentado") - 0.15,
        piscaEle: T("Você pisca") - 0.15,
        desce: T("Você desce") - 0.15,
        casa: T("e vai andando") - 0.15,
      };
      const SENTADO_MESA = [0.02, 0.57, -0.06];
      const SENTADO_BUS = [-0.5, 0.56, 0.84];
      const BANCO_PONTO = [10.0, C + 0.6, 1.6];
      const PISCA_REFLEXO = T("pisca") + 0.05;
      const PISCA_ELE = T("pisca", 2) + 0.05;
      const SOLTA_BUS = PISCA_ELE + 0.25;
      // cabeça dele na vitrine: olha para o vidro e volta; o reflexo faz o mesmo 0,8 s depois
      const CG_VITRINE = [[t.vitrine, 0], [T("padaria,") - 0.2, 0], [T("padaria,") + 0.35, -1.0, "ambos"], [T("cabeça.") + 0.2, -1.0], [T("cabeça.") + 0.7, 0, "ambos"]];

      const eixos = (b) => {
        const g = b.rotation.y;
        return { frente: new THREE.Vector3(Math.sin(g), 0, Math.cos(g)), direita: new THREE.Vector3(-Math.cos(g), 0, Math.sin(g)), cima: new THREE.Vector3(0, 1, 0) };
      };
      const em = (base, ...pares) => pares.reduce((v, [d, k]) => v.addScaledVector(d, k), base.clone());
      // sentado: as duas mãos descansando nas coxas
      const noColo = (b) => {
        const { frente, direita } = eixos(b);
        const q = b.position.clone();
        return { alvoE: em(q, [frente, 0.3], [direita, -0.11]).setY(q.y + 0.12), pesoE: 1, alvoD: em(q, [frente, 0.3], [direita, 0.11]).setY(q.y + 0.12), pesoD: 1 };
      };
      // feed da rede social na tela (antes de apagar)
      function feed(g, W, H) {
        g.fillStyle = "#121418";
        g.fillRect(0, 0, W, H);
        barraDeStatus(g, W, "12:18");
        g.fillStyle = "#e8e6e1";
        g.font = fonte(800, 46);
        g.textAlign = "left";
        g.fillText("Início", 40, 150);
        for (let i = 0; i < 4; i++) {
          const y = 200 + i * 270;
          g.fillStyle = "#23262c";
          g.beginPath();
          g.roundRect(28, y, W - 56, 240, 26);
          g.fill();
          g.fillStyle = ["#6f8a9a", "#9a7f6a", "#7a8a6a", "#8a6f8a"][i];
          g.beginPath();
          g.arc(80, y + 52, 26, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#cfd2d6";
          g.fillRect(124, y + 34, 180, 18);
          g.fillStyle = "#5c6068";
          g.fillRect(124, y + 64, 110, 14);
          g.fillStyle = "#3a3e46";
          g.fillRect(52, y + 104, W - 104, 112);
        }
      }
      // câmera de ponto de vista olhando a tela do celular (de perto)
      function cameraTela(perto, alto = 0.0) {
        return (tt, ctx) => {
          const { cabeca } = pontosDoBoneco(ctx.boneco);
          ctx.celular.updateMatrixWorld(true);
          const alvo = ctx.celular.localToWorld(new THREE.Vector3(0, -0.01, 0));
          const dir = alvo.clone().sub(cabeca).normalize();
          return { pos: alvo.clone().addScaledVector(dir, -perto).add(new THREE.Vector3(0, alto, 0)), alvo, fov: 34 };
        };
      }
      let telaReflexo = null;

      iniciarParte({
        host: "__parte02",
        cenarios: ["rua", "cozinha", "onibus"],
        planos: [
          { de: 0, cenario: "rua", nome: "segue", modo: "dia" }, //                          O dia segue normal.
          { de: t.escola, cenario: "rua", nome: "escola", modo: "dia" }, //                Escola,
          { de: t.celular, cenario: "rua", nome: "celular", modo: "dia" }, //              celular,
          { de: t.almoco, cenario: "cozinha", nome: "almoco", modo: "dia" }, //            almoço.
          { de: t.estranhas, cenario: "cozinha", nome: "estranhas", modo: "dia" }, //      Mas tem umas coisinhas estranhas.
          { de: t.tela, cenario: "cozinha", nome: "tela", modo: "dia" }, //                Na tela preta do celular, o seu reflexo
          { de: t.pisca, cenario: "cozinha", nome: "pisca", modo: "dia" }, //              pisca
          { de: t.rosto, cenario: "cozinha", nome: "rosto", modo: "dia" }, //              quando você não piscou.
          { de: t.vitrine, cenario: "rua", nome: "vitrine", modo: "dia" }, //              Na vitrine da padaria, ele demora pra virar a cabeça.
          { de: t.tenta, cenario: "rua", nome: "tenta", modo: "tarde" }, //                Você tenta não pensar nisso.
          { de: t.onibus, cenario: "onibus", nome: "onibus" }, //                          Até que, no ônibus, encostado na janela,
          { de: t.olha, cenario: "onibus", nome: "olha" }, //                              você olha pro vidro
          { de: t.naoEsta, cenario: "onibus", nome: "naoEsta" }, //                        e o reflexo não está encostado.
          { de: t.reto, cenario: "onibus", nome: "reto" }, //                              Ele está sentado reto, olhando para você.
          { de: t.piscaEle, cenario: "onibus", nome: "piscaEle" }, //                      Você pisca e ele está encostado de novo, igual a você.
          { de: t.desce, cenario: "rua", nome: "desce", modo: "tarde" }, //                Você desce dois pontos antes
          { de: t.casa, cenario: "rua", nome: "casa", modo: "tarde" }, //                  e vai andando para casa, sem olhar para nenhuma janela.
        ],
        cortesEscuros: [t.almoco, t.vitrine, t.onibus, t.desce],
        cameras: {
          segue: { k: [[0, [-5.5, 1.9, -2.2], [-11.5, 1.2, 2.2], 44], [t.escola, [-6.0, 1.85, -2.0], [-10.2, 1.2, 2.3], 42]], tremor: 0.002 },
          escola: { k: [[t.escola, [-6.5, 1.45, 1.35], [-10.4, 1.45, 2.3], 46], [t.celular, [-6.4, 1.45, 1.4], [-9.7, 1.45, 2.3], 44]], tremor: 0.003 },
          celular: cameraTela(0.62, 0.05),
          almoco: { k: [[t.almoco, [1.7, 1.45, 1.55], [0.1, 0.95, -0.05], 46], [t.estranhas, [1.6, 1.45, 1.45], [0.1, 0.95, -0.05], 44]], tremor: 0.002 },
          estranhas: { k: [[t.estranhas, [0.75, 1.42, 1.15], [0.02, 1.2, -0.05], 46], [t.tela, [0.7, 1.4, 1.05], [0.02, 1.2, -0.05], 42]], tremor: 0.002 },
          tela: cameraTela(0.74, 0.04),
          pisca: cameraTela(0.7, 0.03),
          rosto: { k: [[t.rosto, [0.02, 1.36, 0.92], [0.02, 1.28, -0.06], 46], [t.vitrine, [0.02, 1.36, 0.85], [0.02, 1.28, -0.06], 40]], tremor: 0.0015 },
          vitrine: { k: [[t.vitrine, [3.6, 1.55, 1.1], [-1.6, 1.4, 3.2], 46], [t.tenta, [3.4, 1.5, 1.15], [-0.6, 1.4, 3.2], 42]], tremor: 0.002 },
          tenta: { k: [[t.tenta, [6.4, 1.5, -2.0], [9.8, 1.0, 1.6], 44], [t.onibus, [6.7, 1.45, -1.8], [9.9, 1.0, 1.6], 40]], tremor: 0.002 },
          onibus: { k: [[t.onibus, [1.0, 1.65, -0.35], [-0.7, 1.15, 0.85], 52], [t.olha, [0.85, 1.6, -0.25], [-0.7, 1.15, 0.85], 48]], tremor: 0.003 },
          olha: { k: [[t.olha, [0.28, 1.42, 0.52], [-0.48, 1.34, 0.9], 40], [t.naoEsta, [0.24, 1.42, 0.55], [-0.48, 1.34, 0.9], 36]], tremor: 0.003 },
          naoEsta: { k: [[t.naoEsta, [0.32, 1.46, 0.28], [-0.42, 1.34, 1.15], 44], [t.reto, [0.3, 1.45, 0.3], [-0.38, 1.35, 1.17], 40]], tremor: 0.003 },
          reto: { k: [[t.reto, [0.16, 1.42, 0.55], [-0.27, 1.39, 1.215], 34], [t.piscaEle, [0.14, 1.42, 0.57], [-0.27, 1.39, 1.215], 28]], tremor: 0.003 },
          piscaEle: { k: [[t.piscaEle, [0.26, 1.42, 0.55], [-0.47, 1.35, 0.9], 34], [T("e ele está") - 0.1, [0.24, 1.42, 0.56], [-0.47, 1.35, 0.9], 32], [T("e ele está"), [0.32, 1.46, 0.28], [-0.4, 1.35, 1.16], 42, "corte"], [t.desce, [0.3, 1.45, 0.3], [-0.4, 1.35, 1.16], 40]], tremor: 0.003 },
          desce: { k: [[t.desce, [8.5, 1.6, -1.6], [3.5, 1.2, 2.3], 46], [t.casa, [8.0, 1.6, -1.4], [1.8, 1.2, 2.3], 44]], tremor: 0.002 },
          casa: (tt, ctx) => {
            const b = ctx.boneco.position;
            return { pos: b.clone().add(new THREE.Vector3(-2.6, 0.75, -1.7)), alvo: b.clone().add(new THREE.Vector3(0.3, 0.55, 0.6)), fov: 46 };
          },
        },
        semCabeca: (tt, p) => ["celular", "tela", "pisca"].includes(p.nome),
        personagem: {
          semente: 3,
          onde: [[0, "rua"], [t.almoco, "cozinha"], [t.vitrine, "rua"], [t.onibus, "onibus"], [t.desce, "rua"]],
          pos: [
            [0, [-12.2, C + ALT, 2.3]],
            [t.almoco - 0.01, [-8.3, C + ALT, 2.3], "linear"],
            [t.almoco, SENTADO_MESA, "corte"],
            [t.vitrine - 0.01, SENTADO_MESA],
            [t.vitrine, [-4.6, C + ALT, 2.35], "corte"],
            [t.tenta - 0.01, [0.9, C + ALT, 2.35], "linear"],
            [t.tenta, BANCO_PONTO, "corte"],
            [t.onibus - 0.01, BANCO_PONTO],
            [t.onibus, SENTADO_BUS, "corte"],
            [t.desce - 0.01, SENTADO_BUS],
            [t.desce, [5.0, C + ALT, 2.3], "corte"],
            [FIM, [-3.0, C + ALT, 2.3], "linear"],
          ],
          passos: [[0, t.almoco - 0.05, 1, 0.62], [t.vitrine, t.tenta - 0.05, 1, 0.62], [t.desce, FIM, 1.05, 0.62]],
          pose: {
            giro: [[0, PI / 2], [t.almoco, 0, "corte"], [t.vitrine, PI / 2, "corte"], [t.tenta, PI, "corte"], [t.onibus, PI / 2, "corte"], [t.desce, -PI / 2, "corte"]],
            quadril: [[0, 0], [t.almoco, -PI / 2, "corte"], [t.vitrine, 0, "corte"], [t.tenta, -PI / 2, "corte"], [t.desce, 0, "corte"]],
            joelho: [[0, 0], [t.almoco, 1.5, "corte"], [t.vitrine, 0, "corte"], [t.tenta, 1.5, "corte"], [t.desce, 0, "corte"]],
            cabecaGiro: [...CG_VITRINE.map(([a, v, c], i) => [a, v, i ? c : "corte"]), [t.tenta, 0.0, "corte"], [t.olha, 0.0], [t.olha + 0.6, -0.55, "ambos"], [t.desce, 0, "corte"]],
            cabecaInclina: [[0, 0.05], [t.celular, 0.35, "corte"], [t.almoco, 0.2, "corte"], [t.estranhas, 0.3], [t.tenta, 0.3, "corte"], [t.onibus, 0.08, "corte"], [t.desce, 0.15, "corte"], [t.casa, 0.38, "ambos"]],
            cabecaTomba: [[0, 0], [t.onibus, 0.32, "corte"], [t.olha + 0.2, 0.32], [t.olha + 0.8, 0.12, "ambos"], [t.naoEsta + 0.5, 0.12], [t.piscaEle, 0.12], [T("e ele está"), 0.3, "ambos"], [t.desce, 0, "corte"]],
            inclinar: [[0, 0.04], [t.almoco, 0.12, "corte"], [t.vitrine, 0.04, "corte"], [t.tenta, 0.2, "corte"], [t.onibus, 0.0, "corte"], [t.desce, 0.08, "corte"]],
            ombro: [[0, 0], [t.tenta, -0.25, "corte"], [t.onibus, -0.2, "corte"], [t.desce, 0, "corte"]],
            cotovelo: [[0, 0.15], [t.tenta, 0.9, "corte"], [t.onibus, 1.0, "corte"], [t.desce, 0.15, "corte"]],
            olhos: [[0, 1], [t.rosto, 1.25, "corte"], [t.vitrine, 1, "corte"], [t.reto, 1.2], [t.piscaEle, 1.1]],
            sobrancelha: [[0, 0], [t.rosto, 0.7, "corte"], [t.vitrine, 0.1, "corte"], [T("demora") + 0.4, 0.4, "ambos"], [t.tenta, 0, "corte"], [t.naoEsta + 0.5, 0.6, "ambos"], [t.piscaEle, 0.3], [t.desce, -0.2, "corte"]],
            sobrancelhaMedo: [[0, 0], [t.rosto, 0.5, "corte"], [t.vitrine, 0, "corte"], [t.reto, 0.6, "ambos"], [t.desce, 0.4, "corte"]],
            apertar: [[0, 0], [t.tenta, 0.2, "corte"], [t.onibus, 0.1, "corte"]],
          },
          // ele não pisca enquanto encara a tela e o vidro; pisca no "Você pisca"
          semPiscar: [[t.tela, t.vitrine], [t.reto, PISCA_ELE + 0.3]],
          piscadas: [PISCA_ELE],
          maos: (tt, pts, ctx, b) => {
            const { frente, direita, cima } = eixos(b);
            // na mesa, as duas mãos seguram o celular na frente do rosto; no ônibus, as mãos no colo
            if ((tt >= t.celular && tt < t.almoco) || (tt >= t.estranhas && tt < t.vitrine)) {
              // depois que o reflexo pisca, ele abaixa o celular (aparece o rosto)
              const baixa = trilha([[t.rosto - 0.05, 0], [t.rosto + 0.35, 1, "ambos"]], tt);
              const alvo = em(pts.cabeca, [frente, 0.58 - 0.2 * baixa], [cima, -0.18 - 0.24 * baixa]);
              return { alvoE: alvo, pesoE: 1, alvoD: em(alvo, [direita, 0.05], [cima, -0.03]), pesoD: 0.85 };
            }
            if (tt >= t.onibus && tt < t.desce) return noColo(b);
            if (tt >= t.almoco && tt < t.estranhas) {
              const o = ctx.cenarios.cozinha.grupo.position;
              return { alvoE: new THREE.Vector3(-0.1, 0.84, 0.18).add(o), pesoE: 1, alvoD: new THREE.Vector3(0.15, 0.84, 0.2).add(o), pesoD: 1 };
            }
            return null;
          },
        },
        // o reflexo: na tela pisca sozinho; na vitrine vira a cabeça 0,8 s depois; no ônibus fica sentado reto olhando
        reflexo: {
          atraso: () => 0,
          janelas: [
            { de: t.tela - 0.1, ate: t.vitrine, piscadas: [PISCA_REFLEXO], semPiscar: [[t.tela - 0.1, t.vitrine]] },
            { de: t.vitrine, ate: t.tenta, pose: { cabecaGiro: CG_VITRINE.map(([a, v, c]) => [a + 0.8, v, c]) } },
            {
              de: t.naoEsta - 0.3,
              ate: SOLTA_BUS,
              semPiscar: [[t.naoEsta - 0.3, SOLTA_BUS + 0.2]],
              pose: {
                cabecaTomba: [[0, 0]],
                cabecaGiro: [[0, 0], [t.reto, 0], [T("olhando") - 0.2, -1.05, "ambos"]],
                cabecaInclina: [[0, 0.0]],
                inclinar: [[0, -0.02]],
                olhos: [[0, 1.12]],
                sobrancelha: [[0, 0]],
                sobrancelhaMedo: [[0, 0]],
              },
            },
          ],
        },
        celular: (tt) => ((tt >= t.celular && tt < t.almoco) || (tt >= t.estranhas && tt < t.vitrine) ? "mao" : null),
        tela: (g, tt, desenhar) => {
          const chave = tt < t.tela + 0.1 ? "feed" : "apagada";
          if (desenhar) {
            if (chave === "feed") feed(g, 600, 1302);
            else {
              g.fillStyle = "#020203";
              g.fillRect(0, 0, 600, 1302);
            }
          }
          return chave;
        },
        outros: [
          { id: "padeiro", variante: "padeiro", semente: 11, onde: [[0, "rua"]], pos: [[0, [-1.2, C + ALT, 7.0]]], pose: { giro: [[0, PI]], cabecaInclina: [[0, 0.2]], inclinar: [[0, 0.1]] } },
          { id: "passageira", variante: "passageira", semente: 12, onde: [[0, "onibus"]], pos: [[0, [-1.7, 0.56, -0.88]]], pose: { giro: [[0, PI / 2]], quadril: [[0, -PI / 2]], joelho: [[0, 1.5]], cabecaInclina: [[0, 0.25]] }, maos: (tt, pts, ctx, b) => noColo(b) },
          { id: "passageiro", variante: "passageiro", semente: 13, onde: [[0, "onibus"]], pos: [[0, [1.9, 0.56, 0.84]]], pose: { giro: [[0, PI / 2]], quadril: [[0, -PI / 2]], joelho: [[0, 1.5]], cabecaTomba: [[0, 0.15]] }, maos: (tt, pts, ctx, b) => noColo(b) },
          { id: "motorista", variante: "pai", semente: 14, onde: [[0, "onibus"]], pos: [[0, [4.22, 0.56, -0.7]]], pose: { giro: [[0, PI / 2]], quadril: [[0, -PI / 2]], joelho: [[0, 1.45]] }, maos: (tt, pts, ctx) => { const o = ctx.cenarios.onibus.grupo.position; return { alvoE: new THREE.Vector3(4.5, 1.36, -0.86).add(o), pesoE: 1, alvoD: new THREE.Vector3(4.5, 1.36, -0.54).add(o), pesoD: 1 }; } },
        ],
        montar: (ctx) => {
          // tela preta que reflete: só aparece com a tela apagada
          telaReflexo = new EspelhoPlano(0.07, 0.152, { resolucao: 768, cor: 0x60666d, brilho: 0.05 });
          telaReflexo.position.z = 0.0052;
          telaReflexo.visible = false;
          ctx.celular.add(telaReflexo);
          // celular na proporção do boneco (a cabeça dele é grande): o rosto refletido cabe na tela
          ctx.celular.scale.setScalar(2.2);
        },
        quadro: (tt, plano, ctx) => {
          const c = ctx.cenarios;
          telaReflexo.visible = tt >= t.tela + 0.1 && tt < t.vitrine;
          c.onibus.andar(tt, 8.5);
          c.cozinha.onibus(0, false);
          c.cozinha.radio(false);
          c.cozinha.cafe(false);
          c.cozinha.relogio.mostrar("12:18");
        },
      });
