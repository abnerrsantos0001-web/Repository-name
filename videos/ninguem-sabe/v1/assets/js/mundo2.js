// Cenários das partes 2 a 11, no mesmo estilo low-poly de mundo.js:
// o térreo da casa, o shopping, a concessionária, a escadaria do prédio e o apartamento da mulher.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
import { COR, DESLOCAMENTO, mat, luzPropria, caixa, cilindro, parede, criarCarro, criarRelogio, luzSol, aplicarLuz, rng } from "./mundo.js";

function grupo(cena, nome) {
  const g = new THREE.Group();
  g.position.copy(DESLOCAMENTO[nome]);
  cena.add(g);
  return g;
}

function cadeira(pai, x, z, ry, cor = COR.madeira) {
  const c = new THREE.Group();
  c.position.set(x, 0, z);
  c.rotation.y = ry;
  caixa(c, 0.44, 0.05, 0.44, cor, 0, 0.46, 0);
  caixa(c, 0.44, 0.5, 0.05, cor, 0, 0.72, -0.2);
  for (const [a, b] of [[0.19, 0.19], [-0.19, 0.19], [0.19, -0.19], [-0.19, -0.19]]) caixa(c, 0.04, 0.46, 0.04, cor, a, 0.23, b);
  pai.add(c);
  return c;
}

// texto pintado num plano (placas, números de andar, cardápios)
function placa(pai, w, h, desenhar, o = {}) {
  const tela = document.createElement("canvas");
  tela.width = Math.round(256 * w);
  tela.height = Math.round(256 * h);
  const tex = new THREE.CanvasTexture(tela);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), o.propria ? new THREE.MeshBasicMaterial({ map: tex, transparent: !!o.transparente }) : new THREE.MeshStandardMaterial({ map: tex, transparent: !!o.transparente, roughness: 0.9 }));
  pai.add(m);
  m.userData.redesenhar = (...a) => {
    const c = tela.getContext("2d");
    c.clearRect(0, 0, tela.width, tela.height);
    desenhar(c, tela.width, tela.height, ...a);
    tex.needsUpdate = true;
  };
  m.userData.redesenhar();
  return m;
}

