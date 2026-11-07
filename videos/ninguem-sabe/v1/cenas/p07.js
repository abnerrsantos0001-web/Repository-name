      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, MEDIDAS, trilha } from "./assets/js/cena.js";
      import { lanterna as telaLanterna } from "./assets/js/telas.js";
      import { PALAVRAS } from "./assets/js/tempos/v1-parte07.js";

      const T = tempos(PALAVRAS);
      const ALT = MEDIDAS.quadrilEmPe;
      const FIM = 26.5;
      const t = {
        olha: T("Ela te") - 0.15,
        pergunta: T("Você pergunta,") - 0.15,
        responde: T("E ela") - 0.15,
        voltou: T("Todo mundo") - 0.15,
        aqui: T("Por que") - 0.15,
        entende: T("Você não") - 0.15,
        explica: T("Ela explica,") - 0.15,
        relogio: T("às") - 0.15,
        lado: T("o mundo") - 0.15,
      };
      // ele para logo depois da porta; ela perto do abajur, de frente para ele
      const ELE = [0.2, ALT, -1.3];
      const ELA = [1.3, ALT, -3.6];
      const GIRO_ELE = Math.atan2(ELA[0] - ELE[0], ELA[2] - ELE[2]);
      const GIRO_ELA = Math.atan2(ELE[0] - ELA[0], ELE[2] - ELA[2]);
      // boca mexendo enquanto alguém fala (determinístico)
      const fala = (t0, t1, abre = 0.3) => {
        const n = Math.max(2, Math.round((t1 - t0) / 0.1));
        return [[t0 - 0.05, 0], ...Array.from({ length: n }, (_, i) => [t0 + i * 0.1, i % 3 === 2 ? 0.05 : abre * (0.6 + 0.4 * (((i * 7) % 5) / 4))]), [t1 + 0.1, 0]];
      };
      // tremor da mulher: a cabeça treme de leve enquanto ela responde
      const treme = (t0, t1, a) => [[t0, 0], ...Array.from({ length: Math.round((t1 - t0) / 0.09) }, (_, i) => [t0 + 0.09 * (i + 1), (i % 2 ? 1 : -1) * a, "ambos"]), [t1 + 0.1, 0]];
      // o mundo paralelo: tudo levemente distorcido e azulado lá dentro; no fim a virada para o "outro lado"
      const pos = (tt) => {
        const k = trilha([[T("passou") - 0.3, 0], [T("lado.") + 0.2, 1, "entra"]], tt);
        return { onda: 0.4 + 1.6 * k, tom: 0.35 + 0.5 * k };
      };

      iniciarParte({
        host: "__parte07",
        cenarios: ["apartamento"],
        planos: [
          { de: 0, cenario: "apartamento", nome: "entra" }, //                        Dentro do apartamento tem uma mulher.
          { de: t.olha, cenario: "apartamento", nome: "olha" }, //                    Ela te olha como se tivesse visto um fantasma.
          { de: t.pergunta, cenario: "apartamento", nome: "pergunta" }, //            Você pergunta, onde estão todos?
          { de: t.responde, cenario: "apartamento", nome: "responde" }, //            E ela responde, tremendo.
          { de: t.voltou, cenario: "apartamento", nome: "voltou" }, //                Todo mundo voltou ontem.
          { de: t.aqui, cenario: "apartamento", nome: "aqui" }, //                    Por que você ainda está aqui?
          { de: t.entende, cenario: "apartamento", nome: "entende" }, //              Você não entende.
          { de: t.explica, cenario: "apartamento", nome: "explica" }, //              Ela explica, na noite em que todos sumiram,
          { de: t.relogio, cenario: "apartamento", nome: "relogio", preenchimento: 0.2 }, // às 3h33
          { de: t.lado, cenario: "apartamento", nome: "lado" }, //                    o mundo inteiro passou para o outro lado.
        ],
        cameras: {
          entra: { k: [[0, [-1.4, 1.7, -1.4], [0.9, 1.3, -3.2], 52], [t.olha, [-1.3, 1.68, -1.6], [1.0, 1.3, -3.4], 46]], tremor: 0.004 },
          olha: { k: [[t.olha, [0.92, 1.66, -2.35], [1.3, 1.52, -3.6], 36], [t.pergunta, [0.98, 1.64, -2.55], [1.3, 1.52, -3.6], 30]], tremor: 0.003 },
          pergunta: { k: [[t.pergunta, [0.6, 1.64, -2.42], [0.2, 1.5, -1.3], 36], [t.responde, [0.56, 1.62, -2.3], [0.2, 1.5, -1.3], 32]], tremor: 0.003 },
          responde: { k: [[t.responde, [0.55, 1.5, -1.95], [1.3, 1.3, -3.6], 42], [t.voltou, [0.6, 1.52, -2.1], [1.3, 1.32, -3.6], 38]], tremor: 0.004 },
          voltou: { k: [[t.voltou, [0.96, 1.64, -2.5], [1.3, 1.52, -3.6], 30], [t.aqui, [1.0, 1.63, -2.62], [1.3, 1.52, -3.6], 27]], tremor: 0.003 },
          aqui: { k: [[t.aqui, [2.4, 1.85, -4.9], [0.2, 1.45, -1.3], 38], [t.entende, [2.35, 1.83, -4.75], [0.2, 1.47, -1.3], 34]], tremor: 0.003 },
          entende: { k: [[t.entende, [0.62, 1.62, -2.55], [0.2, 1.5, -1.3], 36], [t.explica, [0.58, 1.62, -2.45], [0.2, 1.5, -1.3], 33]], tremor: 0.003 },
          explica: { k: [[t.explica, [-2.7, 1.9, -0.8], [0.8, 1.1, -2.6], 50], [t.relogio, [-2.5, 1.85, -1.1], [0.8, 1.1, -2.6], 46]], tremor: 0.003 },
          relogio: { k: [[t.relogio, [2.6, 1.98, -5.2], [2.6, 1.955, -5.68], 26], [t.lado, [2.6, 1.97, -5.3], [2.6, 1.955, -5.68], 22]], tremor: 0.002 },
          lado: { k: [[t.lado, [-3.2, 2.35, -5.6], [0.8, 1.0, -2.0], 54], [FIM, [-2.95, 2.25, -5.3], [0.8, 1.05, -2.0], 46, "linear"]], tremor: 0.004 },
        },
        personagem: {
          onde: [[0, "apartamento"]],
          pos: [[0, [0.15, ALT, 1.1]], [0.2, [0.15, ALT, 1.1]], [2.2, ELE, "linear"]],
          passos: [[0.2, 2.2, 0.9, 0.6]],
          visivel: (tt, p) => !["olha", "voltou", "relogio"].includes(p.nome),
          pose: {
            giro: [[0, Math.PI], [1.6, Math.PI], [2.4, GIRO_ELE]],
            cabecaInclina: [[0, 0.05], [t.olha, 0.0], [t.entende, 0.0], [t.entende + 0.6, 0.12, "ambos"], [t.explica, 0.05]],
            cabecaTomba: [[0, 0], [t.entende, 0], [t.entende + 0.5, 0.22, "ambos"], [t.explica, 0.1]],
            boca: fala(T("onde"), T.fim("todos?"), 0.3),
            olhos: [[0, 1], [t.lado, 1], [T("passou"), 1.25, "sai"]],
            apertar: [[0, 0], [t.entende, 0], [t.entende + 0.4, 0.3, "ambos"], [t.explica, 0.1]],
          },
          maos: (tt, pts, ctx) => {
            // o celular-lanterna ainda na mão, baixando quando ele vê a mulher
            const giro = ctx.boneco.rotation.y;
            const frente = new THREE.Vector3(Math.sin(giro), 0, Math.cos(giro));
            const baixa = trilha([[0, 0], [2.4, 0], [3.2, 1, "ambos"]], tt);
            return { alvoE: pts.cabeca.clone().addScaledVector(frente, 0.34 - 0.1 * baixa).add(new THREE.Vector3(0, -0.32 - 0.45 * baixa, 0)), pesoE: 1 - 0.6 * baixa };
          },
        },
        outros: [
          {
            id: "mulher",
            variante: "mulher",
            onde: [[0, "apartamento"]],
            pos: [[0, ELA], [T("fantasma.") - 0.3, ELA], [T("fantasma.") + 0.5, [1.45, ALT, -3.9], "sai"]],
            pose: {
              giro: [[0, GIRO_ELA]],
              olhos: [[0, 1], [t.olha, 1], [T("olha") , 1.35, "sai"], [t.voltou, 1.2], [t.explica, 1.05]],
              apertar: [[0, 0], [t.olha, 0], [T("olha"), 0.0], [t.voltou, 0.15]],
              inclinar: [[0, 0], [T("fantasma.") - 0.3, 0], [T("fantasma.") + 0.4, -0.1, "sai"], [t.voltou, -0.03]],
              cabecaInclina: [[0, 0.0], [t.voltou, 0.08], [t.aqui, -0.05], [t.explica, 0.05]],
              cabecaTomba: treme(t.responde, t.voltou + 1.5, 0.035),
              boca: [...fala(T("Todo"), T.fim("aqui?"), 0.32), ...fala(T("na noite"), T.fim("lado."), 0.3).map(([a, b]) => [a, b])].sort((a, b) => a[0] - b[0]),
            },
            // a mão no rosto quando o vê
            maos: (tt, pts, ctx) => {
              const peso = trilha([[t.olha, 0], [T("olha") + 0.1, 1, "ambos"], [t.responde, 1], [t.responde + 0.6, 0, "ambos"]], tt);
              if (peso <= 0) return null;
              const b = ctx.outros.mulher.boneco;
              const frente = new THREE.Vector3(Math.sin(b.rotation.y), 0, Math.cos(b.rotation.y));
              return { alvoD: pts.cabeca.clone().addScaledVector(frente, 0.2).add(new THREE.Vector3(0, -0.12, 0)), pesoD: peso };
            },
          },
        ],
        celular: (tt) => "mao",
        tela: (ctx2d, tt, desenhar) => {
          if (desenhar) telaLanterna(ctx2d, 600, 1302);
          return "lanterna";
        },
        lanterna: (tt) => 0.5 * (1 - trilha([[0, 0], [2.4, 0], [3.2, 1, "ambos"]], tt)),
        pos,
        quadro: (tt, plano, ctx) => {
          const a = ctx.cenarios.apartamento;
          a.porta(1.2);
          a.relogio.userData.mostrar("3:33");
        },
      });
