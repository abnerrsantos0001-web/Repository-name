      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, MEDIDAS, trilha } from "./assets/js/cena.js";
      import { lanterna as telaLanterna } from "./assets/js/telas.js";
      import { PALAVRAS } from "./assets/js/tempos/v1-parte08.js";

      const T = tempos(PALAVRAS);
      const PI = Math.PI;
      const ALT = MEDIDAS.quadrilEmPe;
      const FIM = 19.2;
      const t = {
        todos: T("Todos.") - 0.1,
        pessoa: T("Menos") - 0.15,
        voce: T("Você.") - 0.15,
        vazio: T("Você não") - 0.15,
        paralelo: T("Você ficou") - 0.15,
        ver: T("E ela") - 0.15,
        lados: T("Porque") - 0.15,
      };
      // os dois no apartamento, onde a parte 7 terminou
      const ELE = [0.2, ALT, -1.3];
      const ELA = [1.45, ALT, -3.9];
      const GIRO_ELE = Math.atan2(ELA[0] - ELE[0], ELA[2] - ELE[2]);
      const GIRO_ELA = Math.atan2(ELE[0] - ELA[0], ELE[2] - ELA[2]);
      const fala = (t0, t1, abre = 0.3) => {
        const n = Math.max(2, Math.round((t1 - t0) / 0.1));
        return [[t0 - 0.05, 0], ...Array.from({ length: n }, (_, i) => [t0 + i * 0.1, i % 3 === 2 ? 0.05 : abre * (0.6 + 0.4 * (((i * 7) % 5) / 4))]), [t1 + 0.1, 0]];
      };
      // "entre os dois lados": a imagem pula entre o mundo normal e o azulado, em pulsos irregulares
      const vira = (tt) => {
        const k = Math.floor(tt * 3.2);
        return Math.abs(Math.sin(k * 78.233) * 43758.5453) % 1 > 0.5 ? 1 : 0;
      };
      const pos = (tt, plano) => {
        if (plano.cenario === "cidade" && tt < t.vazio) return null; // a cidade de volta: mundo normal
        if (plano.nome === "vazio") return null;
        if (plano.nome === "paralelo") {
          const k = trilha([[t.paralelo, 0], [T("paralelo.") + 0.3, 1, "entra"]], tt);
          return { onda: 0.5 + 1.8 * k, tom: 0.35 + 0.6 * k };
        }
        if (plano.nome === "lados") {
          const v = vira(tt);
          return { onda: 0.2 + 1.4 * v, tom: 0.05 + 0.8 * v };
        }
        return { onda: 0.4, tom: 0.4 };
      };

      iniciarParte({
        host: "__parte08",
        cenarios: ["cidade", "apartamento"],
        planos: [
          { de: 0, cenario: "cidade", nome: "voltaram", modo: "noite" }, //           E ontem todos voltaram.
          { de: t.todos, cenario: "cidade", nome: "todos", modo: "noite" }, //        Todos.
          { de: t.pessoa, cenario: "apartamento", nome: "pessoa" }, //                Menos uma pessoa.
          { de: t.voce, cenario: "apartamento", nome: "voce" }, //                    Você.
          { de: t.vazio, cenario: "cidade", nome: "vazio", modo: "dia" }, //          Você não ficou no mundo vazio.
          { de: t.paralelo, cenario: "cidade", nome: "paralelo", modo: "dia" }, //    Você ficou preso no mundo paralelo.
          { de: t.ver, cenario: "apartamento", nome: "ver" }, //                      E ela é a única que consegue te ver.
          { de: t.lados, cenario: "apartamento", nome: "lados" }, //                  Porque está entre os dois lados.
        ],
        cortesEscuros: [t.pessoa, t.vazio, t.ver],
        cameras: {
          voltaram: { k: [[0, [0, 30.5, 71], [0, 12, -60], 50], [t.todos, [0, 30.2, 69.5], [0, 11.5, -60], 48]], tremor: 0.002 },
          todos: { k: [[t.todos, [3.2, 1.2, 9], [0, 5, -60], 46], [t.pessoa, [3.0, 1.3, 8], [0, 5, -60], 45]], tremor: 0.003 },
          pessoa: { k: [[t.pessoa, [-3.2, 2.35, -5.6], [0.3, 1.1, -1.5], 46], [t.voce, [-3.0, 2.3, -5.3], [0.25, 1.15, -1.4], 40]], tremor: 0.003 },
          voce: { k: [[t.voce, [0.62, 1.62, -2.55], [0.2, 1.5, -1.3], 38], [t.vazio, [0.55, 1.6, -2.35], [0.2, 1.52, -1.3], 30]], tremor: 0.003 },
          vazio: { k: [[t.vazio, [6, 14, 16], [0.5, 1, -2], 48], [t.paralelo, [5.5, 13, 13.5], [0.5, 1, -2], 46]], tremor: 0.002 },
          paralelo: { k: [[t.paralelo, [3.6, 2.2, 5.5], [0.5, 1.2, 0], 44], [t.ver, [-3.6, 2.6, 4.6], [0.5, 1.2, 0], 40, "linear"]], tremor: 0.004 },
          ver: { k: [[t.ver, [0.65, 1.75, -0.35], [1.45, 1.4, -3.9], 38], [t.lados, [0.7, 1.73, -0.6], [1.45, 1.42, -3.9], 34]], tremor: 0.003 },
          lados: { k: [[t.lados, [0.98, 1.64, -2.62], [1.45, 1.52, -3.9], 32], [FIM, [1.05, 1.62, -2.82], [1.45, 1.52, -3.9], 26, "linear"]], tremor: 0.003 },
        },
        personagem: {
          onde: [[0, "apartamento"], [t.vazio, "cidade"], [t.ver, "apartamento"]],
          pos: [[0, ELE], [t.vazio - 0.01, ELE], [t.vazio, [0.5, ALT, 0]], [t.ver - 0.01, [0.5, ALT, 0]], [t.ver, ELE]],
          pose: {
            giro: [[0, GIRO_ELE], [t.vazio, PI, "corte"], [t.ver, GIRO_ELE, "corte"]],
            cabecaInclina: [[0, 0.1], [t.voce, 0.05], [t.vazio, 0.0], [t.paralelo, 0.1], [t.ver, 0.0]],
            cabecaGiro: [[0, 0], [t.vazio, 0], [t.vazio + 1.2, -0.5, "ambos"], [t.paralelo, 0.45, "ambos"], [t.paralelo + 1.6, -0.35, "ambos"], [t.ver, 0]],
            olhos: [[0, 1], [t.voce, 1], [T("Você.") + 0.2, 1.25, "sai"], [t.vazio, 1], [t.paralelo, 1.2]],
            apertar: [[0, 0.1], [t.paralelo, 0.1], [T("preso"), 0.35, "ambos"], [t.ver, 0.1]],
          },
          maos: (tt, pts, ctx) => {
            if (tt >= t.vazio && tt < t.ver) return null;
            const giro = ctx.boneco.rotation.y;
            const frente = new THREE.Vector3(Math.sin(giro), 0, Math.cos(giro));
            return { alvoE: pts.cabeca.clone().addScaledVector(frente, 0.24).add(new THREE.Vector3(0, -0.77, 0)), pesoE: 0.4 };
          },
        },
        outros: [
          {
            id: "mulher",
            variante: "mulher",
            onde: [[0, "apartamento"]],
            pos: [[0, ELA]],
            visivel: (tt, p) => p.nome !== "pessoa",
            pose: {
              giro: [[0, GIRO_ELA]],
              olhos: [[0, 1.1], [t.lados, 1.1], [T("dois"), 1.3, "sai"]],
              inclinar: [[0, -0.03]],
              cabecaInclina: [[0, 0.05], [t.ver, 0.0], [t.lados, -0.04]],
              cabecaTomba: [[0, 0], [t.ver, 0], [t.ver + 1.0, 0.12, "ambos"], [t.lados, 0.0]],
              boca: [[0, 0]],
            },
          },
        ],
        celular: (tt) => (tt >= t.vazio && tt < t.ver ? null : "mao"),
        tela: (ctx2d, tt, desenhar) => {
          if (desenhar) telaLanterna(ctx2d, 600, 1302);
          return "lanterna";
        },
        lanterna: () => 0,
        pos,
        quadro: (tt, plano, ctx) => {
          const c = ctx.cenarios;
          // todos voltaram: a cidade acende de uma vez, janela por janela
          c.cidade.luzes(tt < t.vazio ? trilha([[0.8, 0], [T("Todos.") + 0.6, 1, "linear"]], tt) : 0);
          c.cidade.semaforos(tt < t.vazio ? tt > 1.4 : true);
          c.cidade.fumaca(false);
          c.apartamento.porta(1.2);
          c.apartamento.relogio.userData.mostrar("3:33");
        },
      });