// ------------------------------------------------------------ térreo da casa
// Sala e cozinha: x de -4 a 4, z de -3.5 a 3.5, pé-direito 2.7. Escada sobe junto da parede x- rumo a z-.
export function criarTerreo(cena) {
  const g = grupo(cena, "terreo");
  const H = 2.7;
  caixa(g, 8.2, 0.1, 7.2, COR.piso, 0, -0.05, 0);
  // teto com o vão da escada
  caixa(g, 6.8, 0.1, 7.2, 0x2a2b2e, 0.7, H + 0.05, 0);
  caixa(g, 1.4, 0.1, 3.5, 0x2a2b2e, -3.3, H + 0.05, 1.75);
  parede(g, { w: 8.2, h: H, cor: COR.paredeQuarto, z: -3.6 });
  parede(g, { w: 8.2, h: H, cor: COR.paredeQuarto, z: 3.6, furos: [{ x0: 1.4, x1: 2.4, y0: 0, y1: 2.15 }] });
  parede(g, { w: 7.2, h: H, cor: COR.paredeQuarto, x: -4.1, ry: Math.PI / 2 });
  parede(g, { w: 7.2, h: H, cor: COR.paredeQuarto, x: 4.1, ry: Math.PI / 2, furos: [{ x0: -0.6, x1: 1.2, y0: 0.95, y1: 2.1 }] });
  const matFora = new THREE.MeshBasicMaterial({ color: 0x8d9196, fog: false });
  const fora = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), matFora);
  fora.position.set(6.5, 1.6, -0.3);
  fora.rotation.y = -Math.PI / 2;
  g.add(fora);
  caixa(g, 0.14, 0.08, 1.9, 0x5a5c60, 4.08, 0.95, -0.3);
  caixa(g, 0.14, 0.08, 1.9, 0x5a5c60, 4.08, 2.1, -0.3);

  // escada: 14 degraus de 0.19 m subindo rumo a z-
  for (let i = 0; i < 14; i++) {
    const h = 0.19 * (i + 1);
    caixa(g, 1.0, h, 0.35, 0x2f2b28, -3.55, h / 2, 2.2 - i * 0.35);
  }
  for (let i = 0; i <= 7; i++) cilindro(g, 0.025, 0.025, 0.9, 5, 0x4a4542, -3.02, 0.19 * (i * 2 + 1) + 0.45, 2.2 - i * 0.7);
  const corrimao = caixa(g, 0.05, 0.05, 5.2, 0x4a4542, -3.02, 1.85, -0.25, { rx: -Math.atan2(2.66, 4.9) });
  corrimao.position.y = 0.19 * 7 + 0.9;

  // cozinha
  caixa(g, 4.2, 0.9, 0.62, 0x34363a, 1.6, 0.45, -3.25);
  caixa(g, 4.3, 0.05, 0.66, 0x55575c, 1.6, 0.92, -3.25);
  caixa(g, 4.2, 0.7, 0.36, 0x2c2e32, 1.6, 2.0, -3.4);
  caixa(g, 0.8, 1.9, 0.7, 0x6a6c70, 3.55, 0.95, -3.2);
  caixa(g, 0.5, 0.04, 0.36, 0x1e1f22, 0.9, 0.94, -3.25);
  // mesa com quatro cadeiras; uma delas "sai do lugar" na parte 5
  caixa(g, 1.5, 0.06, 0.95, COR.madeira, 0.9, 0.76, 0.3);
  for (const [a, b] of [[0.65, 0.4], [-0.65, 0.4], [0.65, -0.4], [-0.65, -0.4]]) caixa(g, 0.06, 0.74, 0.06, COR.madeira, 0.9 + a, 0.37, 0.3 + b);
  cadeira(g, 0.5, -0.45, 0);
  cadeira(g, 1.3, -0.45, 0);
  cadeira(g, 0.5, 1.05, Math.PI);
  const cadeiraSolta = cadeira(g, 1.3, 1.05, Math.PI);
  // café de ontem: xícara, pires, garrafa térmica
  const xicara = new THREE.Group();
  xicara.position.set(0.62, 0.79, 0.18);
  // xícara aberta (parede dupla), para ver de cima se está cheia ou vazia
  const corpoXicara = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 14, 1, true), mat(0xb8b8b2, { lado: THREE.DoubleSide }));
  corpoXicara.position.y = 0.045;
  corpoXicara.castShadow = true;
  xicara.add(corpoXicara);
  cilindro(xicara, 0.04, 0.04, 0.006, 14, 0xa8a8a2, 0, 0.003, 0);
  const alca = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 5, 10), mat(0xb8b8b2));
  alca.position.set(0.055, 0.05, 0);
  xicara.add(alca);
  const cafe = cilindro(xicara, 0.044, 0.044, 0.005, 12, 0x2e1d12, 0, 0.083, 0, { sombra: false });
  const fundoVazio = cilindro(xicara, 0.03, 0.03, 0.003, 12, 0x7a6658, 0, 0.008, 0, { sombra: false });
  fundoVazio.visible = false;
  cilindro(xicara, 0.075, 0.075, 0.008, 14, 0xb8b8b2, 0, 0.004, 0);
  g.add(xicara);
  cilindro(g, 0.06, 0.07, 0.3, 10, 0x2a2b2e, 1.2, 0.94, 0.12);
  caixa(g, 0.3, 0.02, 0.22, 0xc9c6bf, 1.0, 0.8, 0.45);
  // porta da frente (vermelho-escura, como vista de fora) com ferrolho
  const dobPorta = new THREE.Group();
  dobPorta.position.set(1.4, 0, 3.55);
  caixa(dobPorta, 1.0, 2.13, 0.06, COR.vermelhoEscuro, 0.5, 1.065, 0);
  const ferrolho = caixa(dobPorta, 0.16, 0.04, 0.04, 0x9a9b9e, 0.8, 1.15, -0.06, { sombra: false });
  caixa(dobPorta, 0.04, 0.08, 0.05, 0x9a9b9e, 0.85, 1.05, -0.06, { sombra: false });
  g.add(dobPorta);
  caixa(g, 0.1, 0.1, 0.05, 0x9a9b9e, 2.36, 1.15, 3.5, { sombra: false });
  // sofá e quadro na sala
  caixa(g, 2.0, 0.42, 0.85, 0x3a3c41, -0.8, 0.21, 2.9);
  caixa(g, 2.0, 0.5, 0.2, 0x3a3c41, -0.8, 0.62, 3.25);
  caixa(g, 0.9, 0.6, 0.03, 0x1b1c1f, 2.5, 1.7, -3.55);
  // luminária sobre a mesa
  cilindro(g, 0.005, 0.005, 0.9, 4, 0x2a2b2e, 0.9, 2.25, 0.3, { sombra: false });
  const cupula = cilindro(g, 0.08, 0.28, 0.2, 10, 0x2a2b2e, 0.9, 1.75, 0.3);

  const sol = luzSol(g, 0xb4bac3, 3.4, new THREE.Vector3(9, 4.5, -0.3), new THREE.Vector3(0, 0.5, 0), 6, 1024, 0.8);
  const hemi = new THREE.HemisphereLight(0x80858d, 0x1c1c1c, 2.2);
  g.add(hemi);
  const lampada = new THREE.PointLight(0xf2e2c4, 0, 7, 2);
  lampada.position.set(0.9, 1.6, 0.3);
  g.add(lampada);
  const preench = new THREE.PointLight(0xa0a6ae, 3, 9, 2);
  preench.position.set(-1, 2.3, 1.5);
  g.add(preench);

  const MODOS = {
    dia: { sol: [3.4, 0xb4bac3], hemi: [2.2, 0x80858d, 0x1c1c1c], preench: [3, 0xa0a6ae], matFora: 0x8d9196 },
    noite: { sol: [0.9, 0x55627e], hemi: [0.7, 0x3a4256, 0x08080a], preench: [0.6, 0x5d6678], matFora: 0x12151b },
    manha: { sol: [6, 0xf0e6d4], hemi: [3.0, 0xb6b4b0, 0x2a2826], preench: [4, 0xd8d4cc], matFora: 0xe2e4e8 },
  };
  const ret = {
    grupo: g,
    fundo: 0x0c0d0f,
    nevoa: [0x0c0d0f, 10, 40],
    xicara,
    cadeiraSolta,
    modo(nome) {
      if (nome === ret.modoAtual) return;
      ret.modoAtual = nome;
      aplicarLuz({ sol, hemi, preench, matFora }, MODOS[nome] || MODOS.dia);
    },
    cafe(cheio) {
      cafe.visible = cheio;
      fundoVazio.visible = !cheio;
    },
    lampada(nivel) {
      lampada.intensity = 6 * nivel;
      cupula.material = nivel > 0.5 ? luzPropria(0x8a7a5e) : mat(0x2a2b2e);
    },
    porta(abertura) {
      dobPorta.rotation.y = -abertura;
    },
    trancar(k) {
      ferrolho.position.x = 0.8 + 0.12 * k;
    },
    cadeiraFora(k) {
      cadeiraSolta.position.set(1.3 + 0.9 * k, 0, 1.05 + 0.5 * k);
      cadeiraSolta.rotation.y = Math.PI + 1.1 * k;
    },
    atualizar() {},
  };
  return ret;
}

