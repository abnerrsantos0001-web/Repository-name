      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, trilha } from "./assets/js/cena.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { PI, ALT, eixos, em, figurante, cameraTelaAlta } from "./assets/js/v3.js";
      import { telaPerfis } from "./assets/js/telas3.js";
      import { PALAVRAS } from "./assets/js/tempos/v3-parte06.js";

      // Parte 6 (DIA 4): o mundo vira de cabeça para baixo: gente correndo na rua, aeroportos e igrejas lotados; quem
      // tem 50 anos pela frente vai trabalhar como se nada fosse. As datas nos perfis; na rua todo mundo olha para ele.
      // No jantar a mãe não come, só segura a mão dele; pela primeira vez ele vê o pai chorar.
      const T = tempos(PALAVRAS);
      const FIM = 44.1;
      const C = 0.12; // calçada da rua
      const t = {
        cabeca: T("No quarto") - 0.15,
        larga: T("Quem tem") - 0.12,
        aero: T("Os aeroportos") - 0.15,
        igreja: T("as igrejas") - 0.12,
        trabalho: T("quem tem", 2) - 0.12,
        redes: T("Nas redes,") - 0.15,
        olham: T("todo mundo") - 0.15,
        jantar: T("Na mesa") - 0.15,
        mao: T("ela só") - 0.12,
        pai: T("E pela") - 0.12,
      };
      const presa = (quem, f, d, c, af = 0, ac = 0, fov = 38) => (tt, ctx) => {
        const b = quem === "ele" ? ctx.boneco : ctx.outros[quem].boneco;
        const { cabeca } = pontosDoBoneco(b);
        const { frente, direita, cima } = eixos(b);
        return { pos: em(cabeca, [frente, f], [direita, d], [cima, c]), alvo: em(cabeca, [frente, af], [cima, ac]), fov };
      };
      const sentado = { quadril: [[0, -PI / 2]], joelho: [[0, 1.5]] };
      // ----- rua: correndo para um lado e para o outro; o homem de 50 anos andando devagar com a pasta
      const corre = (id, v, z, x0, x1, t0, t1, sem) => figurante(id, v, "rua", [x0, C + ALT, z], x1 > x0 ? PI / 2 : -PI / 2, {
        semente: sem, posK: [[0, [x0, C + ALT, z]], [t0, [x0, C + ALT, z]], [t1, [x1, C + ALT, z], "linear"]], passos: [[t0, t1, 1.25, 0.95]],
        inclinar: 0.18, cabecaInclina: [[0, 0.05]], pose: { sobrancelhaMedo: [[0, 0.6]], ofegar: [[0, 1]] },
        visivel: (tt) => tt >= t0 - 0.3 && tt <= t1 + 0.3,
      });
      const rua = [
        corre("r1", "passageiro", 2.0, -9, 9, 0.0, 4.6, 601),
        corre("r2", "passageira", 3.1, 8, -8, 1.2, 6.0, 602),
        corre("r3", "aluno", 2.3, -12, 6, 3.4, 8.3, 603),
        corre("r4", "passageira", 3.1, 10, -6, 6.4, 12.6, 604),
        corre("r5", "passageira", 2.3, -10, 8, 8.4, 12.8, 605),
        corre("r6", "aluna", 3.1, 9, -9, 16.8, 21.2, 606),
        corre("r7", "passageiro", 2.4, -9, 9, 18.6, 23.0, 607),
        figurante("calmo", "passageiro", "rua", [-6, C + ALT, 1.55], PI / 2, {
          semente: 608, posK: [[0, [-6, C + ALT, 1.55]], [t.trabalho, [-6, C + ALT, 1.55]], [t.redes, [1.4, C + ALT, 1.55], "linear"]], passos: [[t.trabalho, t.redes, 0.7, 0.55]],
          visivel: (tt) => tt >= t.trabalho - 0.2 && tt < t.redes,
          inclinar: 0.02, cabecaInclina: [[0, -0.02]], pose: { sorriso: [[0, 0.15]] },
          maos: (tt, pts, ctx, b) => {
            const { frente, direita } = eixos(b);
            const q = b.position.clone();
            return { alvoD: em(q, [direita, 0.3], [frente, 0.02]).setY(q.y - 0.05), pesoD: 1 };
          },
        }),
      ];
      // na calçada, quem olha para ele passando
      const olhando = [[-1.2, 3.0, 609, "passageira"], [1.6, 2.9, 610, "aluno"], [4.2, 3.0, 611, "idosa"], [-3.6, 2.95, 612, "passageiro"]].map(([x, z, sem, v], i) =>
        figurante(`o${i}`, v, "rua", [x, C + ALT, z], PI, {
          semente: sem,
          // a cabeça acompanha ele (que anda de x = -6 até 2 entre "todo mundo" e "a mesa")
          cabecaGiro: [[0, 0], [t.olham - 0.1, 0], ...[0, 0.25, 0.5, 0.75, 1].map((k) => [t.olham + k * (t.jantar - t.olham), Math.max(-1.1, Math.min(1.1, Math.atan2(-(-6 + 8 * k - x), 3.0 - 1.8) * 0.9)), "suave"])],
          pose: { sobrancelhaMedo: [[0, 0.3]], apertar: [[0, 0.3]] },
          visivel: (tt) => tt >= t.olham,
        }),
      );
      // ----- aeroporto: fila em zigue-zague entre as fitas, de frente para os balcões
      const aero = [];
      for (let i = 0; i < 15; i++) {
        const faixa = i < 10 ? 0 : 1;
        const x = faixa === 0 ? -8.4 + i * 0.95 : 0.0 - (i - 10) * 0.95;
        const z = faixa === 0 ? -3.2 : -1.6;
        aero.push(figurante(`v${i}`, ["passageiro", "passageira", "idosa", "aluno", "aluna", "padeiro"][i % 6], "aeroporto", [x, ALT, z], faixa === 0 ? -PI / 2 : PI / 2, {
          semente: 700 + i * 3, cabecaGiro: [[0, 0.3 * Math.sin(i * 1.3)]], cabecaInclina: [[0, 0.05 * Math.cos(i)]], pose: { sobrancelhaMedo: [[0, 0.5]] },
        }));
      }
      // ----- igreja: fila descendo a escada e seguindo pela calçada (à noite)
      const PI_ = [[0.2, 0.45, 0.65, PI], [-0.2, 0.3, 1.5, PI], [0.15, 0.15, 2.15, PI], [0.0, 0.14, 2.95, PI], [0.6, 0.14, 3.75, -PI / 2], [1.5, 0.14, 3.95, -PI / 2], [2.4, 0.14, 3.7, -PI / 2], [3.3, 0.14, 3.95, -PI / 2], [4.2, 0.14, 3.7, -PI / 2], [5.1, 0.14, 3.95, -PI / 2], [6.0, 0.14, 3.7, -PI / 2], [6.9, 0.14, 3.95, -PI / 2]];
      const igreja = PI_.map(([x, y, z, g], i) =>
        figurante(`g${i}`, ["idosa", "passageiro", "passageira", "aluno", "pai", "aluna"][i % 6], "igreja", [x, ALT + y, z], g, {
          semente: 800 + i * 5, cabecaInclina: [[0, 0.2]], pose: { sobrancelhaMedo: [[0, 0.6]] },
          maos: i % 4 === 1 ? (tt, pts, ctx, b) => { const { frente, cima } = eixos(b); return { alvoE: em(pts.cabeca, [frente, 0.25], [cima, -0.45]), pesoE: 1, alvoD: em(pts.cabeca, [frente, 0.25], [cima, -0.45]), pesoD: 1 }; } : undefined,
        }),
      );
      // mesa: ele na cadeira 1, a mãe na cadeira 2 (do lado dele), o pai na frente (cadeira 4)
      const ELE = [0.02, 0.57, -0.25];
      const MAE = [0.78, 0.57, -0.25];
      const PAI = [0.62, 0.57, 1.25];
      const MAO = [0.33, 0.825, 0.14];
      const PERFIS = [
        [0, { nome: "Bia", data: "61 anos", cor: "#b07fa0" }],
        [0, { nome: "Pedro", data: "44 anos", cor: "#a0907f" }],
        [T("perfil"), { nome: "Gabi", data: "70 anos", cor: "#7fa08f" }],
        [T("perfil") + 0.5, { nome: "Rafa", data: "2 dias", cor: "#7f8fa0" }],
        [T("de repente,") - 0.1, { nome: "você", data: "3 dias", cor: "#c4161c" }],
      ];

      iniciarParte({
        host: "__parte06",
        cenarios: ["rua", "aeroporto", "igreja", "cozinha"],
        planos: [
          { de: 0, cenario: "rua", nome: "abre", modo: "dia" }, //                          (DIA 4)
          { de: t.cabeca, cenario: "rua", nome: "cabeca", modo: "dia" }, //                No quarto dia, o mundo vira de cabeça pra baixo.
          { de: t.larga, cenario: "rua", nome: "larga", modo: "dia" }, //                  Quem tem poucos dias larga o emprego... e some.
          { de: t.aero, cenario: "aeroporto", nome: "aero" }, //                          Os aeroportos lotam,
          { de: t.igreja, cenario: "igreja", nome: "igreja" }, //                         as igrejas lotam,
          { de: t.trabalho, cenario: "rua", nome: "trabalho", modo: "dia" }, //            quem tem 50 anos pela frente continua indo trabalhar...
          { de: t.redes, cenario: "rua", nome: "redes", modo: "dia" }, //                  Nas redes, as pessoas colocam a data no perfil
          { de: t.olham, cenario: "rua", nome: "olham", modo: "tarde" }, //               e, de repente, todo mundo te olha diferente...
          { de: t.jantar, cenario: "cozinha", nome: "jantar", modo: "noite" }, //          Na mesa do jantar, a sua mãe não come,
          { de: t.mao, cenario: "cozinha", nome: "mao", modo: "noite" }, //                ela só segura a sua mão.
          { de: t.pai, cenario: "cozinha", nome: "pai", modo: "noite" }, //                E pela primeira vez na vida, você vê o seu pai chorar.
        ],
        cortesEscuros: [t.aero, t.igreja, t.trabalho, t.jantar],
        preenchimento: { cozinha: 0.6 },
        cameras: {
          abre: { k: [[0, [-2.0, 2.6, -5.5], [2.0, 1.0, 2.2], 52], [t.cabeca, [-1.5, 2.4, -5.3], [2.5, 1.0, 2.2], 50]], tremor: 0.002 },
          cabeca: { k: [[t.cabeca, [6.5, 1.5, -1.6], [-2.0, 1.2, 2.2], 46], [t.larga, [6.0, 1.45, -1.4], [-3.0, 1.2, 2.2], 44]], tremor: 0.003 },
          larga: { k: [[t.larga, [-12.5, 1.6, -1.2], [-3.0, 1.2, 2.2], 44], [t.aero, [-11.0, 1.55, -1.0], [2.0, 1.2, 2.2], 42]], tremor: 0.0025 },
          aero: { k: [[t.aero, [1.2, 3.0, 2.6], [-4.0, 1.1, -2.7], 50], [t.igreja, [0.8, 2.9, 2.3], [-4.0, 1.1, -2.7], 48]], tremor: 0.0015 },
          igreja: { k: [[t.igreja, [-5.5, 2.3, 11.5], [2.5, 2.6, 1.5], 50], [t.trabalho, [-5.0, 2.2, 11.0], [2.5, 2.7, 1.5], 48]], tremor: 0.0015 },
          trabalho: (tt, ctx) => {
            const b = ctx.outros.calmo.boneco;
            const { cabeca } = pontosDoBoneco(b);
            return { pos: cabeca.clone().add(new THREE.Vector3(1.6, 0.0, -3.0)), alvo: cabeca.clone().add(new THREE.Vector3(0.1, -0.35, 0)), fov: 44 };
          },
          redes: cameraTelaAlta(0.36, 0.028, 32),
          olham: (tt, ctx) => {
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            return { pos: cabeca.clone().add(new THREE.Vector3(2.6, 0.1, -2.6)), alvo: cabeca.clone().add(new THREE.Vector3(-0.3, -0.3, 0.4)), fov: 44 };
          },
          jantar: { k: [[t.jantar, [2.35, 1.45, 0.45], [0.3, 1.0, 0.45], 44], [t.mao, [2.2, 1.42, 0.45], [0.3, 1.0, 0.45], 42]], tremor: 0.0018 },
          mao: { k: [[t.mao, [0.45, 1.45, 1.08], [0.4, 0.98, -0.1], 42], [t.pai, [0.45, 1.42, 1.0], [0.4, 0.96, -0.1], 40]], tremor: 0.0012 },
          pai: presa("pai", 1.0, -0.2, -0.22, 0, -0.22, 38),
        },
        semCabeca: (tt, p) => p.nome === "redes",
        personagem: {
          semente: 31,
          onde: [[0, "rua"], [t.jantar, "cozinha"]],
          pos: [[0, [-6, C + ALT, 1.8]], [t.olham, [-6, C + ALT, 1.8]], [t.jantar - 0.01, [2.0, C + ALT, 1.8], "linear"], [t.jantar, ELE, "corte"]],
          passos: [[t.olham, t.jantar - 0.01, 0.8, 0.6]],
          visivel: (tt) => tt >= t.olham,
          pose: {
            giro: [[0, PI / 2], [t.jantar, 0, "corte"]],
            quadril: [[0, 0], [t.jantar, -PI / 2, "corte"]],
            joelho: [[0, 0], [t.jantar, 1.5, "corte"]],
            inclinar: [[0, 0.06], [t.jantar, 0.12, "corte"]],
            cabecaInclina: [[0, 0.3], [t.olham, 0.25], [t.jantar, 0.3, "corte"], [t.pai, 0.05, "corte"]],
            cabecaGiro: [[0, 0], [t.olham, 0], [t.olham + 1.2, -0.35, "ambos"], [t.olham + 2.4, 0.3, "ambos"], [t.jantar, 0, "corte"], [t.pai, 0.2, "corte"]],
            sobrancelhaMedo: [[0, 0.5], [t.jantar, 0.6, "corte"], [t.pai, 0.85, "corte"]],
          },
          maos: (tt, pts, ctx, b) => {
            if (tt < t.redes - 0.4 || tt >= t.olham) {
              if (tt < t.jantar) return null;
              const o = ctx.cenarios.cozinha.grupo.position;
              return { alvoE: new THREE.Vector3(...MAO).add(o), pesoE: 1, alvoD: new THREE.Vector3(-0.15, 0.825, 0.08).add(o), pesoD: 1 };
            }
            const { frente, cima, direita } = eixos(b);
            const a = em(pts.cabeca, [frente, 0.46], [cima, -0.3]);
            return { alvoE: a, pesoE: 1, alvoD: em(a, [direita, 0.05], [cima, -0.03]), pesoD: 0.85 };
          },
        },
        celular: (tt) => (tt >= t.redes - 0.4 && tt < t.olham ? "mao" : null),
        tela: (g, tt, desenhar) => {
          const lista = PERFIS.filter(([a]) => tt >= a).map(([, p]) => p);
          const ordenada = lista.length === 5 ? [lista[4], ...lista.slice(0, 4)] : lista;
          if (desenhar) telaPerfis(g, 600, 1302, { hora: "13:20", perfis: ordenada });
          return "p" + lista.length;
        },
        outros: [
          ...rua,
          ...olhando,
          ...aero,
          ...igreja,
          {
            id: "mae", variante: "mae", semente: 37, onde: [[0, "cozinha"]], pos: [[0, MAE]],
            pose: { ...sentado, giro: [[0, -0.15]], inclinar: [[0, 0.1]], cabecaGiro: [[0, 0.5]], cabecaInclina: [[0, 0.25]], sobrancelhaMedo: [[0, 0.8]], sorriso: [[0, 0]] },
            maos: (tt, pts, ctx, b) => {
              const o = ctx.cenarios.cozinha.grupo.position;
              return { alvoD: new THREE.Vector3(MAO[0] + 0.03, MAO[1] + 0.085, MAO[2] + 0.01).add(o), pesoD: 1, alvoE: new THREE.Vector3(0.95, 0.825, 0.12).add(o), pesoE: 1 };
            },
          },
          {
            id: "pai", variante: "pai", semente: 39, onde: [[0, "cozinha"]], pos: [[0, PAI]],
            pose: {
              ...sentado, giro: [[0, PI]], inclinar: [[0, 0.16]], cabecaInclina: [[0, 0.3], [t.pai, 0.36, "corte"], [FIM, 0.42]],
              cabecaGiro: [[0, 0.15]], sobrancelhaMedo: [[0, 0.7], [t.pai, 1.0, "corte"]], sobrancelha: [[0, -0.2]], apertar: [[0, 0.2], [t.pai + 1.0, 0.5, "ambos"]],
              choro: [[0, 0], [t.pai - 0.1, 0], [t.pai + 0.6, 1, "ambos"]], choroFase: [[0, 0], [FIM, FIM, "linear"]],
              boca: [[0, 0], [t.pai + 1.5, 0.06]],
            },
            maos: (tt, pts, ctx, b) => {
              const o = ctx.cenarios.cozinha.grupo.position;
              return { alvoE: new THREE.Vector3(0.75, 0.8, 0.82).add(o), pesoE: 1, alvoD: new THREE.Vector3(0.45, 0.8, 0.82).add(o), pesoD: 1 };
            },
          },
        ],
        montar: (ctx) => {
          const coz = ctx.cenarios.cozinha;
          coz.espelhoLigado = false;
          coz.real.cadeiras[0].position.z = -0.35;
          coz.real.cadeiras[1].position.z = -0.35;
          coz.real.cadeiras[3].position.set(0.62, 0, 1.35);
          coz.real.cadeiras[2].visible = false;
          const paes = coz.grupo.getObjectByName("paes");
          if (paes) paes.visible = false; // jantar: sem os pães do café
        },
        quadro: (tt, plano, ctx, fase) => {
          if (fase !== "antes") return;
          ctx.cenarios.cozinha.relogio.mostrar("20:40");
          ctx.cenarios.cozinha.cafe(false);
          ctx.cenarios.igreja?.atualizar?.(tt);
        },
      });
