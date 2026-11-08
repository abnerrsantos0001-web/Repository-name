      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, trilha } from "./assets/js/cena.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { PI, ALT, eixos, em, segurandoCelular, noColo } from "./assets/js/v3.js";
      import { telaConta, telaBloqueio } from "./assets/js/telas3.js";
      import { PALAVRAS } from "./assets/js/tempos/v3-parte07.js";

      // Parte 7: ele se tranca no quarto, olha o relógio, faz a conta (3 dias = 72 h = 4.320 min); cada piscada, um
      // número a menos. Não dorme. Às 3:33 o celular vibra de novo: "Faltam 3 dias". Todo dia, no mesmo horário.
      const T = tempos(PALAVRAS);
      const FIM = 42.3667;
      const t = {
        relogio: T("Fica") - 0.12,
        conta: T("Fazendo") - 0.15,
        pisca: T("Cada vez") - 0.15,
        naoDorme: T("Você não") - 0.15,
        relogio2: T("Às 3h33") - 0.15,
        vibra: T("o celular") - 0.15,
        pov: T("Um e") - 0.15,
        lembrar: T("Todo dia,") - 0.15,
        fim: T("E você entende") - 0.15,
      };
      const SENTADO = [-1.44, 0.605, -0.7];
      const CEL_CAMA = [-1.62, 0.535, -0.32];
      const presa = (f, d, c, ac = 0, fov = 38) => (tt, ctx) => {
        const { cabeca } = pontosDoBoneco(ctx.boneco);
        const { frente, direita, cima } = eixos(ctx.boneco);
        return { pos: em(cabeca, [frente, f], [direita, d], [cima, c]), alvo: em(cabeca, [cima, ac]), fov };
      };
      // a tela vista do lugar dele, no meio do quadro (o letreiro em cima, a legenda embaixo)
      const pov = (perto = 0.4, sobe = 0.006) => (tt, ctx) => {
        const { cabeca } = pontosDoBoneco(ctx.boneco);
        const c = ctx.celular;
        c.updateMatrixWorld(true);
        const centro = c.localToWorld(new THREE.Vector3(0, 0, 0));
        const alvo = c.localToWorld(new THREE.Vector3(0, sobe, 0));
        const dir = centro.clone().sub(cabeca).normalize();
        return { pos: alvo.clone().addScaledVector(dir, -perto), alvo, fov: 32 };
      };
      const vibrando = (tt) => tt >= T("vibra") - 0.3 && tt < T("vibra") + 1.2;

      iniciarParte({
        host: "__parte07",
        cenarios: ["quarto2"],
        planos: [
          { de: 0, cenario: "quarto2", nome: "porta", modo: "noiteAcesa", preenchimento: 0.35 }, //                      Você se tranca no quarto.
          { de: t.relogio, cenario: "quarto2", nome: "relogio", modo: "noite", preenchimento: 1.7 }, //            Fica olhando o relógio.
          { de: t.conta, cenario: "quarto2", nome: "conta", modo: "noite", preenchimento: 1.7 }, //                Fazendo conta. Três dias são 72 horas. 72 horas são 4.320 minutos.
          { de: t.pisca, cenario: "quarto2", nome: "pisca", modo: "noite", preenchimento: 1.7 }, //                Cada vez que você pisca, o número diminui.
          { de: t.naoDorme, cenario: "quarto2", nome: "naoDorme", modo: "noite", preenchimento: 1.7 }, //          Você não dorme.
          { de: t.relogio2, cenario: "quarto2", nome: "relogio2", modo: "noite", preenchimento: 1.7 }, //          Às 3:33
          { de: t.vibra, cenario: "quarto2", nome: "vibra", modo: "noite", preenchimento: 1.7 }, //                o celular vibra de novo.
          { de: t.pov, cenario: "quarto2", nome: "pov", modo: "noite", preenchimento: 4.6 }, //                    Um e-mail novo. O assunto agora é outro. Faltam três dias.
          { de: t.lembrar, cenario: "quarto2", nome: "lembrar", modo: "noite", preenchimento: 1.7 }, //            Todo dia, no mesmo horário, ele vai te lembrar.
          { de: t.fim, cenario: "quarto2", nome: "fim", modo: "noite", preenchimento: 2.6 }, //                    E você entende... contando o minuto.
        ],
        preenchimento: { quarto2: 1.15 },
        cameras: {
          porta: { k: [[0, [-0.7, 1.5, -0.45], [0.75, 1.1, 1.75], 46], [t.relogio, [-0.6, 1.48, -0.35], [0.7, 1.1, 1.7], 44]], tremor: 0.0018 },
          relogio: { k: [[t.relogio, [-0.62, 0.8, -1.26], [-0.95, 0.6, -1.69], 30], [t.conta, [-0.66, 0.77, -1.32], [-0.95, 0.6, -1.69], 26]], tremor: 0.0012,
            v: [[t.relogio, [-0.55, 0.85, -1.1], [-0.95, 0.6, -1.69], 46], [t.conta, [-0.6, 0.82, -1.18], [-0.95, 0.6, -1.69], 40]] },
          conta: pov(0.36, 0.004),
          pisca: presa(1.05, 0.25, 0.0, -0.12, 38),
          naoDorme: { k: [[t.naoDorme, [2.0, 1.95, 1.6], [-1.4, 0.8, -0.8], 48], [t.relogio2, [1.9, 1.9, 1.5], [-1.4, 0.8, -0.8], 46]], tremor: 0.0015 },
          relogio2: { k: [[t.relogio2, [-0.62, 0.8, -1.26], [-0.95, 0.6, -1.69], 28], [t.vibra, [-0.66, 0.77, -1.32], [-0.95, 0.6, -1.69], 24]], tremor: 0.0012,
            v: [[t.relogio2, [-0.55, 0.85, -1.1], [-0.95, 0.6, -1.69], 44], [t.vibra, [-0.6, 0.82, -1.18], [-0.95, 0.6, -1.69], 38]] },
          vibra: { k: [[t.vibra, [-1.25, 1.05, 0.05], [-1.62, 0.54, -0.32], 34], [t.pov, [-1.3, 0.98, -0.02], [-1.62, 0.54, -0.32], 30]], tremor: 0.0015 },
          pov: pov(0.28, 0.012),
          lembrar: (tt, ctx) => {
            const k = trilha([[t.lembrar, 0], [t.fim, 1, "suave"]], tt);
            return presa(1.3 - 0.35 * k, 0.2, 0.0, -0.14, 38)(tt, ctx);
          },
          fim: { k: [[t.fim, [1.75, 2.25, 1.6], [-1.4, 0.8, -0.75], 48], [FIM, [2.1, 2.45, 1.9], [-1.4, 0.75, -0.75], 52]], tremor: 0.001 },
        },
        semCabeca: (tt, p) => p.nome === "conta" || p.nome === "pov",
        personagem: {
          semente: 33,
          onde: [[0, "quarto2"]],
          pos: [[0, [0.83, ALT, 1.45]], [t.relogio, SENTADO, "corte"]],
          pose: {
            giro: [[0, 0], [2.9, 0], [3.6, PI, "ambos"], [t.relogio, PI / 2, "corte"]],
            quadril: [[0, 0], [t.relogio, -PI / 2, "corte"]],
            joelho: [[0, 0], [t.relogio, 1.5, "corte"]],
            inclinar: [[0, 0.05], [t.relogio, 0.16, "corte"], [t.fim, 0.16], [t.fim + 3, 0.38, "ambos"]],
            cabecaInclina: [[0, 0.05], [t.relogio, 0.4, "corte"], [t.pisca, 0.18, "corte"], [t.naoDorme, 0.3, "corte"], [t.lembrar, 0.25, "corte"], [t.fim, 0.3, "corte"], [t.fim + 3, 0.5, "ambos"]],
            cabecaGiro: [[0, 0], [t.naoDorme, -0.5, "corte"], [t.relogio2 + 1.0, -0.5], [t.vibra, -0.2, "corte"], [t.pov, 0, "corte"]],
            olhos: [[0, 1], [t.pisca, 1.2, "corte"], [t.naoDorme, 1.05, "corte"]],
            sobrancelhaMedo: [[0, 0.5], [t.pisca, 0.7, "corte"], [t.lembrar, 0.9, "corte"]],
            sobrancelha: [[0, 0], [t.pisca, 0.3, "corte"], [t.lembrar, 0.4, "corte"]],
            ofegar: [[0, 0.4], [t.lembrar, 1]],
          },
          semPiscar: [[t.pisca, T("pisca,") - 0.05], [T("pisca,") + 0.3, t.naoDorme], [t.lembrar, FIM]],
          piscadas: [T("pisca,")],
          maos: (tt, pts, ctx, b) => {
            if (tt < t.relogio) {
              // fecha a porta e gira a chave
              const o = ctx.cenarios.quarto2.grupo.position;
              const k = trilha([[0.3, 0], [0.8, 1, "ambos"], [3.0, 1], [3.4, 0, "ambos"]], tt);
              return k > 0 ? { alvoD: new THREE.Vector3(0.52, 1.0, 1.88).add(o), pesoD: k } : null;
            }
            if (tt >= t.naoDorme && tt < t.pov - 0.4) return noColo(b, 0.13);
            return segurandoCelular(pts, b, 0.44, 0.32);
          },
        },
        celular: (tt) => {
          if (tt < t.conta - 0.3) return null;
          if (tt >= t.naoDorme && tt < t.pov - 0.4) {
            const tr = vibrando(tt) ? 0.003 * Math.sin(tt * 190) : 0;
            return { cenario: "quarto2", pos: [CEL_CAMA[0] + tr, CEL_CAMA[1], CEL_CAMA[2]], rot: [-PI / 2, 0, 0.4 + tr * 6] };
          }
          return "mao";
        },
        tela: (g, tt, desenhar) => {
          let k, fn;
          if (tt < t.pisca) {
            const linhas = [{ texto: "3 dias" }];
            if (tt >= T("72") - 0.1) linhas.push({ texto: "= 72 horas", vermelho: true });
            if (tt >= T("72", 2) - 0.1) linhas.push({ texto: "72 h" });
            if (tt >= T("4 .320") - 0.1) linhas.push({ texto: "= 4.320 min", vermelho: true });
            k = "c" + linhas.length;
            fn = () => telaConta(g, 600, 1302, { hora: "0:14", linhas });
          } else if (tt < t.naoDorme) {
            const n = tt < T("pisca,") ? "4.320" : "4.319";
            k = "n" + n;
            fn = () => telaConta(g, 600, 1302, { hora: "0:15", linhas: [{ texto: "faltam" }, { texto: n + " min", vermelho: true }] });
          } else if (tt < T("vibra") - 0.3) (k = "bl"), (fn = () => telaBloqueio(g, 600, 1302, { hora: "2:47", data: "domingo, 15 de novembro", brilho: 0.25 }));
          else if (tt < T("Faltam") - 0.1) (k = "nova"), (fn = () => telaBloqueio(g, 600, 1302, { hora: "3:33", data: "domingo, 15 de novembro", notificacao: { texto: "1 mensagem nova" } }));
          else (k = "faltam"), (fn = () => telaBloqueio(g, 600, 1302, { hora: "3:33", data: "domingo, 15 de novembro", notificacao: { texto: "Faltam 3 dias.", vermelho: true } }));
          if (desenhar) fn();
          return k;
        },
        montar: (ctx) => {
          ctx.cenarios.quarto2.cobertor.visible = false;
          const brilho = new THREE.PointLight(0xbcd0ff, 0, 2.4, 1.6);
          ctx.cena.add(brilho);
          ctx.brilhoTela = brilho;
        },
        quadro: (tt, plano, ctx, fase) => {
          const q = ctx.cenarios.quarto2;
          if (fase === "antes") {
            q.porta(trilha([[0, 1.15], [0.4, 1.15], [1.4, 0, "ambos"]], tt));
            q.cortinas(0.35);
            q.relogio.userData.mostrar(tt < t.naoDorme ? "0:14" : tt < t.relogio2 ? "2:47" : "3:33");
            return;
          }
          // a luz fria da tela no rosto
          const p = ctx.celular.getWorldPosition(new THREE.Vector3());
          ctx.brilhoTela.position.copy(p).add(new THREE.Vector3(0, 0.1, 0));
          ctx.brilhoTela.intensity = ctx.celular.visible && tt >= t.conta ? 2.6 : 0;
        },
      });