// ------------------------------------------------------------ shopping vazio, tudo aceso
// Corredor ao longo de z (de 30 a -40), x de -6 a 6, pé-direito 7. Praça de alimentação no fim (z < -18).
export function criarShopping(cena) {
  const g = grupo(cena, "shopping");
  const r = rng(303);
  caixa(g, 40, 0.1, 80, 0xb4b7bc, 0, -0.05, -5, { aspereza: 0.35, metal: 0.05 });
  for (let z = 30; z > -40; z -= 2) caixa(g, 12, 0.012, 0.03, 0x9a9da2, 0, 0.004, z, { sombra: false });
  for (let x = -6; x <= 6; x += 2) caixa(g, 0.03, 0.012, 48, 0x9a9da2, x, 0.004, 6, { sombra: false });
  caixa(g, 40, 0.2, 80, 0xd8d9dc, 0, 7.1, -5, { sombra: false });
  for (const x of [-3, 0, 3]) caixa(g, 0.5, 0.04, 66, 0xf6f4ee, x, 6.98, -5, { material: luzPropria(0xf6f4ee), sombra: false });

  // lojas dos dois lados: vitrine, fundo iluminado, letreiro claro
  const lojas = [];
  for (const s of [1, -1]) {
    for (let z0 = 28; z0 > -16; z0 -= 9) {
      const loja = new THREE.Group();
      loja.position.set(s * 6, 0, z0 - 4.5);
      loja.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      caixa(loja, 9, 7, 0.4, 0x8a8d92, 0, 3.5, -6);
      caixa(loja, 0.4, 7, 6, 0x8a8d92, -4.5, 3.5, -3);
      caixa(loja, 0.4, 7, 6, 0x8a8d92, 4.5, 3.5, -3);
      caixa(loja, 9, 0.1, 6, 0xc8cacd, 0, 0.0, -3, { sombra: false });
      caixa(loja, 8.6, 3.2, 0.1, 0xe9e8e4, 0, 1.9, -5.7, { material: luzPropria(0xe9e8e4), sombra: false });
      caixa(loja, 9, 1.3, 0.3, 0x2d2f33, 0, 4.5, 0);
      caixa(loja, 4 + r() * 3, 0.6, 0.06, 0xf0efeb, 0, 4.5, 0.17, { material: luzPropria(0xf0efeb), sombra: false });
      for (const x of [-4.4, 4.4]) caixa(loja, 0.2, 3.85, 0.25, 0x2d2f33, x, 1.92, 0);
      for (let i = 0; i < 3; i++) caixa(loja, 1.6, 0.9 + r(), 0.6, 0x5a5c61 + Math.floor(r() * 3) * 0x101010, -3 + i * 3, 0.5, -4.5);
      g.add(loja);
      lojas.push(loja);
    }
  }
  // loja de tênis (esquerda, primeira): prateleiras e o tênis vermelho no pedestal
  const tenisLoja = lojas[5];
  for (let y = 0.8; y < 3.4; y += 0.6) {
    caixa(tenisLoja, 7.6, 0.05, 0.4, 0xd8d9dc, 0, y, -5.4);
    for (let x = -3.4; x <= 3.4; x += 0.6) caixa(tenisLoja, 0.28, 0.12, 0.16, [0x3a3c40, 0xd0d1d4, 0x6a6c70][Math.floor(r() * 3)], x, y + 0.09, -5.35);
  }
  const tenis = new THREE.Group();
  caixa(tenis, 0.14, 0.04, 0.34, 0xeeeeea, 0, 0.02, 0);
  caixa(tenis, 0.13, 0.11, 0.24, COR.vermelho, 0, 0.09, -0.04);
  caixa(tenis, 0.12, 0.06, 0.12, COR.vermelho, 0, 0.06, 0.12, { rx: 0.4 });
  caixa(tenis, 0.135, 0.02, 0.2, 0xeeeeea, 0, 0.11, -0.03);
  const pedestal = new THREE.Group();
  cilindro(pedestal, 0.35, 0.4, 1.0, 10, 0xe2e3e6, 0, 0.5, 0);
  tenis.position.set(0, 1.02, 0);
  tenis.rotation.y = 0.6;
  pedestal.add(tenis);
  pedestal.position.set(-4.2, 0, 21);
  g.add(pedestal);
  // loja de celulares (direita, segunda): mesas e a vitrine de vidro com o celular mais caro
  const vitrine = new THREE.Group();
  vitrine.position.set(4.3, 0, 14.5);
  caixa(vitrine, 0.7, 1.0, 0.7, 0x2d2f33, 0, 0.5, 0);
  caixa(vitrine, 0.7, 0.7, 0.7, 0xc8d0d8, 0, 1.36, 0, { opacidade: 0.18, aspereza: 0.05, sombra: false });
  const celVitrine = new THREE.Group();
  caixa(celVitrine, 0.09, 0.18, 0.012, 0x16171a, 0, 0, 0, { aspereza: 0.3, metal: 0.4 });
  caixa(celVitrine, 0.08, 0.165, 0.002, 0x6a7f9f, 0, 0, 0.007, { material: luzPropria(0x6a7f9f), sombra: false });
  celVitrine.position.set(0, 1.2, 0);
  celVitrine.rotation.set(-0.15, -0.5, 0);
  vitrine.add(celVitrine);
  caixa(vitrine, 0.18, 0.06, 0.005, 0xf0efeb, 0.15, 1.03, 0.36, { material: luzPropria(0xf0efeb), sombra: false });
  g.add(vitrine);

  // praça de alimentação: balcões, mesas redondas e uma bandeja servida
  for (let i = 0; i < 4; i++) {
    const x = -15 + i * 10;
    caixa(g, 7, 1.1, 1.2, 0x5a5c61, x, 0.55, -39);
    caixa(g, 7, 1.6, 0.1, 0xeeede9, x, 3.6, -39.5, { material: luzPropria(0xeeede9), sombra: false });
    caixa(g, 7, 7, 0.3, 0x8a8d92, x, 3.5, -40.2);
  }
  const mesas = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const x = -9 + i * 6;
      const z = -22 - j * 5.5;
      cilindro(g, 0.5, 0.5, 0.05, 12, 0xd8d9dc, x, 0.76, z);
      cilindro(g, 0.05, 0.05, 0.74, 6, 0x5a5c61, x, 0.37, z);
      for (let k = 0; k < 4; k++) cadeira(g, x + Math.cos((k * Math.PI) / 2) * 0.8, z + Math.sin((k * Math.PI) / 2) * 0.8, -(k * Math.PI) / 2 - Math.PI / 2, 0x4a4c51);
      mesas.push([x, z]);
    }
  }
  const bandeja = new THREE.Group();
  caixa(bandeja, 0.5, 0.02, 0.36, 0x3a3c41, 0, 0.01, 0);
  cilindro(bandeja, 0.08, 0.09, 0.04, 10, 0xc8a46e, -0.1, 0.04, 0);
  cilindro(bandeja, 0.085, 0.085, 0.025, 10, 0x4a2e1e, -0.1, 0.07, 0);
  cilindro(bandeja, 0.08, 0.07, 0.04, 10, 0xc8a46e, -0.1, 0.1, 0);
  caixa(bandeja, 0.08, 0.1, 0.06, COR.vermelho, 0.12, 0.07, -0.08);
  for (let k = 0; k < 5; k++) caixa(bandeja, 0.012, 0.07, 0.012, 0xd8b45a, 0.1 + k * 0.012, 0.15, -0.08);
  cilindro(bandeja, 0.04, 0.035, 0.16, 10, COR.vermelho, 0.15, 0.1, 0.09);
  bandeja.position.set(-3, 0.79, -22);
  g.add(bandeja);

  g.add(new THREE.HemisphereLight(0xecebe7, 0x5a5a5a, 3.0));
  luzSol(g, 0xf4f2ec, 1.4, new THREE.Vector3(8, 30, 10), new THREE.Vector3(0, 0, 0), 40, 2048, 0.45);
  for (const z of [20, 0, -25]) {
    const l = new THREE.PointLight(0xfff2dc, 30, 26, 1.6);
    l.position.set(0, 6.2, z);
    g.add(l);
  }
  return { grupo: g, fundo: 0xd8d9dc, nevoa: [0xd8d9dc, 40, 140], tenis: pedestal, vitrine, bandeja, atualizar() {} };
}

