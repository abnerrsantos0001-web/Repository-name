      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, trilha } from "./assets/js/cena.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { ESCOLA } from "./assets/js/mundo4.js";
      import { PI, ALT, eixos, em, no, segurandoCelular, celularExtra, figurante, cameraTelaAlta } from "./assets/js/v3.js";
      import { telaEmail, telaChat } from "./assets/js/telas3.js";
      import { PALAVRAS } from "./assets/js/tempos/v3-parte04.js";

      // Parte 4 (DIA 3): a sala de aula. O Lucas olha muito para o relógio; no intervalo mostra o e-mail: lá embaixo,
      // em letras pequenas, "14:07". Às 14:05 a mensagem: "valeu por tudo, mano". Às 14:07 ele encosta a cabeça na
      // carteira, como se fosse cochilar, e não levanta mais. (Sem violência: só isso.)
      const T = tempos(PALAVRAS);
      const FIM = 51.5;
      const t = {
        entra: T("No terceiro") - 0.15,
        lado: T("senta") - 0.12,
        olha: T("você repara") - 0.12,
        relogio1: T("relógio,") - 0.35,
        intervalo: T("na hora") - 0.15,
        tela: T("lá embaixo") - 0.15,
        relogio2: T("Às 14h05,") - 0.15,
        vibra: T("ele te manda") - 0.12,
        duas: T("mesmo estando") - 0.12,
        pov: T("Se for") - 0.15,
        ri: T("Você ri,") - 0.12,
        naoRi: T("ele não") - 0.12,
        relogio3: T("14h07", 2) - 0.25,
        deita: T("O Lucas", 2) - 0.2,
        fim: T("e não levanta") - 0.4,
      };
      const ELE = ESCOLA.sentado(1, 2);
      const LUCAS_M = ESCOLA.sentado(2, 2);
      const LUCAS_T = ESCOLA.sentado(3, 2);
      const TARDE = t.relogio2;
      const presa = (quem, f, d, c, af = 0, ac = 0, fov = 38) => (tt, ctx) => {
        const b = quem === "ele" ? ctx.boneco : ctx.outros[quem].boneco;
        const { cabeca } = pontosDoBoneco(b);
        const { frente, direita, cima } = eixos(b);
        return { pos: em(cabeca, [frente, f], [direita, d], [cima, c]), alvo: em(cabeca, [frente, af], [cima, ac]), fov };
      };
      // mãos em cima da carteira (a carteira do lugar onde o quadril está)
      const naCarteira = (b, abre = 0.13, z = -0.47) => {
        const q = b.position;
        return { alvoE: new THREE.Vector3(q.x - abre, q.y + 0.25, q.z + z), pesoE: 1, alvoD: new THREE.Vector3(q.x + abre, q.y + 0.25, q.z + z), pesoD: 1 };
      };
      const sentadoPose = { quadril: [[0, -PI / 2]], joelho: [[0, 1.5]] };
      const CADEIRAS = [[0, 0, "aluno"], [1, 0, "aluna"], [3, 0, "aluno"], [4, 0, "aluna"], [0, 1, "aluna"], [2, 1, "aluno"], [3, 1, "aluna"], [4, 1, "aluno"], [0, 2, "aluno"], [4, 2, "aluna"], [0, 3, "aluna"], [1, 3, "aluna"], [2, 3, "aluno"], [3, 3, "aluno"]];
      const alunos = CADEIRAS.map(([c, f, v], i) =>
        figurante(`a${i}`, v, "escola", ESCOLA.sentado(c, f), PI, {
          sentado: true,
          semente: 100 + i * 7,
          inclinar: 0.18 + 0.06 * Math.sin(i),
          cabecaInclina: [[0, 0.3 + 0.12 * Math.sin(i * 2.3)], [TARDE, 0.26 + 0.1 * Math.cos(i), "corte"]],
          cabecaGiro: [[0, 0.2 * Math.sin(i * 1.7)], [TARDE, 0.15 * Math.cos(i * 1.3), "corte"]],
          maos: (tt, pts, ctx, b) => naCarteira(b, 0.12 + 0.02 * Math.sin(i)),
        }),
      );
      // a Bia senta entre os dois à tarde (as "duas cadeiras de distância")
      alunos.push(figurante("bia", "aluna", "escola", ESCOLA.sentado(2, 2), PI, { sentado: true, semente: 222, inclinar: 0.2, maos: (tt, pts, ctx, b) => naCarteira(b), visivel: (tt) => tt >= TARDE }));

      iniciarParte({
        host: "__parte04",
        cenarios: ["escola"],
        planos: [
          { de: 0, cenario: "escola", nome: "abre", modo: "dia" }, //                        (DIA 3)
          { de: t.entra, cenario: "escola", nome: "entra", modo: "dia" }, //                No terceiro dia, o Lucas vai para a escola normal,
          { de: t.lado, cenario: "escola", nome: "lado", modo: "dia" }, //                  senta do seu lado como sempre,
          { de: t.olha, cenario: "escola", nome: "olha", modo: "dia" }, //                  você repara que ele olha muito
          { de: t.relogio1, cenario: "escola", nome: "relogio1", modo: "dia" }, //          para o relógio,
          { de: t.intervalo, cenario: "escola", nome: "intervalo", modo: "dia" }, //        na hora do intervalo ele te mostra o e-mail de novo,
          { de: t.tela, cenario: "escola", nome: "tela", modo: "dia" }, //                  lá embaixo, em letras bem pequenas... Um horário, 14:07.
          { de: t.relogio2, cenario: "escola", nome: "relogio2", modo: "tarde" }, //        Às 14:05,
          { de: t.vibra, cenario: "escola", nome: "vibra", modo: "tarde" }, //              ele te manda uma mensagem,
          { de: t.duas, cenario: "escola", nome: "duas", modo: "tarde" }, //                mesmo estando a duas cadeiras de distância.
          { de: t.pov, cenario: "escola", nome: "pov", modo: "tarde" }, //                  Se for verdade, valeu por tudo, mano.
          { de: t.ri, cenario: "escola", nome: "ri", modo: "tarde" }, //                    Você ri, olha pra ele,
          { de: t.naoRi, cenario: "escola", nome: "naoRi", modo: "tarde" }, //              ele não está rindo.
          { de: t.relogio3, cenario: "escola", nome: "relogio3", modo: "tarde" }, //        14:07.
          { de: t.deita, cenario: "escola", nome: "deita", modo: "tarde" }, //              O Lucas encosta a cabeça na carteira, como se fosse cochilar,
          { de: t.fim, cenario: "escola", nome: "fim", modo: "tarde" }, //                  e não levanta mais.
        ],
        cortesEscuros: [t.relogio2],
        cameras: {
          abre: { k: [[0, [-3.6, 2.55, 3.25], [0.4, 0.9, -1.0], 52], [t.entra, [-3.4, 2.45, 3.15], [0.5, 0.9, -1.0], 50]], tremor: 0.0015 },
          entra: (tt, ctx) => {
            const { cabeca } = pontosDoBoneco(ctx.outros.lucas.boneco);
            return { pos: no("escola", 0.75, 1.4, -0.65), alvo: em(cabeca, [new THREE.Vector3(0, 1, 0), -0.12]), fov: 40 };
          },
          lado: { k: [[t.lado, [-0.7, 1.38, -0.25], [-0.7, 1.15, 1.6], 46], [t.olha, [-0.7, 1.36, -0.15], [-0.7, 1.15, 1.6], 44]], tremor: 0.0018 },
          olha: presa("lucas", 1.05, -0.3, -0.12, 0, -0.08, 40),
          relogio1: { k: [[t.relogio1, [0.05, 2.3, -2.3], [0, 2.62, -3.47], 30], [t.intervalo, [0.04, 2.32, -2.4], [0, 2.62, -3.47], 28]], tremor: 0.0012 },
          intervalo: { k: [[t.intervalo, [1.6, 1.42, 0.55], [-0.7, 1.12, 1.6], 42], [t.tela, [1.5, 1.4, 0.6], [-0.7, 1.12, 1.6], 40]], tremor: 0.002 },
          tela: (tt, ctx) => {
            // a tela do celular do Lucas vista do lugar dele; desce do "3 dias" até as letras pequenas
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            const c = ctx.celLucas.obj;
            c.updateMatrixWorld(true);
            const centro = c.localToWorld(new THREE.Vector3(0, 0, 0));
            const desce = trilha([[t.tela, -0.004], [T("pequenas") + 0.3, 0.05, "ambos"]], tt);
            const alvo = c.localToWorld(new THREE.Vector3(0, -desce, 0));
            const dir = centro.clone().sub(cabeca).normalize();
            const perto = trilha([[t.tela, 0.36], [T("pequenas") + 0.3, 0.2, "ambos"]], tt);
            return { pos: centro.clone().addScaledVector(dir, -perto).add(alvo.clone().sub(centro)), alvo, fov: 32 };
          },
          relogio2: { k: [[t.relogio2, [0.05, 2.3, -2.3], [0, 2.62, -3.47], 30], [t.vibra, [0.04, 2.32, -2.4], [0, 2.62, -3.47], 28]], tremor: 0.0012 },
          vibra: { k: [[t.vibra, [-1.95, 1.45, 0.65], [-1.32, 0.85, 1.0], 40], [t.duas, [-1.9, 1.42, 0.7], [-1.32, 0.85, 1.0], 38]], tremor: 0.002 },
          duas: { k: [[t.duas, [0.7, 2.05, -1.45], [0, 0.98, 1.6], 50], [t.pov, [0.7, 2.0, -1.3], [0, 0.98, 1.6], 48]], tremor: 0.0018 },
          pov: cameraTelaAlta(0.56, 0.006, 30),
          ri: presa("ele", 1.0, 0.25, 0.0, 0, -0.12, 38),
          naoRi: presa("lucas", 1.0, 0.25, 0.0, 0, -0.12, 38),
          relogio3: { k: [[t.relogio3, [0.05, 2.25, -2.0], [0, 2.62, -3.47], 28], [t.deita, [0.04, 2.27, -2.15], [0, 2.62, -3.47], 26]], tremor: 0.001 },
          deita: { k: [[t.deita, [0.05, 1.8, 0.85], [1.3, 0.98, 1.3], 40], [t.fim, [0.12, 1.72, 0.88], [1.3, 0.92, 1.25], 36]], tremor: 0.0012 },
          fim: { k: [[t.fim, [3.25, 2.2, -1.5], [-0.1, 0.9, 1.6], 46], [FIM, [3.1, 2.1, -1.2], [-0.1, 0.9, 1.6], 42]], tremor: 0.001 },
        },
        semCabeca: (tt, p) => p.nome === "tela" || p.nome === "pov",
        personagem: {
          semente: 27,
          onde: [[0, "escola"]],
          pos: [[0, ELE]],
          pose: {
            ...sentadoPose,
            giro: [[0, PI]],
            inclinar: [[0, 0.16]],
            cabecaInclina: [[0, 0.2], [t.intervalo, 0.2], [t.intervalo + 0.5, 0.3, "ambos"], [t.vibra, 0.45, "corte"], [t.duas, 0.35, "corte"], [t.ri, 0.15, "corte"], [t.fim, 0.12, "corte"]],
            cabecaGiro: [[0, 0], [t.intervalo, 0], [t.intervalo + 0.5, -0.6, "ambos"], [t.relogio2, 0, "corte"], [T("olha pra") - 0.15, 0], [T("olha pra") + 0.35, -0.7, "ambos"], [t.fim, -0.75, "corte"]],
            sorriso: [[0, 0], [t.ri, 0.75, "corte"], [T("olha pra") + 0.3, 0.6], [T("não está") , 0.0, "ambos"]],
            boca: [[0, 0], [t.ri + 0.1, 0], [t.ri + 0.25, 0.35, "sai"], [t.ri + 0.45, 0.06], [t.ri + 0.6, 0.28], [t.ri + 0.85, 0]],
            sobrancelha: [[0, 0], [T("não está"), 0.0], [T("não está") + 0.4, 0.55, "ambos"], [t.fim, 0.6, "corte"]],
            sobrancelhaMedo: [[0, 0], [T("não está"), 0.0], [T("não está") + 0.4, 0.5, "ambos"], [t.fim, 0.7, "corte"]],
          },
          maos: (tt, pts, ctx, b) => {
            if (tt >= t.pov - 0.6 && tt < t.ri + 0.6) return segurandoCelular(pts, b, 0.42, 0.34);
            return naCarteira(b);
          },
        },
        celular: (tt) => (tt >= t.pov - 0.6 && tt < t.ri + 0.6 ? "mao" : { cenario: "escola", pos: [ELE[0] + 0.14, 0.7255, ELE[2] - 0.62], rot: [-PI / 2, 0, 0.2 + (tt >= t.vibra && tt < t.vibra + 1.3 ? 0.03 * Math.sin(tt * 160) : 0)] }),
        tela: (g, tt, desenhar) => {
          const k = tt < t.vibra ? "apagada" : tt < t.pov - 0.6 ? "notif" : "chat";
          if (desenhar) {
            if (k === "apagada") (g.fillStyle = "#050506"), g.fillRect(0, 0, 600, 1302);
            else if (k === "notif") telaChat(g, 600, 1302, { titulo: "Lucas", sub: "online", hora: "14:05", mensagens: [{ de: "Lucas", cor: "#ff8a5c", texto: "nova mensagem" }] });
            else telaChat(g, 600, 1302, { titulo: "Lucas", sub: "online", hora: "14:05", mensagens: [{ de: "Lucas", cor: "#ff8a5c", texto: "se for verdade" }, { de: "Lucas", cor: "#ff8a5c", texto: "valeu por tudo, mano", grande: true }] });
          }
          return k;
        },
        outros: [
          {
            id: "lucas",
            variante: "lucas",
            semente: 45,
            onde: [[0, "escola"]],
            pos: [[0, [0.7, ALT, 3.25]], [t.entra, [0.7, ALT, 3.25]], [t.lado - 0.05, [0.7, ALT, 2.05], "linear"], [t.lado, LUCAS_M, "corte"], [TARDE, LUCAS_T, "corte"]],
            passos: [[t.entra, t.lado - 0.05, 0.9, 0.6]],
            pose: {
              giro: [[0, PI]],
              quadril: [[0, 0], [t.lado, -PI / 2, "corte"]],
              joelho: [[0, 0], [t.lado, 1.5, "corte"]],
              inclinar: [[0, 0.04], [t.lado, 0.14, "corte"], [t.deita, 0.14], [t.deita + 2.0, 0.86, "ambos"]],
              cabecaInclina: [[0, 0.1], [t.lado, 0.2, "corte"], [t.olha, 0.2], [t.olha + 0.5, -0.3, "ambos"], [t.intervalo - 0.3, -0.25], [t.intervalo, 0.2, "ambos"], [t.relogio2, -0.25, "corte"], [t.deita, -0.2], [t.deita + 2.0, 0.25, "ambos"]],
              cabecaGiro: [[0, 0], [t.intervalo, 0], [t.intervalo + 0.5, 0.6, "ambos"], [t.relogio2, 0, "corte"], [t.deita + 0.6, 0], [t.deita + 2.2, 0.7, "ambos"]],
              cabecaTomba: [[0, 0], [t.deita + 0.8, 0], [t.deita + 2.2, -0.45, "ambos"]],
              sorriso: [[0, 0.15], [t.olha, 0], [t.intervalo, 0.1], [t.relogio2, 0, "corte"]],
              sobrancelhaMedo: [[0, 0.3], [t.relogio2, 0.55, "corte"]],
              olhos: [[0, 1], [t.deita + 1.4, 1], [T("cochilar,") , 0.05, "ambos"]],
            },
            semPiscar: [[t.naoRi, FIM]],
            maos: (tt, pts, ctx, b) => {
              if (tt < t.lado) return null;
              if (tt >= t.intervalo && tt < t.relogio2) {
                // mostra o celular para ele (à esquerda do Lucas)
                const { frente, direita, cima } = eixos(b);
                const k = trilha([[t.intervalo, 0], [t.intervalo + 0.6, 1, "ambos"]], tt);
                const alvo = em(pts.cabeca, [frente, 0.4], [cima, -0.3], [direita, -0.22 * k]);
                return { alvoE: alvo, pesoE: 1, alvoD: em(alvo, [direita, 0.06]), pesoD: 0.8 };
              }
              if (tt >= t.relogio2 - 0.01 && tt < t.vibra + 0.6) {
                // digitando a mensagem embaixo da carteira
                return segurandoCelular(pts, b, 0.36, 0.45);
              }
              if (tt >= t.deita) {
                // os braços cruzados em cima da carteira, a cabeça vai deitando sobre eles
                const q = b.position;
                const k = trilha([[t.deita, 0], [t.deita + 1.4, 1, "ambos"]], tt);
                return { alvoE: new THREE.Vector3(q.x + 0.16 * k - 0.13 * (1 - k), q.y + 0.27, q.z - 0.5), pesoE: 1, alvoD: new THREE.Vector3(q.x - 0.16 * k + 0.13 * (1 - k), q.y + 0.27, q.z - 0.5), pesoD: 1 };
              }
              return naCarteira(b);
            },
          },
          ...alunos,
        ],
        montar: (ctx) => {
          ctx.celLucas = celularExtra(ctx.cena);
        },
        quadro: (tt, plano, ctx, fase) => {
          const e = ctx.cenarios.escola;
          if (fase === "antes") {
            const hora = tt < TARDE ? (tt < t.intervalo ? "11:52" : "12:00") : tt < T("14h07", 2) ? (tt < t.ri ? "14:05" : "14:06") : "14:07";
            e.relogio.userData.mostrar(hora);
            return;
          }
          const lucas = ctx.outros.lucas.boneco;
          const mostrando = tt >= t.intervalo && tt < t.relogio2;
          const digitando = tt >= t.relogio2 && tt < t.vibra + 0.6;
          if (mostrando) {
            ctx.celLucas.naMao(lucas, pontosDoBoneco(ctx.boneco).cabeca);
            const pequenas = tt >= T("horário,") - 0.1;
            ctx.celLucas.mostrar(pequenas ? "p" : "n", (g, W, H) => telaEmail(g, W, H, { hora: "12:01", frase: "Você tem 3 dias.", pequenas: "data e horário: 14:07", destaquePequenas: pequenas }));
          } else if (digitando) {
            ctx.celLucas.naMao(lucas, pontosDoBoneco(lucas).cabeca);
            ctx.celLucas.mostrar("dig", (g, W, H) => telaChat(g, W, H, { titulo: "você", sub: "online", hora: "14:05", mensagens: [{ minha: true, texto: "se for verdade" }, { minha: true, texto: "valeu por tudo, mano" }] }));
          } else if (tt >= t.lado) {
            // na carteira dele, virado para baixo
            const q = lucas.position;
            ctx.celLucas.em(new THREE.Vector3(q.x + 0.2, 0.7255, q.z - 0.6), [PI / 2, 0, 0.3]);
          } else ctx.celLucas.esconder();
        },
      });
