      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
      import { iniciarParte, tempos, trilha } from "./assets/js/cena.js";
      import { pontosDoBoneco } from "./assets/js/personagem.js";
      import { SALA } from "./assets/js/mundo4.js";
      import { PI, ALT, eixos, em, no, segurandoCelular, celularExtra, falar } from "./assets/js/v3.js";
      import { tvJornal, telaBoato, telaCaixa, telaApagada } from "./assets/js/telas3.js";
      import { PALAVRAS } from "./assets/js/tempos/v3-parte10.js";

      // Parte 10: à noite, o pai na garagem mexendo no carro velho que nunca funciona. Ele pede desculpa; o pai não fala
      // nada, só passa uma chave inglesa; os dois ficam até de madrugada consertando um carro que nunca vai andar.
      // No sexto dia começa o boato: "a data mudou". Ele liga o celular, olha a caixa de entrada e decide não abrir nada.
      const T = tempos(PALAVRAS);
      const FIM = 42.5;
      const t = {
        encontra: T("A noite") - 0.15,
        motor: T("mexendo") - 0.12,
        desculpa: T("Você pede") - 0.12,
        cala: T("ele não") - 0.12,
        chave: T("só te") - 0.12,
        madrugada: T("e vocês") - 0.12,
        tv: T("É no") - 0.15,
        boato: T("que chegou") - 0.12,
        quarto: T("Ninguém") - 0.15,
        liga: T("Você liga") - 0.12,
        caixa: T("olha a") - 0.1,
        fim: T("e decide") - 0.12,
      };
      const PAI = [0, ALT, -2.25];
      const ELE_A = [-0.85, ALT, -2.15];
      const ELE_B = [0.78, ALT, -2.2];
      const MOTOR = [0, 1.12, -1.55];
      const SENTADO = [-1.44, 0.605, -0.7];
      const TROCA = T("chave") + 0.25; // a chave passa da mão do pai para a dele
      const presa = (quem, f, d, c, ac = 0, fov = 38) => (tt, ctx) => {
        const b = quem === "ele" ? ctx.boneco : ctx.outros[quem].boneco;
        const { cabeca } = pontosDoBoneco(b);
        const { frente, direita, cima } = eixos(b);
        return { pos: em(cabeca, [frente, f], [direita, d], [cima, c]), alvo: em(cabeca, [cima, ac]), fov };
      };
      const noMotor = (b, o, dx = 0) => ({ alvoE: new THREE.Vector3(MOTOR[0] + dx - 0.16, MOTOR[1], MOTOR[2] - 0.05).add(o), pesoE: 1, alvoD: new THREE.Vector3(MOTOR[0] + dx + 0.16, MOTOR[1], MOTOR[2] - 0.05).add(o), pesoD: 1 });

      iniciarParte({
        host: "__parte10",
        cenarios: ["garagem", "sala", "quarto2"],
        planos: [
          { de: 0, cenario: "garagem", nome: "abre", modo: "noite" }, //                     (a garagem, o pai no motor)
          { de: t.encontra, cenario: "garagem", nome: "encontra", modo: "noite" }, //        À noite, você encontra o seu pai na garagem,
          { de: t.motor, cenario: "garagem", nome: "motor", modo: "noite" }, //              mexendo no carro velho que nunca funciona.
          { de: t.desculpa, cenario: "garagem", nome: "desculpa", modo: "noite" }, //        Você pede desculpa,
          { de: t.cala, cenario: "garagem", nome: "cala", modo: "noite" }, //                ele não fala nada,
          { de: t.chave, cenario: "garagem", nome: "chave", modo: "noite" }, //              só te passa uma chave inglesa
          { de: t.madrugada, cenario: "garagem", nome: "madrugada", modo: "madrugada" }, //  e vocês ficam ali até de madrugada, consertando...
          { de: t.tv, cenario: "sala", nome: "tv", modo: "dia" }, //                         É no sexto dia que o boato começa. Algumas pessoas... mudou,
          { de: t.boato, cenario: "sala", nome: "boato", modo: "dia" }, //                   que chegou um e-mail novo, um assunto diferente.
          { de: t.quarto, cenario: "quarto2", nome: "quarto", modo: "dia" }, //              Ninguém sabe por quê. Ninguém sabe com quem.
          { de: t.liga, cenario: "quarto2", nome: "liga", modo: "dia" }, //                  Você liga o celular,
          { de: t.caixa, cenario: "quarto2", nome: "caixa", modo: "dia" }, //                olha a caixa de entrada
          { de: t.fim, cenario: "quarto2", nome: "fim", modo: "dia" }, //                    e decide não abrir nada.
        ],
        cortesEscuros: [t.tv, t.quarto],
        preenchimento: { garagem: 0.75, sala: 0.6 },
        cameras: {
          abre: { k: [[0, [2.1, 1.75, -0.35], [0, 1.2, -2.0], 50], [t.encontra, [2.0, 1.72, -0.45], [0, 1.2, -2.0], 48]], tremor: 0.0015 },
          encontra: { k: [[t.encontra, [-2.2, 1.6, -2.65], [-0.8, 1.2, 1.6], 46], [t.motor, [-2.15, 1.58, -2.6], [-1.2, 1.15, -0.5], 44]], tremor: 0.002 },
          motor: { k: [[t.motor, [1.35, 1.5, -1.0], [0, 1.32, -2.0], 40], [t.desculpa, [1.3, 1.48, -1.05], [0, 1.32, -2.0], 38]], tremor: 0.0015 },
          desculpa: presa("ele", 1.05, 0.25, 0.0, -0.12, 38),
          cala: { k: [[t.cala, [1.05, 1.42, -1.3], [0, 1.45, -2.05], 36], [t.chave, [1.0, 1.42, -1.35], [0, 1.45, -2.05], 34]], tremor: 0.0015 },
          chave: { k: [[t.chave, [-1.85, 1.45, -1.35], [-0.4, 1.15, -2.2], 44], [t.madrugada, [-1.8, 1.43, -1.45], [-0.4, 1.15, -2.2], 42]], tremor: 0.0018 },
          madrugada: { k: [[t.madrugada, [1.9, 2.2, 1.4], [0, 1.0, -2.0], 46], [t.tv, [1.5, 2.0, 0.7], [0, 1.0, -2.0], 42]], tremor: 0.0012 },
          tv: { k: [[t.tv, [0.12, 1.1, -0.1], [0, 1.04, -2.27], 40], [t.boato, [0.08, 1.09, -0.35], [0, 1.03, -2.27], 40]], tremor: 0.0012 },
          boato: (tt, ctx) => {
            const c = ctx.celMae.obj;
            c.updateMatrixWorld(true);
            const centro = c.localToWorld(new THREE.Vector3(0, 0, 0));
            const alvo = c.localToWorld(new THREE.Vector3(0, -0.006, 0));
            const n = new THREE.Vector3(0, 0, 1).transformDirection(c.matrixWorld);
            return { pos: alvo.clone().addScaledVector(n, 0.36).add(new THREE.Vector3(0, 0.04, 0)), alvo, fov: 32 };
          },
          quarto: { k: [[t.quarto, [0.6, 1.5, 0.85], [-1.4, 0.95, -0.8], 44], [t.liga, [0.5, 1.48, 0.75], [-1.4, 0.95, -0.8], 42]], tremor: 0.0018 },
          liga: (tt, ctx) => {
            const c = ctx.celular.getWorldPosition(new THREE.Vector3());
            const { frente, direita, cima } = eixos(ctx.boneco);
            return { pos: em(c, [frente, 0.5], [direita, 0.25], [cima, 0.12]), alvo: c, fov: 34 };
          },
          caixa: (tt, ctx) => {
            const { cabeca } = pontosDoBoneco(ctx.boneco);
            const c = ctx.celular;
            c.updateMatrixWorld(true);
            const centro = c.localToWorld(new THREE.Vector3(0, 0, 0));
            const alvo = c.localToWorld(new THREE.Vector3(0, -0.01, 0));
            const dir = centro.clone().sub(cabeca).normalize();
            return { pos: alvo.clone().addScaledVector(dir, -0.36), alvo, fov: 32 };
          },
          fim: presa("ele", 1.15, 0.25, 0.0, -0.14, 38),
        },
        semCabeca: (tt, p) => p.nome === "caixa",
        personagem: {
          semente: 39,
          onde: [[0, "garagem"], [t.tv, "quarto2"]],
          pos: [[0, [-1.6, ALT, 2.7]], [t.encontra, [-1.6, ALT, 2.7]], [t.motor - 0.6, [-1.6, ALT, -1.85], "linear"], [t.motor + 0.3, ELE_A, "suave"], [t.madrugada, ELE_B, "corte"], [t.tv, SENTADO, "corte"]],
          passos: [[t.encontra, t.motor + 0.3, 0.9, 0.6]],
          visivel: (tt, p) => tt >= t.encontra || p.cenario !== "garagem",
          pose: {
            giro: [[0, PI], [t.motor - 0.6, PI], [t.motor + 0.3, 1.0, "ambos"], [t.madrugada, 0, "corte"], [t.tv, PI / 2, "corte"]],
            quadril: [[0, 0], [t.tv, -PI / 2, "corte"]],
            joelho: [[0, 0], [t.tv, 1.5, "corte"]],
            inclinar: [[0, 0.04], [t.madrugada, 0.25, "corte"], [t.tv, 0.14, "corte"]],
            cabecaInclina: [[0, 0.05], [t.desculpa, 0.3, "corte"], [t.cala, 0.25], [t.chave, 0.15, "corte"], [t.madrugada, 0.35, "corte"], [t.tv, 0.35, "corte"], [t.fim, 0.2, "corte"]],
            boca: falar([[T("Você pede"), T.fim("desculpa,")]], 0.25),
            sobrancelhaMedo: [[0, 0.5], [t.madrugada, 0.1, "corte"], [t.quarto, 0.55, "corte"]],
            sorriso: [[0, 0], [t.madrugada, 0.3, "corte"], [t.tv, 0, "corte"]],
            sobrancelha: [[0, 0], [t.fim, -0.25, "corte"]],
          },
          maos: (tt, pts, ctx, b) => {
            const o = ctx.cenarios.garagem.grupo.position;
            if (tt >= t.tv) {
              if (tt >= t.liga - 0.3) {
                const r = segurandoCelular(pts, b, 0.44, 0.34);
                if (tt >= T("não abrir") + 0.2) {
                  // baixa o celular para o colo (tela para baixo)
                  const k = trilha([[T("não abrir") + 0.2, 0], [T("não abrir") + 0.9, 1, "ambos"]], tt);
                  const { frente } = eixos(b);
                  r.alvoE = r.alvoE.clone().lerp(em(b.position, [frente, 0.32]).setY(b.position.y + 0.12), k);
                  r.alvoD = r.alvoD.clone().lerp(em(b.position, [frente, 0.32]).setY(b.position.y + 0.12), k);
                }
                return r;
              }
              const { frente, direita } = eixos(b);
              const q = b.position.clone();
              return { alvoE: em(q, [frente, 0.3], [direita, -0.1]).setY(q.y + 0.12), pesoE: 1, alvoD: em(q, [frente, 0.3], [direita, 0.1]).setY(q.y + 0.12), pesoD: 1 };
            }
            if (tt >= t.madrugada) return noMotor(b, o, 0.32);
            if (tt >= TROCA - 0.4 && tt < t.madrugada) {
              // recebe a chave: a mão esquerda vai até a do pai
              const k = trilha([[TROCA - 0.4, 0], [TROCA, 1, "ambos"], [TROCA + 0.8, 0.6, "ambos"]], tt);
              return { alvoE: new THREE.Vector3(-0.55, 1.05, -2.02).add(o), pesoE: k };
            }
            return null;
          },
        },
        celular: (tt) => {
          if (tt < t.tv || tt < t.liga - 0.3) return tt >= t.tv ? { cenario: "quarto2", pos: [-1.2, 0.535, -0.95], rot: [-PI / 2, 0, 0.5] } : null;
          return "mao";
        },
        tela: (g, tt, desenhar) => {
          let k, fn;
          if (tt < T("liga") + 0.4) (k = "off"), (fn = () => telaApagada(g, 600, 1302));
          else if (tt < T("liga") + 1.1) {
            k = "boot";
            fn = () => {
              g.fillStyle = "#050506";
              g.fillRect(0, 0, 600, 1302);
              g.fillStyle = "#e9e7e3";
              g.beginPath();
              g.arc(300, 600, 70, 0, Math.PI * 2);
              g.fill();
            };
          } else if (tt < T("não abrir") + 0.3) {
            k = "caixa";
            fn = () => telaCaixa(g, 600, 1302, { hora: "10:42", naoLidos: 1, emails: [
              { de: "(sem remetente)", assunto: "• • • • • • • •", hora: "3:33", vermelho: true },
              { de: "(sem remetente)", assunto: "Faltam 3 dias.", hora: "sáb" },
              { de: "(sem remetente)", assunto: "(sem assunto)", hora: "qui" },
              { de: "Escola", assunto: "Aulas suspensas", hora: "qui" },
            ] });
          } else (k = "off2"), (fn = () => telaApagada(g, 600, 1302));
          if (desenhar) fn();
          return k;
        },
        outros: [
          {
            id: "pai", variante: "pai", semente: 41, onde: [[0, "garagem"]], pos: [[0, PAI]],
            pose: {
              giro: [[0, 0], [t.chave, 0], [t.chave + 0.4, -0.5, "ambos"], [TROCA + 0.6, -0.5], [TROCA + 1.0, 0, "ambos"]],
              inclinar: [[0, 0.25], [t.chave, 0.25], [t.chave + 0.4, 0.1, "ambos"], [TROCA + 0.6, 0.1], [TROCA + 1.0, 0.25, "ambos"]],
              cabecaInclina: [[0, 0.45], [t.cala, 0.4]],
              sobrancelhaMedo: [[0, 0.3], [t.cala, 0.6, "corte"]],
              sobrancelha: [[0, -0.2]],
              sorriso: [[0, 0], [t.madrugada, 0.25, "corte"]],
            },
            maos: (tt, pts, ctx, b) => {
              const o = ctx.cenarios.garagem.grupo.position;
              if (tt >= t.chave && tt < TROCA + 0.6) {
                const k = trilha([[t.chave, 0], [t.chave + 0.5, 1, "ambos"]], tt);
                return { alvoD: new THREE.Vector3(-0.34, 1.07, -2.0).add(o), pesoD: k, alvoE: new THREE.Vector3(MOTOR[0] - 0.16, MOTOR[1], MOTOR[2] - 0.05).add(o), pesoE: 1 - k };
              }
              return noMotor(b, o, -0.12);
            },
          },
          {
            id: "mae", variante: "mae", semente: 43, onde: [[0, "sala"]], pos: [[0, SALA.sentado(0.4)]],
            pose: { quadril: [[0, -PI / 2]], joelho: [[0, 1.5]], giro: [[0, PI]], inclinar: [[0, 0.1]], cabecaInclina: [[0, 0.4]], sobrancelhaMedo: [[0, 0.7]] },
            maos: (tt, pts, ctx, b) => segurandoCelular(pts, b, 0.4, 0.38),
          },
        ],
        montar: (ctx) => {
          ctx.celMae = celularExtra(ctx.cena);
          ctx.celMae.mostrar("boato", (g, W, H) => telaBoato(g, W, H, { hora: "11:05", posts: [
            { nome: "Carla", texto: "minha data mudou!!! chegou outro e-mail agora", cor: "#a07fb0" },
            { nome: "Tiago", texto: "o meu também, o assunto é diferente", cor: "#7fa0b0" },
            { nome: "Rê", texto: "alguém mais? a data mudou?", cor: "#b0a07f" },
          ] }));
          ctx.cenarios.quarto2.cobertor.visible = false;
          ctx.cenarios.garagem.vareta.visible = false; // a vareta do capô cortava o rosto do pai nos closes
        },
        quadro: (tt, plano, ctx, fase) => {
          const gar = ctx.cenarios.garagem;
          if (fase === "antes") {
            const sala = ctx.cenarios.sala;
            sala.tv.userData.mostrar("boato", (g, W, H) => tvJornal(g, W, H, { manchete: "A DATA MUDOU?", sub: "pessoas dizem ter recebido um e-mail novo" }));
            sala.luzTV(0x9fb8e0, 0.9);
            sala.relogio.userData.mostrar("11:05");
            ctx.cenarios.quarto2.relogio.userData.mostrar("10:41");
            return;
          }
          // a chave inglesa: na mão do pai, depois na dele
          const c = gar.chave;
          const naMao = (b, lado) => {
            const p = new THREE.Vector3();
            b.userData.rig[lado === "E" ? "bracoE" : "bracoD"].pega.getWorldPosition(p);
            c.position.copy(p).sub(gar.grupo.position);
            c.rotation.set(0.3, b.rotation.y, 0.4);
          };
          if (tt >= t.chave && tt < TROCA) naMao(ctx.outros.pai.boneco, "D");
          else if (tt >= TROCA && tt < t.tv) naMao(ctx.boneco, tt >= t.madrugada ? "D" : "E");
          if (plano.cenario === "sala") ctx.celMae.naMao(ctx.outros.mae.boneco, pontosDoBoneco(ctx.outros.mae.boneco).cabeca);
          else ctx.celMae.esconder();
        },
      });