// ------------------------------------------------------------ concessionária
// Salão x de -12 a 12, z de -8 a 8, vidro na frente (z+). O carro vermelho no meio, a chave no quadro.
export function criarConcessionaria(cena) {
  const g = grupo(cena, "concessionaria");
  caixa(g, 26, 0.1, 18, 0x2a2c30, 0, -0.05, 0, { aspereza: 0.3, metal: 0.1 });
  for (let x = -12; x <= 12; x += 3) caixa(g, 0.03, 0.012, 16, 0x3a3c40, x, 0.004, 0, { sombra: false });
  caixa(g, 26, 0.2, 18, 0x3a3b3e, 0, 6.1, 0, { sombra: false });
  for (const x of [-8, 0, 8]) caixa(g, 1.2, 0.05, 12, 0xf2f1ec, x, 5.98, 0, { material: luzPropria(0xf2f1ec), sombra: false });
  parede(g, { w: 26, h: 6, cor: 0x3a3c40, z: -9 });
  parede(g, { w: 18, h: 6, cor: 0x3a3c40, x: -13, ry: Math.PI / 2 });
  parede(g, { w: 18, h: 6, cor: 0x3a3c40, x: 13, ry: Math.PI / 2 });
  caixa(g, 14, 2.2, 0.08, 0xdedcd6, 0, 3.6, -8.9, { material: luzPropria(0xdedcd6), sombra: false });
  for (let x = -12; x <= 12; x += 4) caixa(g, 0.15, 6, 0.15, 0x26282b, x, 3, 9);
  caixa(g, 26, 6, 0.04, 0x9aa3ad, 0, 3, 9, { opacidade: 0.15, aspereza: 0.05, sombra: false });
  const fora = new THREE.Mesh(new THREE.PlaneGeometry(80, 20), new THREE.MeshBasicMaterial({ color: 0x8d9196, fog: false }));
  fora.position.set(0, 6, 24);
  fora.rotation.y = Math.PI;
  g.add(fora);
  // carros em exposição
  const carros = [];
  for (const [x, z, cor, ry] of [[-7.5, -1.5, 0x55575c, 0.5], [0, 0.5, COR.vermelho, -0.35], [7.5, -1.5, 0xc9cacd, -0.5]]) {
    cilindro(g, 3.0, 3.0, 0.12, 20, 0x45474c, x, 0.06, z);
    const c = criarCarro(51 + carros.length, { cor });
    c.position.set(x, 0.12, z);
    c.rotation.y = ry;
    g.add(c);
    carros.push(c);
  }
  const vermelho = carros[1];
  // quadro de chaves na parede (a chave do carro vermelho tem chaveiro vermelho)
  caixa(g, 1.6, 1.0, 0.06, 0x2c2e32, 9.5, 1.6, -8.9);
  const chaves = [];
  for (let i = 0; i < 8; i++) {
    const k = new THREE.Group();
    k.position.set(8.95 + (i % 4) * 0.36, 1.85 - Math.floor(i / 4) * 0.42, -8.83);
    caixa(k, 0.03, 0.08, 0.01, 0x9a9b9e, 0, -0.05, 0, { sombra: false });
    caixa(k, 0.06, 0.07, 0.015, i === 5 ? COR.vermelho : 0x4a4c51, 0, -0.12, 0, { sombra: false });
    g.add(k);
    chaves.push(k);
  }
  caixa(g, 2.4, 0.8, 1.0, 0x34363a, 8.5, 0.4, -5.5);
  g.add(new THREE.HemisphereLight(0xc8c9cc, 0x2a2a2c, 2.2));
  luzSol(g, 0xd8dade, 1.2, new THREE.Vector3(6, 20, 30), new THREE.Vector3(0, 0, 0), 20, 2048, 0.5);
  for (const x of [-7.5, 0, 7.5]) {
    const l = new THREE.PointLight(0xfff4e6, x === 0 ? 40 : 18, 12, 1.6);
    l.position.set(x, 5.5, 0);
    g.add(l);
  }
  return { grupo: g, fundo: 0x2a2c30, nevoa: [0x2a2c30, 30, 120], carroVermelho: vermelho, chave: chaves[5], atualizar() {} };
}

