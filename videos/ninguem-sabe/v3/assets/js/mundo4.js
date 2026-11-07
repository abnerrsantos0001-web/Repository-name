// Cenários do vídeo 3 ("E se você soubesse o dia da sua morte?"), no mesmo estilo low-poly dos vídeos 1 e 2,
// claros (regra 3: ~30% mais claros que o vídeo 1) e cheios: sala de estar com TV, sala de aula, garagem com o
// carro velho, praia, a casa da Júlia, o saguão do aeroporto, a igreja e a rua de casas à noite (parte 1).
//
// Cada cenário é um grupo com as próprias luzes e "modos" de luz; peças que a cena move (controles do videogame,
// folha do caderno, porta da Júlia, sino, telas) ficam expostas na api. Telas (TV, painel do aeroporto) são
// canvas redesenhados só quando a "chave" do que mostram muda.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
import { mat, caixa, cilindro, parede, luzPropria, ceu, criarCarro, criarOnibus, criarCasa, criarPredio, Janelas, criarPoste, rng, DESLOCAMENTO, telhado, desenharSeteSegmentos } from "./mundo.js";
import { obj, passavel, texturaAzulejo, matTextura, paredeTex, placa, luzPonto, luzSpot, pano, cadeiraMadeira, textoCentro, relogioParede } from "./mundo3.js";

Object.assign(DESLOCAMENTO, {
  sala: new THREE.Vector3(2000, 0, 0),
  escola: new THREE.Vector3(2000, 0, 100),
  garagem: new THREE.Vector3(2000, 0, 200),
  praia: new THREE.Vector3(2400, 0, 0),
  casaJulia: new THREE.Vector3(2400, 0, 300),
  aeroporto: new THREE.Vector3(2800, 0, 0),
  igreja: new THREE.Vector3(2800, 0, 300),
  noite: new THREE.Vector3(3200, 0, 0),
});

// ------------------------------------------------------------ peças comuns
// tela em canvas (TV, painel): mostrar(chave, desenhar) só redesenha quando a chave muda
export function telaCanvas(pai, w, h, o = {}) {
  let atual;
  const m = placa(pai, w, h, (g, W, H, fn) => {
    g.fillStyle = "#050607";
    g.fillRect(0, 0, W, H);
    if (fn) fn(g, W, H);
  }, { propria: true, ppm: o.ppm ?? 1100 });
  m.userData.passavel = true;
  m.userData.mostrar = (chave, fn) => {
    if (chave === atual) return;
    atual = chave;
    m.userData.redesenhar(fn);
  };
  return m;
}
// luzes de ambulância lá fora: vermelho e azul alternando (só as luzes, a ambulância nunca aparece)
function sirene(pai, x, y, z, alcance = 14) {
  const v = luzPonto(pai, 0xff2a2a, 0, x, y, z, alcance, 1.2);
  const a = luzPonto(pai, 0x2a5cff, 0, x, y, z - 1.2, alcance, 1.2);
  return (t, nivel) => {
    const f = ((t * 2.6) % 1 + 1) % 1;
    v.intensity = nivel * (f < 0.5 ? 14 : 1.5);
    a.intensity = nivel * (f >= 0.5 ? 14 : 1.5);
  };
}
// planta em vaso
function planta(pai, nome, x, z, sem = 3, alt = 0.9) {
  const p = obj(pai, nome, x, 0, z);
  cilindro(p, 0.16, 0.12, 0.3, 10, 0x6b4a3a, 0, 0.15, 0);
  const r = rng(sem);
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + r() * 0.08, 0), mat(i % 2 ? 0x56704e : 0x4a6344));
    f.position.set((r() - 0.5) * 0.3, 0.35 + r() * (alt - 0.35), (r() - 0.5) * 0.3);
    f.castShadow = true;
    p.add(f);
  }
  return p;
}
// quadro na parede (moldura + desenho simples)
function quadroParede(pai, x, y, z, ry, w, h, cor, sem) {
  const q = passavel(obj(pai, "quadro", x, y, z, ry));
  caixa(q, w + 0.05, h + 0.05, 0.03, 0x2a2522, 0, 0, 0);
  const r = rng(sem);
  placa(q, w, h, (g, W, H) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = ["#d9d2c2", "#7d8a96", "#5c6a5a", "#a08670"][i];
      g.beginPath();
      g.arc(W * (0.2 + r() * 0.6), H * (0.25 + r() * 0.5), W * (0.08 + r() * 0.12), 0, Math.PI * 2);
      g.fill();
    }
  }, { ppm: 400 }).position.z = 0.017;
  return q;
}
// "lá fora" de uma janela: céu, casas e janelas acesas à noite (vira para a janela com ry)
function foraDaJanela(pai, x, z, ry, sem = 41) {
  const fora = passavel(obj(pai, "fora", x, 0, z, ry));
  const ceuJ = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshBasicMaterial({ color: 0xb6c8da, fog: false }));
  ceuJ.position.set(0, 4, -16);
  fora.add(ceuJ);
  const r = rng(sem);
  const janelas = [];
  for (let i = 0; i < 6; i++) {
    const xx = -9 + i * 3.4;
    const h = 3 + r() * 2.5;
    caixa(fora, 2.8, h, 3, [0x6a6e76, 0x5d6169, 0x767a82][i % 3], xx, h / 2 - 0.2, -9);
    caixa(fora, 3.2, 0.4, 3.4, 0x3a3c40, xx, h, -9);
    const jl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.9), new THREE.MeshStandardMaterial({ color: 0x23262b, emissive: 0xffd49a, emissiveIntensity: 0 }));
    jl.position.set(xx + (r() - 0.5), h * 0.55, -7.48);
    fora.add(jl);
    janelas.push(jl);
  }
  caixa(fora, 40, 0.1, 6, 0x5a5d62, 0, -0.25, -3.5);
  return {
    pintar: (dia, noiteAcesas = 0.6) => {
      ceuJ.material.color.setHex(dia ? 0xb6c8da : 0x16233a);
      janelas.forEach((j, i) => (j.material.emissiveIntensity = dia ? 0 : noiteAcesas * (i % 2 ? 1 : 0.45)));
    },
  };
}
// janela com caixilho (no plano de uma parede, olhando para "dentro" = +z local)
function caixilho(pai, nome, x, y, z, ry, w, h) {
  const j = obj(pai, nome, x, y, z, ry);
  for (const [cw, ch, cx, cy] of [[w + 0.08, 0.06, 0, h / 2], [w + 0.08, 0.06, 0, -h / 2], [0.06, h, -w / 2, 0], [0.06, h, w / 2, 0], [0.04, h, 0, 0]]) caixa(j, cw, ch, 0.08, 0xe9e8e4, cx, cy, 0);
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0xcfe0ea, transparent: true, opacity: 0.12, roughness: 0.1 }));
  vidro.userData.passavel = true;
  j.add(vidro);
  caixa(j, w + 0.16, 0.04, 0.22, 0xe9e8e4, 0, -h / 2 - 0.03, 0.08);
  return j;
}

