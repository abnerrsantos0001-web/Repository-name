      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, trilha } from "./assets/js/cena.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { ESCOLA, SALA } from "./assets/js/mundo4.js";
      import { PI, ALT, eixos, em, segurandoCelular, celularExtra, figurante } from "./assets/js/v3.js";
      import { telaEmail, tvJornal } from "./assets/js/telas3.js";
      import { PALAVRAS } from "./assets/js/tempos/v3-parte05.js";

      // Parte 5: o resto do dia é sirene (só as luzes da ambulância entrando pelas janelas), gente gritando, o professor
      // ligando para todo mundo. À noite, o jornal: no mundo inteiro, no minuto marcado em cada e-mail, as pessoas pararam.
      // Às 11 da noite ele abre o próprio e-mail, com as mãos tremendo: embaixo dos 7 dias, um horário. 3:33.
      const T = tempos(PALAVRAS);
      const FIM = 44.8;
      const t = {
        sirene: T("O resto") - 0.15,
        gritando: T("gente") - 0.12,
        professor: T("professor") - 0.12,
        noite: T("mas o") - 0.12,
        tv: T("No mundo") - 0.15,
        icones: T("Em casa,") - 0.12,
        rostos: T("sem barulho,") - 0.12,
        param: T("Elas") - 0.12,
        quarto: T("Às 11") - 0.15,
        abre: T("e você abre") - 0.12,
        pov: T("Embaixo") - 0.15,
      };
      const ELE = ESCOLA.sentado(1, 2);
      const SENTADO = [-1.44, 0.605, -0.7];
      const presa = (quem, f, d, c, af = 0, ac = 0, fov = 38) => (tt, ctx) => {
        const b = quem === "ele" ? ctx.boneco : ctx.outros[quem].boneco;
        const { cabeca } = pontosDoBoneco(b);
        const { frente, direita, cima } = eixos(b);
        return { pos: em(cabeca, [frente, f], [direita, d], [cima, c]), alvo: em(cabeca, [frente, af], [cima, ac]), fov };
      };
      const naCarteira = (b, abre = 0.13) => {
        const q = b.position;
        return { alvoE: new THREE.Vector3(q.x - abre, q.y + 0.25, q.z - 0.47), pesoE: 1, alvoD: new THREE.Vector3(q.x + abre, q.y + 0.25, q.z - 0.47), pesoD: 1 };
      };
      const sentado = { quadril: [[0, -PI / 2]], joelho: [[0, 1.5]] };
      // alunos de pé nas janelas, olhando as luzes lá fora; alguns com as mãos na cabeça
      const JANELA = [[3.5, -2.7], [3.5, -1.8], [3.45, -0.9], [3.5, 0.0], [3.45, 0.9], [3.5, 1.8], [3.45, 2.7], [2.7, -1.35], [2.7, 0.45]];
      const naJanela = JANELA.map(([x, z], i) =>
        figurante(`j${i}`, i % 2 ? "aluna" : "aluno", "escola", [x, ALT, z], PI / 2 + 0.25 * Math.sin(i * 1.9), {
          semente: 300 + i * 11,
          cabecaInclina: [[0, -0.05 + 0.05 * Math.sin(i)]],
          cabecaGiro: [[0, 0.2 * Math.sin(i * 2.1)], [t.gritando, 0.2 * Math.sin(i * 2.1)], [t.gritando + 0.4, -0.35 * Math.cos(i), "ambos"], [t.gritando + 1.0, 0.25 * Math.sin(i), "ambos"]],
          pose: { sobrancelhaMedo: [[0, 0.6]], boca: [[0, 0], [t.gritando, 0], [t.gritando + 0.2, i % 3 ? 0.55 : 0.1, "sai"], [t.gritando + 1.4, 0.05]] },
          maos: (tt, pts, ctx, b) => {
            if (i % 3 !== 0 || tt < t.gritando) return null;
            // mãos na cabeça
            const { direita, cima } = eixos(b);
            return { alvoE: em(pts.cabeca, [direita, -0.27], [cima, 0.05]), pesoE: 1, alvoD: em(pts.cabeca, [direita, 0.27], [cima, 0.05]), pesoD: 1 };
          },
        }),
      );
      const CADEIRAS = [[0, 0, "aluno"], [2, 1, "aluno"], [0, 2, "aluno"], [1, 3, "aluna"], [2, 3, "aluno"]];
      const sentados = CADEIRAS.map(([c, f, v], i) =>
        figurante(`s${i}`, v, "escola", ESCOLA.sentado(c, f), PI - 0.6, { sentado: true, semente: 400 + i * 5, inclinar: 0.05, cabecaGiro: [[0, 0.7]], maos: (tt, pts, ctx, b) => naCarteira(b) }),
      );

      iniciarParte({
        host: "__parte05",
        cenarios: ["escola", "sala", "quarto2"],
        planos: [
          { de: 0, cenario: "escola", nome: "abre", modo: "tarde" }, //                     (as luzes da ambulância nas paredes)
          { de: t.sirene, cenario: "escola", nome: "sirene", modo: "tarde" }, //            O resto do dia é sirene,
          { de: t.gritando, cenario: "escola", nome: "gritando", modo: "tarde" }, //        gente gritando,
          { de: t.professor, cenario: "escola", nome: "professor", modo: "tarde" }, //      professor ligando pra todo mundo,
          { de: t.noite, cenario: "sala", nome: "noite", modo: "noiteTV" }, //              mas o pior vem à noite, no jornal.
          { de: t.tv, cenario: "sala", nome: "tv", modo: "noiteTV" }, //                    No mundo inteiro, no exato minuto... as pessoas pararam.
          { de: t.icones, cenario: "sala", nome: "tv2", modo: "noiteTV" }, //               Em casa, no trabalho, no ônibus,
          { de: t.rostos, cenario: "sala", nome: "rostos", modo: "noiteTV" }, //            sem barulho, sem dor, dizem os médicos.
          { de: t.param, cenario: "sala", nome: "param", modo: "noiteTV" }, //              Elas simplesmente param.
          { de: t.quarto, cenario: "quarto2", nome: "quarto", modo: "noite" }, //           Às 11 da noite, ninguém mais chama aquilo de golpe,
          { de: t.abre, cenario: "quarto2", nome: "maos", modo: "noite" }, //               e você abre o seu e-mail de novo, com as mãos tremendo.
          { de: t.pov, cenario: "quarto2", nome: "pov", modo: "noite" }, //                 Embaixo dos 7 dias, também tem um horário, 3:33.
        ],
        cortesEscuros: [t.noite, t.quarto],
        preenchimento: { sala: 0.75, quarto2: 0.7 },
        chacoalhar: (tt, p) => (p.nome === "gritando" ? 0.8 : 0),
        cameras: {
          abre: presa("ele", 1.15, 0.35, 0.05, 0, -0.1, 40),
          sirene: { k: [[t.sirene, [-3.6, 2.4, 3.2], [1.5, 1.0, -0.6], 50], [t.gritando, [-3.4, 2.3, 3.1], [1.6, 1.0, -0.6], 48]], tremor: 0.002 },
          gritando: { k: [[t.gritando, [1.6, 1.5, 2.8], [3.4, 1.4, -0.6], 44], [t.professor, [1.7, 1.48, 2.6], [3.4, 1.4, -0.7], 42]], tremor: 0.003 },
          professor: { k: [[t.professor, [-0.5, 1.5, -0.4], [-2.2, 1.35, -2.75], 40], [t.noite, [-0.6, 1.48, -0.5], [-2.0, 1.35, -2.7], 38]], tremor: 0.0025 },
          noite: { k: [[t.noite, [0.25, 2.12, 2.42], [0, 0.85, -2.2], 46], [t.tv, [0.15, 2.05, 2.36], [0, 0.88, -2.2], 42]], tremor: 0.0015 },
          tv: { k: [[t.tv, [0.0, 1.06, -0.4], [0, 1.0, -2.27], 40], [t.icones, [0.0, 1.05, -0.6], [0, 0.99, -2.27], 40]], tremor: 0.001 },
          tv2: { k: [[t.icones, [-0.1, 1.08, -0.5], [0, 1.0, -2.27], 40], [t.rostos, [-0.05, 1.07, -0.65], [0, 0.99, -2.27], 40]], tremor: 0.001 },
          rostos: { k: [[t.rostos, [0.05, 1.22, -1.85], [0, 1.15, 1.25], 34], [t.param, [0.05, 1.22, -1.7], [0, 1.15, 1.25], 32]], tremor: 0.0015 },
          param: presa("ele", 1.1, 0.0, 0.0, 0, -0.12, 36),
          quarto: { k: [[t.quarto, [0.6, 1.55, 0.9], [-1.4, 0.9, -0.85], 46], [t.abre, [0.45, 1.5, 0.75], [-1.4, 0.92, -0.8], 42]], tremor: 0.0018 },
          maos: (tt, ctx) => {
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            const cel = ctx.celular.getWorldPosition(new THREE.Vector3());
            const { frente, direita, cima } = eixos(ctx.boneco);
            return { pos: em(cel, [frente, 0.55], [direita, 0.35], [cima, 0.12]), alvo: em(cel.clone().lerp(cabeca, 0.42), [cima, 0.02]), fov: 38 };
          },
          pov: (tt, ctx) => {
            // a tela vista do lugar dele: desce do "7 dias" até o horário
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            const c = ctx.celular;
            c.updateMatrixWorld(true);
            const centro = c.localToWorld(new THREE.Vector3(0, 0, 0));
            const k = trilha([[t.pov, 0], [T("horário,"), 1, "ambos"]], tt);
            const alvo = c.localToWorld(new THREE.Vector3(-0.012 * k, 0.012 - 0.004 * k, 0));
            const dir = centro.clone().sub(cabeca).normalize();
            const perto = trilha([[t.pov, 0.3], [T("3") - 0.3, 0.4, "ambos"]], tt);
            return { pos: centro.clone().addScaledVector(dir, -perto).add(alvo.clone().sub(centro)), alvo, fov: 32 };
          },
        },
        semCabeca: (tt, p) => p.nome === "pov",
        personagem: {
          semente: 29,
          onde: [[0, "escola"], [t.noite, "sala"], [t.quarto, "quarto2"]],
          pos: [[0, ELE], [t.noite, SALA.sentado(0), "corte"], [t.quarto, SENTADO, "corte"]],
          pose: {
            ...sentado,
            giro: [[0, PI], [t.quarto, PI / 2, "corte"]],
            inclinar: [[0, 0.1], [t.noite, -0.02, "corte"], [t.quarto, 0.18, "corte"]],
            cabecaGiro: [[0, -0.55], [t.sirene, -0.2], [t.noite, 0, "corte"], [t.quarto, 0, "corte"]],
            cabecaInclina: [[0, 0.1], [t.noite, 0.02, "corte"], [t.quarto, 0.42, "corte"], [t.pov, 0.45]],
            sobrancelhaMedo: [[0, 0.6], [t.noite, 0.5, "corte"], [t.param, 0.85, "ambos"], [t.quarto, 0.7, "corte"]],
            sobrancelha: [[0, 0.1], [t.param, 0.4, "ambos"]],
            olhos: [[0, 1.05], [t.param, 1.2]],
            boca: [[0, 0], [t.param, 0.08]],
            ofegar: [[0, 0.3], [t.abre, 1]],
          },
          semPiscar: [[t.param, t.quarto]],
          maos: (tt, pts, ctx, b) => {
            if (tt >= t.quarto) {
              // segurando o celular; tremendo a partir do "abre o seu e-mail"
              const treme = tt >= t.abre ? 0.006 : 0;
              const r = segurandoCelular(pts, b, 0.44, 0.32);
              const d = new THREE.Vector3(Math.sin(tt * 43) * treme, Math.sin(tt * 37 + 1) * treme, Math.sin(tt * 51 + 2) * treme);
              r.alvoE.add(d);
              r.alvoD.add(d);
              return r;
            }
            if (tt < t.noite) return naCarteira(b);
            return null;
          },
        },
        celular: (tt) => (tt >= t.quarto ? "mao" : null),
        tela: (g, tt, desenhar) => {
          const revela = tt >= T("horário,") - 0.2;
          if (desenhar) telaEmail(g, 600, 1302, { hora: "23:04", frase: "Você tem 7 dias.", extra: revela ? "3:33" : null, extraCor: "#e3121b", extraTam: 96 });
          return revela ? "3:33" : "7dias";
        },
        outros: [
          ...naJanela,
          ...sentados,
          {
            id: "prof", variante: "professor", semente: 501, onde: [[0, "escola"]],
            pos: [[0, [-2.4, ALT, -1.85]], [t.professor, [-2.4, ALT, -1.85]], [t.noite, [-1.5, ALT, -1.95], "linear"]],
            passos: [[t.professor, t.noite, 0.7, 0.55]],
            pose: { giro: [[0, 0.9], [t.professor, 1.5]], sobrancelhaMedo: [[0, 0.7]], cabecaInclina: [[0, 0.15]], boca: [[0, 0], [t.professor + 0.5, 0.25], [t.professor + 0.7, 0.05], [t.professor + 0.9, 0.3], [t.professor + 1.1, 0.05], [t.professor + 1.4, 0.25], [t.professor + 1.6, 0]] },
            maos: (tt, pts, ctx, b) => {
              const { direita, frente } = eixos(b);
              return { alvoD: em(pts.cabeca, [direita, 0.25], [frente, 0.05]), pesoD: 1 };
            },
          },
          { id: "mae", variante: "mae", semente: 33, onde: [[0, "sala"]], pos: [[0, SALA.sentado(-0.74)]], pose: { ...sentado, giro: [[0, PI - 0.1]], sobrancelhaMedo: [[0, 0.8]], cabecaInclina: [[0, 0.05]] },
            maos: (tt, pts, ctx, b) => {
              // a mão na boca
              const { frente, cima } = eixos(b);
              const k = trilha([[t.rostos - 0.5, 0], [t.rostos + 0.3, 1, "ambos"]], tt);
              return k > 0 ? { alvoD: em(pts.cabeca, [frente, 0.25], [cima, -0.12]), pesoD: k } : null;
            } },
          { id: "pai", variante: "pai", semente: 35, onde: [[0, "sala"]], pos: [[0, SALA.sentado(0.74)]], pose: { ...sentado, giro: [[0, PI + 0.1]], sobrancelha: [[0, -0.5]], sobrancelhaMedo: [[0, 0.4]], inclinar: [[0, 0.25]] } },
        ],
        montar: (ctx) => {
          ctx.celProf = celularExtra(ctx.cena);
          ctx.cenarios.quarto2.cobertor.visible = false;
        },
        quadro: (tt, plano, ctx, fase) => {
          const e = ctx.cenarios.escola;
          const sala = ctx.cenarios.sala;
          if (fase === "antes") {
            e.relogio.userData.mostrar(tt < t.gritando ? "15:40" : "16:12");
            e.sirene(tt, plano.cenario === "escola" ? 1 : 0);
            sala.relogio.userData.mostrar("21:30");
            ctx.cenarios.quarto2.relogio.userData.mostrar("23:04");
            let k, fn;
            if (tt < t.icones) {
              const m = Math.round(trilha([[t.tv, 0.2], [T("pararam.") + 0.3, 1, "entra"]], tt) * 20) / 20;
              k = "n" + m;
              fn = (g, W, H) => tvJornal(g, W, H, { manchete: "O MUNDO PAROU", sub: "no minuto marcado em cada e-mail", noite: true, mapa: m });
            } else {
              const lista = [["EM CASA", T("Em casa,")], ["NO TRABALHO", T("no trabalho,")], ["NO ÔNIBUS", T("no ônibus,")], ["SEM DOR, DIZEM MÉDICOS", T("sem dor,")]];
              const atual = lista.filter(([, a]) => tt >= a - 0.1).pop() || lista[0];
              k = "i" + atual[0];
              fn = (g, W, H) => tvJornal(g, W, H, { manchete: atual[0], sub: "as pessoas simplesmente pararam", noite: true });
            }
            sala.tv.userData.mostrar(k, fn);
            sala.luzTV(0x8fa8e0, 2.3);
            return;
          }
          if (plano.cenario === "escola") {
            const p = ctx.outros.prof.boneco;
            const { direita, frente } = eixos(p);
            ctx.celProf.naMao(p, em(pontosDoBoneco(p).cabeca, [direita, -1]), "D");
          } else ctx.celProf.esconder();
        },
      });