// ------------------------------------------------------------ escadaria do prédio
// Poço de 5 x 5 m; cada andar tem 3 m e dois lances (um sobe rumo a z-, o outro volta rumo a z+).
// Modelados 6 andares; o número pintado na parede de cada patamar é definido pela cena.
export function criarEscadaria(cena) {
  const g = grupo(cena, "escadaria");
  const ANDARES = 6;
  const cor = 0x3a3b3e;
  for (let a = 0; a < ANDARES; a++) {
    const y0 = a * 3;
    caixa(g, 5, 0.15, 1.4, 0x33343a, 0, y0 - 0.075, 1.8);
    caixa(g, 5, 0.15, 1.2, 0x33343a, 0, y0 + 1.5 - 0.075, -1.9);
    for (let i = 0; i < 10; i++) {
      caixa(g, 1.9, 0.15, 0.32, 0x45464a, -1.15, y0 + 0.075 + i * 0.15, 1.1 - i * 0.29);
      caixa(g, 1.9, 0.15, 0.32, 0x45464a, 1.15, y0 + 1.5 + 0.075 + i * 0.15, -1.3 + i * 0.29);
    }
    caixa(g, 0.06, 0.9, 3.0, 0x5a5c60, 0, y0 + 1.2, -0.1, { rx: -Math.atan2(1.5, 2.9) });
  }
  parede(g, { w: 5.2, h: ANDARES * 3 + 3, cor, z: -2.6 });
  parede(g, { w: 5.2, h: ANDARES * 3 + 3, cor, z: 2.6 });
  parede(g, { w: 5.2, h: ANDARES * 3 + 3, cor, x: -2.6, ry: Math.PI / 2 });
  parede(g, { w: 5.2, h: ANDARES * 3 + 3, cor, x: 2.6, ry: Math.PI / 2 });
  // em cada patamar: porta corta-fogo, número do andar e placa de saída (vermelha)
  const numeros = [];
  for (let a = 0; a < ANDARES; a++) {
    const y0 = a * 3;
    caixa(g, 0.95, 2.05, 0.06, 0x26282b, 1.4, y0 + 1.02, 2.55);
    const n = placa(g, 0.9, 0.7, (c, w, h, num = "") => {
      c.fillStyle = num === "20" ? "#b3141b" : "#c9c9c4";
      c.font = `800 ${h * 0.82}px Montserrat, Arial, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(num, w / 2, h / 2 + 4);
    }, { transparente: true });
    n.position.set(-0.4, y0 + 1.55, 2.54);
    n.rotation.y = Math.PI;
    numeros.push(n);
    const saida = placa(g, 0.42, 0.16, (c, w, h) => {
      c.fillStyle = "#3a0a0c";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#e01b22";
      c.font = `800 ${h * 0.62}px Montserrat, Arial, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("SAÍDA", w / 2, h / 2 + 2);
    }, { propria: true });
    saida.position.set(1.4, y0 + 2.3, 2.54);
    saida.rotation.y = Math.PI;
  }
  const hemi = new THREE.HemisphereLight(0x2c3140, 0x050506, 0.35);
  g.add(hemi);
  const emerg = new THREE.PointLight(COR.vermelho, 1.2, 4, 2);
  emerg.position.set(1.4, 2.2, 2.2);
  g.add(emerg);
  return {
    grupo: g,
    fundo: 0x050506,
    nevoa: [0x050506, 4, 16],
    ANDARES,
    // números pintados: andar do patamar mais baixo (os outros seguem +1)
    andares(base) {
      numeros.forEach((n, i) => {
        const v = String(base + i);
        if (n.userData.v !== v) {
          n.userData.v = v;
          n.userData.redesenhar(v);
        }
      });
    },
    // altura e ponto de cada degrau, para o personagem subir: p de 0 a ANDARES (andares subidos)
    caminho(p) {
      const a = Math.floor(p);
      const f = p - a;
      const y0 = a * 3;
      if (f < 0.5) {
        const k = f / 0.5;
        return [-1.15, y0 + 1.5 * k, 1.5 - 3.2 * k, Math.PI];
      }
      const k = (f - 0.5) / 0.5;
      return [1.15, y0 + 1.5 + 1.5 * k, -1.7 + 3.2 * k, 0];
    },
    atualizar() {},
  };
}