// ------------------------------------------------------------ sala de estar
// x de -3 a 3, z de -2.5 a 2.5, pé-direito 2.6. TV no rack da parede norte (z = -2.5), sofá de frente para ela,
// mesa de centro no meio, relógio digital de parede à esquerda da TV, janela na parede leste, porta ao sul.
export const SALA = {
  sofa: { z: 1.4, assento: 0.42, encosto: 1.58 },
  // quadril de quem senta no sofá (x livre em -0.75 / 0 / 0.75)
  sentado: (x) => [x, 0.47, 1.22],
  tv: { x: 0, y: 1.06, z: -2.27 },
  relogio: { x: -1.85, y: 1.85, z: -2.47 },
};
export function criarSala(cena) {
  const g = new THREE.Group();
  g.name = "sala";
  g.position.copy(DESLOCAMENTO.sala);
  cena.add(g);
  const H = 2.6;
  const api = { grupo: g, fundo: 0x1a1c20, nevoa: [0x1a1c20, 30, 70] };
  const tabua = texturaAzulejo(0x8a7058, 0x6a5644, { colunas: 1, linhas: 6, ruido: 0.12, chanfro: 0.03, semente: 23 });
  const chao = passavel(obj(g, "chao"));
  caixa(chao, 6.0, 0.1, 5.0, 0xffffff, 0, -0.05, 0, { material: matTextura(tabua, 6.0, 5.0, 1.2) });
  const teto = passavel(obj(g, "teto"));
  caixa(teto, 6.0, 0.08, 5.0, 0xdedcd8, 0, H + 0.04, 0);
  const corParede = 0xc2b9ab;
  paredeTex(g, { w: 6.0, h: H, z: -2.56, cor: corParede, nome: "parede-norte" });
  paredeTex(g, { w: 5.0, h: H, x: -3.06, ry: Math.PI / 2, cor: corParede, nome: "parede-oeste" });
  paredeTex(g, { w: 5.0, h: H, x: 3.06, ry: -Math.PI / 2, cor: corParede, furos: [{ x0: -0.9, x1: 0.5, y0: 0.9, y1: 2.15 }], nome: "parede-leste" });
  paredeTex(g, { w: 6.0, h: H, z: 2.56, ry: Math.PI, cor: corParede, furos: [{ x0: -2.75, x1: -1.9, y0: 0, y1: 2.05 }], nome: "parede-sul" });
  const rodape = passavel(obj(g, "rodape"));
  caixa(rodape, 5.98, 0.08, 0.015, 0xe4e2dc, 0, 0.04, -2.495);
  caixa(rodape, 0.015, 0.08, 4.98, 0xe4e2dc, -2.995, 0.04, 0);

  // rack e TV
  const rack = obj(g, "rack", 0, 0, -2.24);
  caixa(rack, 2.0, 0.45, 0.42, 0x4a3a2e, 0, 0.225, 0);
  for (const x of [-0.5, 0.5]) caixa(rack, 0.012, 0.36, 0.01, 0x2e241c, x, 0.22, 0.211, { sombra: false });
  caixa(rack, 0.3, 0.06, 0.25, 0x18191b, 0.7, 0.48, 0.02);
  const tv = obj(g, "tv", 0, 0.45, -2.3);
  caixa(tv, 0.42, 0.025, 0.2, 0x111214, 0, 0.012, 0);
  caixa(tv, 0.06, 0.1, 0.04, 0x111214, 0, 0.07, -0.02);
  caixa(tv, 1.38, 0.8, 0.05, 0x0b0c0d, 0, 0.61, 0, { aspereza: 0.4, metal: 0.2 });
  const telaTV = telaCanvas(tv, 1.31, 0.735, { ppm: 1150 });
  telaTV.position.set(0, 0.61, 0.026);
  api.tv = telaTV;
  // a luz da TV na sala (cor e força vindas da cena)
  const luzTV = luzPonto(g, 0x9fb8e0, 0, 0, 1.1, -1.7, 6, 1.4);
  api.luzTV = (cor, intensidade) => {
    luzTV.color.setHex(cor);
    luzTV.intensity = intensidade;
  };

  // sofá de 3 lugares de frente para a TV (assento a 0,42 m, encosto em z = 1,58)
  const sofa = obj(g, "sofa", 0, 0, SALA.sofa.z);
  const corSofa = 0x5d6670;
  caixa(sofa, 2.3, 0.28, 0.9, 0x4a525b, 0, 0.14, 0);
  // assentos macios (quem senta afunda uns centímetros: não conta como colisão)
  const assentos = passavel(obj(g, "assentos", 0, 0, SALA.sofa.z));
  for (const x of [-0.74, 0, 0.74]) caixa(assentos, 0.72, 0.14, 0.62, corSofa, x, 0.35, -0.12);
  caixa(sofa, 2.3, 0.62, 0.22, 0x4a525b, 0, 0.59, 0.34);
  for (const x of [-0.74, 0, 0.74]) caixa(sofa, 0.7, 0.4, 0.12, corSofa, x, 0.66, 0.2, { rx: -0.12 });
  for (const s of [-1, 1]) caixa(sofa, 0.2, 0.62, 0.9, 0x4a525b, s * 1.25, 0.31, 0);
  // almofadas soltas e manta (macias: encostar não conta como colisão)
  const alm = passavel(obj(g, "almofadas"));
  caixa(alm, 0.36, 0.34, 0.12, 0xa9905f, -0.98, 0.62, SALA.sofa.z + 0.1, { rx: -0.25, ry: 0.4 });
  caixa(alm, 0.34, 0.32, 0.12, 0x7a2a2c, 0.98, 0.62, SALA.sofa.z + 0.1, { rx: -0.25, ry: -0.4 });
  const manta = pano(0.5, 0.9, 0.03, 0x8b8f7a, 0.02, 4);
  manta.position.set(1.25, 0.66, SALA.sofa.z + 0.05);
  manta.rotation.set(0, Math.PI / 2, 0);
  alm.add(manta);

  // mesa de centro com o lanche (parte 3) e os controles do videogame (soltos: a cena põe nas mãos)
  const mesa = obj(g, "mesa-centro", 0, 0, 0.2);
  caixa(mesa, 1.0, 0.05, 0.52, 0x6b5543, 0, 0.38, 0);
  for (const [x, z] of [[-0.44, -0.2], [0.44, -0.2], [-0.44, 0.2], [0.44, 0.2]]) caixa(mesa, 0.04, 0.36, 0.04, 0x5a4636, x, 0.18, z);
  const lanche = obj(g, "lanche", 0, 0.405, 0.2);
  caixa(lanche, 0.42, 0.04, 0.42, 0xc9b28a, -0.18, 0.02, 0, { ry: 0.2 });
  for (let i = 0; i < 3; i++) {
    const fatia = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 3), mat([0xd99a4a, 0xc9843a, 0xd68f45][i]));
    fatia.position.set(-0.24 + i * 0.07, 0.05, -0.05 + i * 0.06);
    fatia.rotation.y = i * 1.7;
    lanche.add(fatia);
  }
  cilindro(lanche, 0.04, 0.035, 0.12, 10, 0x9a2a22, 0.25, 0.06, -0.08);
  cilindro(lanche, 0.04, 0.035, 0.12, 10, 0x2a3e6a, 0.33, 0.06, 0.06);
  api.lanche = lanche;
  const controles = [];
  for (let i = 0; i < 2; i++) {
    const c = passavel(obj(g, "controle"));
    caixa(c, 0.15, 0.03, 0.09, 0x1b1c1f, 0, 0, 0);
    for (const s of [-1, 1]) caixa(c, 0.045, 0.03, 0.07, 0x1b1c1f, s * 0.07, -0.004, -0.03, { ry: s * 0.4 });
    caixa(c, 0.02, 0.008, 0.02, i ? 0x2a6acc : 0xc4161c, 0.03, 0.018, 0.0, { sombra: false });
    c.position.set(0.25 - i * 0.5, 0.42, 0.25);
    controles.push(c);
  }
  api.controles = controles;
  const tapete = passavel(obj(g, "tapete"));
  caixa(tapete, 2.6, 0.012, 1.7, 0x7d7468, 0, 0.006, 0.45, { sombra: false });

  // relógio digital na parede, à esquerda da TV (3:30, 3:31, 3:32, 3:33)
  api.relogio = relogioParede(g, "relogio", SALA.relogio.x, SALA.relogio.y, SALA.relogio.z, 0, false);
  api.relogio.userData.mostrar("3:30");
  // estante, planta, abajur de pé, quadros
  const estante = obj(g, "estante", -2.75, 0, -0.6, Math.PI / 2);
  caixa(estante, 1.2, 1.8, 0.34, 0x6b5543, 0, 0.9, 0);
  const rl = rng(61);
  for (const y of [0.5, 0.95, 1.4]) {
    caixa(estante, 1.16, 0.02, 0.32, 0x5a4636, 0, y - 0.03, 0.0);
    let x = -0.52;
    while (x < 0.5) {
      const lw = 0.03 + rl() * 0.035;
      const lh = 0.2 + rl() * 0.12;
      if (rl() < 0.15) {
        x += 0.12;
        continue;
      }
      caixa(estante, lw, lh, 0.22, [0x7a2a2c, 0x34495e, 0xc9b98f, 0x4d5b4a, 0x8a8d91][Math.floor(rl() * 5)], x + lw / 2, y - 0.02 + lh / 2, 0.03);
      x += lw + 0.004;
    }
  }
  planta(g, "planta", 2.55, -2.1, 5, 1.1);
  const abajur = obj(g, "abajur", -1.7, 0, 1.75);
  cilindro(abajur, 0.14, 0.16, 0.03, 12, 0x2b2c2f, 0, 0.015, 0);
  cilindro(abajur, 0.012, 0.012, 1.4, 6, 0x2b2c2f, 0, 0.72, 0);
  const cupula = cilindro(abajur, 0.16, 0.22, 0.26, 16, 0xe8dcc3, 0, 1.5, 0);
  const luzAbajur = luzPonto(abajur, 0xffcf95, 0, 0, 1.42, 0, 5, 1.5);
  quadroParede(g, 2.99, 1.6, -1.6, -Math.PI / 2, 0.6, 0.45, "#3a4a5c", 7);
  quadroParede(g, -0.4, 1.75, 2.49, Math.PI, 0.8, 0.55, "#5c4a3a", 9);
  quadroParede(g, 0.55, 1.75, 2.49, Math.PI, 0.5, 0.55, "#4a5c4a", 11);

  // janela (leste) e o lado de fora; as luzes da ambulância passam lá fora
  caixilho(g, "janela", 2.99, 1.53, 0.2, -Math.PI / 2, 1.4, 1.25);
  const fora = foraDaJanela(g, 3.6, 0.2, -Math.PI / 2, 47);
  const cortina = pano(0.5, 1.6, 0.03, 0x8b7d6b, 0.035, 14);
  cortina.rotation.y = -Math.PI / 2;
  cortina.position.set(2.92, 1.45, -0.85);
  g.add(passavel(cortina));
  api.sirene = sirene(g, 7, 1.6, 0.6);
  // porta para o corredor
  const porta = obj(g, "porta", -1.9, 0, 2.5);
  caixa(porta, 0.84, 2.03, 0.04, 0xd9d5cc, -0.42, 1.015, 0.02);
  api.porta = (ab) => (porta.rotation.y = ab);

  // luzes: plafon (sombra), preenchimento, sol/lua pela janela, hemisférica
  const plafon = passavel(obj(g, "plafon"));
  cilindro(plafon, 0.28, 0.3, 0.06, 20, 0xe9e8e4, 0, H - 0.03, 0.2);
  const disco = new THREE.Mesh(new THREE.CircleGeometry(0.26, 20), new THREE.MeshStandardMaterial({ color: 0xdadad6, emissive: 0xfff4e4, emissiveIntensity: 0 }));
  disco.rotation.x = Math.PI / 2;
  disco.position.set(0, H - 0.062, 0.2);
  plafon.add(disco);
  const luzTeto = luzSpot(g, 0xfff1de, 0, new THREE.Vector3(0, H - 0.1, 0.2), new THREE.Vector3(0, 0, 0.3), 1.45, 1024, 10);
  const fill = luzPonto(g, 0xfff1de, 0, 0, 2.0, 1.0, 8, 1.3);
  const sol = luzSpot(g, 0xffe8c8, 0, new THREE.Vector3(6, 3.4, 0.6), new THREE.Vector3(0.0, 0, 0.0), 0.5, 1024, 14);
  const lua = luzSpot(g, 0x8ea6cc, 0, new THREE.Vector3(6, 3.0, 0.6), new THREE.Vector3(0.0, 0, 0.0), 0.5, 1024, 14);
  const hemi = new THREE.HemisphereLight(0xe6ecf2, 0x4a4540, 0);
  g.add(hemi);
  api.modo = (nome) => {
    if (nome === api.modoAtual) return;
    api.modoAtual = nome;
    const dia = nome === "dia" || nome === "manha";
    // [teto, abajur, sol, lua, hemi]
    const L = { dia: [0.8, 0, 1, 0, 0.6], manha: [0.6, 0, 1.1, 0, 0.6], noite: [1, 0.6, 0, 0.4, 0.4], noiteTV: [0, 0.9, 0, 0.7, 0.38], madrugada: [0, 0.75, 0, 0.8, 0.34] }[nome] || [1, 0, 1, 0, 0.5];
    luzTeto.intensity = 22 * L[0];
    fill.intensity = 2.2 * L[0] + 0.9 * (1 - L[0]);
    disco.material.emissiveIntensity = 1.3 * L[0];
    luzAbajur.intensity = 2.4 * L[1];
    cupula.material = mat(0xe8dcc3, { emissivo: 0xffcf95, brilho: 0.55 * L[1] });
    sol.intensity = 60 * L[2];
    lua.intensity = 16 * L[3];
    hemi.intensity = L[4];
    fora.pintar(dia, 0.7);
    api.fundo = dia ? 0x9fb3c8 : 0x0f1520;
  };
  api.atualizar = () => {};
  return api;
}

