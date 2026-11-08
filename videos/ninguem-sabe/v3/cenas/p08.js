      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, trilha } from "./assets/js/cena.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { PI, ALT, eixos, em, no, segurandoCelular, criarFolha } from "./assets/js/v3.js";
      import { telaDesligar, telaApagada, telaBloqueio } from "./assets/js/telas3.js";
      import { PALAVRAS } from "./assets/js/tempos/v3-parte08.js";

      // Parte 8 (DIA 5): ele acorda com uma ideia: não vai mais contar. Arranca uma folha do caderno e escreve o que
      // sempre deixou para depois: ver o mar, falar com a Júlia, pedir desculpa ao pai, dizer tudo à mãe. Dobra a folha,
      // guarda no bolso e desliga o celular.
      const T = tempos(PALAVRAS);
      const FIM = 44.8667;
      const t = {
        acorda: T("No quinto") - 0.15,
        contar: T("Você não") - 0.15,
        folha: T("Pega") - 0.15,
        mar: T("Ver o") - 0.2,
        julia: T("Falar") - 0.15,
        folha2: T("dela") - 0.1,
        pai: T("Pedir") - 0.15,
        rostoPai: T("fingem") - 0.15,
        mae: T("e dizer") - 0.15,
        rostoMae: T("tudo aquilo") - 0.15,
        dobra: T("Você dobra") - 0.15,
        desliga: T("e desliga") - 0.15,
      };
      const DEITADO = [-1.78, 0.79, -0.84];
      const MESA = [1.38, 0.57, 0.4]; // sentado na escrivaninha, de frente para a janela (+x)
      const FOLHA = [1.9, 0.7625, 0.36];
      const ITENS = [
        { texto: "Ver o mar", a: T("Ver o"), b: T.fim("mar.") + 0.5 },
        { texto: "Falar pra Júlia", a: T("Falar"), b: T("Falar") + 1.6 },
        { texto: "Desculpa pro pai", a: T("Pedir"), b: T("Pedir") + 1.7 },
        { texto: "Dizer tudo pra mãe", a: T("e dizer"), b: T("e dizer") + 1.9 },
      ];
      const TOTAL = ITENS.reduce((n, i) => n + i.texto.length, 0);
      const escrito = (tt) => ITENS.reduce((n, i) => n + i.texto.length * Math.max(0, Math.min(1, (tt - i.a) / (i.b - i.a))), 0) / TOTAL;
      // ponto da folha em que a caneta está (para a mão que escreve)
      const pontoCaneta = (tt) => {
        const atual = ITENS.findIndex((i) => tt >= i.a && tt < i.b);
        const i = atual >= 0 ? atual : ITENS.reduce((k, it, j) => (tt >= it.b ? j : k), 0);
        const it = ITENS[i];
        const k = Math.max(0, Math.min(1, (tt - it.a) / (it.b - it.a)));
        // folha deitada, topo para +x: a linha do item i fica em x; a escrita anda em -z (da esquerda dele para a direita)
        const x = FOLHA[0] + 0.297 * (0.5 - (0.12 + 0.07 * (i * 1.5 + 1)));
        const z = FOLHA[2] - 0.07 + 0.15 * k;
        return new THREE.Vector3(x - 0.01, FOLHA[1] + 0.015 + (atual >= 0 ? 0.004 * Math.abs(Math.sin(tt * 22)) : 0.02), z);
      };
      const escrevendo = (tt) => tt >= t.folha + 1.2 && tt < t.dobra;
      const presa = (f, d, c, ac = 0, fov = 38) => (tt, ctx) => {
        const { cabeca } = pontosDoBoneco(ctx.boneco);
        const { frente, direita, cima } = eixos(ctx.boneco);
        return { pos: em(cabeca, [frente, f], [direita, d], [cima, c]), alvo: em(cabeca, [cima, ac]), fov };
      };
      // quase de cima da folha (o topo da folha aponta para a janela, então o texto sai em pé na tela)
      const camFolha = (desce = 0.62, fov = 36) => () => ({ pos: no("quarto2", FOLHA[0] - 0.14, FOLHA[1] + desce, FOLHA[2] + 0.02), alvo: no("quarto2", FOLHA[0] + 0.1, FOLHA[1], FOLHA[2] + 0.02), fov });

      iniciarParte({
        host: "__parte08",
        cenarios: ["quarto2"],
        planos: [
          { de: 0, cenario: "quarto2", nome: "abre", modo: "manha" }, //                     (DIA 5)
          { de: t.acorda, cenario: "quarto2", nome: "acorda", modo: "manha" }, //            No quinto dia, você acorda com uma ideia na cabeça.
          { de: t.contar, cenario: "quarto2", nome: "contar", modo: "manha" }, //            Você não vai mais contar.
          { de: t.folha, cenario: "quarto2", nome: "folha", modo: "manha" }, //              Pega uma folha do caderno e escreve...
          { de: t.mar, cenario: "quarto2", nome: "lista", modo: "manha" }, //                Ver o mar. Você mora três horas da praia e nunca foi.
          { de: t.julia, cenario: "quarto2", nome: "julia", modo: "manha" }, //              Falar pra Júlia que gosta dela
          { de: t.folha2, cenario: "quarto2", nome: "lista2", modo: "manha" }, //            desde o oitavo ano.
          { de: t.pai, cenario: "quarto2", nome: "lista3", modo: "manha" }, //               Pedir desculpa pro seu pai por aquela briga
          { de: t.rostoPai, cenario: "quarto2", nome: "rostoPai", modo: "manha" }, //        que vocês fingem que nunca aconteceu,
          { de: t.mae, cenario: "quarto2", nome: "lista4", modo: "manha" }, //               e dizer pra sua mãe, olhando nos olhos dela,
          { de: t.rostoMae, cenario: "quarto2", nome: "rostoMae", modo: "manha" }, //        tudo aquilo que você só sabe escrever em mensagem.
          { de: t.dobra, cenario: "quarto2", nome: "dobra", modo: "manha" }, //              Você dobra a folha e guarda no bolso,
          { de: t.desliga, cenario: "quarto2", nome: "desliga", modo: "manha" }, //          e desliga o celular.
        ],
        cameras: {
          abre: { k: [[0, [1.2, 1.9, 1.5], [-1.6, 0.6, -1.0], 48], [t.acorda, [1.0, 1.85, 1.35], [-1.6, 0.6, -1.0], 46]], tremor: 0.0015 },
          acorda: (tt, ctx) => {
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            return { pos: cabeca.clone().add(new THREE.Vector3(0.45, 0.75, 0.45)), alvo: cabeca.clone(), fov: 38 };
          },
          contar: { k: [[t.contar, [0.4, 1.45, 1.35], [1.6, 1.0, 0.35], 44], [t.folha, [0.45, 1.42, 1.3], [1.6, 1.0, 0.35], 42]], tremor: 0.002 },
          folha: { k: [[t.folha, [0.85, 1.55, -0.6], [1.85, 0.8, 0.3], 42], [t.mar, [0.95, 1.5, -0.5], [1.85, 0.8, 0.32], 40]], tremor: 0.0018 },
          lista: camFolha(0.62, 36),
          julia: (tt, ctx) => {
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            return { pos: no("quarto2", 2.22, 1.4, 1.0), alvo: cabeca.clone().add(new THREE.Vector3(0, 0.03, 0)), fov: 52 };
          },
          lista2: camFolha(0.62, 36),
          lista3: camFolha(0.6, 36),
          rostoPai: (tt, ctx) => {
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            return { pos: no("quarto2", 2.22, 1.38, 0.98), alvo: cabeca.clone().add(new THREE.Vector3(0, -0.03, 0)), fov: 48 };
          },
          lista4: camFolha(0.58, 36),
          rostoMae: (tt, ctx) => {
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            const k = trilha([[t.rostoMae, 0], [t.dobra, 1]], tt);
            return { pos: no("quarto2", 2.22, 1.38, 0.98 - 0.08 * k), alvo: cabeca.clone().add(new THREE.Vector3(0, -0.03, 0)), fov: 48 - 4 * k };
          },
          dobra: { k: [[t.dobra, [2.1, 1.4, 1.5], [1.5, 1.05, 0.4], 40], [t.desliga, [2.05, 1.38, 1.42], [1.5, 1.05, 0.4], 38]], tremor: 0.0015 },
          desliga: (tt, ctx) => {
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            const c = ctx.celular;
            c.updateMatrixWorld(true);
            const centro = c.localToWorld(new THREE.Vector3(0, 0, 0));
            const alvo = c.localToWorld(new THREE.Vector3(0, 0.008, 0));
            const dir = centro.clone().sub(cabeca).normalize();
            return { pos: alvo.clone().addScaledVector(dir, -0.36), alvo, fov: 32 };
          },
        },
        semCabeca: (tt, p) => p.nome.startsWith("lista") || p.nome === "desliga",
        personagem: {
          semente: 35,
          onde: [[0, "quarto2"]],
          pos: [[0, DEITADO], [t.contar, MESA, "corte"]],
          pose: {
            giro: [[0, 0], [t.contar, PI / 2, "corte"]],
            deitar: [[0, -1.45], [t.contar, 0, "corte"]],
            quadril: [[0, 0], [t.contar, -PI / 2, "corte"]],
            joelho: [[0, 0], [t.contar, 1.5, "corte"]],
            inclinar: [[0, 0], [t.contar, 0.12, "corte"], [t.folha + 1, 0.3, "ambos"], [t.dobra, 0.1, "ambos"]],
            cabecaGiro: [[0, 0.3], [t.acorda, 0.3], [T("acorda") + 0.5, 0, "ambos"], [t.contar, 0, "corte"]],
            cabecaInclina: [[0, -0.1], [t.contar, 0.15, "corte"], [t.folha + 1, 0.45, "ambos"], [t.julia, 0.08, "corte"], [t.folha2, 0.45, "corte"], [t.rostoPai, 0.1, "corte"], [t.mae, 0.45, "corte"], [t.rostoMae, 0.05, "corte"], [t.dobra, 0.3, "corte"]],
            olhos: [[0, 0.04], [T("acorda") - 0.1, 0.04], [T("acorda") + 0.2, 1.1, "sai"], [T("ideia"), 1.15]],
            sobrancelha: [[0, 0], [T("ideia"), 0.35, "ambos"], [t.contar, -0.25, "corte"], [t.julia, 0.2, "corte"], [t.rostoPai, -0.1, "corte"], [t.rostoMae, 0.1, "corte"]],
            sobrancelhaMedo: [[0, 0], [t.rostoPai, 0.4, "corte"], [t.rostoMae, 0.65, "corte"]],
            sorriso: [[0, 0], [t.contar, 0.15, "corte"], [t.julia, 0.05, "corte"], [T("gosta"), 0.7, "ambos"], [t.folha2, 0.3, "corte"], [t.rostoPai, 0, "corte"], [t.rostoMae, 0.15, "corte"], [t.dobra, 0.3, "corte"]],
            choro: [[0, 0], [t.rostoMae, 0], [t.rostoMae + 1.2, 0.6, "ambos"], [t.dobra, 0, "corte"]],
          },
          semPiscar: [[0, T("acorda") - 0.2]],
          maos: (tt, pts, ctx, b) => {
            if (tt < t.contar) return null;
            const o = ctx.cenarios.quarto2.grupo.position;
            if (tt >= t.desliga - 0.6) return segurandoCelular(pts, b, 0.42, 0.34);
            if (tt >= t.dobra) {
              // dobra a folha na frente do peito e guarda no bolso do moletom
              const { frente, cima, direita } = eixos(b);
              const bolso = trilha([[T("guarda") - 0.1, 0], [T("guarda") + 0.5, 1, "ambos"]], tt);
              const c = em(pts.cabeca, [frente, 0.38 - 0.12 * bolso], [cima, -0.38 - 0.25 * bolso]);
              return { alvoE: em(c, [direita, -0.07 + 0.05 * bolso]), pesoE: 1, alvoD: em(c, [direita, 0.07]), pesoD: 1 - 0.6 * bolso };
            }
            const esquerda = new THREE.Vector3(FOLHA[0] - 0.08, FOLHA[1] + 0.04, FOLHA[2] - 0.14).add(o);
            if (escrevendo(tt)) return { alvoE: esquerda, pesoE: 1, alvoD: pontoCaneta(tt).add(o), pesoD: 1 };
            // arrancando a folha do caderno
            return { alvoE: esquerda, pesoE: 1, alvoD: new THREE.Vector3(FOLHA[0] - 0.02, FOLHA[1] + 0.06, FOLHA[2] + 0.1).add(o), pesoD: 1 };
          },
        },
        celular: (tt) => (tt >= t.desliga - 0.6 ? "mao" : { cenario: "quarto2", pos: [1.86, 0.7655, -0.12], rot: [-PI / 2, 0, PI / 2 + 0.3] }),
        tela: (g, tt, desenhar) => {
          let k = "dorme";
          let fn = () => telaBloqueio(g, 600, 1302, { hora: "9:12", data: "segunda-feira, 16 de novembro", brilho: 0.15 });
          if (tt >= t.desliga - 0.6) {
            const kk = Math.min(1, Math.max(0, (tt - T("desliga")) / 0.7));
            if (tt >= T("desliga") + 0.95) (k = "off"), (fn = () => telaApagada(g, 600, 1302));
            else (k = "d" + Math.round(kk * 10)), (fn = () => telaDesligar(g, 600, 1302, kk));
          }
          if (desenhar) fn();
          return k;
        },
        montar: (ctx) => {
          const q = ctx.cenarios.quarto2;
          q.cobertor.visible = false;
          q.cadeira.position.x = 1.15;
          ctx.folha = criarFolha(ctx.cena);
          const caneta = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.004, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0x1c3a8a, roughness: 0.4 }));
          ctx.cena.add(caneta);
          ctx.caneta = caneta;
        },
        quadro: (tt, plano, ctx, fase) => {
          const q = ctx.cenarios.quarto2;
          if (fase === "antes") {
            q.cortinas(0);
            q.relogio.userData.mostrar("9:12");
            return;
          }
          const o = q.grupo.position;
          const f = ctx.folha;
          // a folha: no caderno -> na mesa (escrevendo) -> dobrada na mão -> no bolso
          if (tt < t.folha + 0.6) f.grupo.visible = false;
          else if (tt < t.dobra) {
            f.grupo.visible = true;
            f.grupo.position.set(...FOLHA).add(o);
            f.grupo.rotation.set(-PI / 2, 0, -PI / 2);
            f.dobrar(0);
          } else if (tt < T.fim("bolso,") - 0.1) {
            f.grupo.visible = true;
            const b = ctx.boneco;
            const pE = new THREE.Vector3();
            const pD = new THREE.Vector3();
            b.userData.rig.bracoE.pega.getWorldPosition(pE);
            b.userData.rig.bracoD.pega.getWorldPosition(pD);
            f.grupo.position.copy(pE.lerp(pD, 0.5)).add(new THREE.Vector3(0, 0.03, 0));
            f.grupo.rotation.set(0, b.rotation.y - PI / 2, 0);
            f.dobrar(trilha([[t.dobra, 0], [T("guarda") - 0.2, 1, "ambos"]], tt));
          } else f.grupo.visible = false;
          const itens = ITENS.map((i) => ({ texto: i.texto }));
          const e = escrito(tt);
          f.mostrar("e" + Math.round(e * 60) + (tt >= t.dobra ? "d" : ""), { itens, escrito: e, dobras: tt >= t.dobra });
          // a caneta na mão direita enquanto escreve
          const c = ctx.caneta;
          c.visible = escrevendo(tt) || (tt >= t.folha && tt < t.dobra);
          if (c.visible) {
            const p = new THREE.Vector3();
            ctx.boneco.userData.rig.bracoD.pega.getWorldPosition(p);
            c.position.copy(p).add(new THREE.Vector3(0.02, 0.03, 0));
            c.rotation.set(0.5, 0, -0.6);
          }
        },
      });
