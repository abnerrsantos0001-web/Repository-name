      import { iniciarParte, MEDIDAS } from "./assets/js/cena.js";

      const ALT = MEDIDAS.quadrilEmPe;
      // capa: ele sozinho no meio da avenida vazia, carros largados, a torre lá no fundo
      iniciarParte({
        host: "__partecapa",
        cenarios: ["cidade"],
        planos: [{ de: 0, cenario: "cidade", nome: "capa", modo: "dia" }],
        cameras: { capa: { k: [[0, [-0.75, 1.1, 4.0], [1.9, 2.2, -14], 42], [2, [-0.75, 1.1, 4.0], [1.9, 2.2, -14], 42]], tremor: 0 } },
        personagem: {
          onde: [[0, "cidade"]],
          pos: [[0, [0.9, ALT, 0.8]]],
          pose: { giro: [[0, -0.35]], cabecaInclina: [[0, -0.12]], cabecaGiro: [[0, 0.35]], olhos: [[0, 1.3]], apertar: [[0, 0.25]], boca: [[0, 0.18]], abertura: [[0, 0.35]], cotovelo: [[0, 0.3]] },
        },
        quadro: (tt, plano, ctx) => {
          ctx.cenarios.cidade.luzes(0);
          ctx.cenarios.cidade.semaforos(true);
          ctx.cenarios.cidade.fumaca(false);
        },
      });