// ------------------------------------------------------------ sala de aula
// x de -4 a 4, z de -3.5 a 3.5, pé-direito 3. Quadro e relógio digital na parede norte (z = -3.5), janelas
// na parede leste (x = 4), carteiras em 4 fileiras de 5, viradas para o quadro (-z).
export const ESCOLA = {
  colunas: [-2.8, -1.4, 0, 1.4, 2.8],
  fileiras: [-1.5, -0.2, 1.1, 2.4],
  mesa: { altura: 0.72, prof: 0.5 },
  // quadril de quem senta na carteira da coluna c, fileira f
  sentado: (c, f) => [ESCOLA.colunas[c], 0.545, ESCOLA.fileiras[f] + 0.36],
  relogio: { x: 0, y: 2.62, z: -3.47 },
};
function carteira(pai, nome, x, z, cor = 0x8a7458) {
  const c = obj(pai, nome, x, 0, z);
  // tampo e estrutura de metal
  caixa(c, 0.66, 0.03, ESCOLA.mesa.prof, cor, 0, ESCOLA.mesa.altura - 0.015, 0);
  for (const [lx, lz] of [[-0.29, -0.2], [0.29, -0.2], [-0.29, 0.2], [0.29, 0.2]]) caixa(c, 0.03, ESCOLA.mesa.altura - 0.03, 0.03, 0x3c3f45, lx, (ESCOLA.mesa.altura - 0.03) / 2, lz, { metal: 0.5, aspereza: 0.4 });
  // cadeira atrás
  const cad = obj(c, nome + "-cadeira", 0, 0, 0.5);
  caixa(cad, 0.42, 0.04, 0.4, 0x3e4a5a, 0, 0.44, 0.02);
  for (const [lx, lz] of [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.18], [0.18, 0.18]]) caixa(cad, 0.025, 0.42, 0.025, 0x3c3f45, lx, 0.21, lz, { metal: 0.5, aspereza: 0.4 });
  caixa(cad, 0.42, 0.3, 0.03, 0x3e4a5a, 0, 0.72, 0.21);
  for (const s of [-1, 1]) caixa(cad, 0.025, 0.3, 0.025, 0x3c3f45, s * 0.18, 0.57, 0.21, { metal: 0.5, aspereza: 0.4 });
  return c;
}
export function criarEscola(cena) {
  const g = new THREE.Group();
  g.name = "escola";
  g.position.copy(DESLOCAMENTO.escola);
  cena.add(g);
  const H = 3.0;
  const api = { grupo: g, fundo: 0xbfd0df, nevoa: [0xbfd0df, 30, 80] };
  const piso = texturaAzulejo(0xa9a59c, 0x8c887f, { colunas: 3, linhas: 3, semente: 71, ruido: 0.05 });
  const chao = passavel(obj(g, "chao"));
  caixa(chao, 8.0, 0.1, 7.0, 0xffffff, 0, -0.05, 0, { material: matTextura(piso, 8, 7, 0.9) });
  const teto = passavel(obj(g, "teto"));
  caixa(teto, 8.0, 0.08, 7.0, 0xe2e0dc, 0, H + 0.04, 0);
  const corParede = 0xd9d3c4;
  const barrado = 0x7d8f86;
  paredeTex(g, { w: 8.0, h: H, z: -3.56, cor: corParede, nome: "parede-norte" });
  paredeTex(g, { w: 7.0, h: H, x: -4.06, ry: Math.PI / 2, cor: corParede, furos: [{ x0: 1.8, x1: 2.75, y0: 0, y1: 2.1 }], nome: "parede-oeste" });
  const furosJ = [-2.4, -0.5, 1.4].map((c) => ({ x0: c - 0.75, x1: c + 0.75, y0: 1.0, y1: 2.4 }));
  paredeTex(g, { w: 7.0, h: H, x: 4.06, ry: -Math.PI / 2, cor: corParede, furos: furosJ, nome: "parede-leste" });
  paredeTex(g, { w: 8.0, h: H, z: 3.56, ry: Math.PI, cor: corParede, nome: "parede-sul" });
  // barrado pintado embaixo (faixa verde) nas paredes
  const faixa = passavel(obj(g, "barrado"));
  caixa(faixa, 7.98, 0.9, 0.01, barrado, 0, 0.45, -3.495, { sombra: false });
  caixa(faixa, 7.98, 0.9, 0.01, barrado, 0, 0.45, 3.495, { sombra: false });
  caixa(faixa, 0.01, 0.9, 6.98, barrado, -3.995, 0.45, 0, { sombra: false });
  caixa(faixa, 0.01, 0.9, 6.98, barrado, 3.995, 0.45, 0, { sombra: false });

  // quadro (verde, com a matéria escrita a giz) e mesa do professor
  const quadro = obj(g, "quadro", 0, 1.55, -3.47);
  caixa(quadro, 3.8, 1.3, 0.04, 0x8a7458, 0, 0, 0);
  const lousa = placa(quadro, 3.65, 1.16, (c, W, Hh) => {
    c.fillStyle = "#2f4a3c";
    c.fillRect(0, 0, W, Hh);
    c.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 9; i++) c.fillRect(W * (0.05 + 0.1 * i), Hh * 0.6, W * 0.06, Hh * 0.05);
    c.font = `600 ${Hh * 0.1}px Inter, Arial`;
    c.fillStyle = "#e9ece6";
    c.textAlign = "left";
    c.fillText("Funções do 1º grau", W * 0.05, Hh * 0.18);
    c.font = `500 ${Hh * 0.085}px Inter, Arial`;
    c.fillText("f(x) = 2x + 3", W * 0.07, Hh * 0.36);
    c.fillText("f(2) = 2·2 + 3 = 7", W * 0.07, Hh * 0.5);
    c.fillText("Exercícios: pág. 74, 1 a 6", W * 0.5, Hh * 0.36);
    c.strokeStyle = "#e9ece6";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(W * 0.55, Hh * 0.88);
    c.lineTo(W * 0.92, Hh * 0.88);
    c.moveTo(W * 0.6, Hh * 0.95);
    c.lineTo(W * 0.6, Hh * 0.52);
    c.moveTo(W * 0.6, Hh * 0.8);
    c.lineTo(W * 0.86, Hh * 0.58);
    c.stroke();
  }, { ppm: 700 });
  lousa.position.z = 0.022;
  caixa(quadro, 3.8, 0.04, 0.1, 0x8a7458, 0, -0.68, 0.05);
  const mesaProf = obj(g, "mesa-professor", -2.3, 0, -2.55);
  caixa(mesaProf, 1.3, 0.04, 0.65, 0x6b5543, 0, 0.76, 0);
  caixa(mesaProf, 1.26, 0.7, 0.04, 0x5a4636, 0, 0.38, -0.3);
  for (const s of [-1, 1]) caixa(mesaProf, 0.04, 0.74, 0.6, 0x5a4636, s * 0.62, 0.37, 0);
  caixa(mesaProf, 0.3, 0.05, 0.22, 0x34495e, 0.3, 0.805, 0.05);
  caixa(mesaProf, 0.26, 0.04, 0.2, 0xc9b98f, 0.31, 0.85, 0.05, { ry: 0.1 });
  cadeiraMadeira(g, "cadeira-professor", -2.3, -3.05, 0, 0x3e4450);
  // relógio digital em cima do quadro (14:05, 14:06, 14:07)
  api.relogio = relogioParede(g, "relogio", ESCOLA.relogio.x, ESCOLA.relogio.y, ESCOLA.relogio.z, 0, false);
  api.relogio.userData.mostrar("14:05");

  // carteiras
  api.carteiras = [];
  ESCOLA.fileiras.forEach((z, f) => ESCOLA.colunas.forEach((x, c) => api.carteiras.push(carteira(g, `carteira-${c}-${f}`, x, z, f % 2 ? 0x8a7458 : 0x917a5d))));
  // mochilas no chão, ao lado de algumas carteiras
  const rm = rng(73);
  ESCOLA.fileiras.forEach((z, f) =>
    ESCOLA.colunas.forEach((x, c) => {
      if (rm() < 0.45) {
        const m = obj(g, "mochila", x - 0.47, 0, z + 0.55, rm() * 2);
        caixa(m, 0.28, 0.36, 0.16, [0x2c3a4a, 0x4a2c2c, 0x2c4a3a, 0x4a4a2c][Math.floor(rm() * 4)], 0, 0.18, 0);
      }
    }),
  );
  // cartazes e mural
  const mural = passavel(obj(g, "mural"));
  const cart = placa(mural, 1.6, 1.0, (c, W, Hh) => {
    c.fillStyle = "#c9b48a";
    c.fillRect(0, 0, W, Hh);
    const r = rng(77);
    for (let i = 0; i < 7; i++) {
      c.fillStyle = ["#f2efe6", "#e6d4a8", "#d8e2ea", "#f0dcd0"][i % 4];
      c.fillRect(W * (0.05 + (i % 4) * 0.23), Hh * (0.08 + Math.floor(i / 4) * 0.46), W * 0.19, Hh * 0.36);
      c.fillStyle = "#5a5d62";
      for (let k = 0; k < 4; k++) c.fillRect(W * (0.07 + (i % 4) * 0.23), Hh * (0.14 + Math.floor(i / 4) * 0.46 + k * 0.06), W * (0.1 + r() * 0.05), Hh * 0.02);
    }
  }, { ppm: 500 });
  cart.rotation.y = Math.PI / 2;
  cart.position.set(-3.99, 1.65, -0.4);

  // janelas e o pátio lá fora; as luzes da ambulância chegam por elas
  furosJ.forEach((f, i) => caixilho(g, "janela-" + i, 3.99, 1.7, -(f.x0 + f.x1) / 2, -Math.PI / 2, 1.5, 1.4));
  const fora = passavel(obj(g, "fora"));
  const ceuF = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.MeshBasicMaterial({ color: 0xc4d4e2, fog: false }));
  ceuF.rotation.y = -Math.PI / 2;
  ceuF.position.set(24, 6, 0);
  fora.add(ceuF);
  caixa(fora, 20, 0.1, 30, 0x8f8b84, 13, -0.3, 0);
  const ra = rng(79);
  for (let i = 0; i < 5; i++) {
    const a = obj(fora, "arvore", 9 + ra() * 6, 0, -9 + i * 4.4);
    cilindro(a, 0.12, 0.16, 2.4, 7, 0x4a3b30, 0, 1.2, 0);
    for (let k = 0; k < 3; k++) {
      const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 + ra() * 0.4, 0), mat(k % 2 ? 0x5d6e54 : 0x52634a));
      copa.position.set((ra() - 0.5) * 1.2, 2.9 + ra() * 0.8, (ra() - 0.5) * 1.2);
      a.add(copa);
    }
  }
  caixa(fora, 1, 3.5, 24, 0x8d8378, 17, 1.75, 0);
  api.sirene = sirene(g, 7.5, 1.6, 0.5, 16);

  // lâmpadas tubulares no teto, spot principal com sombra, sol pelas janelas
  const luminarias = passavel(obj(g, "luminarias"));
  const tubos = [];
  for (const x of [-2, 0, 2]) {
    for (const z of [-1.5, 1.5]) {
      caixa(luminarias, 1.25, 0.05, 0.28, 0xe9e8e4, x, H - 0.03, z);
      const tubo = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.02, 0.18), new THREE.MeshStandardMaterial({ color: 0xe9e8e4, emissive: 0xf4f6ff, emissiveIntensity: 1.2 }));
      tubo.position.set(x, H - 0.065, z);
      luminarias.add(tubo);
      tubos.push(tubo);
    }
  }
  const luzTeto = luzSpot(g, 0xf6f6ff, 26, new THREE.Vector3(0, H - 0.1, 0.4), new THREE.Vector3(0, 0, 0.4), 1.4, 2048, 12);
  const fill = luzPonto(g, 0xf4f4f0, 2.4, 0, 2.4, 1.6, 10, 1.2);
  const fill2 = luzPonto(g, 0xf4f4f0, 1.6, 0, 2.4, -2.2, 9, 1.2);
  const sol = luzSpot(g, 0xffe9c8, 60, new THREE.Vector3(8, 4.5, 0), new THREE.Vector3(0, 0, -0.2), 0.6, 2048, 18);
  const hemi = new THREE.HemisphereLight(0xeef2f6, 0x6a6560, 0.7);
  g.add(hemi);
  api.modo = (nome) => {
    if (nome === api.modoAtual) return;
    api.modoAtual = nome;
    const tarde = nome === "tarde";
    sol.intensity = tarde ? 40 : 60;
    sol.color.setHex(tarde ? 0xffd8a8 : 0xffe9c8);
    ceuF.material.color.setHex(tarde ? 0xd8c8b4 : 0xc4d4e2);
    for (const t of tubos) t.material.emissiveIntensity = 1.2;
    luzTeto.intensity = 26;
    fill.intensity = 2.4;
    fill2.intensity = 1.6;
    hemi.intensity = 0.7;
  };
  api.atualizar = () => {};
  return api;
}

