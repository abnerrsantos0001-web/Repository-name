      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, MEDIDAS } from "./assets/js/cena.js";
      import { PALAVRAS } from "./assets/js/tempos/v1-parte11.js";

      const T = tempos(PALAVRAS);
      const PI = Math.PI;
      const ALT = MEDIDAS.quadrilEmPe;
      const FIM = 16.1;

      // encerramento: ele sozinho na avenida escura, a janela acesa lá longe, a câmera subindo devagar
      iniciarParte({
        host: "__parte11",
        cenarios: ["cidade"],
        planos: [{ de: 0, cenario: "cidade", nome: "fim", modo: "noite" }],
        cameras: {
          fim: {
            k: [
              [0, [1.3, 1.6, 3.8], [0.2, 6, -60], 46],
              [T("Se inscreve") - 0.3, [2.4, 4.8, 10.5], [0, 1.5, -60], 50, "ambos"],
              [FIM, [3.0, 11, 21], [0, -1, -60], 54, "linear"],
            ],
            tremor: 0.002,
          },
        },
        personagem: {
          onde: [[0, "cidade"]],
          pos: [[0, [0.5, ALT, 0]]],
          pose: {
            giro: [[0, PI]],
            cabecaInclina: [[0, -0.1], [6, -0.18, "ambos"]],
            cabecaGiro: [[0, 0], [3.0, 0.25, "ambos"], [6.5, -0.15, "ambos"], [9.5, 0, "ambos"]],
          },
        },
        quadro: (tt, plano, ctx) => {
          ctx.cenarios.cidade.luzes(0);
          ctx.cenarios.cidade.semaforos(false);
          ctx.cenarios.cidade.fumaca(false);
        },
      });
