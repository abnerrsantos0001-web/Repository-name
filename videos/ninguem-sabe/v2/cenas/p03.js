      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, MEDIDAS, trilha } from "./assets/js/cena.js";
      import { PALAVRAS } from "./assets/js/tempos/v2-parte03.js";

      const T = tempos(PALAVRAS);
      const PI = Math.PI;
      const ALT = MEDIDAS.quadrilEmPe;
      const FIM = 44.5333;
      const PIA = [0, ALT, -0.56];
      const JUNTO_PORTA = [-0.3, ALT, 1.05];
      const t = {
        fecha: T("Fecha") - 0.2,
        acende: T("acende") - 0.15,
        frente: T("e para") - 0.15,
        mao: T("Levanta") - 0.2,
        abaixa: T("Abaixa,") - 0.15,
        careta: T("Você faz") - 0.15,
        caretaEle: T("ele faz.") - 0.1,
        lingua: T("Mostra") - 0.15,
        linguaEle: T("ele mostra.") - 0.1,
        aliviado: T("Você respira") - 0.15,
        sorri: T("E aí") - 0.15,
        naoSorri: T("E ele não") - 0.15,
        parado: T("Ele fica") - 0.15,
        devagar: T("e então,") - 0.15,
        grande: T("um sorriso") - 0.15,
        medo: T("grande demais,") + 0.15,
        apaga: T("você apaga") - 0.15,
      };
      const LUZ_ON = T("acende") + 0.18;
      const LUZ_OFF = T("luz", 2) + 0.05;
      const SOLTA = t.apaga; // a partir daqui o reflexo para de seguir: fica na pia, sorrindo
      // porta do banheiro: abre para dentro, dobradiça em (0.75, 1.5); a maçaneta, no mundo do cenário
      const aberturaPorta = (tt) => trilha([[0, 1.5], [t.fecha + 0.45, 1.5], [t.fecha + 1.25, 0, "ambos"], [LUZ_OFF + 0.12, 0], [LUZ_OFF + 0.45, 1.5, "sai"]], tt);
      function macaneta(ab) {
        const lx = -0.76;
        const lz = -0.06;
        const c = Math.cos(-ab);
        const s = Math.sin(-ab);
        return new THREE.Vector3(0.75 + lx * c + lz * s, 1.0, 1.5 - lx * s + lz * c);
      }
      // o rosto do reflexo a partir do sorriso dele: fica sério, depois sorri devagar até o sorriso grande demais
      const ROSTO_REFLEXO = {
        sorriso: [[0, 0], [T("bem", 2) - 0.1, 0], [T("sorri", 3) + 0.4, 1.0, "ambos"], [t.grande + 0.4, 1.0], [T("grande") - 0.2, 0.6]],
        sorrisoLargo: [[0, 0], [t.grande + 0.3, 0], [T("grande") + 0.2, 1.0, "ambos"]],
        olhos: [[0, 1.05], [t.grande + 0.3, 1.05], [T("grande") + 0.4, 0.78, "ambos"]],
        sobrancelha: [[0, 0], [t.grande + 0.3, 0], [T("grande") + 0.4, -0.35, "ambos"]],
        sobrancelhaMedo: [[0, 0]],
        cabecaTomba: [[0, 0], [t.grande, 0], [T("demais,") + 0.3, 0.16, "ambos"]],
        cabecaInclina: [[0, 0.0], [t.grande, 0.0], [T("demais,") + 0.3, -0.06, "ambos"]],
        cabecaGiro: [[0, 0]],
        boca: [[0, 0]],
        apertar: [[0, 0]],
        lingua: [[0, 0]],
      };

      const eixos = (b) => {
        const g = b.rotation.y;
        return { frente: new THREE.Vector3(Math.sin(g), 0, Math.cos(g)), direita: new THREE.Vector3(-Math.cos(g), 0, Math.sin(g)), cima: new THREE.Vector3(0, 1, 0) };
      };
      const em = (base, ...pares) => pares.reduce((v, [d, k]) => v.addScaledVector(d, k), base.clone());

      iniciarParte({
        host: "__parte03",
        cenarios: ["banheiro"],
        exposicao: 1.15,
        planos: [
          { de: 0, cenario: "banheiro", nome: "decide", modo: "apagada", preenchimento: 0.6 }, //         À noite, você decide provar pra você mesmo que está ficando louco.
          { de: t.fecha, cenario: "banheiro", nome: "fecha", modo: "apagada", preenchimento: 0.6 }, //    Fecha a porta do banheiro,
          { de: t.acende, cenario: "banheiro", nome: "acende", modo: "apagada", preenchimento: 0.6 }, //  acende a luz
          { de: t.frente, cenario: "banheiro", nome: "frente", modo: "noiteAcesa" }, //                   e para na frente do espelho.
          { de: t.mao, cenario: "banheiro", nome: "mao", modo: "noiteAcesa" }, //                         Levanta a mão direita. Ele levanta.
          { de: t.abaixa, cenario: "banheiro", nome: "abaixa", modo: "noiteAcesa" }, //                   Abaixa, ele abaixa.
          { de: t.careta, cenario: "banheiro", nome: "careta", modo: "noiteAcesa" }, //                   Você faz uma careta,
          { de: t.caretaEle, cenario: "banheiro", nome: "caretaEle", modo: "noiteAcesa" }, //             ele faz.
          { de: t.lingua, cenario: "banheiro", nome: "lingua", modo: "noiteAcesa" }, //                   Mostra a língua,
          { de: t.linguaEle, cenario: "banheiro", nome: "linguaEle", modo: "noiteAcesa" }, //             ele mostra.
          { de: t.aliviado, cenario: "banheiro", nome: "aliviado", modo: "noiteAcesa" }, //               Você respira aliviado. Tá tudo bem.
          { de: t.sorri, cenario: "banheiro", nome: "sorri", modo: "noiteAcesa" }, //                     E aí você sorri.
          { de: t.naoSorri, cenario: "banheiro", nome: "naoSorri", modo: "noiteAcesa" }, //               E ele não sorri.
          { de: t.parado, cenario: "banheiro", nome: "parado", modo: "noiteAcesa" }, //                   Ele fica parado, sério, com a cara que você tinha um segundo atrás,
          { de: t.devagar, cenario: "banheiro", nome: "devagar", modo: "noiteAcesa" }, //                 e então, bem devagar, ele sorri,
          { de: t.grande, cenario: "banheiro", nome: "grande", modo: "noiteAcesa" }, //                   um sorriso que não é o seu, grande demais,
          { de: t.medo, cenario: "banheiro", nome: "medo", modo: "noiteAcesa" }, //                       (o rosto dele)
          { de: t.apaga, cenario: "banheiro", nome: "apaga", modo: "noiteAcesa" }, //                     você apaga a luz e sai correndo.
        ],
        cameras: {
          decide: { k: [[0, [-0.6, 1.5, -0.65], [0.3, 1.45, 2.2], 44], [t.fecha, [-0.55, 1.5, -0.45], [0.3, 1.45, 2.0], 40]], tremor: 0.003 },
          fecha: { k: [[t.fecha, [0.55, 1.62, -0.35], [-0.05, 1.2, 1.3], 50], [t.acende, [0.5, 1.6, -0.25], [-0.15, 1.2, 1.35], 48]], tremor: 0.003 },
          acende: { k: [[t.acende, [0.3, 1.52, 1.15], [-0.35, 1.32, 1.4], 46], [t.frente, [0.3, 1.52, 1.12], [-0.35, 1.32, 1.4], 42]], tremor: 0.003 },
          frente: { k: [[t.frente, [1.3, 1.85, 0.42], [-0.2, 1.2, -0.7], 52], [t.mao, [1.25, 1.82, 0.3], [-0.15, 1.25, -0.9], 48]], tremor: 0.002 },
          mao: { k: [[t.mao, [0.74, 1.72, 0.42], [-0.16, 1.52, -1.5], 42], [t.abaixa, [0.7, 1.72, 0.32], [-0.16, 1.52, -1.5], 40]], tremor: 0.002 },
          abaixa: { k: [[t.abaixa, [0.66, 1.7, 0.22], [-0.16, 1.52, -1.5], 38], [t.careta, [0.62, 1.7, 0.15], [-0.16, 1.52, -1.5], 36]], tremor: 0.002 },
          careta: { k: [[t.careta, [0.0, 1.55, -1.44], [0.0, 1.52, -0.56], 40], [t.caretaEle, [0.0, 1.55, -1.42], [0.0, 1.52, -0.56], 36]], tremor: 0.0015 },
          caretaEle: { k: [[t.caretaEle, [0.36, 1.62, -0.22], [-0.04, 1.55, -1.5], 30], [t.lingua, [0.34, 1.62, -0.26], [-0.04, 1.55, -1.5], 28]], tremor: 0.0015 },
          lingua: { k: [[t.lingua, [0.0, 1.55, -1.44], [0.0, 1.5, -0.56], 40], [t.linguaEle, [0.0, 1.55, -1.42], [0.0, 1.5, -0.56], 36]], tremor: 0.0015 },
          linguaEle: { k: [[t.linguaEle, [0.36, 1.62, -0.22], [-0.04, 1.53, -1.5], 30], [t.aliviado, [0.34, 1.62, -0.26], [-0.04, 1.53, -1.5], 28]], tremor: 0.0015 },
          aliviado: { k: [[t.aliviado, [0.0, 1.55, -1.44], [0.0, 1.5, -0.56], 46], [t.sorri, [0.0, 1.55, -1.42], [0.0, 1.5, -0.56], 42]], tremor: 0.0015 },
          sorri: { k: [[t.sorri, [0.0, 1.56, -1.44], [0.0, 1.53, -0.56], 38], [t.naoSorri, [0.0, 1.56, -1.42], [0.0, 1.53, -0.56], 34]], tremor: 0.0015 },
          naoSorri: { k: [[t.naoSorri, [0.36, 1.62, -0.22], [-0.04, 1.55, -1.5], 30], [t.parado, [0.34, 1.62, -0.26], [-0.04, 1.55, -1.5], 27]], tremor: 0.0015 },
          parado: { k: [[t.parado, [0.04, 1.58, -1.18], [0.0, 1.56, -2.4], 30], [t.devagar, [0.03, 1.58, -1.26], [0.0, 1.56, -2.4], 26]], tremor: 0.001 },
          devagar: { k: [[t.devagar, [0.03, 1.58, -1.26], [0.0, 1.56, -2.4], 26], [t.grande, [0.02, 1.58, -1.32], [0.0, 1.56, -2.4], 22]], tremor: 0.001 },
          grande: { k: [[t.grande, [0.02, 1.58, -1.32], [0.0, 1.55, -2.4], 22], [t.medo, [0.02, 1.58, -1.38], [0.0, 1.55, -2.4], 18, "linear"]], tremor: 0.001 },
          medo: { k: [[t.medo, [0.0, 1.56, -1.4], [0.0, 1.54, -0.56], 34], [t.apaga, [0.0, 1.56, -1.36], [0.0, 1.54, -0.56], 30]], tremor: 0.003 },
          apaga: { k: [[t.apaga, [-1.2, 1.78, 1.28], [0.0, 1.42, -1.5], 50], [FIM, [-1.18, 1.76, 1.15], [0.0, 1.47, -1.5], 42, "linear"]], tremor: 0.003 },
        },
        personagem: {
          semente: 3,
          onde: [[0, "banheiro"]],
          pos: [
            [0, [0.33, ALT, 2.45]],
            [t.fecha - 0.75, [0.33, ALT, 2.45]],
            [t.fecha + 0.05, [0.33, ALT, 1.22], "linear"],
            [t.fecha + 0.42, JUNTO_PORTA, "linear"],
            [t.frente + 0.1, JUNTO_PORTA],
            [t.mao - 0.2, PIA, "linear"],
            [t.apaga + 0.25, PIA],
            [LUZ_OFF - 0.05, JUNTO_PORTA, "linear"],
            [LUZ_OFF + 0.45, JUNTO_PORTA],
            [LUZ_OFF + 0.8, [0.33, ALT, 1.2], "linear"],
            [FIM, [0.33, ALT, 2.8], "linear"],
          ],
          passos: [[t.fecha - 0.75, t.fecha + 0.42, 0.9, 0.55], [t.frente + 0.1, t.mao - 0.2, 1, 0.62], [t.apaga + 0.25, LUZ_OFF - 0.05, 1.8, 0.9], [LUZ_OFF + 0.45, FIM, 1.8, 0.9]],
          pose: {
            giro: [[0, PI], [t.fecha + 0.05, PI], [t.fecha + 0.42, 0.05, "ambos"], [t.frente + 0.1, 0.05], [t.frente + 0.5, PI, "ambos"], [t.apaga + 0.1, PI], [t.apaga + 0.4, 2 * PI - 0.6, "ambos"], [LUZ_OFF, 2 * PI - 0.6], [LUZ_OFF + 0.45, 2 * PI + 0.25, "ambos"], [LUZ_OFF + 0.75, 2 * PI, "ambos"]],
            inclinar: [[0, 0], [t.aliviado, 0], [t.aliviado + 0.4, -0.06, "ambos"], [t.aliviado + 1.4, 0.0, "ambos"], [t.apaga + 0.2, 0.0], [t.apaga + 0.5, 0.22, "ambos"]],
            cabecaInclina: [[0, 0.0], [t.acende, 0.05], [t.careta, 0.0], [t.aliviado + 0.3, -0.12, "ambos"], [t.aliviado + 1.6, 0.0, "ambos"]],
            cabecaTomba: [[0, 0], [t.careta, 0], [T("careta,"), 0.12, "ambos"], [t.lingua, 0], [T("língua,"), -0.08, "ambos"], [t.aliviado, 0]],
            olhos: [[0, 1], [t.careta, 1], [T("careta,"), 0.35, "ambos"], [t.lingua - 0.25, 0.35], [t.lingua + 0.15, 1, "ambos"], [t.sorri, 1], [T("sorri.") + 0.1, 0.75, "ambos"], [t.naoSorri + 0.4, 1.0, "ambos"], [t.parado, 1.15], [t.medo, 1.38, "sai"], [t.apaga, 1.3]],
            apertar: [[0, 0.15], [t.acende, 0], [t.careta, 0], [T("careta,"), 0.8, "ambos"], [t.lingua - 0.25, 0.8], [t.lingua + 0.15, 0, "ambos"]],
            sobrancelha: [[0, -0.3], [t.acende, 0], [t.careta, 0], [T("careta,"), -0.9, "ambos"], [t.lingua - 0.25, -0.9], [t.lingua + 0.15, 0.2, "ambos"], [t.aliviado, 0.1], [t.naoSorri + 0.3, 0.5, "ambos"], [t.medo, 1.0, "sai"]],
            sobrancelhaMedo: [[0, 0], [t.naoSorri + 0.3, 0.4, "ambos"], [t.medo, 0.9, "sai"]],
            boca: [[0, 0], [t.careta, 0], [T("careta,"), 0.35, "ambos"], [t.lingua - 0.25, 0.35], [t.lingua + 0.1, 0.0, "ambos"], [T("língua,"), 0.42, "ambos"], [t.aliviado - 0.1, 0.42], [t.aliviado + 0.25, 0, "ambos"], [t.aliviado + 0.4, 0.18, "ambos"], [t.aliviado + 1.4, 0, "ambos"], [t.medo, 0.22, "sai"], [t.apaga, 0.3]],
            lingua: [[0, 0], [t.lingua, 0], [T("língua,") + 0.1, 1, "sai"], [t.aliviado - 0.1, 1], [t.aliviado + 0.25, 0, "ambos"]],
            sorriso: [[0, 0], [t.aliviado, 0], [T("Tá"), 0.35, "ambos"], [t.sorri, 0.2], [T("sorri.") + 0.15, 1.0, "sai"], [t.naoSorri + 0.4, 1.0], [t.parado, 0.15, "ambos"], [t.medo, 0]],
            ofegar: [[0, 0], [t.aliviado, 0.6], [t.aliviado + 1.5, 0], [t.medo, 1.0], [FIM, 1.4]],
          },
          semPiscar: [[t.parado, FIM]],
          maos: (tt, pts, ctx, b) => {
            const { frente, direita, cima } = eixos(b);
            const o = ctx.cenarios.banheiro.grupo.position;
            const r = {};
            // fecha a porta empurrando pela maçaneta, e o interruptor (acende/apaga)
            const ab = aberturaPorta(tt);
            if (tt >= t.fecha && tt < t.fecha + 1.5 && ab < 0.75) {
              r.alvoD = macaneta(ab).add(o);
              r.pesoD = trilha([[t.fecha + 0.7, 0], [t.fecha + 0.9, 1, "ambos"], [t.fecha + 1.25, 1], [t.fecha + 1.45, 0, "ambos"]], tt);
            }
            for (const [t0, t1] of [[T("acende") - 0.25, T("acende") + 0.45], [LUZ_OFF - 0.25, LUZ_OFF + 0.2]]) {
              if (tt >= t0 && tt < t1) {
                r.alvoD = new THREE.Vector3(-0.35, 1.25, 1.41).add(o);
                r.pesoD = trilha([[t0, 0], [t0 + 0.2, 1, "ambos"], [t1 - 0.15, 1], [t1, 0, "ambos"]], tt);
              }
            }
            // levanta a mão direita e abaixa
            if (tt >= T("Levanta") - 0.1 && tt < T("abaixa.") + 0.6) {
              const sobe = trilha([[T("Levanta") - 0.1, 0], [T("direita.") + 0.2, 1, "ambos"]], tt);
              const desce = trilha([[T("Abaixa,") - 0.1, 0], [T("Abaixa,") + 0.6, 1, "ambos"]], tt);
              r.alvoD = em(pts.cabeca, [direita, 0.3], [frente, 0.14], [cima, -0.55 + 0.68 * sobe - 0.68 * desce]);
              r.pesoD = Math.min(sobe * 1.6, 1) * (1 - desce);
            }
            return r.alvoE || r.alvoD ? r : null;
          },
        },
        reflexo: {
          cenario: "banheiro",
          atraso: () => 0,
          janelas: [
            { de: T("sorri.") - 0.2, ate: SOLTA, pose: ROSTO_REFLEXO, semPiscar: [[T("sorri."), FIM]] },
            {
              de: SOLTA,
              ate: FIM + 1,
              pos: [[0, PIA]],
              passos: [],
              semPiscar: [[T("sorri."), FIM + 1]],
              pose: { ...ROSTO_REFLEXO, giro: [[0, PI]], inclinar: [[0, 0]], ofegar: [[0, 0]] },
              maos: () => null,
            },
          ],
        },
        quadro: (tt, plano, ctx) => {
          const b = ctx.cenarios.banheiro;
          b.porta(aberturaPorta(tt));
          b.corredor(tt < t.fecha + 1.2 || tt > LUZ_OFF + 0.2 ? 1 : 0);
          b.torneira(false);
          b.lencol(0);
          b.tecla(tt >= LUZ_ON && tt < LUZ_OFF);
          // a luz do banheiro: apagada até o interruptor, acesa até ele apagar
          const acesa = tt >= LUZ_ON && tt < LUZ_OFF;
          const queria = acesa ? "noiteAcesa" : "apagada";
          if (b.modoAtual !== queria) {
            b.modoAtual = null;
            b.modo(queria);
          }
        },
      });