// ------------------------------------------------------------ garagem
// x de -3 a 3, z de -3.2 a 3.2, pé-direito 2.6. O carro velho no meio com a frente para o norte (z -) e o capô
// aberto; bancada com ferramentas na parede oeste, prateleiras e pneus a leste, portão aberto ao sul (noite).
export const GARAGEM = {
  carro: { x: 0, z: 0.4 },
  // ponto do motor (onde as mãos trabalham), na frente do carro
  motor: { x: 0, y: 1.08, z: -1.0 },
};
export function criarGaragem(cena) {
  const g = new THREE.Group();
  g.name = "garagem";
  g.position.copy(DESLOCAMENTO.garagem);
  cena.add(g);
  const H = 2.6;
  const api = { grupo: g, fundo: 0x10141c, nevoa: [0x10141c, 24, 60] };
  const cimento = texturaAzulejo(0x8a8783, 0x7d7a76, { colunas: 2, linhas: 2, semente: 81, ruido: 0.08, chanfro: 0.0 });
  const chao = passavel(obj(g, "chao"));
  caixa(chao, 6.0, 0.1, 6.4, 0xffffff, 0, -0.05, 0, { material: matTextura(cimento, 6, 6.4, 1.5) });
  // manchas de óleo
  for (const [x, z, r] of [[0.3, -0.6, 0.35], [-0.4, 0.8, 0.25], [0.6, 1.6, 0.2]]) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 14), mat(0x55534f));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.002, z);
    chao.add(m);
  }
  const teto = passavel(obj(g, "teto"));
  caixa(teto, 6.0, 0.08, 6.4, 0x9a9792, 0, H + 0.04, 0);
  const tijolo = texturaAzulejo(0x9c8a7a, 0x857566, { colunas: 4, linhas: 8, semente: 83, ruido: 0.1, chanfro: 0.02 });
  paredeTex(g, { w: 6.0, h: H, z: -3.26, tex: tijolo, passo: 1.0, nome: "parede-norte" });
  paredeTex(g, { w: 6.4, h: H, x: -3.06, ry: Math.PI / 2, tex: tijolo, passo: 1.0, nome: "parede-oeste" });
  paredeTex(g, { w: 6.4, h: H, x: 3.06, ry: -Math.PI / 2, tex: tijolo, passo: 1.0, nome: "parede-leste" });
  paredeTex(g, { w: 6.0, h: H, z: 3.26, ry: Math.PI, tex: tijolo, passo: 1.0, furos: [{ x0: -2.2, x1: 2.2, y0: 0, y1: 2.3 }], nome: "parede-sul" });
  // portão de enrolar recolhido em cima
  const portao = passavel(obj(g, "portao"));
  cilindro(portao, 0.2, 0.2, 4.5, 14, 0x5a5c60, 0, 2.42, 3.1, { rz: Math.PI / 2, metal: 0.4, aspereza: 0.5 });

  // o carro velho (bege desbotado), frente para o norte, capô aberto e o motor à mostra
  const carro = obj(g, "carro", GARAGEM.carro.x, 0, GARAGEM.carro.z, Math.PI / 2);
  const c = criarCarro(5, { cor: 0x9a8a6a });
  carro.add(c);
  caixa(carro, 0.12, 0.16, 1.84, 0xb4b6ba, 2.16, 0.5, 0, { metal: 0.6, aspereza: 0.3 });
  caixa(carro, 0.12, 0.16, 1.84, 0xb4b6ba, -2.16, 0.5, 0, { metal: 0.6, aspereza: 0.3 });
  const motor = obj(carro, "motor", 1.5, 0.93, 0);
  caixa(motor, 0.62, 0.24, 0.9, 0x3a3c40, 0, 0.12, 0, { metal: 0.4, aspereza: 0.5 });
  caixa(motor, 0.4, 0.1, 0.6, 0x2a2b2e, 0, 0.29, 0, { metal: 0.4, aspereza: 0.5 });
  cilindro(motor, 0.1, 0.1, 0.06, 12, 0x5a3a2a, 0.0, 0.37, 0.1, { metal: 0.3 });
  caixa(motor, 0.2, 0.18, 0.26, 0x1c1d20, -0.1, 0.09, -0.6);
  caixa(motor, 0.18, 0.04, 0.24, 0xc4161c, -0.1, 0.2, -0.6, { sombra: false });
  for (let i = 0; i < 4; i++) cilindro(motor, 0.025, 0.025, 0.08, 6, 0x8a8b8e, 0.0, 0.33, -0.3 + i * 0.2);
  const dobra = new THREE.Group();
  dobra.position.set(0.98, 0.94, 0);
  carro.add(dobra);
  const capo = new THREE.Group();
  capo.name = "capo";
  dobra.add(capo);
  caixa(capo, 1.15, 0.04, 1.74, 0x9a8a6a, 0.575, 0.0, 0);
  dobra.rotation.z = 1.15;
  // vareta segurando o capô
  cilindro(carro, 0.008, 0.008, 0.72, 5, 0x8a8b8e, 1.95, 1.25, 0.6, { rz: -0.5 });
  api.carro = carro;

  // bancada com morsa, caixa de ferramentas e o painel de ferramentas na parede oeste
  const bancada = obj(g, "bancada", -2.72, 0, -0.8);
  caixa(bancada, 0.6, 0.06, 2.2, 0x6b5543, 0, 0.9, 0);
  for (const z of [-1.0, 1.0]) caixa(bancada, 0.55, 0.87, 0.06, 0x5a4636, 0, 0.435, z);
  caixa(bancada, 0.55, 0.04, 2.1, 0x5a4636, 0, 0.25, 0);
  caixa(bancada, 0.3, 0.2, 0.5, 0xb4161c, 0.05, 1.03, 0.5, { aspereza: 0.6 });
  caixa(bancada, 0.16, 0.12, 0.2, 0x3a3c40, 0.1, 0.99, -0.6, { metal: 0.5, aspereza: 0.4 });
  for (let i = 0; i < 3; i++) cilindro(bancada, 0.08, 0.08, 0.16, 10, [0x6a7a8a, 0x8a6a4a, 0x5a6a5a][i], 0.1, 0.05 + 0.08 + 0.25, -0.6 + i * 0.25);
  const painel = passavel(obj(g, "painel-ferramentas"));
  const pp = placa(painel, 1.8, 0.9, (cc, W, Hh) => {
    cc.fillStyle = "#b9a888";
    cc.fillRect(0, 0, W, Hh);
    cc.fillStyle = "#8a7a60";
    for (let x = 20; x < W; x += 36) for (let y = 20; y < Hh; y += 36) cc.fillRect(x, y, 5, 5);
    cc.fillStyle = "#3a3c40";
    const r = rng(85);
    for (let i = 0; i < 9; i++) {
      const x = W * (0.06 + i * 0.1);
      const comp = Hh * (0.35 + r() * 0.35);
      cc.fillRect(x, Hh * 0.15, W * 0.018, comp);
      cc.beginPath();
      cc.arc(x + W * 0.009, Hh * 0.15, W * 0.022, 0, Math.PI * 2);
      cc.fill();
    }
  }, { ppm: 600 });
  pp.rotation.y = Math.PI / 2;
  pp.position.set(-2.995, 1.55, -0.8);
  // ferramentas penduradas (com volume)
  for (let i = 0; i < 6; i++) caixa(painel, 0.02, 0.24 + 0.03 * i, 0.04, 0x6a6c70, -2.97, 1.55, -1.5 + i * 0.28, { metal: 0.6, aspereza: 0.35 });
  // chave inglesa solta (a cena põe na mão do pai e depois na sua)
  const chave = passavel(obj(g, "chave-inglesa"));
  caixa(chave, 0.03, 0.22, 0.012, 0x9a9ca0, 0, 0, 0, { metal: 0.7, aspereza: 0.3 });
  caixa(chave, 0.06, 0.05, 0.014, 0x9a9ca0, 0, 0.12, 0, { metal: 0.7, aspereza: 0.3 });
  chave.position.set(-2.62, 0.95, -0.2);
  chave.rotation.set(-Math.PI / 2, 0, 0.4);
  api.chave = chave;
  // prateleiras com latas e pneus empilhados (leste)
  const prat = obj(g, "prateleira", 2.78, 0, -1.6);
  for (const y of [0.5, 1.1, 1.7]) caixa(prat, 0.4, 0.03, 1.3, 0x6b6d72, 0, y, 0, { metal: 0.4, aspereza: 0.5 });
  for (const z of [-0.62, 0.62]) caixa(prat, 0.4, 1.9, 0.03, 0x5a5c60, 0, 0.95, z);
  const rl = rng(87);
  for (const y of [0.5, 1.1, 1.7]) for (let i = 0; i < 4; i++) cilindro(prat, 0.08, 0.08, 0.18, 10, [0x9a3a2a, 0x3a5a7a, 0x8a8a7a, 0x5a6a3a][Math.floor(rl() * 4)], 0, y + 0.105, -0.45 + i * 0.3);
  const pneus = obj(g, "pneus", 2.5, 0, 1.9);
  for (let i = 0; i < 3; i++) cilindro(pneus, 0.33, 0.33, 0.2, 14, 0x161618, 0, 0.1 + i * 0.205, 0);

  // lâmpada pendurada sobre a frente do carro e a calha de luz
  const fio = passavel(obj(g, "lampada"));
  cilindro(fio, 0.006, 0.006, 0.55, 4, 0x1a1a1a, 0, H - 0.28, -1.1);
  cilindro(fio, 0.05, 0.04, 0.06, 10, 0x2b2c2f, 0, H - 0.58, -1.1);
  const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }));
  bulbo.position.set(0, H - 0.65, -1.1);
  fio.add(bulbo);
  const luzLampada = luzSpot(g, 0xffe2b0, 30, new THREE.Vector3(0, H - 0.7, -1.1), new THREE.Vector3(0, 0, -0.6), 1.3, 2048, 9);
  const brilhoLampada = luzPonto(g, 0xffe2b0, 3.2, 0, H - 0.75, -1.1, 7, 1.3);
  const fill = luzPonto(g, 0xe8e4dc, 2.4, 0, 2.2, 1.8, 9, 1.3);
  // a rua lá fora (noite): casas do outro lado, poste
  const fora = passavel(obj(g, "fora"));
  caixa(fora, 30, 0.08, 14, 0x2a2c30, 0, -0.04, 10.5);
  criarCasa(fora, 3, { x: -4, z: 16, ry: Math.PI, w: 7, d: 6 });
  criarCasa(fora, 4, { x: 5, z: 16, ry: Math.PI, w: 7, d: 6 });
  criarPoste(fora, 2.8, 8.5, Math.PI);
  const luzRua = luzPonto(g, 0xffc98a, 6, 2.8, 4.5, 8.2, 14, 1.4);
  const hemi = new THREE.HemisphereLight(0x9aa8bc, 0x3a3530, 0.75);
  g.add(hemi);
  api.modo = (nome) => {
    if (nome === api.modoAtual) return;
    api.modoAtual = nome;
    const madrugada = nome === "madrugada";
    luzLampada.intensity = 30;
    brilhoLampada.intensity = 3.2;
    fill.intensity = madrugada ? 2.0 : 2.4;
    hemi.intensity = madrugada ? 0.85 : 1.0;
    luzRua.intensity = 6;
  };
  api.atualizar = () => {};
  return api;
}

