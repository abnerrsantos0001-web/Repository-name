      import { iniciarParte } from "./assets/js/cena.js";
      import { SALA, ESCOLA, PRAIA } from "./assets/js/mundo4.js";
      import { PI, ALT } from "./assets/js/v3.js";
      const cen = ["sala", "escola", "garagem", "praia", "casaJulia", "aeroporto", "igreja", "noite", "quarto2", "cozinha"];
      const S = SALA.sentado(0);
      iniciarParte({
        host: "__parte98",
        cenarios: cen,
        planos: cen.map((c, i) => ({ de: i, cenario: c, nome: c, modo: c === "sala" ? "noite" : c === "casaJulia" ? "dia" : "dia" })),
        cameras: {
          sala: { k: [[0, [1.6, 1.55, -1.4], [-0.2, 0.8, 1.0], 50]] },
          escola: { k: [[1, [3.2, 2.3, -3.0], [-0.5, 0.6, 1.2], 56]] },
          garagem: { k: [[2, [2.4, 1.8, 2.6], [0, 0.8, -1.0], 54]] },
          praia: { k: [[3, [3, 1.8, 10], [0, 0.6, -4], 50]] },
          casaJulia: { k: [[4, [2.5, 1.6, 6.5], [0, 1.2, 0.5], 46]] },
          aeroporto: { k: [[5, [10, 4.5, 6.5], [-2, 1, -2], 56]] },
          igreja: { k: [[6, [6, 2.2, 12], [0, 4, 0], 50]] },
          noite: { k: [[7, [-20, 6, 2], [10, 2, -2], 50]] },
          quarto2: { k: [[8, [1.6, 1.7, 1.6], [-1.2, 0.6, -0.8], 52]] },
          cozinha: { k: [[9, [2.2, 1.7, 1.9], [0.2, 0.8, 0.2], 52]] },
        },
        personagem: {
          onde: [[0, "sala"], [1, "escola"], [2, "garagem"], [3, "praia"], [4, "casaJulia"], [5, "aeroporto"], [6, "igreja"], [7, "noite"], [8, "quarto2"], [9, "cozinha"]],
          pos: [[0, S], [1, ESCOLA.sentado(3, 2), "corte"], [2, [-0.9, ALT, -2.2], "corte"], [3, [0, ALT + PRAIA.areia(4), 4], "corte"], [4, [0.2, ALT + 0.15, 1.1], "corte"], [5, [0, ALT, 0], "corte"], [6, [0, ALT + 0.14, 3.8], "corte"], [7, [0, ALT, 5.2], "corte"], [8, [0, ALT, 0], "corte"], [9, [0.4, ALT, 1.4], "corte"]],
          pose: {
            giro: [[0, PI], [1, PI, "corte"], [2, 0, "corte"], [3, PI, "corte"], [4, PI, "corte"], [6, PI, "corte"]],
            quadril: [[0, -PI / 2], [1, -PI / 2], [2, 0, "corte"]],
            joelho: [[0, 1.5], [1, 1.5], [2, 0, "corte"]],
          },
        },
        outros: [
          { id: "lucas", variante: "lucas", onde: [[0, "sala"], [1, "escola"]], pos: [[0, SALA.sentado(0.75)], [1, ESCOLA.sentado(4, 2), "corte"]], pose: { giro: [[0, PI]], quadril: [[0, -PI / 2]], joelho: [[0, 1.5]] } },
          { id: "julia", variante: "julia", onde: [[0, "casaJulia"]], pos: [[0, [-0.1, ALT + 0.15, 0.45]]], pose: { giro: [[0, 0]], choro: [[0, 1]], choroFase: [[0, 0], [12, 12, "linear"]] } },
          { id: "pai", variante: "pai", onde: [[0, "garagem"]], pos: [[0, [0.2, ALT, -2.3]]], pose: { giro: [[0, 0]], inclinar: [[0, 0.5]], choro: [[0, 1]], choroFase: [[0, 0], [12, 12, "linear"]] } },
          { id: "mae", variante: "mae", onde: [[0, "sala"], [8, "cozinha"]], pos: [[0, SALA.sentado(-0.75)], [8, [-0.4, ALT, 1.4], "corte"]], pose: { giro: [[0, PI], [8, PI, "corte"]], quadril: [[0, -PI / 2], [8, 0, "corte"]], joelho: [[0, 1.5], [8, 0, "corte"]] } },
        ],
        quadro: (t, plano, ctx) => {
          if (plano.cenario === "noite") ctx.cenarios.noite.acender(0.7, 1);
        },
      });
