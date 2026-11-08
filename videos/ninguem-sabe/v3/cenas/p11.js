      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, trilha } from "./assets/js/cena.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { SALA } from "./assets/js/mundo4.js";
      import { PI, eixos, em, noColo, falar } from "./assets/js/v3.js";
      import { tvMadrugada } from "./assets/js/telas3.js";
      import { PALAVRAS } from "./assets/js/tempos/v3-parte11.js";

      // Parte 11 (DIA 7): o sétimo dia amanhece bonito; café com a mãe, devagar; ele fala tudo; ela chora rindo, ele ri
      // chorando. À noite a família dorme no sofá, um encostado no outro, a TV ligada sem som; ele não dorme e olha o
      // relógio na parede: 3:30, 3:31, 3:32... fecha os olhos. 3:33.
      const T = tempos(PALAVRAS);
      const FIM = 44.9333;
      const t = {
        amanhece: T("O sétimo") - 0.15,
        cafe: T("Você toma") - 0.15,
        fala: T("e fala,") - 0.12,
        ouve: T("que você sente") - 0.12,
        ama: T("que você ama") - 0.12,
        chora: T("ela chora") - 0.12,
        ri: T("você ri") - 0.12,
        sofa: T("A noite") - 0.15,
        acordado: T("você não") - 0.15,
        relogio: T("3 e 30,") - 0.45,
        fecha: T("você fecha") - 0.15,
        tres33: T("3 e 33.") - 0.12,
      };
      const ELE = [0.02, 0.57, -0.25];
      const MAE = [0.02, 0.57, 1.25];
      const CANECA_E = [0.02, 0.81, 0.2];
      const CANECA_M = [0.02, 0.81, 0.8];
      const presa = (quem, f, d, c, ac = 0, fov = 38) => (tt, ctx) => {
        const b = quem === "ele" ? ctx.boneco : ctx.outros[quem].boneco;
        const { cabeca } = pontosDoBoneco(b);
        const { frente, direita, cima } = eixos(b);
        return { pos: em(cabeca, [frente, f], [direita, d], [cima, c]), alvo: em(cabeca, [cima, ac]), fov };
      };
      const caneca = (o, p) => ({ alvoE: new THREE.Vector3(p[0] + 0.1, p[1] + 0.03, p[2]).add(o), pesoE: 1, alvoD: new THREE.Vector3(p[0] - 0.1, p[1] + 0.03, p[2]).add(o), pesoD: 1 });
      const sentado = { quadril: [[0, -PI / 2]], joelho: [[0, 1.5]] };
      const dormindo = (tomba, sem) => ({ olhos: [[0, 0.05]], cabecaTomba: [[0, tomba]], cabecaInclina: [[0, 0.22]], inclinar: [[0, -0.06]], sobrancelhaMedo: [[0, 0.1]] });

      iniciarParte({
        host: "__parte11",
        cenarios: ["cozinha", "sala"],
        planos: [
          { de: 0, cenario: "cozinha", nome: "abre", modo: "manha" }, //                      (DIA 7)
          { de: t.amanhece, cenario: "cozinha", nome: "amanhece", modo: "manha" }, //         O sétimo dia amanhece bonito.
          { de: t.cafe, cenario: "cozinha", nome: "cafe", modo: "manha" }, //                 Você toma café com a sua mãe, devagar, sem pressa,
          { de: t.fala, cenario: "cozinha", nome: "fala", modo: "manha" }, //                 e fala, fala tudo, que ela foi a melhor mãe do mundo,
          { de: t.ouve, cenario: "cozinha", nome: "ouve", modo: "manha" }, //                 que você sente muito por todas as vezes que foi grosso,
          { de: t.ama, cenario: "cozinha", nome: "ama", modo: "manha" }, //                   que você ama ela,
          { de: t.chora, cenario: "cozinha", nome: "chora", modo: "manha" }, //               ela chora rindo,
          { de: t.ri, cenario: "cozinha", nome: "ri", modo: "manha" }, //                     você ri chorando.
          { de: t.sofa, cenario: "sala", nome: "sofa", modo: "madrugada" }, //                À noite, a família inteira dorme no sofá... TV sem som,
          { de: t.acordado, cenario: "sala", nome: "acordado", modo: "madrugada" }, //        você não dorme, fica olhando o relógio na parede,
          { de: t.relogio, cenario: "sala", nome: "relogio", modo: "madrugada" }, //          3:30, 3:31, 3:32,
          { de: t.fecha, cenario: "sala", nome: "fecha", modo: "madrugada" }, //              você fecha os olhos,
          { de: t.tres33, cenario: "sala", nome: "relogio2", modo: "madrugada" }, //          3:33.
        ],
        cortesEscuros: [t.sofa],
        preenchimento: { cozinha: 0.5, sala: 1.1 },
        cameras: {
          abre: { k: [[0, [2.4, 1.75, 1.6], [-0.2, 0.7, 0.3], 44], [t.amanhece, [2.3, 1.72, 1.5], [-0.2, 0.7, 0.3], 43]], tremor: 0.0015 },
          amanhece: { k: [[t.amanhece, [-0.75, 1.25, 0.6], [0.05, 0.86, 0.45], 42], [t.cafe, [-0.65, 1.2, 0.58], [0.05, 0.86, 0.45], 38]], tremor: 0.0012 },
          cafe: { k: [[t.cafe, [2.25, 1.42, 0.5], [0.02, 1.12, 0.5], 46], [t.fala, [2.1, 1.4, 0.5], [0.02, 1.12, 0.5], 44]], tremor: 0.0018 },
          fala: presa("ele", 1.0, 0.3, -0.02, -0.12, 38),
          ouve: presa("mae", 1.0, -0.3, -0.02, -0.12, 38),
          ama: presa("ele", 0.95, 0.25, -0.02, -0.12, 36),
          chora: presa("mae", 0.95, -0.25, -0.02, -0.12, 36),
          ri: presa("ele", 0.95, 0.25, -0.02, -0.12, 36),
          sofa: { k: [[t.sofa, [0.45, 1.4, -1.55], [0, 1.0, 1.3], 50], [t.acordado, [0.35, 1.38, -1.3], [0, 1.0, 1.3], 46]], tremor: 0.0012 },
          acordado: presa("ele", 0.95, 0.12, -0.02, -0.12, 38),
          relogio: { k: [[t.relogio, [-1.55, 1.72, -1.35], [-1.85, 1.85, -2.47], 30], [t.fecha, [-1.6, 1.74, -1.45], [-1.85, 1.85, -2.47], 26]], tremor: 0.001,
            v: [[t.relogio, [-1.45, 1.7, -1.1], [-1.85, 1.85, -2.47], 44], [t.fecha, [-1.5, 1.72, -1.2], [-1.85, 1.85, -2.47], 38]] },
          fecha: presa("ele", 1.0, 0.1, -0.02, -0.14, 40),
          relogio2: { k: [[t.tres33, [-1.6, 1.74, -1.45], [-1.85, 1.85, -2.47], 32], [FIM, [-1.65, 1.76, -1.55], [-1.85, 1.85, -2.47], 29]], tremor: 0.001,
            v: [[t.tres33, [-1.5, 1.72, -1.2], [-1.85, 1.85, -2.47], 38], [FIM, [-1.55, 1.74, -1.3], [-1.85, 1.85, -2.47], 34]] },
        },
        personagem: {
          semente: 43,
          onde: [[0, "cozinha"], [t.sofa, "sala"]],
          pos: [[0, ELE], [t.sofa, SALA.sentado(0), "corte"]],
          pose: {
            ...sentado,
            giro: [[0, 0], [t.sofa, PI, "corte"]],
            inclinar: [[0, 0.1], [t.sofa, -0.04, "corte"]],
            cabecaInclina: [[0, 0.1], [t.fala, 0.02, "corte"], [t.sofa, 0.05, "corte"], [t.acordado + 1.2, -0.12, "ambos"]],
            cabecaGiro: [[0, 0], [t.sofa, 0, "corte"], [t.acordado + 1.0, 0], [T("relógio") , 0.45, "ambos"]],
            boca: falar([[T("e fala,"), T.fim("mundo,")], [T("que você sente"), T.fim("grosso,")], [T("que você ama"), T.fim("ama ela,")]], 0.26),
            sorriso: [[0, 0.3], [t.fala, 0.2, "corte"], [t.ama, 0.35, "corte"], [t.ri, 0.75, "corte"], [t.sofa, 0, "corte"]],
            sobrancelhaMedo: [[0, 0.1], [t.fala, 0.45, "corte"], [t.ri, 0.6, "corte"], [t.sofa, 0.5, "corte"], [t.relogio, 0.75]],
            choro: [[0, 0], [t.ama, 0.3, "corte"], [t.ri, 1, "corte"], [t.sofa, 0, "corte"]],
            olhos: [[0, 1], [t.acordado, 1.15, "corte"], [T("você fecha") + 0.4, 1.1], [T("olhos,") + 0.2, 0.05, "ambos"]],
          },
          semPiscar: [[t.acordado, FIM]],
          maos: (tt, pts, ctx, b) => {
            if (tt < t.sofa) return caneca(ctx.cenarios.cozinha.grupo.position, CANECA_E);
            return noColo(b);
          },
        },
        outros: [
          {
            id: "mae", variante: "mae", semente: 45, onde: [[0, "cozinha"], [t.sofa, "sala"]],
            pos: [[0, MAE], [t.sofa, SALA.sentado(-0.74), "corte"]],
            pose: {
              ...sentado,
              giro: [[0, PI], [t.sofa, PI, "corte"]],
              inclinar: [[0, 0.1], [t.sofa, -0.06, "corte"]],
              cabecaInclina: [[0, 0.08], [t.sofa, 0.22, "corte"]],
              cabecaTomba: [[0, 0], [t.sofa, -0.38, "corte"]],
              sorriso: [[0, 0.4], [t.ouve, 0.15, "corte"], [t.chora, 0.8, "corte"], [t.sofa, 0, "corte"]],
              sobrancelhaMedo: [[0, 0.2], [t.ouve, 0.7, "corte"], [t.chora, 0.8, "corte"], [t.sofa, 0.1, "corte"]],
              choro: [[0, 0], [t.ouve, 0.4, "corte"], [t.chora, 1, "corte"], [t.sofa, 0, "corte"]],
              olhos: [[0, 1], [t.sofa, 0.05, "corte"]],
            },
            semPiscar: [[t.sofa, FIM]],
            maos: (tt, pts, ctx, b) => (tt < t.sofa ? caneca(ctx.cenarios.cozinha.grupo.position, CANECA_M) : noColo(b)),
          },
          {
            id: "pai", variante: "pai", semente: 47, onde: [[0, "sala"]], pos: [[0, SALA.sentado(0.74)]],
            pose: { ...sentado, giro: [[0, PI]], ...dormindo(0.38) },
            semPiscar: [[0, FIM]],
            maos: (tt, pts, ctx, b) => noColo(b),
            visivel: (tt) => tt >= t.sofa,
          },
        ],
        montar: (ctx) => {
          const coz = ctx.cenarios.cozinha;
          coz.espelhoLigado = false;
          coz.real.cadeiras[0].position.z = -0.35;
          coz.real.cadeiras[2].position.z = 1.35;
          coz.real.cadeiras[1].visible = false;
          coz.real.cadeiras[3].visible = false;
          const paes = coz.grupo.getObjectByName("paes");
          if (paes) paes.visible = false;
          // as duas canecas (macias para a checagem: as mãos seguram)
          for (const p of [CANECA_E, CANECA_M]) {
            const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 14), new THREE.MeshStandardMaterial({ color: p === CANECA_E ? 0x8c2a2c : 0xd9d2c5, roughness: 0.5 }));
            c.position.set(p[0], p[1] - 0.0, p[2]).add(coz.grupo.position);
            c.userData.passavel = true;
            coz.grupo.parent.add(c);
            c.visible = true;
            (ctx.canecas = ctx.canecas || []).push(c);
          }
        },
        quadro: (tt, plano, ctx, fase) => {
          if (fase !== "antes") return;
          for (const c of ctx.canecas) c.visible = plano.cenario === "cozinha";
          ctx.cenarios.cozinha.relogio.mostrar("8:10");
          ctx.cenarios.cozinha.cafe(true);
          const sala = ctx.cenarios.sala;
          const hora = tt < T("3 e 31,") ? "3:30" : tt < T("3 e 32,") ? "3:31" : tt < T("3 e 33.") ? "3:32" : "3:33";
          sala.relogio.userData.mostrar(hora);
          sala.tv.userData.mostrar("m" + Math.round(tt * 3), (g, W, H) => tvMadrugada(g, W, H, tt));
          sala.luzTV(0x8aa8e0, 2.4);
        },
      });