// ------------------------------------------------------------ praia
// A linha d'água é z = 0. A areia sobe para +z (y = 0,055·z) e desce para dentro do mar (z < 0); o mar é um
// plano em y = 0 com ondas (atualizar). Entrando até z = -13 a água chega na cintura. A estrada fica em z = 30.
export const PRAIA = {
  areia: (z) => (z > -40 ? 0.055 * z : 0.055 * -40),
  estrada: 30,
};
export function criarPraia(cena) {
  const g = new THREE.Group();
  g.name = "praia";
  g.position.copy(DESLOCAMENTO.praia);
  cena.add(g);
  const api = { grupo: g, fundo: 0xd8dde0, nevoa: [0xd3dadf, 60, 420] };
  // areia: plano subdividido com relevo leve
  const geoA = new THREE.PlaneGeometry(400, 90, 80, 45);
  geoA.rotateX(-Math.PI / 2);
  const pa = geoA.attributes.position;
  const ra = rng(91);
  for (let i = 0; i < pa.count; i++) {
    const z = pa.getZ(i) + 5;
    pa.setZ(i, z);
    const ondulado = z > 1 ? 0.04 * Math.sin(pa.getX(i) * 0.7) * Math.sin(z * 0.9) + (ra() - 0.5) * 0.02 : 0;
    pa.setY(i, PRAIA.areia(z) + ondulado);
  }
  geoA.computeVertexNormals();
  const areia = new THREE.Mesh(geoA, mat(0xd9c9a3));
  areia.receiveShadow = true;
  areia.name = "areia";
  areia.userData.passavel = true;
  g.add(areia);
  // faixa molhada perto da água
  const molhada = new THREE.Mesh(new THREE.PlaneGeometry(400, 3.2), new THREE.MeshLambertMaterial({ color: 0xb7a582, transparent: true, opacity: 0.7 }));
  molhada.rotation.x = -Math.PI / 2 + Math.atan(0.055);
  molhada.position.set(0, 0.09, 1.6);
  molhada.userData.passavel = true;
  g.add(molhada);
  // mar com ondas (vértices animados em atualizar)
  const geoM = new THREE.PlaneGeometry(500, 420, 100, 84);
  geoM.rotateX(-Math.PI / 2);
  geoM.translate(0, 0, -208);
  const base = geoM.attributes.position.array.slice();
  const agua = new THREE.Mesh(geoM, new THREE.MeshStandardMaterial({ color: 0x2f7290, roughness: 0.3, metalness: 0.08, flatShading: true, transparent: true, opacity: 0.93 }));
  agua.receiveShadow = true;
  agua.name = "mar";
  agua.userData.passavel = true;
  g.add(agua);
  // espuma: faixas brancas que vão e voltam na beira
  const espumas = [];
  for (let i = 0; i < 3; i++) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.35 + i * 0.1), new THREE.MeshBasicMaterial({ color: 0xf2f4f2, transparent: true, opacity: 0.8 }));
    e.rotation.x = -Math.PI / 2;
    e.userData.passavel = true;
    g.add(e);
    espumas.push(e);
  }
  // céu, sol baixo, morros nas pontas
  const ceuP = ceu(g, 0x5f93c4, 0xf3dcb4, 560);
  const solDisco = new THREE.Mesh(new THREE.CircleGeometry(16, 32), luzPropria(0xfff1d2));
  solDisco.position.set(-90, 38, -480);
  solDisco.lookAt(0, 2, 0);
  g.add(solDisco);
  for (const [x, z, r, h] of [[-160, -170, 60, 34], [-110, -200, 40, 22], [170, -190, 70, 40], [230, -150, 50, 28]]) {
    const morro = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat(0x5b6e5a));
    morro.scale.set(r, h, r * 0.7);
    morro.position.set(x, -h * 0.3, z);
    g.add(morro);
  }
  // pedras na beira, coqueiros, a estrada e o ponto de ônibus lá atrás
  const rp = rng(93);
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 + rp() * 0.9, 0), mat(0x6d6a66));
    const x = 14 + rp() * 14;
    const z = -2 + rp() * 5;
    p.position.set(x, PRAIA.areia(z) + 0.1, z);
    p.rotation.set(rp() * 3, rp() * 3, 0);
    p.castShadow = true;
    p.name = "pedra";
    g.add(p);
  }
  for (const [x, z, s] of [[-12, 14, 1], [-15, 18, 0.9], [11, 16, 1.1], [24, 20, 0.95]]) {
    const coq = obj(g, "coqueiro", x, PRAIA.areia(z), z);
    for (let k = 0; k < 6; k++) cilindro(coq, 0.15 - k * 0.01, 0.17 - k * 0.01, 1.1, 7, 0x7a6448, 0.12 * k * k * 0.1, 0.55 + k * 1.05, 0, { rz: -0.04 * k });
    for (let k = 0; k < 7; k++) {
      const folha = caixa(coq, 2.4 * s, 0.04, 0.45, 0x4f6b3c, 0, 0, 0);
      folha.geometry.translate(1.2 * s, 0, 0);
      folha.position.set(0.55, 6.6, 0);
      folha.rotation.set(0, (k / 7) * Math.PI * 2, -0.45);
    }
  }
  caixa(g, 400, 0.12, 8, 0x3a3c40, 0, PRAIA.areia(PRAIA.estrada) - 0.02, PRAIA.estrada + 2);
  const calcadao = passavel(obj(g, "calcadao"));
  caixa(calcadao, 400, 0.18, 2.4, 0xb8b1a4, 0, PRAIA.areia(PRAIA.estrada - 1.5), PRAIA.estrada - 1.2);
  const onibus = criarOnibus(7);
  onibus.position.set(-6, PRAIA.areia(PRAIA.estrada) + 0.05, PRAIA.estrada + 1.4);
  g.add(onibus);
  api.onibus = onibus;
  const ponto = obj(g, "ponto", 2, PRAIA.areia(PRAIA.estrada - 1.5) + 0.09, PRAIA.estrada - 1.5);
  for (const x of [-1.2, 1.2]) caixa(ponto, 0.08, 2.4, 0.08, 0x5a5c60, x, 1.2, -0.5);
  caixa(ponto, 2.8, 0.06, 1.2, 0x7a8a96, 0, 2.42, 0, { metal: 0.3, aspereza: 0.4 });
  // luz: sol de fim de tarde e céu
  const sol = new THREE.DirectionalLight(0xfff0d8, 2.6);
  sol.position.set(-40, 50, -60);
  sol.target.position.set(0, 0, 4);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  for (const k of ["left", "bottom"]) sol.shadow.camera[k] = -24;
  for (const k of ["right", "top"]) sol.shadow.camera[k] = 24;
  sol.shadow.camera.far = 200;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.03;
  sol.shadow.radius = 3;
  g.add(sol, sol.target);
  const hemi = new THREE.HemisphereLight(0xcfe0f0, 0xbba98a, 1.1);
  g.add(hemi);
  api.modo = (nome) => {
    if (nome === api.modoAtual) return;
    api.modoAtual = nome;
    const tarde = nome === "tarde";
    sol.intensity = tarde ? 2.3 : 2.7;
    sol.color.setHex(tarde ? 0xffdcb0 : 0xfff0d8);
    ceuP.userData.pintar(tarde ? 0x6a8fbe : 0x5f93c4, tarde ? 0xf6cf9e : 0xf3dcb4);
  };
  api.atualizar = (t) => {
    const p = geoM.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[3 * i];
      const z = base[3 * i + 2];
      const longe = Math.min(1, Math.max(0.25, -z / 30));
      p.setY(i, longe * (0.09 * Math.sin(0.32 * x + 1.1 * t + 0.25 * z) + 0.06 * Math.sin(-0.21 * x + 0.8 * t + 0.4 * z) + 0.05 * Math.sin(0.55 * z - 1.6 * t)));
    }
    p.needsUpdate = true;
    geoM.computeVertexNormals();
    espumas.forEach((e, i) => {
      const f = 0.5 + 0.5 * Math.sin(0.9 * t + i * 2.1);
      const z = 0.3 + 1.5 * f - i * 0.4;
      e.position.set(0, PRAIA.areia(z) + 0.03, z);
      e.material.opacity = 0.75 * (1 - 0.6 * f);
    });
  };
  return api;
}