// ------------------------------------------------------------ apartamento do 20º andar
// Corredor escuro do lado de fora (z de 0 a 6) e a sala (z de -6 a 0) com o único abajur aceso da cidade.
export function criarApartamento(cena) {
  const g = grupo(cena, "apartamento");
  const H = 2.7;
  // corredor externo
  caixa(g, 2.2, 0.1, 6, 0x2a2b2e, 0, -0.05, 3);
  caixa(g, 2.2, 0.1, 6, 0x1e1f22, 0, H + 0.05, 3);
  caixa(g, 0.1, H, 6, 0x2c2e32, -1.1, H / 2, 3);
  caixa(g, 0.1, H, 6, 0x2c2e32, 1.1, H / 2, 3);
  // parede da porta com o vão
  parede(g, { w: 7.2, h: H, cor: 0x2c2e32, z: 0, furos: [{ x0: -0.45, x1: 0.45, y0: 0, y1: 2.1 }] });
  const dobPorta = new THREE.Group();
  dobPorta.position.set(-0.45, 0, -0.03);
  caixa(dobPorta, 0.9, 2.08, 0.05, 0x2b2724, 0.45, 1.04, 0);
  caixa(dobPorta, 0.05, 0.05, 0.06, 0x9a9b9e, 0.8, 1.0, 0.04, { sombra: false });
  g.add(dobPorta);
  placa(g, 0.32, 0.12, (c, w, h) => {
    c.fillStyle = "#b8b8b4";
    c.font = `700 ${h * 0.7}px Inter, Arial, sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("2001", w / 2, h / 2);
  }).position.set(0, 2.3, 0.07);
  // sala
  caixa(g, 7.2, 0.1, 6.2, 0x3a3430, 0, -0.05, -3.1);
  caixa(g, 7.2, 0.1, 6.2, 0x26282b, 0, H + 0.05, -3.1);
  parede(g, { w: 7.2, h: H, cor: 0x4a4440, z: -6.2, furos: [{ x0: -1.6, x1: 0.2, y0: 0.9, y1: 2.2 }] });
  parede(g, { w: 6.2, h: H, cor: 0x4a4440, x: -3.6, z: -3.1, ry: Math.PI / 2 });
  parede(g, { w: 6.2, h: H, cor: 0x4a4440, x: 3.6, z: -3.1, ry: Math.PI / 2 });
  const fora = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ color: 0x0b0d12, fog: false }));
  fora.position.set(-0.7, 1.6, -7.5);
  g.add(fora);
  caixa(g, 2.2, 0.75, 0.9, 0x5a3e36, -2.6, 0.38, -3.0, { ry: Math.PI / 2 });
  caixa(g, 2.2, 0.55, 0.22, 0x5a3e36, -3.25, 0.85, -3.0, { ry: Math.PI / 2 });
  caixa(g, 1.0, 0.4, 0.6, COR.madeira, -1.2, 0.2, -3.0);
  caixa(g, 1.9, 0.02, 1.4, 0x6a4a3e, -1.4, 0.01, -3.0, { sombra: false });
  caixa(g, 1.4, 1.9, 0.35, COR.madeira, 2.6, 0.95, -5.9);
  // relógio digital na estante (contagem da parte 9)
  const relogio = criarRelogio("2:50");
  relogio.position.set(2.6, 1.9, -5.68);
  g.add(relogio);
  // abajur de pé: a única luz quente
  cilindro(g, 0.02, 0.02, 1.5, 5, 0x2a2b2e, 2.4, 0.75, -1.6);
  cilindro(g, 0.16, 0.26, 0.3, 10, 0xefe2c4, 2.4, 1.6, -1.6, { material: luzPropria(0xefe2c4) });
  const abajur = new THREE.PointLight(0xf3d9a8, 14, 9, 1.6);
  abajur.position.set(2.4, 1.55, -1.6);
  abajur.castShadow = true;
  abajur.shadow.mapSize.set(1024, 1024);
  g.add(abajur);
  const vaza = new THREE.PointLight(0xf3d9a8, 0, 5, 2);
  vaza.position.set(0, 1.4, 0.6);
  g.add(vaza);
  g.add(new THREE.HemisphereLight(0x4a4038, 0x0a0908, 0.6));
  return {
    grupo: g,
    fundo: 0x050506,
    nevoa: [0x050506, 8, 30],
    relogio,
    porta(abertura) {
      dobPorta.rotation.y = abertura;
      vaza.intensity = 4 * Math.min(1, abertura / 1.2);
    },
    atualizar() {},
  };
}
