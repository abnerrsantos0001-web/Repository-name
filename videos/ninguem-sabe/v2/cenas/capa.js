      import { iniciarParte, MEDIDAS } from "./assets/js/cena.js";

      const PI = Math.PI;
      const ALT = MEDIDAS.quadrilEmPe;
      const PIA = [0, ALT, -0.6];
      // capa do vídeo 2: ele com medo na frente do espelho; o reflexo não copia: sorri grande demais
      iniciarParte({
        host: "__partecapa",
        cenarios: ["banheiro"],
        exposicao: 1.15,
        planos: [{ de: 0, cenario: "banheiro", nome: "capa", modo: "noiteAcesa", preenchimento: 0.45 }],
        cameras: {
          capa: { k: [[0, [0.46, 1.56, 0.08], [-0.2, 1.42, -1.5], 34], [2, [0.46, 1.56, 0.08], [-0.2, 1.42, -1.5], 34]], tremor: 0 },
        },
        personagem: {
          semente: 6,
          onde: [[0, "banheiro"]],
          pos: [[0, PIA]],
          pose: {
            giro: [[0, PI]],
            inclinar: [[0, -0.05]],
            cabecaGiro: [[0, 0.12]],
            cabecaTomba: [[0, -0.08]],
            olhos: [[0, 1.4]],
            sobrancelha: [[0, 0.9]],
            sobrancelhaMedo: [[0, 1.0]],
            boca: [[0, 0.24]],
          },
          semPiscar: [[0, 3]],
        },
        reflexo: {
          cenario: "banheiro",
          atraso: () => 0,
          janelas: [
            {
              de: -1,
              ate: 5,
              pos: [[0, [-0.04, ALT, -0.66]]],
              passos: [],
              semPiscar: [[-1, 5]],
              pose: {
                giro: [[0, PI]],
                inclinar: [[0, 0.08]],
                cabecaGiro: [[0, 0.22]],
                cabecaTomba: [[0, 0.18]],
                cabecaInclina: [[0, -0.06]],
                olhos: [[0, 1.12]],
                sobrancelha: [[0, -0.35]],
                sobrancelhaMedo: [[0, 0]],
                boca: [[0, 0]],
                sorriso: [[0, 1]],
                sorrisoLargo: [[0, 1]],
              },
              maos: () => null,
            },
          ],
        },
        quadro: (tt, plano, ctx) => {
          const b = ctx.cenarios.banheiro;
          b.porta(1.5);
          b.corredor(0.5);
          b.tecla(true);
          b.lencol(0);
          b.derrubar(0);
          b.quebrar(-1);
          b.espelhoVisivel(true);
        },
      });