// ------------------------------------------------------------ casa da Júlia (fachada, fim de tarde)
// A fachada fica em z = 0 voltada para +z; a varanda vai de z = 0 a 1,8 (piso a 0,15 m); a calçada e a rua
// ficam à frente. A porta abre para dentro (dobradiça em x = -0,5) e mostra o corredor aceso.
export const CASAJULIA = { varanda: 0.15, porta: { x: 0, z: 0 } };
export function criarCasaJulia(cena) {
  const g = new THREE.Group();
  g.name = "casaJulia";
  g.position.copy(DESLOCAMENTO.casaJulia);
  cena.add(g);
  const api = { grupo: g, fundo: 0x6a7a92, nevoa: [0x8a8fa0, 30, 140] };
  const V = CASAJULIA.varanda;
  const chao = passavel(obj(g, "chao"));
  caixa(chao, 80, 0.1, 40, 0x4a5a42, 0, -0.05, 10);
  caixa(chao, 80, 0.12, 2.4, 0x9a968e, 0, 0.06, 5.2);
  caixa(chao, 80, 0.08, 8, 0x2e3034, 0, -0.01, 10.5);
  caixa(chao, 1.2, 0.13, 3.2, 0x8a857c, 0, 0.065, 3.4);
  // a casa: parede da frente com porta e janelas acesas, telhado
  const corCasa = 0xd2c3a8;
  const frente = obj(g, "fachada");
  parede(frente, { w: 9, h: 2.9, e: 0.2, cor: corCasa, z: -0.1, furos: [{ x0: -0.5, x1: 0.5, y0: 0, y1: 2.1 }, { x0: -3.4, x1: -1.8, y0: 0.95, y1: 2.15 }, { x0: 1.8, x1: 3.4, y0: 0.95, y1: 2.15 }] });
  parede(frente, { w: 9, h: 2.9, e: 0.2, cor: corCasa, z: -7 });
  parede(frente, { w: 7, h: 2.9, e: 0.2, cor: corCasa, x: -4.5, z: -3.55, ry: Math.PI / 2 });
  parede(frente, { w: 7, h: 2.9, e: 0.2, cor: corCasa, x: 4.5, z: -3.55, ry: Math.PI / 2 });
  telhado(frente, 9.8, 1.8, 7.8, 0x7a4a3a, 0, 2.9, -3.55);
  // dentro: corredor quente que aparece pela porta e pelas janelas
  const dentro = passavel(obj(g, "dentro"));
  caixa(dentro, 8.6, 0.05, 6.6, 0x8a7058, 0, 0.13, -3.55);
  caixa(dentro, 8.6, 2.8, 0.05, 0xe2c9a0, 0, 1.4, -6.85);
  caixa(dentro, 0.05, 2.8, 6.6, 0xd9c09a, -1.6, 1.4, -3.55);
  quadroParede(dentro, 0, 1.6, -6.8, 0, 0.7, 0.5, "#5c4a3a", 13);
  const luzDentro = luzPonto(g, 0xffd29a, 3.5, 0, 2.2, -2.4, 7, 1.4);
  for (const x of [-2.6, 2.6]) {
    const jv = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshStandardMaterial({ color: 0x3a3226, emissive: 0xffd9a0, emissiveIntensity: 0.55, transparent: true, opacity: 0.85 }));
    jv.position.set(x, 1.55, 0.01);
    jv.userData.passavel = true;
    g.add(jv);
    for (const [w, h, y] of [[1.7, 0.06, 2.18], [1.7, 0.08, 0.92]]) caixa(g, w, h, 0.12, 0xf2efe8, x, y, 0.05);
    caixa(g, 0.05, 1.2, 0.1, 0xf2efe8, x, 1.55, 0.05);
  }
  // porta (abre para dentro) com batente
  for (const [w, h, x, y] of [[0.08, 2.15, -0.54, 1.075], [0.08, 2.15, 0.54, 1.075], [1.16, 0.08, 0, 2.14]]) caixa(g, w, h, 0.24, 0xf2efe8, x, y, -0.06);
  const dob = new THREE.Group();
  dob.name = "porta";
  dob.position.set(-0.5, V, -0.08);
  g.add(dob);
  caixa(dob, 1.0, 1.95, 0.05, 0x6a3a2a, 0.5, 0.975, 0);
  cilindro(dob, 0.022, 0.022, 0.08, 8, 0xc9b98f, 0.88, 0.95, 0.05, { rx: Math.PI / 2, metal: 0.6, aspereza: 0.3 });
  api.porta = (ab) => (dob.rotation.y = ab);
  // varanda: piso, degrau, pilares, teto com luz, vaso
  const varanda = passavel(obj(g, "varanda"));
  caixa(varanda, 4.0, V, 1.8, 0x9a8f80, 0, V / 2, 0.9);
  caixa(varanda, 1.6, 0.08, 0.35, 0x9a8f80, 0, 0.04, 1.97);
  caixa(g, 4.2, 0.1, 2.0, 0x6a5a4a, 0, 2.55, 0.95);
  for (const s of [-1, 1]) cilindro(g, 0.07, 0.07, 2.4, 8, 0xf2efe8, s * 1.9, 1.35, 1.75);
  const arandela = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0 }));
  arandela.position.set(0.85, 2.15, 0.06);
  g.add(arandela);
  const luzVaranda = luzPonto(g, 0xffd9a0, 4.5, 0.85, 2.1, 0.5, 6, 1.4);
  planta(g, "vaso", 1.55, 0.4, 17, 0.8).position.y = V;
  // muro baixo e portão, jardim
  const muro = obj(g, "muro");
  for (const [x0, x1] of [[-6, -0.6], [0.6, 6]]) caixa(muro, x1 - x0, 0.6, 0.15, 0xd2c3a8, (x0 + x1) / 2, 0.3, 3.85);
  const rj = rng(97);
  for (let i = 0; i < 8; i++) {
    const a = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + rj() * 0.2, 0), mat(0x52634a));
    a.position.set((rj() < 0.5 ? -1 : 1) * (1.4 + rj() * 3), 0.25, 2.2 + rj() * 1.2);
    a.castShadow = true;
    a.name = "arbusto";
    g.add(a);
  }
  // rua: casas vizinhas, poste, céu de fim de tarde
  criarCasa(g, 8, { x: -11, z: -3, w: 8, d: 7, cor: 0x8a8f96 });
  criarCasa(g, 9, { x: 11, z: -3, w: 8, d: 7, cor: 0x9a8f86 });
  criarCasa(g, 10, { x: -4, z: 22, ry: Math.PI, w: 9, d: 7 });
  criarCasa(g, 11, { x: 8, z: 22, ry: Math.PI, w: 9, d: 7 });
  criarPoste(g, 3.5, 6.6, Math.PI);
  const luzPoste = luzPonto(g, 0xffc98a, 8, 3.5, 5, 6.3, 16, 1.4);
  const ceuC = ceu(g, 0x3b4f74, 0xe0a27a, 400);
  const sol = new THREE.DirectionalLight(0xffc8a0, 1.4);
  sol.position.set(30, 18, 40);
  sol.target.position.set(0, 0, 0);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  for (const k of ["left", "bottom"]) sol.shadow.camera[k] = -14;
  for (const k of ["right", "top"]) sol.shadow.camera[k] = 14;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  sol.shadow.radius = 3;
  g.add(sol, sol.target);
  const hemi = new THREE.HemisphereLight(0xb0bcd6, 0x4a4238, 1.0);
  g.add(hemi);
  api.modo = (nome) => {
    if (nome === api.modoAtual) return;
    api.modoAtual = nome;
    const noite = nome === "noite";
    sol.intensity = noite ? 0.25 : 1.4;
    hemi.intensity = noite ? 0.7 : 1.0;
    ceuC.userData.pintar(noite ? 0x16233a : 0x3b4f74, noite ? 0x4a4f6a : 0xe0a27a);
    luzPoste.intensity = 8;
    luzVaranda.intensity = 4.5;
    luzDentro.intensity = 3.5;
    api.fundo = noite ? 0x1a2236 : 0x6a7a92;
  };
  api.atualizar = () => {};
  return api;
}

