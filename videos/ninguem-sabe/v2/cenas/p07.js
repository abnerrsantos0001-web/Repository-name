      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, MEDIDAS, trilha } from "./assets/js/cena.js";
      import { toquesNoVidro } from "./assets/js/reflexo.js";
      import { PALAVRAS } from "./assets/js/tempos/v2-parte07.js";

      const T = tempos(PALAVRAS);
      const PI = Math.PI;
      const ALT = MEDIDAS.quadrilEmPe;
      const FIM = 41.2;
      const t = {
        agua2: T("como") - 0.15,
        atravessa: T("A mão") - 0.12,
        gelada: T("Ela é") - 0.12,
        puxa: T("Você puxa") - 0.12,
        bate: T("bate") - 0.12,
        derruba: T("derruba") - 0.12,
        volta: T("Ele puxa") - 0.12,
        metade: T("Metade") - 0.12,
        dentro: T("E lá") - 0.12,
        pega: T("Você pega") - 0.12,
        secador: T("o secador") - 0.08,
        acerta: T("e acerta") - 0.1,
        estoura: T("O vidro", 2) - 0.1,
        quieto: T("e tudo") - 0.1,
        cai: T("Você cai") - 0.12,
      };
      const HIT1 = T("acerta") + 0.15; // o primeiro golpe: a água endurece e o reflexo solta o pulso
      const QUEBRA = T("estoura") - 0.15; // o segundo golpe: o vidro estoura (o som está aqui)
      const RECUO = [0, ALT, -0.05];
      // na pia: afastado da cuba (x 0,45), na ponta dos pés, girado com o ombro esquerdo à frente;
      // assim a barriga passa por cima da bancada e a mão esquerda alcança o vidro
      const PERTO = [0.45, ALT, -0.6];
      const NA_PIA = [0.45, ALT + 0.03, -0.6];
      const PUXADO = [0.45, ALT + 0.045, -0.6];
      const SOLTO = [0.45, ALT, -0.5];
      const SENTADO = [0.3, 0.1, -0.12];
      const GIRO_PIA = PI - 0.25;
      // a mão esquerda dele no vidro (a água) e afundando quando é puxado
      const VIDRO_E = [0.33, 1.3, -1.49];
      const PUXANDO_E = [0.33, 1.29, -1.46];
      const DENTRO_E = [0.33, 1.26, -1.62];
      // o secador: no gancho, puxado para fora, erguido, e o golpe (o bico encosta no vidro)
      const SEC_GANCHO = [0.8, 1.22, -1.31];
      // a cabeça dele (grande) fica a poucos centímetros do vidro quando ele se debruça:
      // o secador sai do gancho para baixo e para a direita e bate no canto direito do espelho, por baixo do queixo
      const SEC_FORA = [0.9, 1.1, -1.25];
      const SEC_PREPARA = [0.92, 1.12, -1.02];
      const SEC_GOLPE = [0.56, 1.18, -1.335];
      const SEC_DEPOIS = [0.95, 1.12, -0.78];
      const GIRO_SEC = PI + 0.5; // o bico aponta para o vidro, um pouco para dentro
      const PEGA_SEC = T("pega") + 0.05;
      const SOLTA_SEC = T("tudo") + 0.1; // larga o secador quando tudo fica quieto

      const eixos = (b) => {
        const g = b.rotation.y;
        return { frente: new THREE.Vector3(Math.sin(g), 0, Math.cos(g)), direita: new THREE.Vector3(-Math.cos(g), 0, Math.sin(g)), cima: new THREE.Vector3(0, 1, 0) };
      };
      const em = (base, ...pares) => pares.reduce((v, [d, k]) => v.addScaledVector(d, k), base.clone());
      const noBanheiro = (ctx, x, y, z) => new THREE.Vector3(x, y, z).add(ctx.cenarios.banheiro.grupo.position);
      const peito = (b, l) => {
        const { frente, direita, cima } = eixos(b);
        return em(b.position, [cima, 0.36], [frente, 0.3], [direita, 0.14 * l]);
      };
      // ponto no mundo -> o mesmo ponto visto do outro lado do vidro (z' = 2·zEspelho - z, no cenário)
      const espelharPonto = (ctx, v) => {
        const o = ctx.cenarios.banheiro.grupo.position;
        return new THREE.Vector3(v.x, v.y, o.z + (-3.0 - (v.z - o.z)));
      };
      // mão esquerda dele: no vidro, puxando, afundando, e solta no primeiro golpe
      const alvoEsq = (tt) =>
        trilha(
          [
            [0, VIDRO_E],
            [T("Você puxa") + 0.2, VIDRO_E],
            [T("força,"), PUXANDO_E, "ambos"],
            [T("bate") - 0.15, PUXANDO_E],
            [T("bate") + 0.12, VIDRO_E, "sai"],
            [T("Ele puxa"), VIDRO_E],
            [T("volta.") + 0.15, DENTRO_E, "ambos"],
          ],
          tt,
        );
      // mão direita: varre a pia, pega o secador, ergue, primeiro golpe, ergue de novo, segundo golpe
      const alvoDir = (tt) =>
        trilha(
          [
            [0, SEC_GANCHO],
            [PEGA_SEC, SEC_GANCHO],
            [PEGA_SEC + 0.4, SEC_FORA, "ambos"],
            [T("secador") - 0.1, SEC_PREPARA, "ambos"],
            [HIT1 - 0.25, SEC_PREPARA],
            [HIT1, SEC_GOLPE, "entra"],
            [HIT1 + 0.5, SEC_PREPARA, "ambos"],
            [QUEBRA - 0.3, SEC_PREPARA],
            [QUEBRA, SEC_GOLPE, "entra"],
            [QUEBRA + 0.5, SEC_PREPARA, "ambos"],
            [QUEBRA + 1.2, SEC_DEPOIS, "ambos"],
          ],
          tt,
        );

      iniciarParte({
        host: "__parte07",
        cenarios: ["banheiro"],
        exposicao: 1.15,
        planos: [
          { de: 0, cenario: "banheiro", nome: "agua", modo: "noiteAcesa", preenchimento: 0.35 }, //           O vidro começa a ficar mole,
          { de: t.agua2, cenario: "banheiro", nome: "agua2", modo: "noiteAcesa", preenchimento: 0.35 }, //    como água.
          { de: t.atravessa, cenario: "banheiro", nome: "atravessa", modo: "noiteAcesa", preenchimento: 0.35 }, // A mão dele atravessa e segura o seu pulso.
          { de: t.gelada, cenario: "banheiro", nome: "gelada", modo: "noiteAcesa", preenchimento: 0.4 }, //  Ela é gelada.
          { de: t.puxa, cenario: "banheiro", nome: "puxa", modo: "noiteAcesa", preenchimento: 0.35 }, //      Você puxa com toda a força,
          { de: t.bate, cenario: "banheiro", nome: "bate", modo: "noiteAcesa", preenchimento: 0.35 }, //      bate na pia,
          { de: t.derruba, cenario: "banheiro", nome: "derruba", modo: "noiteAcesa", preenchimento: 0.4 }, // derruba as coisas no chão.
          { de: t.volta, cenario: "banheiro", nome: "volta", modo: "noiteAcesa", preenchimento: 0.35 }, //    Ele puxa de volta.
          { de: t.metade, cenario: "banheiro", nome: "metade", modo: "noiteAcesa", preenchimento: 0.35 }, //  Metade do seu braço já está do outro lado.
          { de: t.dentro, cenario: "banheiro", nome: "dentro", modo: "noiteAcesa", preenchimento: 0.4 }, //  E lá dentro é frio, silencioso, sem cheiro, sem nada.
          { de: t.pega, cenario: "banheiro", nome: "pega", modo: "noiteAcesa", preenchimento: 0.35 }, //      Você pega a primeira coisa que encontra,
          { de: t.secador, cenario: "banheiro", nome: "secador", modo: "noiteAcesa", preenchimento: 0.35 }, // o secador de cabelo,
          { de: t.acerta, cenario: "banheiro", nome: "acerta", modo: "noiteAcesa", preenchimento: 0.35 }, //  e acerta o espelho.
          { de: t.estoura, cenario: "banheiro", nome: "estoura", modo: "noiteAcesa", preenchimento: 0.35 }, // O vidro estoura em mil pedaços,
          { de: t.quieto, cenario: "banheiro", nome: "quieto", modo: "noiteAcesa", preenchimento: 0.4 }, //  e tudo fica quieto.
          { de: t.cai, cenario: "banheiro", nome: "cai", modo: "noiteAcesa", preenchimento: 0.45 }, //       Você cai sentado no chão, respirando forte. Acabou.
        ],
        cameras: {
          agua: { k: [[0, [0.26, 1.48, -0.92], [0.12, 1.38, -2.2], 40], [t.agua2, [0.24, 1.47, -1.0], [0.14, 1.36, -2.2], 36]], tremor: 0.002 },
          agua2: { k: [[t.agua2, [0.78, 1.64, 0.6], [0.2, 1.35, -1.5], 46], [t.atravessa, [0.74, 1.62, 0.45], [0.2, 1.35, -1.5], 44]], tremor: 0.003 },
          atravessa: { k: [[t.atravessa, [-0.05, 1.52, -1.12], [0.36, 1.32, -1.5], 42], [t.gelada, [-0.02, 1.5, -1.16], [0.36, 1.33, -1.5], 38]], tremor: 0.003 },
          gelada: { k: [[t.gelada, [-0.3, 1.56, -2.2], [0.55, 1.4, -1.25], 44], [t.puxa, [-0.26, 1.55, -2.15], [0.55, 1.4, -1.25], 40]], tremor: 0.002 },
          puxa: { k: [[t.puxa, [1.38, 1.55, -0.2], [0.15, 1.15, -1.15], 52], [t.bate, [1.34, 1.55, -0.25], [0.15, 1.15, -1.15], 50]], tremor: 0.006 },
          bate: { k: [[t.bate, [1.18, 1.25, -0.42], [0.25, 0.98, -1.12], 48], [t.derruba, [1.16, 1.24, -0.45], [0.25, 0.98, -1.12], 46]], tremor: 0.008 },
          derruba: { k: [[t.derruba, [-0.58, 0.78, 0.05], [0.0, 0.52, -0.92], 56], [t.volta, [-0.55, 0.76, 0.0], [0.0, 0.5, -0.92], 54]], tremor: 0.004 },
          volta: { k: [[t.volta, [-0.6, 1.66, 0.38], [0.2, 1.2, -1.4], 46], [t.metade, [-0.55, 1.64, 0.3], [0.2, 1.2, -1.4], 44]], tremor: 0.006 },
          metade: { k: [[t.metade, [0.0, 1.48, -1.18], [0.36, 1.27, -1.55], 42], [t.dentro, [0.03, 1.46, -1.22], [0.36, 1.27, -1.55], 38]], tremor: 0.003 },
          dentro: { k: [[t.dentro, [-0.12, 1.12, -2.05], [0.33, 1.32, -1.5], 48], [t.pega, [-0.06, 1.14, -1.95], [0.33, 1.33, -1.5], 42]], tremor: 0.002 },
          pega: { k: [[t.pega, [1.3, 1.52, -0.5], [0.7, 1.3, -1.32], 48], [t.secador, [1.26, 1.5, -0.55], [0.7, 1.3, -1.32], 46]], tremor: 0.004 },
          secador: { k: [[t.secador, [1.15, 1.5, -0.3], [0.6, 1.45, -1.05], 44], [t.acerta, [1.12, 1.5, -0.35], [0.58, 1.46, -1.05], 42]], tremor: 0.004 },
          acerta: { k: [[t.acerta, [-0.6, 1.68, 0.4], [0.3, 1.4, -1.45], 46], [t.estoura, [-0.58, 1.66, 0.35], [0.3, 1.4, -1.45], 45]], tremor: 0.007 },
          estoura: { k: [[t.estoura, [1.22, 1.62, -0.32], [0.2, 1.3, -1.35], 54], [t.quieto, [1.18, 1.6, -0.36], [0.2, 1.28, -1.3], 52]], tremor: 0.009 },
          quieto: { k: [[t.quieto, [-0.62, 2.1, 0.95], [0.25, 0.8, -1.0], 56], [t.cai, [-0.6, 2.08, 0.9], [0.25, 0.8, -1.0], 55]], tremor: 0.001 },
          cai: { k: [[t.cai, [-0.3, 0.92, -0.78], [0.3, 0.7, -0.1], 50], [FIM, [-0.24, 0.88, -0.74], [0.3, 0.68, -0.1], 44]], tremor: 0.002 },
        },
        pos: (tt, p) => ({ onda: p.nome === "agua" || p.nome === "metade" ? 0.35 : 0, tom: p.nome === "dentro" ? 0.85 : p.nome === "gelada" ? 0.55 : 0 }),
        personagem: {
          semente: 6,
          onde: [[0, "banheiro"]],
          pos: [
            [0, RECUO],
            [0.9, RECUO],
            [3.0, PERTO, "ambos"],
            [3.5, NA_PIA, "ambos"],
            [T("Ele puxa"), NA_PIA],
            [T("volta.") + 0.15, PUXADO, "ambos"],
            [HIT1 + 0.05, PUXADO],
            [HIT1 + 0.45, SOLTO, "ambos"],
            [T("cai") - 0.05, SOLTO],
            [T("cai") + 0.75, SENTADO, "ambos"],
          ],
          passos: [[0.9, 3.3, 0.7, 0.5]],
          pose: {
            giro: [[0, PI], [1.6, PI], [3.3, GIRO_PIA, "ambos"], [T("Ele puxa"), GIRO_PIA], [T("volta.") + 0.15, PI - 0.35, "ambos"], [T("Você pega"), PI - 0.35], [T("pega"), GIRO_PIA, "ambos"], [QUEBRA + 0.5, GIRO_PIA], [T("tudo"), PI, "ambos"]],
            inclinar: [
              [0, -0.04], [1.9, 0.0], [3.5, 0.65, "ambos"], [T("Você puxa") + 0.3, 0.65],
              // puxando com força: o tronco treme sem soltar a mão do vidro
              ...Array.from({ length: 9 }, (_, i) => [T("Você puxa") + 0.5 + i * 0.25, i % 2 ? 0.62 : 0.56]),
              [T("bate") - 0.1, 0.56], [T("bate") + 0.12, 0.68, "sai"], [T("bate") + 0.5, 0.65, "ambos"],
              [T("Ele puxa"), 0.65], [T("volta.") + 0.15, 0.72, "ambos"], [T("Você pega"), 0.72], [T("pega"), 0.65, "ambos"], [HIT1 + 0.05, 0.65], [HIT1 + 0.45, 0.5, "ambos"], [QUEBRA - 0.3, 0.5], [QUEBRA, 0.65, "entra"], [QUEBRA + 0.5, 0.3, "ambos"],
              [T("quieto."), 0.15], [T("cai"), 0.15], [T("cai") + 0.75, -0.12, "ambos"], [FIM, -0.18],
            ],
            cabecaInclina: [[0, -0.04], [3.5, -0.45, "ambos"], [T("Ele puxa"), -0.5], [T("volta.") + 0.15, -0.62, "ambos"], [HIT1 + 0.45, -0.25, "ambos"], [QUEBRA, -0.4, "ambos"], [QUEBRA + 0.5, -0.1, "ambos"], [T("cai") + 0.75, 0.05, "ambos"], [FIM, 0.12]],
            cabecaGiro: [[0, 0], [T("força,") - 0.4, 0], [T("força,"), 0.35, "ambos"], [T("bate"), -0.15, "ambos"], [T("derruba"), 0.4, "ambos"], [T("chão.") + 0.3, 0.0, "ambos"], [T("pega"), 0.0], [T("pega") + 0.3, 0.6, "ambos"], [T("secador"), 0.0, "ambos"], [T("quieto."), 0], [T("quieto.") + 0.6, -0.2, "ambos"]],
            cabecaTomba: [[0, 0], [T("força,"), 0.15, "ambos"], [T("bate"), -0.1, "ambos"], [T("Ele puxa"), 0]],
            olhos: [[0, 1.05], [T("atravessa"), 1.2], [T("segura"), 1.45, "sai"], [T("Você puxa"), 0.7], [T("força,"), 0.45, "ambos"], [T("bate") + 0.3, 1.3, "ambos"], [T("Metade"), 1.45], [T("frio,"), 1.3], [QUEBRA - 0.05, 1.2], [QUEBRA + 0.05, 0.25, "sai"], [QUEBRA + 0.9, 1.15, "ambos"], [T("quieto."), 1.3], [T("cai") + 0.9, 0.9, "ambos"], [FIM, 0.8]],
            apertar: [[0, 0], [T("Você puxa"), 0.3], [T("força,"), 0.85, "ambos"], [T("bate") + 0.3, 0.1, "ambos"], [T("pega"), 0.2], [HIT1, 0.7, "ambos"], [HIT1 + 0.6, 0.2, "ambos"], [QUEBRA, 0.9, "ambos"], [QUEBRA + 0.9, 0, "ambos"]],
            sobrancelha: [[0, 0.3], [T("segura"), 1.0, "sai"], [T("Você puxa"), -0.6, "ambos"], [T("bate") + 0.3, 0.9, "ambos"], [T("frio,"), 0.8], [T("pega"), -0.5, "ambos"], [QUEBRA + 0.9, 0.6, "ambos"], [T("cai") + 0.9, 0.3, "ambos"]],
            sobrancelhaMedo: [[0, 0.8], [T("segura"), 1.0], [T("Você puxa"), 0.4], [T("bate") + 0.3, 1.0, "ambos"], [T("pega"), 0.5], [QUEBRA + 0.9, 0.9, "ambos"], [FIM, 0.7]],
            boca: [[0, 0.1], [T("segura"), 0.35, "sai"], [T("Você puxa"), 0.2], [T("força,"), 0.4, "ambos"], [T("bate") + 0.3, 0.35], [T("Metade"), 0.3], [T("frio,"), 0.18], [T("pega"), 0.3], [HIT1, 0.45, "sai"], [QUEBRA, 0.5, "sai"], [T("quieto."), 0.2], [T("respirando"), 0.3, "ambos"], [FIM, 0.25]],
            ofegar: [[0, 1.2], [T("Você puxa"), 1.8], [T("quieto."), 1.2], [T("respirando"), 2.4, "ambos"], [FIM, 2.0]],
            quadril: [[0, 0], [T("cai") + 0.1, 0], [T("cai") + 0.75, -1.35, "ambos"]],
            joelho: [[0, 0], [T("cai") + 0.1, 0], [T("cai") + 0.45, 0.9, "ambos"], [T("cai") + 0.75, 0.35, "ambos"]],
          },
          semPiscar: [[T("atravessa"), QUEBRA - 0.1]],
          maos: (tt, pts, ctx, b) => {
            const r = {};
            // a mão direita solta: junto do corpo, ao lado do quadril (não pendura para dentro da bancada)
            const { frente: fr, direita: dr, cima: cm } = eixos(b);
            r.alvoD = em(b.position, [dr, 0.3], [cm, 0.08], [fr, 0.05]);
            r.pesoD = trilha([[0, 0], [2.4, 0], [3.4, 1, "ambos"], [T("cai") - 0.2, 1], [T("cai") + 0.2, 0, "ambos"]], tt);
            // esquerda: sobe pela frente do peito até o vidro; fica presa até o primeiro golpe
            const pE = trilha([[0, 0], [2.0, 0], [2.6, 1, "ambos"], [HIT1 + 0.15, 1], [HIT1 + 0.75, 0, "ambos"]], tt);
            if (pE > 0) {
              const vai = trilha([[2.6, 0], [3.5, 1, "ambos"], [HIT1 + 0.1, 1], [HIT1 + 0.45, 0, "ambos"]], tt);
              r.alvoE = peito(b, -1).lerp(noBanheiro(ctx, ...alvoEsq(tt)), vai);
              r.pesoE = pE;
            }
            // direita: varre a pia (derruba o copo), depois o secador
            const varre = trilha([[T("derruba") - 0.35, 0], [T("derruba") - 0.05, 1, "ambos"], [T("derruba") + 0.55, 1], [T("derruba") + 0.95, 0, "ambos"]], tt);
            if (varre > 0) {
              const x = trilha([[T("derruba") - 0.05, 0.62], [T("derruba") + 0.45, 0.46, "ambos"]], tt);
              r.alvoD = r.alvoD.clone().lerp(noBanheiro(ctx, x, 1.02, -1.22), varre);
            }
            const pD = trilha([[T("Você pega") - 0.1, 0], [T("Você pega") + 0.4, 1, "ambos"], [SOLTA_SEC + 0.1, 1], [SOLTA_SEC + 0.6, 0, "ambos"]], tt);
            if (pD > 0) r.alvoD = r.alvoD.clone().lerp(noBanheiro(ctx, ...alvoDir(tt)), pD);
            // sentado no chão: as mãos apoiadas no chão, ao lado do quadril
            const pS = trilha([[T("cai") + 0.4, 0], [T("cai") + 0.9, 1, "ambos"]], tt);
            if (pS > 0) {
              const { frente, direita } = eixos(b);
              r.alvoE = em(b.position, [direita, -0.3], [frente, -0.12]).setY(ctx.cenarios.banheiro.grupo.position.y + 0.06);
              r.alvoD = em(b.position, [direita, 0.3], [frente, -0.12]).setY(ctx.cenarios.banheiro.grupo.position.y + 0.06);
              r.pesoE = pS;
              r.pesoD = pS;
            }
            return r.alvoE || r.alvoD ? r : null;
          },
        },
        // o reflexo: chega no vidro, debruçado na pia dele; a mão atravessa e segura o pulso; solta no golpe
        reflexo: {
          cenario: "banheiro",
          atraso: () => 0,
          janelas: [
            {
              de: -1,
              ate: FIM + 1,
              semPiscar: [[-1, FIM + 1]],
              pos: [[0, [0, ALT, -0.28]], [0.3, [0, ALT, -0.28]], [1.6, PERTO, "ambos"], [3.3, NA_PIA, "ambos"], [HIT1 + 0.1, NA_PIA], [HIT1 + 0.6, [0.45, ALT, -0.45], "ambos"]],
              passos: [[0.3, 1.6, 0.8, 0.5], [HIT1 + 0.1, HIT1 + 0.6, 0.6, 0.45]],
              pose: {
                giro: [[0, PI], [1.4, PI], [3.2, GIRO_PIA, "ambos"], [HIT1 + 0.1, GIRO_PIA], [HIT1 + 0.6, PI, "ambos"]],
                inclinar: [[0, 0], [1.4, 0.2], [3.4, 0.65, "ambos"], [HIT1 + 0.1, 0.65], [HIT1 + 0.6, 0.05, "ambos"]],
                quadril: [[0, 0]],
                joelho: [[0, 0]],
                cabecaInclina: [[0, 0], [1.4, -0.1], [3.4, -0.5, "ambos"], [HIT1 + 0.1, -0.5], [HIT1 + 0.6, 0.0, "ambos"]],
                cabecaTomba: [[0, 0.22], [3.4, 0.15], [T("gelada."), 0.3, "ambos"], [T("Metade"), 0.1, "ambos"], [T("frio,"), 0.3, "ambos"], [HIT1, 0.1, "ambos"]],
                olhos: [[0, 1.2], [HIT1 - 0.05, 1.2], [HIT1 + 0.1, 1.5, "sai"]],
                sobrancelha: [[0, 0.3], [HIT1 - 0.05, 0.3], [HIT1 + 0.1, -1.0, "sai"]],
                sobrancelhaMedo: [[0, 0]],
                sorriso: [[0, 1.0], [HIT1 - 0.05, 1.0], [HIT1 + 0.1, 0, "sai"]],
                sorrisoLargo: [[0, 1.0], [T("Você puxa"), 0.8], [T("Metade"), 1.0, "ambos"], [HIT1 - 0.05, 1.0], [HIT1 + 0.1, 0, "sai"]],
                boca: [[0, 0], [HIT1 - 0.05, 0], [HIT1 + 0.1, 0.55, "sai"], [QUEBRA, 0.6]],
                ofegar: [[0, 0]],
              },
              maos: (tt, pts, ctx, b) => {
                const r = {};
                // esquerda: atravessa o vidro e segura o pulso dele (pela pega da mão dele, neste quadro)
                const p = trilha([[0, 0], [2.4, 0], [2.9, 1, "ambos"], [HIT1 + 0.1, 1], [HIT1 + 0.7, 0, "ambos"]], tt);
                if (p > 0) {
                  const vai = trilha([[2.9, 0], [T("segura"), 1, "ambos"], [HIT1 + 0.05, 1], [HIT1 + 0.4, 0, "ambos"]], tt);
                  const pulso = ctx.boneco.userData.rig.bracoE.pega.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.095, -0.02));
                  r.alvoE = peito(b, -1).lerp(espelharPonto(ctx, pulso), vai);
                  r.pesoE = p;
                }
                // direita: apoiada na bancada enquanto está debruçado
                const pD = trilha([[2.4, 0], [3.2, 1, "ambos"], [HIT1 + 0.1, 1], [HIT1 + 0.6, 0, "ambos"]], tt);
                if (pD > 0) {
                  const vai = trilha([[2.4, 0], [3.2, 1, "ambos"], [HIT1 - 0.2, 1], [HIT1 + 0.3, 0, "ambos"]], tt);
                  r.alvoD = peito(b, 1).lerp(noBanheiro(ctx, 0.52, 0.94, -1.06), vai);
                  r.pesoD = pD;
                }
                return r.alvoE || r.alvoD ? r : null;
              },
            },
          ],
        },
        quadro: (tt, plano, ctx, fase) => {
          const b = ctx.cenarios.banheiro;
          if (fase === "antes") {
            b.porta(1.5);
            b.corredor(1);
            b.torneira(false);
            b.tecla(true);
            b.lencol(0);
            b.derrubar(trilha([[0, 0], [T("derruba") + 0.05, 0], [T("chão.") + 0.3, 1, "linear"]], tt));
            b.quebrar(tt - QUEBRA);
            // o vidro mole como água: ondas a partir de onde as mãos se encontram; endurece no golpe
            const u = b.materialVidro.uniforms;
            u.agua.value = trilha([[0, 0.05], [T("mole,"), 0.55, "ambos"], [T("água."), 0.85, "ambos"], [HIT1 - 0.02, 0.85], [HIT1 + 0.05, 1.0], [HIT1 + 0.45, 0.0, "sai"]], tt);
            u.centroAgua.value.set(0.83, 0.32);
            toquesNoVidro(b.materialVidro, [[0.83, 0.3, T("segura"), 1], [0.97, 0.29, HIT1, 1]], tt);
            // depois do estouro, o fundo cobre o vão: o mundo do espelho some (e não pesa no render)
            b.espelhoVisivel(tt < QUEBRA + 0.15);
            return;
          }
          // o secador: no gancho, na mão direita (bico para o vidro) e, ao cair sentado, no chão
          for (const c of [b.real, b.copia]) {
            const s = c.corpoSecador;
            const gancho = c.secador;
            if (tt < PEGA_SEC + 0.02) {
              s.position.set(0, 0, 0.07);
              s.rotation.set(0, 0, 0);
              continue;
            }
            // posição da mão no cenário (a mesma conta nas duas cópias: elas são o mesmo cenário espelhado)
            const mao = ctx.boneco.userData.rig.bracoD.pega.getWorldPosition(new THREE.Vector3()).sub(b.grupo.position);
            const naMao = new THREE.Vector3();
            const chao = new THREE.Vector3(1.02, 0.05, -0.3).sub(gancho.position);
            const kp = trilha([[PEGA_SEC, 0], [PEGA_SEC + 0.45, 1, "ambos"]], tt);
            const ry = GIRO_SEC * kp + trilha([[QUEBRA + 0.5, 0], [T("tudo"), -0.9, "ambos"]], tt);
            // a mão segura o cabo: o corpo do secador fica acima da mão, o bico à frente
            // o cabo fica encostado na palma (um pouco à frente do centro da mão), sem atravessar a mão
            const cabo = new THREE.Vector3(0, -0.1, -0.03).applyEuler(new THREE.Euler(0, ry, 0));
            const palma = new THREE.Vector3(0, 0, -0.055).applyEuler(new THREE.Euler(0, ry - PI, 0));
            naMao.set(mao.x - cabo.x + palma.x, mao.y - cabo.y, mao.z - cabo.z + palma.z).sub(gancho.position);
            const repouso = new THREE.Vector3(0, 0, 0.07);
            const k = trilha([[SOLTA_SEC, 0], [SOLTA_SEC + 0.4, 1, "entra"]], tt);
            s.position.copy(repouso).lerp(naMao, kp).lerp(chao, k);
            s.rotation.set(0, ry + 0.4 * k, (PI / 2) * k);
          }
        },
      });