// ------------------------------------------------------------ saguão do aeroporto (lotado, parte 6)
// x de -14 a 14, z de -8 a 8, pé-direito 7. Janelão ao norte com a pista e os aviões; painel de voos
// pendurado; balcões de check-in a oeste. A fila (figurantes) fica na cena.
export function criarAeroporto(cena) {
  const g = new THREE.Group();
  g.name = "aeroporto";
  g.position.copy(DESLOCAMENTO.aeroporto);
  cena.add(g);
  const H = 7;
  const api = { grupo: g, fundo: 0xc9d4de, nevoa: [0xc9d4de, 40, 160] };
  const piso = texturaAzulejo(0xc9c6c0, 0xb4b1ab, { colunas: 2, linhas: 2, semente: 101, ruido: 0.03 });
  const chao = passavel(obj(g, "chao"));
  const mp = matTextura(piso, 28, 16, 1.6);
  caixa(chao, 28, 0.1, 16, 0xffffff, 0, -0.05, 0, { material: new THREE.MeshStandardMaterial({ map: mp.map, roughness: 0.35, metalness: 0.05 }) });
  const teto = passavel(obj(g, "teto"));
  caixa(teto, 28, 0.1, 16, 0xe9e8e4, 0, H, 0);
  paredeTex(g, { w: 16, h: H, x: -14.06, ry: Math.PI / 2, cor: 0xd8d4cc, nome: "parede-oeste" });
  paredeTex(g, { w: 16, h: H, x: 14.06, ry: -Math.PI / 2, cor: 0xd8d4cc, nome: "parede-leste" });
  paredeTex(g, { w: 28, h: H, z: 8.06, ry: Math.PI, cor: 0xd8d4cc, nome: "parede-sul" });
  // janelão ao norte (montantes) e a pista lá fora com aviões
  const janelao = obj(g, "janelao");
  caixa(janelao, 28, 0.3, 0.3, 0x5a5d62, 0, 0.15, -8, { metal: 0.4, aspereza: 0.4 });
  caixa(janelao, 28, 0.3, 0.3, 0x5a5d62, 0, H - 0.15, -8, { metal: 0.4, aspereza: 0.4 });
  for (let x = -14; x <= 14; x += 2.8) caixa(janelao, 0.14, H, 0.2, 0x5a5d62, x, H / 2, -8, { metal: 0.4, aspereza: 0.4 });
  caixa(janelao, 28, 0.08, 0.16, 0x5a5d62, 0, 3.6, -8, { metal: 0.4, aspereza: 0.4 });
  const fora = passavel(obj(g, "fora"));
  caixa(fora, 200, 0.1, 80, 0x6a6c70, 0, -0.1, -50);
  for (let i = 0; i < 8; i++) caixa(fora, 6, 0.02, 0.4, 0xe9e8e4, -40 + i * 12, -0.04, -30);
  ceu(fora, 0x7fa2c6, 0xe6d6c0, 300);
  function aviao(x, z, ry, s = 1) {
    const a = obj(fora, "aviao", x, 0, z, ry);
    a.scale.setScalar(s);
    cilindro(a, 1.6, 1.6, 30, 14, 0xe9eaec, 0, 3.2, 0, { rx: Math.PI / 2 });
    cilindro(a, 0.1, 1.6, 4, 14, 0xe9eaec, 0, 3.2, 17, { rx: Math.PI / 2 });
    caixa(a, 30, 0.35, 4.5, 0xd4d6da, 0, 2.6, 1);
    caixa(a, 0.35, 5, 3, 0xc4161c, 0, 6.2, -13.5);
    caixa(a, 10, 0.3, 2.4, 0xd4d6da, 0, 3.6, -13.5);
    for (const s2 of [-1, 1]) cilindro(a, 0.9, 0.9, 3, 12, 0x9a9ca0, s2 * 6, 1.7, 2.5, { rx: Math.PI / 2 });
    return a;
  }
  aviao(-12, -36, 0.4);
  aviao(20, -48, -0.3, 0.9);
  // painel de voos (pendurado, as linhas em vermelho: CANCELADO / LOTADO)
  const painel = obj(g, "painel-voos", 6, 4.6, -3.0);
  caixa(painel, 5.2, 2.0, 0.2, 0x1b1c1f, 0, 0, 0);
  for (const s of [-1, 1]) cilindro(painel, 0.02, 0.02, 1.4, 5, 0x5a5d62, s * 2.2, 1.7, 0);
  const tela = telaCanvas(painel, 5.0, 1.85, { ppm: 380 });
  tela.position.z = 0.101;
  api.painel = tela;
  tela.userData.mostrar("voos", (c, W, Hh) => {
    c.fillStyle = "#0b1626";
    c.fillRect(0, 0, W, Hh);
    c.fillStyle = "#e9e7e3";
    c.font = `800 ${Hh * 0.09}px Montserrat, Arial`;
    c.textAlign = "left";
    c.fillText("PARTIDAS", W * 0.03, Hh * 0.12);
    const voos = [["07:40", "LISBOA", "LOTADO"], ["08:15", "SALVADOR", "LOTADO"], ["08:50", "BUENOS AIRES", "CANCELADO"], ["09:20", "RECIFE", "LOTADO"], ["10:05", "NOVA YORK", "CANCELADO"], ["10:40", "MANAUS", "LOTADO"], ["11:30", "ROMA", "LOTADO"]];
    voos.forEach(([h, d, s], i) => {
      const y = Hh * (0.27 + i * 0.105);
      c.fillStyle = i % 2 ? "#13233a" : "#0f1d31";
      c.fillRect(0, y - Hh * 0.07, W, Hh * 0.1);
      c.font = `700 ${Hh * 0.068}px Inter, Arial`;
      c.fillStyle = "#e9e7e3";
      c.fillText(h, W * 0.03, y);
      c.fillText(d, W * 0.18, y);
      c.fillStyle = "#e3121b";
      c.textAlign = "right";
      c.fillText(s, W * 0.97, y);
      c.textAlign = "left";
    });
  });
  // balcões de check-in a oeste e cordões da fila
  for (let i = 0; i < 4; i++) {
    const b = obj(g, "balcao", -12.6, 0, -4.5 + i * 3);
    caixa(b, 1.2, 1.05, 2.2, 0x6a7a8a, 0, 0.525, 0);
    caixa(b, 1.3, 0.05, 2.3, 0xd9d6cf, 0, 1.075, 0);
    caixa(b, 0.06, 1.2, 1.6, 0x2a3e5a, -0.5, 1.8, 0);
  }
  const fitas = passavel(obj(g, "fitas"));
  for (let i = 0; i < 6; i++) {
    for (let k = 0; k < 4; k++) {
      const x = -9 + k * 3.2;
      const z = -4 + i * 1.6;
      cilindro(fitas, 0.04, 0.12, 0.95, 8, 0x8a8b8e, x, 0.475, z, { metal: 0.6, aspereza: 0.3 });
      if (k < 3) caixa(fitas, 3.2, 0.06, 0.01, 0x2a4a7a, x + 1.6, 0.9, z, { sombra: false });
    }
  }
  // luzes: painéis no teto (claro), sol pelo janelão
  for (let x = -10; x <= 10; x += 5) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: 0xf2f2ee, emissive: 0xffffff, emissiveIntensity: 1.1 }));
    p.position.set(x, H - 0.06, 0);
    g.add(passavel(p));
  }
  const sol = new THREE.DirectionalLight(0xfff0d8, 2.2);
  sol.position.set(-10, 20, -30);
  sol.target.position.set(0, 0, 0);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  for (const k of ["left", "bottom"]) sol.shadow.camera[k] = -18;
  for (const k of ["right", "top"]) sol.shadow.camera[k] = 18;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  sol.shadow.radius = 3;
  g.add(sol, sol.target);
  const fill = luzPonto(g, 0xf4f4f0, 6, 0, 5.5, 2, 26, 1.0);
  const hemi = new THREE.HemisphereLight(0xeef2f6, 0x8a857c, 1.0);
  g.add(hemi);
  api.modo = () => {};
  api.atualizar = () => {};
  return api;
}

// ------------------------------------------------------------ igreja (fachada à noite, fila na escada)
// A fachada fica em z = 0 voltada para +z; a escada desce até a calçada em z = 3; a rua em z = 5 a 12.
export function criarIgreja(cena) {
  const g = new THREE.Group();
  g.name = "igreja";
  g.position.copy(DESLOCAMENTO.igreja);
  cena.add(g);
  const api = { grupo: g, fundo: 0x1c2638, nevoa: [0x2a3448, 40, 160] };
  const chao = passavel(obj(g, "chao"));
  caixa(chao, 80, 0.1, 50, 0x3a3c40, 0, -0.05, 10);
  caixa(chao, 80, 0.14, 3, 0x8a867e, 0, 0.07, 3.6);
  // escadaria (3 degraus de 0,15) e adro
  const escada = passavel(obj(g, "escada"));
  for (let i = 0; i < 3; i++) caixa(escada, 9 - i * 0.6, 0.15, 2.4 - i * 0.6, 0xa8a49c, 0, 0.075 + i * 0.15, 1.2 - i * 0.3 + 0.0);
  // fachada branca, frontão, torre com o sino e a cruz
  const corIg = 0xe0dbd0;
  const fach = obj(g, "fachada");
  parede(fach, { w: 10, h: 8, e: 0.4, cor: corIg, z: -0.2, furos: [{ x0: -1.1, x1: 1.1, y0: 0.45, y1: 3.8 }, { x0: -3.6, x1: -2.6, y0: 3.2, y1: 5.4 }, { x0: 2.6, x1: 3.6, y0: 3.2, y1: 5.4 }] });
  telhado(fach, 10.6, 3.0, 0.6, corIg, 0, 8, -0.2);
  caixa(fach, 10.4, 0.25, 0.6, 0xc9c3b6, 0, 8.0, -0.15);
  const rosacea = new THREE.Mesh(new THREE.CircleGeometry(0.75, 20), new THREE.MeshStandardMaterial({ color: 0x5a3a2a, emissive: 0xffc070, emissiveIntensity: 0.6 }));
  rosacea.position.set(0, 6.5, 0.02);
  fach.add(rosacea);
  const torre = obj(g, "torre", 4.2, 0, -1.6);
  caixa(torre, 2.2, 13, 2.2, corIg, 0, 6.5, 0);
  caixa(torre, 2.5, 0.25, 2.5, 0xc9c3b6, 0, 13.1, 0);
  const vaoSino = caixa(torre, 1.2, 1.6, 0.05, 0x1a1c20, 0, 11.4, 1.11, { sombra: false });
  const sino = new THREE.Group();
  sino.position.set(0, 12.1, 1.0);
  torre.add(sino);
  cilindro(sino, 0.18, 0.42, 0.6, 12, 0xb08a3a, 0, -0.35, 0, { metal: 0.7, aspereza: 0.35 });
  api.sino = sino;
  const pir = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 4), mat(0x7a4a3a));
  pir.position.set(0, 14.7, 0);
  pir.rotation.y = Math.PI / 4;
  torre.add(pir);
  caixa(torre, 0.12, 1.2, 0.12, 0xe9e7e3, 0, 16.7, 0);
  caixa(torre, 0.6, 0.12, 0.12, 0xe9e7e3, 0, 16.9, 0);
  // porta aberta com a luz quente lá dentro
  const dentro = passavel(obj(g, "dentro"));
  caixa(dentro, 9.4, 0.1, 14, 0x6a5040, 0, 0.45, -7.2);
  caixa(dentro, 9.4, 7.5, 0.1, 0xe8d0a8, 0, 4, -14);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) caixa(dentro, 3.2, 0.5, 0.5, 0x5a3a2a, s * 2.4, 0.75, -2.5 - i * 1.6);
  const luzDentro = luzPonto(g, 0xffcf8a, 8, 0, 3, -3, 14, 1.2);
  for (const s of [-1, 1]) {
    const folha = obj(g, "porta-igreja", s * 1.1, 0.45, -0.25, s * -1.3);
    caixa(folha, 1.1, 3.35, 0.08, 0x5a3424, -s * 0.55, 1.675, 0);
  }
  // postes e as árvores da praça
  criarPoste(g, -6, 4.6, Math.PI);
  criarPoste(g, 6, 4.6, Math.PI);
  const luzPostes = [luzPonto(g, 0xffc98a, 10, -6, 5, 4.3, 16, 1.3), luzPonto(g, 0xffc98a, 10, 6, 5, 4.3, 16, 1.3)];
  criarCasa(g, 12, { x: -15, z: -2, w: 8, d: 7, cor: 0x7a7f88 });
  criarCasa(g, 13, { x: 16, z: -2, w: 8, d: 7, cor: 0x8a8378 });
  const ceuI = ceu(g, 0x111b2e, 0x3a4766, 400);
  const hemi = new THREE.HemisphereLight(0x9aa8c8, 0x3a3530, 1.0);
  g.add(hemi);
  const lua = new THREE.DirectionalLight(0x9ab0d8, 0.9);
  lua.position.set(-20, 30, 30);
  lua.castShadow = true;
  lua.shadow.mapSize.set(2048, 2048);
  for (const k of ["left", "bottom"]) lua.shadow.camera[k] = -16;
  for (const k of ["right", "top"]) lua.shadow.camera[k] = 16;
  lua.shadow.radius = 3;
  lua.shadow.normalBias = 0.02;
  g.add(lua, lua.target);
  const fachadaLuz = luzSpot(g, 0xf2e6d0, 40, new THREE.Vector3(0, 0.5, 9), new THREE.Vector3(0, 4.5, 0), 0.7, 1024, 24);
  api.modo = () => {};
  api.atualizar = (t) => {
    sino.rotation.x = 0.35 * Math.sin(t * 2.2);
  };
  void ceuI;
  void luzPostes;
  void luzDentro;
  void vaoSino;
  void fachadaLuz;
  return api;
}

// ------------------------------------------------------------ rua de casas à noite (parte 1)
// Rua ao longo de x, casas dos dois lados (frentes para a rua), prédios atrás; as janelas acendem uma a uma
// com a luz azulada de celular às 3:33 (acender(nível)).
export function criarNoite(cena) {
  const g = new THREE.Group();
  g.name = "noite";
  g.position.copy(DESLOCAMENTO.noite);
  cena.add(g);
  const api = { grupo: g, fundo: 0x2c3d60, nevoa: [0x3a4b6e, 50, 260] };
  const chao = passavel(obj(g, "chao"));
  caixa(chao, 300, 0.1, 300, 0x5a6c52, 0, -0.06, 0);
  caixa(chao, 300, 0.06, 8, 0x3c3f46, 0, 0.0, 0);
  for (let x = -140; x < 140; x += 6) caixa(chao, 3, 0.01, 0.15, 0x8a8b8e, x, 0.035, 0, { sombra: false });
  for (const s of [-1, 1]) caixa(chao, 300, 0.14, 2.2, 0x6a6a68, 0, 0.07, s * 5.1);
  // casas dos dois lados, com janelas que acendem (planos emissivos por cima das janelas escuras)
  const r = rng(111);
  const janelasCasa = [];
  for (let i = 0; i < 9; i++) {
    for (const s of [-1, 1]) {
      const x = -48 + i * 12 + (s > 0 ? 6 : 0);
      const z = s * 12;
      const andares = r() < 0.35 ? 2 : 1;
      criarCasa(g, 200 + i * 2 + (s > 0 ? 1 : 0), { x, z, ry: s > 0 ? Math.PI : 0, w: 9, d: 7, andares, cor: [0x737884, 0x857d70, 0x6a7680, 0x7d7a86][(i + (s > 0 ? 1 : 0)) % 4], telhado: [0x4a3a34, 0x3a3e46, 0x554038][i % 3] });
      const nJ = andares > 1 ? 5 : 2;
      for (let k = 0; k < nJ; k++) {
        const jx = [-2.7, 2.7, -2.7, 0, 2.7][k];
        const jy = k < 2 ? 1.65 : 4.65;
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2), new THREE.MeshBasicMaterial({ color: 0xa9c6ff, transparent: true, opacity: 0 }));
        pl.position.set(x + (s > 0 ? -jx : jx), jy, z + s * -3.53);
        pl.rotation.y = s > 0 ? Math.PI : 0;
        pl.userData.passavel = true;
        g.add(pl);
        janelasCasa.push({ m: pl, u: r(), x: x + (s > 0 ? -jx : jx) });
      }
    }
  }
  // prédios ao fundo (cidade): grade de janelas em lote
  const jan = new Janelas(g, 0x15171b);
  for (let i = 0; i < 16; i++) {
    const w = 10 + r() * 8;
    const h = 22 + r() * 40;
    criarPredio(g, jan, { x: -120 + i * 16, z: -70 - r() * 30, w, h, d: 10, cor: [0x4e5462, 0x5a5e6a, 0x464c58][i % 3], caixaDagua: r() < 0.4 });
  }
  jan.fechar();
  jan.luz.material.color.setHex(0xa9c6ff);
  // postes
  const luzes = [];
  for (let i = 0; i < 6; i++) {
    const x = -40 + i * 16;
    criarPoste(g, x, 6.2, Math.PI);
    luzes.push(luzPonto(g, 0xffc98a, 16, x, 4.8, 5.9, 20, 1.2));
  }
  const ceuN = ceu(g, 0x1d2f55, 0x6a7ca6, 500);
  const lua = new THREE.Mesh(new THREE.CircleGeometry(5, 24), luzPropria(0xe8ecf2));
  lua.position.set(60, 90, -300);
  lua.lookAt(0, 0, 0);
  g.add(lua);
  const luar = new THREE.DirectionalLight(0xa9c0e8, 3.4);
  luar.position.set(30, 60, -40);
  luar.castShadow = true;
  luar.shadow.mapSize.set(2048, 2048);
  for (const k of ["left", "bottom"]) luar.shadow.camera[k] = -40;
  for (const k of ["right", "top"]) luar.shadow.camera[k] = 40;
  luar.shadow.radius = 3;
  luar.shadow.normalBias = 0.02;
  g.add(luar, luar.target);
  const hemi = new THREE.HemisphereLight(0xa6b8e2, 0x4a4c52, 2.9);
  g.add(hemi);
  // nível 0..1: fração das janelas acesas; cada janela tem o seu limiar (onda que corre ao longo da rua)
  api.acender = (nivel, onda = 0) => {
    for (const j of janelasCasa) {
      const limiar = j.u * 0.6 + 0.4 * ((j.x + 50) / 110) * onda;
      j.m.material.opacity = Math.max(0, Math.min(1, (nivel - limiar) * 6)) * 0.95;
    }
    jan.acender(nivel);
  };
  api.acender(0);
  api.modo = () => {};
  api.atualizar = () => {};
  void ceuN;
  void luzes;
  return api;
}
