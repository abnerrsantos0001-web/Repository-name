// Mundo 3D low-poly do canal "Ninguém Sabe": paleta, peças e os cenários compartilhados por todas as partes.
// Cada cenário fica num ponto do mundo (DESLOCAMENTO) e é um grupo com as próprias luzes;
// a cena liga só o cenário do plano atual. Nada aqui usa o relógio: o que muda com o tempo
// passa por atualizar(t).
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";

export const COR = {
  vermelho: 0xc4161c,
  vermelhoEscuro: 0x5c1114,
  janelaAcesa: 0xefe2c4,
  vidro: 0x0c0d0f,
  asfalto: 0x1c1d20,
  faixa: 0x6d6e70,
  calcada: 0x3a3b3e,
  meioFio: 0x4a4b4f,
  grama: 0x232622,
  predios: [0x222428, 0x2a2c30, 0x313338, 0x393b40, 0x26282b],
  casas: [0x4a4c50, 0x3e4044, 0x46484c, 0x35373a],
  telhados: [0x1e1f22, 0x2a2b2e, 0x242528],
  carros: [0x3d3f44, 0x2a2b2f, 0x55575c, 0x1f2023, 0x47494e],
  pneu: 0x0b0b0c,
  metal: 0x45474c,
  poste: 0x2c2d30,
  madeira: 0x2a2522,
  piso: 0x2b2926,
  paredeQuarto: 0x34363a,
  lencol: 0x8a8a88,
  travesseiro: 0xa3a3a0,
  cobertor: 0x3d3f45,
  interior: 0x0f1012,
};

// gerador pseudoaleatório com semente (mulberry32): o mesmo mundo em todo render
export function rng(semente) {
  let a = semente >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cacheMat = new Map();
export function mat(cor, o = {}) {
  const chave = cor + "|" + JSON.stringify(o);
  if (!cacheMat.has(chave)) {
    cacheMat.set(
      chave,
      new THREE.MeshStandardMaterial({
        color: cor,
        roughness: o.aspereza ?? 0.92,
        metalness: o.metal ?? 0,
        flatShading: true,
        emissive: o.emissivo ?? 0x000000,
        emissiveIntensity: o.brilho ?? 1,
        transparent: o.opacidade !== undefined,
        opacity: o.opacidade ?? 1,
        side: o.lado ?? THREE.FrontSide,
      }),
    );
  }
  return cacheMat.get(chave);
}

// luz própria (lâmpada, janela acesa, LED): não depende da iluminação nem some na névoa
const cacheLuz = new Map();
export function luzPropria(cor) {
  if (!cacheLuz.has(cor)) cacheLuz.set(cor, new THREE.MeshBasicMaterial({ color: cor, fog: false }));
  return cacheLuz.get(cor);
}

export function caixa(pai, w, h, d, cor, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.material ?? mat(cor, o));
  m.position.set(x, y, z);
  if (o.ry) m.rotation.y = o.ry;
  if (o.rx) m.rotation.x = o.rx;
  if (o.rz) m.rotation.z = o.rz;
  m.castShadow = o.sombra ?? true;
  m.receiveShadow = true;
  pai.add(m);
  return m;
}

export function cilindro(pai, rt, rb, h, seg, cor, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), o.material ?? mat(cor, o));
  m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  m.castShadow = o.sombra ?? true;
  m.receiveShadow = true;
  pai.add(m);
  return m;
}

// Parede com furos (portas e janelas). Coordenadas locais: x de -w/2 a w/2, y de 0 a h,
// espessura no eixo z. furos: [{x0, x1, y0, y1}].
export function parede(pai, { w, h, e = 0.12, cor, x = 0, y = 0, z = 0, ry = 0, furos = [] }) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const xs = [...new Set([-w / 2, w / 2, ...furos.flatMap((f) => [f.x0, f.x1])])].sort((a, b) => a - b);
  const ys = [...new Set([0, h, ...furos.flatMap((f) => [f.y0, f.y1])])].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2;
      const cy = (ys[j] + ys[j + 1]) / 2;
      const furado = furos.some((f) => cx > f.x0 && cx < f.x1 && cy > f.y0 && cy < f.y1);
      if (furado) continue;
      caixa(g, xs[i + 1] - xs[i], ys[j + 1] - ys[j], e, cor, cx, cy, 0);
    }
  }
  pai.add(g);
  return g;
}

// prisma triangular (telhado de duas águas) com a cumeeira no eixo x
export function telhado(pai, w, altura, d, cor, x, y, z, o = {}) {
  const forma = new THREE.Shape();
  forma.moveTo(-d / 2, 0);
  forma.lineTo(d / 2, 0);
  forma.lineTo(0, altura);
  forma.closePath();
  const geo = new THREE.ExtrudeGeometry(forma, { depth: w, bevelEnabled: false });
  geo.translate(0, 0, -w / 2);
  geo.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(geo, mat(cor));
  m.position.set(x, y, z);
  if (o.ry) m.rotation.y = o.ry;
  m.castShadow = true;
  m.receiveShadow = true;
  pai.add(m);
  return m;
}

// céu em degradê (esfera virada para dentro, fora da névoa)
export function ceu(pai, corTopo, corHorizonte, raio = 600) {
  const geo = new THREE.SphereGeometry(raio, 24, 16);
  const cores = [];
  const topo = new THREE.Color(corTopo);
  const hor = new THREE.Color(corHorizonte);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = THREE.MathUtils.clamp(pos.getY(i) / raio, 0, 1);
    const c = hor.clone().lerp(topo, Math.pow(k, 0.6));
    cores.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  let atual = [corTopo, corHorizonte];
  m.userData.pintar = (novoTopo, novoHor) => {
    if (atual[0] === novoTopo && atual[1] === novoHor) return;
    atual = [novoTopo, novoHor];
    const a = new THREE.Color(novoTopo);
    const b = new THREE.Color(novoHor);
    const cor = geo.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const k = THREE.MathUtils.clamp(pos.getY(i) / raio, 0, 1);
      const c = b.clone().lerp(a, Math.pow(k, 0.6));
      cor.setXYZ(i, c.r, c.g, c.b);
    }
    cor.needsUpdate = true;
  };
  pai.add(m);
  return m;
}

// mistura de valores de um modo de luz para outro (modos: objetos com os mesmos campos)
export function aplicarLuz(alvos, modo) {
  for (const [k, v] of Object.entries(modo)) {
    const a = alvos[k];
    if (!a) continue;
    if (a.isLight) {
      a.intensity = v[0];
      a.color.setHex(v[1]);
      if (v[2] !== undefined && a.groundColor) a.groundColor.setHex(v[2]);
    } else if (a.isMaterial) {
      a.color.setHex(v);
    }
  }
}

// ---------------------------------------------------------------- peças

export function criarCarro(semente, o = {}) {
  const r = rng(semente);
  const g = new THREE.Group();
  const cor = o.cor ?? COR.carros[Math.floor(r() * COR.carros.length)];
  // carroceria
  caixa(g, 4.2, 0.62, 1.8, cor, 0, 0.62, 0);
  // cabine (topo mais estreito, para-brisa inclinado)
  const cab = new THREE.BoxGeometry(2.2, 0.6, 1.6);
  const p = cab.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0) {
      p.setX(i, p.getX(i) * 0.78 - 0.08);
      p.setZ(i, p.getZ(i) * 0.9);
    }
  }
  cab.computeVertexNormals();
  const cabine = new THREE.Mesh(cab, mat(COR.vidro, { aspereza: 0.3, metal: 0.4 }));
  cabine.position.set(-0.15, 1.23, 0);
  cabine.castShadow = true;
  g.add(cabine);
  caixa(g, 1.5, 0.06, 1.46, cor, -0.23, 1.55, 0);
  // rodas
  for (const [x, z] of [
    [1.35, 0.86],
    [1.35, -0.86],
    [-1.35, 0.86],
    [-1.35, -0.86],
  ]) {
    cilindro(g, 0.36, 0.36, 0.28, 8, COR.pneu, x, 0.36, z, { rx: Math.PI / 2 });
  }
  // faróis e lanternas (vermelhas: detalhe da paleta)
  caixa(g, 0.05, 0.14, 0.34, 0x9a9b9e, 2.11, 0.75, 0.6, { sombra: false });
  caixa(g, 0.05, 0.14, 0.34, 0x9a9b9e, 2.11, 0.75, -0.6, { sombra: false });
  const lanternas = [
    caixa(g, 0.05, 0.16, 0.36, COR.vermelhoEscuro, -2.11, 0.78, 0.6, { sombra: false }),
    caixa(g, 0.05, 0.16, 0.36, COR.vermelhoEscuro, -2.11, 0.78, -0.6, { sombra: false }),
  ];
  // porta aberta do motorista (lado z+), dobradiça na frente
  if (o.portaAberta) {
    const dob = new THREE.Group();
    dob.position.set(0.55, 0, 0.9);
    dob.rotation.y = -o.portaAberta;
    caixa(dob, 1.2, 0.62, 0.07, cor, -0.6, 0.62, 0.035);
    caixa(dob, 1.0, 0.45, 0.05, COR.vidro, -0.62, 1.15, 0.035, { aspereza: 0.3 });
    g.add(dob);
  }
  g.userData.lanternas = lanternas;
  g.userData.alerta = !!o.alerta;
  return g;
}

export function criarOnibus(semente) {
  const g = new THREE.Group();
  const cor = 0x3a3c40;
  caixa(g, 11, 0.55, 2.5, 0x202124, 0, 0.75, 0);
  caixa(g, 11, 0.12, 2.5, 0x2a2b2e, 0, 1.06, 0);
  for (const z of [1.27, -1.27]) {
    caixa(g, 11, 0.72, 0.06, cor, 0, 1.45, z);
    caixa(g, 10.4, 1.05, 0.03, 0x9aa3ad, 0.1, 2.33, z, { opacidade: 0.22, aspereza: 0.1, sombra: false });
    for (let x = -5.4; x <= 5.5; x += 1.55) caixa(g, 0.14, 1.1, 0.07, cor, x, 2.33, z);
  }
  caixa(g, 11, 0.14, 2.6, cor, 0, 2.93, 0);
  caixa(g, 0.06, 1.9, 2.5, cor, -5.5, 1.95, 0);
  caixa(g, 0.06, 1.2, 2.2, COR.vidro, 5.51, 2.25, 0, { aspereza: 0.3 });
  caixa(g, 0.06, 0.75, 2.5, cor, 5.5, 1.45, 0);
  // bancos vazios e barras
  for (let x = -4.6; x <= 4.2; x += 1.05) {
    for (const z of [0.78, -0.78]) {
      caixa(g, 0.42, 0.1, 0.8, 0x4a4c51, x, 1.5, z);
      caixa(g, 0.08, 0.55, 0.8, 0x4a4c51, x - 0.2, 1.8, z);
    }
  }
  for (let x = -4; x <= 4; x += 2.6) cilindro(g, 0.025, 0.025, 1.8, 5, 0x8a8c90, x, 2.0, 0.3);
  for (const x of [3.6, -3.4]) {
    for (const z of [1.2, -1.2]) cilindro(g, 0.5, 0.5, 0.32, 8, COR.pneu, x, 0.5, z, { rx: Math.PI / 2 });
  }
  caixa(g, 0.05, 0.25, 0.4, COR.vermelhoEscuro, -5.51, 1.0, 0.9, { sombra: false });
  caixa(g, 0.05, 0.25, 0.4, COR.vermelhoEscuro, -5.51, 1.0, -0.9, { sombra: false });
  return g;
}

export function criarPoste(pai, x, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  cilindro(g, 0.08, 0.11, 6.5, 6, COR.poste, 0, 3.25, 0);
  caixa(g, 1.6, 0.1, 0.1, COR.poste, 0.75, 6.4, 0);
  const cabeca = caixa(g, 0.6, 0.14, 0.3, 0x3a3b3e, 1.45, 6.3, 0);
  g.userData.acender = (on) => {
    cabeca.material = on ? luzPropria(0xf0d9a8) : mat(0x3a3b3e);
  };
  pai.add(g);
  return g;
}

// semáforo travado no vermelho: a lâmpada tem luz própria e uma luz pontual fraca em volta
export function criarSemaforo(pai, x, z, ry = 0, comLuz = false) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  cilindro(g, 0.07, 0.09, 4.2, 6, COR.poste, 0, 2.1, 0);
  caixa(g, 0.42, 1.2, 0.36, 0x161719, 0, 4.6, 0);
  const vermelho = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), luzPropria(COR.vermelho));
  vermelho.position.set(0, 4.98, 0.19);
  g.add(vermelho);
  for (const y of [4.6, 4.22]) {
    const apagada = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), mat(0x202123));
    apagada.position.set(0, y, 0.19);
    g.add(apagada);
  }
  let l = null;
  if (comLuz) {
    l = new THREE.PointLight(COR.vermelho, 6, 9, 2);
    l.position.set(0, 4.9, 0.6);
    g.add(l);
  }
  g.userData.ligar = (on) => {
    vermelho.material = on ? luzPropria(COR.vermelho) : mat(0x2a1214);
    if (l) l.intensity = on ? 6 : 0;
  };
  pai.add(g);
  return g;
}

export function criarArvoreSeca(pai, semente, x, z, alt = 4) {
  const r = rng(semente);
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  cilindro(g, 0.1, 0.18, alt, 5, 0x252220, 0, alt / 2, 0);
  for (let i = 0; i < 4; i++) {
    const galho = new THREE.Group();
    galho.position.y = alt * (0.55 + 0.4 * r());
    galho.rotation.set(0.6 + 0.5 * r(), r() * Math.PI * 2, 0, "YXZ");
    cilindro(galho, 0.03, 0.07, alt * 0.45, 4, 0x252220, 0, alt * 0.22, 0);
    g.add(galho);
  }
  pai.add(g);
  return g;
}

export function criarCaixaCorreio(pai, x, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  cilindro(g, 0.04, 0.04, 1.1, 5, COR.madeira, 0, 0.55, 0);
  caixa(g, 0.28, 0.26, 0.5, 0x3b3c40, 0, 1.2, 0);
  caixa(g, 0.03, 0.22, 0.04, COR.vermelho, 0.16, 1.4, -0.1);
  caixa(g, 0.03, 0.08, 0.14, COR.vermelho, 0.16, 1.48, -0.03);
  pai.add(g);
  return g;
}

// Casa: frente voltada para +z local. janelaAberta = índice da janela de cima sem vidro opaco
export function criarCasa(pai, semente, o) {
  const r = rng(semente);
  const g = new THREE.Group();
  g.position.set(o.x, 0, o.z);
  g.rotation.y = o.ry ?? 0;
  const w = o.w ?? 9;
  const d = o.d ?? 8;
  const andares = o.andares ?? 1;
  const ha = 3;
  const h = ha * andares;
  const cor = o.cor ?? COR.casas[Math.floor(r() * COR.casas.length)];
  const corTelhado = o.telhado ?? COR.telhados[Math.floor(r() * COR.telhados.length)];

  const porta = { x0: -0.55, x1: 0.55, y0: 0, y1: 2.2 };
  const janelas = [
    { x0: -w / 2 + 1.0, x1: -w / 2 + 2.6, y0: 1.0, y1: 2.3 },
    { x0: w / 2 - 2.6, x1: w / 2 - 1.0, y0: 1.0, y1: 2.3 },
  ];
  if (andares > 1) {
    janelas.push(
      { x0: -w / 2 + 1.0, x1: -w / 2 + 2.6, y0: ha + 1.0, y1: ha + 2.3 },
      { x0: -0.8, x1: 0.8, y0: ha + 1.0, y1: ha + 2.3 },
      { x0: w / 2 - 2.6, x1: w / 2 - 1.0, y0: ha + 1.0, y1: ha + 2.3 },
    );
  }
  // frente com furos, demais paredes inteiras
  parede(g, { w, h, cor, z: d / 2, furos: [porta, ...janelas] });
  parede(g, { w, h, cor, z: -d / 2 });
  parede(g, { w: d, h, cor, x: w / 2, ry: Math.PI / 2 });
  parede(g, { w: d, h, cor, x: -w / 2, ry: Math.PI / 2 });
  // interior escuro (visto pelas janelas)
  const dentro = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.25, h - 0.05, d - 0.25),
    mat(COR.interior, { lado: THREE.BackSide }),
  );
  dentro.position.y = h / 2;
  dentro.receiveShadow = true;
  g.add(dentro);
  if (andares > 1) caixa(g, w - 0.3, 0.2, d - 0.3, COR.interior, 0, ha, 0);
  caixa(g, w + 0.3, 0.25, d + 0.3, 0x2a2b2e, 0, h + 0.12, 0);
  telhado(g, w + 0.8, 2.2, d + 0.8, corTelhado, 0, h + 0.24, 0);
  caixa(g, 0.7, 1.6, 0.7, 0x2e2f33, w / 2 - 1.6, h + 1.6, -d / 4);

  // vidros e molduras
  janelas.forEach((j, i) => {
    const cx = (j.x0 + j.x1) / 2;
    const cy = (j.y0 + j.y1) / 2;
    const jw = j.x1 - j.x0;
    const jh = j.y1 - j.y0;
    const aberta = andares > 1 && i === 3 && o.janelaAberta;
    caixa(g, jw, jh, 0.03, COR.vidro, cx, cy, d / 2 - 0.02, {
      aspereza: 0.2,
      metal: 0.5,
      ...(aberta ? { opacidade: 0.45 } : {}),
      sombra: false,
    });
    caixa(g, jw + 0.2, 0.12, 0.2, 0x6a6c70, cx, j.y0 - 0.04, d / 2 + 0.06);
    caixa(g, jw + 0.2, 0.08, 0.14, 0x6a6c70, cx, j.y1 + 0.04, d / 2 + 0.04);
    caixa(g, 0.07, jh, 0.12, 0x6a6c70, cx, cy, d / 2 + 0.02, { sombra: false });
  });
  // porta (vermelho escuro só na casa do personagem) e varanda
  caixa(g, 1.1, 2.2, 0.08, o.portaVermelha ? COR.vermelhoEscuro : 0x231f1d, 0, 1.1, d / 2 - 0.03);
  caixa(g, 0.06, 0.06, 0.1, 0x8a8b8e, 0.4, 1.05, d / 2 + 0.03, { sombra: false });
  caixa(g, 2.4, 0.2, 1.4, 0x3a3b3e, 0, 0.1, d / 2 + 0.7);
  caixa(g, 2.6, 0.12, 1.6, 0x2a2b2e, 0, 2.75, d / 2 + 0.75);
  for (const s of [1, -1]) cilindro(g, 0.06, 0.06, 2.6, 5, 0x5a5c60, s * 1.15, 1.4, d / 2 + 1.45);

  pai.add(g);
  return g;
}

// Janelas de prédio em lote (InstancedMesh): uma lista de matrizes, um desenho só.
export class Janelas {
  constructor(pai, cor = 0x111214) {
    this.pai = pai;
    this.cor = cor;
    this.lista = [];
  }
  add(x, y, z, ry, w = 1.2, h = 1.5) {
    const m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry),
      new THREE.Vector3(w, h, 1),
    );
    this.lista.push(m);
  }
  fechar() {
    const inst = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 0.08),
      mat(this.cor, { aspereza: 0.35, metal: 0.3 }),
      this.lista.length,
    );
    this.lista.forEach((m, i) => inst.setMatrixAt(i, m));
    inst.receiveShadow = true;
    this.pai.add(inst);
    // camada acesa: ~40% das janelas podem ter luz; cada uma apaga num limiar próprio
    const r = rng(77);
    this.acesas = [];
    this.lista.forEach((m) => {
      if (r() < 0.4) this.acesas.push({ m: m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.03)), u: r() });
    });
    this.luz = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), luzPropria(0xe2cfa4), this.acesas.length);
    this.luz.material = new THREE.MeshBasicMaterial({ color: 0xe2cfa4 });
    this.pai.add(this.luz);
    this.nivel = -1;
    this.acender(0);
    return inst;
  }
  // nível 0..1: fração das janelas acesas (as de limiar menor ficam acesas por mais tempo)
  acender(nivel) {
    if (Math.abs(nivel - this.nivel) < 1e-4) return;
    this.nivel = nivel;
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    this.acesas.forEach((a, i) => this.luz.setMatrixAt(i, a.u < nivel ? a.m : zero));
    this.luz.instanceMatrix.needsUpdate = true;
    this.luz.visible = nivel > 0;
  }
}

// Prédio com a fachada voltada para a direção ry (0 = +z). Janelas na fachada.
export function criarPredio(pai, janelas, o) {
  const g = new THREE.Group();
  g.position.set(o.x, 0, o.z);
  g.rotation.y = o.ry ?? 0;
  caixa(g, o.w, o.h, o.d, o.cor, 0, o.h / 2, 0);
  caixa(g, o.w + 0.3, 0.4, o.d + 0.3, 0x1a1b1e, 0, o.h + 0.2, 0);
  if (o.caixaDagua) caixa(g, 2.2, 1.8, 2.2, 0x2a2b2e, o.w * 0.2, o.h + 1.3, -o.d * 0.15);
  // térreo: faixa escura de lojas fechadas
  caixa(g, o.w - 0.4, 3.2, 0.1, 0x111214, 0, 1.8, o.d / 2 + 0.03, { aspereza: 0.4 });
  if (janelas) {
    const passoX = o.passoX ?? 2.6;
    const passoY = o.passoY ?? 3.2;
    const cols = Math.max(1, Math.floor((o.w - 1.2) / passoX));
    const linhas = Math.max(1, Math.floor((o.h - 5) / passoY));
    const x0 = -((cols - 1) * passoX) / 2;
    const v = new THREE.Vector3();
    g.updateMatrixWorld(true);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < linhas; j++) {
        if (o.pular && o.pular(i, j)) continue;
        v.set(x0 + i * passoX, 5.2 + j * passoY, o.d / 2 + 0.02);
        v.applyMatrix4(g.matrix);
        janelas.add(v.x, v.y, v.z, o.ry ?? 0, o.janela?.w, o.janela?.h);
      }
    }
    g.userData.grade = { cols, linhas, x0, passoX, passoY };
  }
  pai.add(g);
  return g;
}

export function criarCelular() {
  const g = new THREE.Group();
  caixa(g, 0.076, 0.158, 0.009, 0x0e0e10, 0, 0, 0, { aspereza: 0.4, metal: 0.3 });
  const tela = document.createElement("canvas");
  tela.width = 600;
  tela.height = 1302;
  const textura = new THREE.CanvasTexture(tela);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.152), new THREE.MeshBasicMaterial({ map: textura }));
  vidro.position.z = 0.0047;
  g.add(vidro);
  g.userData = { tela, textura, vidro };
  return g;
}

// relógio digital de cabeceira com dígitos de sete segmentos (sem depender de fonte)
export function criarRelogio(texto) {
  const g = new THREE.Group();
  caixa(g, 0.26, 0.11, 0.1, 0x0d0d0e, 0, 0.055, 0, { aspereza: 0.5 });
  const tela = document.createElement("canvas");
  tela.width = 520;
  tela.height = 200;
  const ctx = tela.getContext("2d");
  const textura = new THREE.CanvasTexture(tela);
  textura.colorSpace = THREE.SRGBColorSpace;
  let atual = null;
  // texto "" = visor apagado (piscando quando o alarme toca)
  g.userData.mostrar = (txt) => {
    if (txt === atual) return;
    atual = txt;
    ctx.fillStyle = "#070707";
    ctx.fillRect(0, 0, 520, 200);
    desenharSeteSegmentos(ctx, txt || "8:88", 40, 30, 140, txt ? "#e01b22" : "#1a0a0b", "#1a0a0b");
    textura.needsUpdate = true;
  };
  g.userData.mostrar(texto);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.085), new THREE.MeshBasicMaterial({ map: textura }));
  face.position.set(0, 0.057, 0.0505);
  g.add(face);
  return g;
}

const SEGMENTOS = {
  0: "abcdef",
  1: "bc",
  2: "abged",
  3: "abgcd",
  4: "fgbc",
  5: "afgcd",
  6: "afgedc",
  7: "abc",
  8: "abcdefg",
  9: "abcdfg",
};
export function desenharSeteSegmentos(ctx, texto, x, y, alt, acesa, apagada) {
  const larg = alt * 0.55;
  const esp = alt * 0.13;
  const seg = {
    a: [esp, 0, larg - 2 * esp, esp],
    b: [larg - esp, esp, esp, alt / 2 - esp],
    c: [larg - esp, alt / 2, esp, alt / 2 - esp],
    d: [esp, alt - esp, larg - 2 * esp, esp],
    e: [0, alt / 2, esp, alt / 2 - esp],
    f: [0, esp, esp, alt / 2 - esp],
    g: [esp, alt / 2 - esp / 2, larg - 2 * esp, esp],
  };
  let cx = x;
  for (const ch of texto) {
    if (ch === ":") {
      ctx.fillStyle = acesa;
      ctx.fillRect(cx + esp * 0.4, y + alt * 0.28, esp, esp);
      ctx.fillRect(cx + esp * 0.4, y + alt * 0.64, esp, esp);
      cx += esp * 2.2;
      continue;
    }
    const liga = SEGMENTOS[ch] ?? "";
    for (const [k, [sx, sy, sw, sh]] of Object.entries(seg)) {
      ctx.fillStyle = liga.includes(k) ? acesa : apagada;
      ctx.fillRect(cx + sx, y + sy, sw, sh);
    }
    cx += larg + esp * 1.4;
  }
}

// ---------------------------------------------------------------- cenários

export const DESLOCAMENTO = {
  quarto: new THREE.Vector3(-300, 0, 0),
  bairro: new THREE.Vector3(0, 0, 0),
  cidade: new THREE.Vector3(400, 0, 0),
  terreo: new THREE.Vector3(-300, 0, 60),
  apartamento: new THREE.Vector3(-300, 0, -120),
  escadaria: new THREE.Vector3(-300, 0, -220),
  shopping: new THREE.Vector3(0, 0, 500),
  concessionaria: new THREE.Vector3(0, 0, -500),
};

export function luzSol(grupo, cor, intensidade, de, para, area, mapa = 2048, sombra = 1) {
  const sol = new THREE.DirectionalLight(cor, intensidade);
  sol.shadow.intensity = sombra;
  sol.shadow.radius = 3;
  sol.position.copy(de);
  sol.target.position.copy(para);
  sol.castShadow = true;
  sol.shadow.mapSize.set(mapa, mapa);
  sol.shadow.camera.left = -area;
  sol.shadow.camera.right = area;
  sol.shadow.camera.top = area;
  sol.shadow.camera.bottom = -area;
  sol.shadow.camera.near = 0.5;
  sol.shadow.camera.far = 300;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  grupo.add(sol);
  grupo.add(sol.target);
  return sol;
}

// Quarto do personagem e o corredor até o quarto da mãe.
// Sala: x de -2.4 a 2.4, z de -2.4 a 2.4, pé-direito 2.7. Janela na parede x+, porta na parede z+.
export function criarQuarto(cena) {
  const g = new THREE.Group();
  g.position.copy(DESLOCAMENTO.quarto);
  cena.add(g);
  const H = 2.7;
  caixa(g, 4.9, 0.1, 4.9, COR.piso, 0, -0.05, 0);
  caixa(g, 4.9, 0.1, 4.9, 0x2a2b2e, 0, H + 0.05, 0);
  parede(g, { w: 4.9, h: H, cor: COR.paredeQuarto, z: -2.45 });
  parede(g, { w: 4.9, h: H, cor: COR.paredeQuarto, x: -2.45, ry: Math.PI / 2 });
  // parede da janela (x+): com ry = PI/2 o x local vale -z do mundo
  parede(g, {
    w: 4.9,
    h: H,
    cor: COR.paredeQuarto,
    x: 2.45,
    ry: Math.PI / 2,
    furos: [{ x0: -0.1, x1: 1.3, y0: 0.95, y1: 2.2 }],
  });
  // parede da porta (z+): porta em x de 0.6 a 1.5
  parede(g, { w: 4.9, h: H, cor: COR.paredeQuarto, z: 2.45, furos: [{ x0: 0.6, x1: 1.5, y0: 0, y1: 2.15 }] });
  // porta aberta para dentro
  const dob = new THREE.Group();
  dob.position.set(0.6, 0, 2.38);
  dob.rotation.y = 1.25;
  caixa(dob, 0.9, 2.12, 0.05, 0x2b2724, 0.45, 1.06, 0);
  g.add(dob);

  // janela: moldura, vidro, cortinas e a vista cinza lá fora
  const jz = -0.6;
  caixa(g, 0.16, 0.08, 1.5, 0x5a5c60, 2.42, 0.95, jz);
  caixa(g, 0.16, 0.08, 1.5, 0x5a5c60, 2.42, 2.2, jz);
  caixa(g, 0.1, 1.25, 0.05, 0x5a5c60, 2.42, 1.575, jz);
  caixa(g, 0.02, 1.25, 1.4, 0xb8bcc2, 2.43, 1.575, jz, { opacidade: 0.12, aspereza: 0.1, sombra: false });
  caixa(g, 0.08, 2.3, 0.5, 0x2a2c30, 2.3, 1.4, jz - 0.95);
  caixa(g, 0.08, 2.3, 0.5, 0x2a2c30, 2.3, 1.4, jz + 0.95);
  const matFora = new THREE.MeshBasicMaterial({ color: 0x8d9196, fog: false });
  const fora = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), matFora);
  fora.position.set(6, 2.0, jz);
  fora.rotation.y = -Math.PI / 2;
  g.add(fora);
  // telhados vizinhos na vista
  caixa(g, 0.4, 0.9, 4, 0x3a3d41, 5.4, 0.9, jz - 1.4, { sombra: false });
  caixa(g, 0.4, 1.5, 2.2, 0x4a4d52, 5.2, 0.7, jz + 1.3, { sombra: false });

  // cama baixa (colchão a 0.40 m), cabeceira encostada na parede z-
  const cama = { x: -0.6, z: -1.3, colchao: 0.4, borda: 0.15 };
  caixa(g, 1.5, 0.2, 2.1, COR.madeira, cama.x, 0.1, cama.z);
  caixa(g, 1.4, 0.2, 2.0, COR.lencol, cama.x, 0.3, cama.z);
  caixa(g, 1.5, 0.9, 0.08, COR.madeira, cama.x, 0.45, -2.38);
  caixa(g, 0.9, 0.12, 0.42, COR.travesseiro, cama.x, 0.46, -2.02);
  // cobertor: dois estados (cobrindo o corpo / jogado para o pé da cama), a cena escolhe com cobertor(k)
  const geoCob = new THREE.BoxGeometry(1.46, 1, 1.3, 3, 1, 8);
  geoCob.translate(0, 0.5, 0);
  const pc = geoCob.attributes.position;
  for (let i = 0; i < pc.count; i++) {
    const z = -0.92 + pc.getZ(i);
    const x = pc.getX(i);
    if (pc.getY(i) > 0.5) {
      // mais alto sobre o tronco, mais baixo sobre as pernas, caindo nas laterais
      const sobreTronco = THREE.MathUtils.smoothstep(-z, 0.82, 1.12);
      // e um volume nos pés (os tênis por baixo)
      const pes = 0.26 * Math.exp(-Math.pow((z + 0.47) / 0.13, 2)) * Math.max(0, 1 - Math.pow(x / 0.45, 2));
      const topo = 0.72 + 0.27 * sobreTronco + pes - 0.12 * Math.pow(Math.abs(x) / 0.73, 2);
      pc.setY(i, topo - cama.colchao);
    }
  }
  geoCob.computeVertexNormals();
  const cobrindo = new THREE.Mesh(geoCob, mat(COR.cobertor));
  cobrindo.position.set(cama.x, cama.colchao, -0.92);
  cobrindo.castShadow = true;
  cobrindo.receiveShadow = true;
  g.add(cobrindo);
  // jogado: um volume amassado no pé da cama, caindo pela lateral
  const geoJog = new THREE.BoxGeometry(1.5, 1, 0.62, 6, 1, 4);
  geoJog.translate(0, 0.5, 0);
  const pj = geoJog.attributes.position;
  for (let i = 0; i < pj.count; i++) {
    const x = pj.getX(i);
    const z = pj.getZ(i);
    if (pj.getY(i) > 0.5) pj.setY(i, 0.13 + 0.06 * Math.sin(x * 7.3 + 1.1) + 0.05 * Math.cos(z * 9.1 + x * 2));
    if (x > 0.7) pj.setY(i, pj.getY(i) - 0.32);
  }
  geoJog.computeVertexNormals();
  const jogado = new THREE.Mesh(geoJog, mat(COR.cobertor));
  jogado.position.set(cama.x - 0.03, cama.colchao - 0.01, -0.52);
  jogado.rotation.y = 0.06;
  jogado.castShadow = true;
  jogado.receiveShadow = true;
  g.add(jogado);

  // criado-mudo, relógio e celular
  caixa(g, 0.5, 0.45, 0.45, COR.madeira, 0.45, 0.225, -1.55);
  caixa(g, 0.44, 0.02, 0.02, 0x4a4542, 0.45, 0.33, -1.32, { sombra: false });
  const relogio = criarRelogio("7:12");
  relogio.position.set(0.48, 0.45, -1.66);
  relogio.rotation.y = -0.55;
  g.add(relogio);
  const celular = criarCelular();
  g.add(celular);
  const celularNoMovel = { pos: new THREE.Vector3(0.32, 0.455, -1.42), rot: new THREE.Euler(-Math.PI / 2, 0, 0.35) };

  // guarda-roupa, tapete, quadros
  caixa(g, 0.6, 2.1, 1.5, 0x2c2826, -2.1, 1.05, 1.3);
  caixa(g, 0.02, 1.9, 0.02, 0x4a4542, -1.79, 1.05, 1.3, { sombra: false });
  caixa(g, 1.7, 0.012, 1.2, 0x34302d, 0.6, 0.006, 0.4, { sombra: false });
  caixa(g, 0.6, 0.45, 0.03, 0x1b1c1f, -0.9, 1.75, -2.39);
  caixa(g, 0.4, 0.55, 0.03, 0x232428, -0.15, 1.7, -2.39);

  // corredor: de z 2.5 a 8.6, x de 0.35 a 1.75
  parede(g, { w: 6.2, h: H, cor: 0x2c2e32, x: 0.3, z: 5.55, ry: Math.PI / 2, furos: [{ x0: -0.4, x1: 0.5, y0: 0, y1: 2.1 }] });
  parede(g, { w: 6.2, h: H, cor: 0x2c2e32, x: 1.8, z: 5.55, ry: Math.PI / 2, furos: [{ x0: -1.6, x1: -0.7, y0: 0, y1: 2.1 }] });
  // porta lateral do corredor (fechada; na parte 5 aparece aberta)
  const dobLateral = new THREE.Group();
  dobLateral.position.set(0.31, 0, 5.05);
  caixa(dobLateral, 0.06, 2.1, 0.9, 0x24201e, 0, 1.05, 0.45);
  g.add(dobLateral);
  caixa(g, 0.06, 2.1, 0.9, 0x24201e, 1.79, 1.05, 6.7);
  parede(g, { w: 1.6, h: H, cor: 0x2c2e32, x: 1.05, z: 8.65, furos: [{ x0: -0.45, x1: 0.45, y0: 0, y1: 2.1 }] });
  caixa(g, 1.6, 0.1, 6.3, COR.piso, 1.05, -0.05, 5.55);
  caixa(g, 1.6, 0.1, 6.3, 0x24252a, 1.05, H + 0.05, 5.55);
  // porta do quarto da mãe entreaberta, escuro do outro lado
  const dobMae = new THREE.Group();
  dobMae.position.set(0.6, 0, 8.62);
  dobMae.rotation.y = -0.55;
  caixa(dobMae, 0.9, 2.08, 0.05, 0x2b2724, 0.45, 1.04, 0);
  g.add(dobMae);
  caixa(g, 3, 0.1, 3, COR.piso, 1.05, -0.05, 10.2);
  caixa(g, 3, H, 0.1, 0x1d1e21, 1.05, H / 2, 11.7);
  // cama de casal dos pais, desarrumada como se tivessem levantado no meio da noite
  caixa(g, 1.7, 0.28, 2.0, COR.madeira, 1.05, 0.14, 10.62);
  caixa(g, 1.6, 0.18, 1.9, COR.lencol, 1.05, 0.37, 10.62);
  caixa(g, 1.7, 0.9, 0.08, COR.madeira, 1.05, 0.45, 11.62);
  caixa(g, 0.62, 0.12, 0.36, COR.travesseiro, 0.66, 0.52, 11.35, { ry: 0.2 });
  caixa(g, 0.62, 0.12, 0.36, COR.travesseiro, 1.9, 0.08, 9.9, { ry: 0.7, rz: 0.15 });
  const geoMae = new THREE.BoxGeometry(1.7, 1, 1.4, 6, 1, 5);
  geoMae.translate(0, 0.5, 0);
  const pm = geoMae.attributes.position;
  for (let i = 0; i < pm.count; i++) {
    const x = pm.getX(i);
    const z = pm.getZ(i);
    if (pm.getY(i) > 0.5) pm.setY(i, 0.14 + 0.09 * Math.sin(x * 6.1 + z * 4.3) + 0.06 * Math.cos(z * 8.7));
    if (x < -0.75) pm.setY(i, pm.getY(i) - 0.38 * (pm.getY(i) > 0.5 ? 1 : 0));
  }
  geoMae.computeVertexNormals();
  const cobMae = new THREE.Mesh(geoMae, mat(COR.cobertor));
  cobMae.position.set(1.0, 0.44, 10.2);
  cobMae.rotation.y = -0.18;
  cobMae.castShadow = true;
  cobMae.receiveShadow = true;
  g.add(cobMae);
  caixa(g, 0.4, 0.45, 0.4, COR.madeira, 2.2, 0.225, 11.3);
  const matForaMae = new THREE.MeshBasicMaterial({ color: 0x6d7177, fog: false });
  const janelaMae = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.1), matForaMae);
  janelaMae.position.set(2.49, 1.55, 10.0);
  janelaMae.rotation.y = -Math.PI / 2;
  g.add(janelaMae);
  caixa(g, 0.06, 0.08, 1.1, 0x5a5c60, 2.47, 1.55, 10.0, { sombra: false });
  caixa(g, 0.1, H, 3, 0x1d1e21, 2.55, H / 2, 10.2);
  caixa(g, 0.1, H, 3, 0x1d1e21, -0.45, H / 2, 10.2);
  caixa(g, 3, 0.1, 3, 0x1d1e21, 1.05, H + 0.05, 10.2);

  // luzes: a manhã cinza pela janela, um preenchimento fraco e o corredor quase escuro
  const solQ = luzSol(g, 0xb4bac3, 4.2, new THREE.Vector3(7, 4.6, -0.2), new THREE.Vector3(-0.8, 0.3, -1.2), 4, 1024, 0.85);
  const hemiQ = new THREE.HemisphereLight(0x80858d, 0x1c1c1c, 2.4);
  g.add(hemiQ);
  const preench = new THREE.PointLight(0xa0a6ae, 6, 8, 2);
  preench.position.set(1.4, 2.2, 0.6);
  g.add(preench);
  const corr = new THREE.PointLight(0x8a9099, 2.2, 6, 2);
  corr.position.set(1.05, 2.3, 4.6);
  g.add(corr);
  const mae = new THREE.PointLight(0x7c8189, 0.8, 4, 2);
  mae.position.set(1.4, 1.6, 10.6);
  g.add(mae);
  // lâmpada do teto do corredor (a que pisca sem energia na parte 5)
  const lampada = cilindro(g, 0.16, 0.2, 0.08, 10, 0x3a3b3e, 1.05, 2.64, 4.6, { sombra: false });

  // frase escrita na parede (parte 5): tinta vermelha, letra a letra torta
  const telaParede = document.createElement("canvas");
  telaParede.width = 1300;
  telaParede.height = 500;
  const texParede = new THREE.CanvasTexture(telaParede);
  texParede.colorSpace = THREE.SRGBColorSpace;
  // tinta legível mesmo com pouca luz (material que não depende da iluminação)
  const escrita = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.0), new THREE.MeshBasicMaterial({ map: texParede, transparent: true, color: 0xd8d8d8 }));
  escrita.position.set(-2.38, 1.55, -0.8);
  escrita.rotation.y = Math.PI / 2;
  escrita.visible = false;
  g.add(escrita);
  // escreve só os primeiros `ate` caracteres (a frase aparece enquanto ele escreve)
  function escrever(linhas, ate = Infinity) {
    const c = telaParede.getContext("2d");
    c.clearRect(0, 0, 1300, 500);
    const r = rng(5);
    c.fillStyle = "#a8141a";
    c.textBaseline = "middle";
    let n = 0;
    linhas.forEach((linha, li) => {
      let x = 40;
      const y = 130 + li * 220;
      for (const ch of linha) {
        if (n++ >= ate) break;
        c.save();
        c.font = `800 ${96 + r() * 12}px Montserrat, Arial, sans-serif`;
        c.translate(x, y + (r() - 0.5) * 14);
        c.rotate((r() - 0.5) * 0.16);
        c.fillText(ch, 0, 0);
        const w = c.measureText(ch).width;
        // escorrido de tinta
        if (ch !== " " && r() < 0.28) c.fillRect(w * (0.2 + r() * 0.5), 40, 6, 20 + r() * 70);
        c.restore();
        x += w * 0.9 + 4;
      }
    });
    texParede.needsUpdate = true;
  }

  // modos de luz: manhã nublada (parte 1), noite, manhã clara (parte 10)
  const MODOS = {
    dia: { solQ: [4.2, 0xb4bac3], hemiQ: [2.4, 0x80858d, 0x1c1c1c], preench: [6, 0xa0a6ae], corr: [2.2, 0x8a9099], mae: [3.0, 0x8a9099], matFora: 0x8d9196, matForaMae: 0x6d7177 },
    noite: { solQ: [0.7, 0x55627e], hemiQ: [0.55, 0x3a4256, 0x08080a], preench: [1.0, 0x5d6678], corr: [0.6, 0x6d7484], mae: [0.25, 0x5d6678], matFora: 0x161a22, matForaMae: 0x12151b },
    manha: { solQ: [6.5, 0xeee6d8], hemiQ: [3.0, 0xb0b2b6, 0x2a2826], preench: [7, 0xd8d4cc], corr: [2.8, 0xb0aca4], mae: [1.6, 0xb0aca4], matFora: 0xdfe2e6, matForaMae: 0xd2d5da },
  };
  const alvos = { solQ, hemiQ, preench, corr, mae, matFora, matForaMae };
  let modoAtual = null;

  return {
    grupo: g,
    fundo: 0x0c0d0f,
    nevoa: [0x0c0d0f, 8, 30],
    cama,
    celular,
    celularNoMovel,
    relogio,
    cobertor(k) {
      cobrindo.visible = k < 0.5;
      jogado.visible = k >= 0.5;
    },
    modo(nome) {
      if (nome === modoAtual) return;
      modoAtual = nome;
      aplicarLuz(alvos, MODOS[nome] || MODOS.dia);
    },
    // luz do corredor: 0 apagada, 1 acesa (a cena faz piscar)
    luzCorredor(nivel) {
      lampada.material = nivel > 0.5 ? luzPropria(0xf2e6c8) : mat(0x3a3b3e);
      corr.intensity = (MODOS[modoAtual || "dia"].corr[0]) * (0.3 + 3 * nivel);
    },
    portaLateral(abertura) {
      dobLateral.rotation.y = abertura;
    },
    // frase na parede; k de 0 a 1 = quanto dela já foi escrito
    escrita(linhas, k = 1) {
      escrita.visible = !!linhas;
      if (!linhas) return;
      const total = linhas.join("").length;
      const ate = Math.round(total * Math.min(1, Math.max(0, k)));
      if (escrita.userData.ate !== ate) {
        escrever(linhas, ate);
        escrita.userData.ate = ate;
      }
    },
    escritaPos: new THREE.Vector3(-2.38, 1.55, -0.8),
    atualizar() {},
  };
}

// Rua de casas: a casa escura do personagem (porta vermelho-escura), os vizinhos e a casinha vazia.
// Rua no eixo x (z de -4 a 4); casas do lado norte com a frente para +z.
export function criarBairro(cena) {
  const g = new THREE.Group();
  g.position.copy(DESLOCAMENTO.bairro);
  cena.add(g);
  const ceuB = ceu(g, 0x2f3236, 0x575b61);
  caixa(g, 400, 0.1, 400, COR.grama, 0, -0.05, 0, { sombra: false });
  caixa(g, 400, 0.04, 8, COR.asfalto, 0, 0.02, 0);
  for (const s of [1, -1]) {
    caixa(g, 400, 0.14, 1.8, COR.calcada, 0, 0.07, s * 4.9);
    caixa(g, 400, 0.16, 0.15, COR.meioFio, 0, 0.08, s * 4.05);
  }
  for (let x = -190; x < 190; x += 6) caixa(g, 2.6, 0.012, 0.16, COR.faixa, x, 0.045, 0, { sombra: false });

  // casa do personagem (dois andares) e vizinhos
  const casa = criarCasa(g, 11, { x: 0, z: -15, w: 10, d: 8, andares: 2, cor: 0x45474b, telhado: 0x1c1d20, janelaAberta: true, portaVermelha: true });
  const vizinhos = [
    [-22, -14, 0, 1],
    [22, -14, 0, 1],
    [-44, -14, 0, 2],
    [44, -14, 0, 1],
    [-11, 14, Math.PI, 1],
    [11, 14, Math.PI, 2],
    [33, 14, Math.PI, 1],
    [-33, 14, Math.PI, 1],
  ];
  vizinhos.forEach(([x, z, ry, andares], i) => criarCasa(g, 30 + i, { x, z, ry, andares, w: 8 + (i % 3), d: 8 }));
  // caixas de correio, cercas baixas, árvores secas, postes apagados
  for (const [x, z, ry] of [
    [3.5, -6.3, 0],
    [-18.5, -6.3, 0],
    [25.5, -6.3, 0],
    [-40.5, -6.3, 0],
    [-14.5, 6.3, Math.PI],
    [7.5, 6.3, Math.PI],
    [29.5, 6.3, Math.PI],
  ])
    criarCaixaCorreio(g, x, z, ry);
  for (const s of [1, -1]) {
    for (let x = -60; x <= 60; x += 11) {
      if (s < 0 && Math.abs(x) < 7) continue;
      caixa(g, 9.2, 0.7, 0.06, 0x3a3b3e, x + 5.5, 0.35, s * 6.2);
    }
  }
  [-16, 8, 30, -38, 52].forEach((x, i) => criarArvoreSeca(g, 70 + i, x, -7.2, 4 + (i % 2)));
  [-26, -4, 18, 40].forEach((x, i) => criarArvoreSeca(g, 80 + i, x, 7.2, 4.5));
  for (let x = -55; x <= 55; x += 22) criarPoste(g, x, -5.6, -Math.PI / 2);

  // casinha do cachorro, corrente no chão com a coleira vazia, tigela vermelha
  const casinha = new THREE.Group();
  casinha.position.set(-7.6, 0, -9.2);
  casinha.rotation.y = 0.5;
  caixa(casinha, 1.1, 0.85, 1.2, 0x3c3a38, 0, 0.42, 0);
  telhado(casinha, 1.4, 0.55, 1.45, 0x2a2b2e, 0, 0.85, 0, { ry: Math.PI / 2 });
  caixa(casinha, 0.5, 0.55, 0.02, 0x050505, 0, 0.3, 0.61, { sombra: false });
  g.add(casinha);
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7.25, 0.05, -8.6),
    new THREE.Vector3(-6.9, 0.03, -8.1),
    new THREE.Vector3(-6.95, 0.03, -7.6),
    new THREE.Vector3(-6.5, 0.03, -7.3),
    new THREE.Vector3(-6.2, 0.03, -7.45),
  ]);
  const corrente = new THREE.Mesh(new THREE.TubeGeometry(curva, 40, 0.02, 4), mat(0x6a6c70, { metal: 0.6, aspereza: 0.4 }));
  corrente.castShadow = true;
  g.add(corrente);
  const coleira = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 4, 10), mat(0x101010));
  coleira.position.set(-6.05, 0.03, -7.5);
  coleira.rotation.x = -Math.PI / 2;
  g.add(coleira);
  cilindro(g, 0.17, 0.12, 0.09, 10, COR.vermelho, -6.75, 0.045, -8.95);

  // carros largados na rua
  const carros = [];
  for (const [x, z, ry, sem, porta] of [
    [6.5, 1.6, 0.22, 3, 0.9],
    [-17, -1.9, -0.08, 4, 0],
    [24, 2.0, 0.5, 5, 0.7],
    [-34, 1.5, 3.1, 6, 0],
  ]) {
    const c = criarCarro(sem, { portaAberta: porta });
    c.position.set(x, 0, z);
    c.rotation.y = ry;
    g.add(c);
    carros.push(c);
  }

  const hemiB = new THREE.HemisphereLight(0x8d9298, 0x1a1b1c, 1.5);
  g.add(hemiB);
  const solB = luzSol(g, 0xb7bcc4, 1.4, new THREE.Vector3(-30, 40, 25), new THREE.Vector3(0, 0, -6), 40, 2048, 0.7);

  // mundo normal (parte 10): cachorro na casinha, carros estacionados direito e um passando
  const cachorro = criarCachorro();
  cachorro.position.set(-6.6, 0, -8.2);
  cachorro.rotation.y = 0.9;
  cachorro.visible = false;
  g.add(cachorro);
  const passando = criarCarro(41, { cor: 0x55575c });
  passando.visible = false;
  g.add(passando);
  const estacionados = [];
  for (const [x, z, ry, sem] of [[-17, -2.9, 0, 4], [24, 2.9, Math.PI, 5]]) {
    const c = criarCarro(sem);
    c.position.set(x, 0, z);
    c.rotation.y = ry;
    c.visible = false;
    g.add(c);
    estacionados.push(c);
  }

  const MODOS = {
    dia: { hemiB: [1.5, 0x8d9298, 0x1a1b1c], solB: [1.4, 0xb7bcc4] },
    manha: { hemiB: [2.6, 0xc2c6cc, 0x2a2a28], solB: [3.2, 0xf2ebdd] },
  };
  const ESTILO = {
    dia: { fundo: 0x50545a, nevoa: [0x50545a, 16, 110], ceu: [0x2f3236, 0x575b61] },
    manha: { fundo: 0xc9ced4, nevoa: [0xc4c9cf, 40, 220], ceu: [0x8f99a6, 0xd2d6db] },
  };
  const ret = {
    grupo: g,
    fundo: 0x50545a,
    nevoa: [0x50545a, 16, 110],
    casa,
    cachorro,
    passando,
    // ponto do andar de cima, atrás da janela do meio, onde o personagem aparece
    janelaDoQuarto: new THREE.Vector3(0, 3.0, -11.6),
    modo(nome) {
      if (nome === ret.modoAtual) return;
      ret.modoAtual = nome;
      const e = ESTILO[nome] || ESTILO.dia;
      aplicarLuz({ hemiB, solB }, MODOS[nome] || MODOS.dia);
      ret.fundoAtual = e.fundo;
      ret.nevoaAtual = e.nevoa;
      ceuB.userData.pintar(...e.ceu);
      const normal = nome === "manha";
      for (const c of carros) c.visible = !normal;
      for (const c of estacionados) c.visible = normal;
      cachorro.visible = normal;
      passando.visible = normal;
    },
    atualizar() {},
  };
  return ret;
}

// Cachorro low-poly (sentado, late mexendo a cabeça): cachorro.userData.latir(k)
export function criarCachorro() {
  const g = new THREE.Group();
  const cor = 0x6a5f55;
  const corpo = caixa(g, 0.32, 0.3, 0.62, cor, 0, 0.42, -0.05, { rx: -0.35 });
  const cabeca = new THREE.Group();
  cabeca.position.set(0, 0.7, 0.2);
  g.add(cabeca);
  caixa(cabeca, 0.26, 0.24, 0.26, cor, 0, 0, 0);
  const focinho = caixa(cabeca, 0.16, 0.12, 0.18, 0x5a5048, 0, -0.05, 0.18);
  caixa(cabeca, 0.06, 0.04, 0.04, 0x0d0d0d, 0, -0.01, 0.28, { sombra: false });
  for (const lado of [1, -1]) {
    caixa(cabeca, 0.07, 0.14, 0.05, 0x3e3731, lado * 0.12, 0.13, -0.04, { rz: lado * 0.3 });
    caixa(cabeca, 0.035, 0.035, 0.02, 0x0d0d0d, lado * 0.07, 0.04, 0.13, { sombra: false });
    caixa(g, 0.08, 0.36, 0.08, cor, lado * 0.1, 0.18, 0.16);
    caixa(g, 0.1, 0.12, 0.3, cor, lado * 0.12, 0.08, -0.22);
  }
  const rabo = caixa(g, 0.05, 0.05, 0.28, cor, 0, 0.3, -0.42, { rx: 0.6 });
  g.userData.latir = (t) => {
    const k = Math.max(0, Math.sin(t * 9));
    cabeca.rotation.x = -0.25 * k;
    focinho.position.y = -0.05 - 0.04 * k;
    rabo.rotation.y = 0.5 * Math.sin(t * 14);
  };
  return g;
}

// Centro vazio: avenida no eixo z (rumo -z), cruzamentos em z = -30 e z = -90,
// carros e ônibus largados, semáforos no vermelho e, no fim da avenida, a torre com uma janela acesa.
export function criarCidade(cena) {
  const g = new THREE.Group();
  g.position.copy(DESLOCAMENTO.cidade);
  cena.add(g);
  const r = rng(2026);
  const ceuC = ceu(g, 0x24272b, 0x4d5157);
  caixa(g, 600, 0.1, 600, 0x18191b, 0, -0.05, -80, { sombra: false });
  caixa(g, 14, 0.04, 170, COR.asfalto, 0, 0.02, -25);
  for (const zc of [-30, -90]) caixa(g, 260, 0.045, 12, COR.asfalto, 0, 0.022, zc);
  for (const s of [1, -1]) {
    for (const [z0, z1] of [
      [60, -24],
      [-36, -84],
    ]) {
      caixa(g, 3, 0.15, z0 - z1, COR.calcada, s * 8.5, 0.075, (z0 + z1) / 2);
      caixa(g, 0.15, 0.17, z0 - z1, COR.meioFio, s * 7.05, 0.085, (z0 + z1) / 2);
    }
  }
  for (let z = 56; z > -96; z -= 7) {
    if (Math.abs(z + 30) < 7 || Math.abs(z + 90) < 7) continue;
    caixa(g, 0.18, 0.012, 3, COR.faixa, 0, 0.045, z, { sombra: false });
  }
  for (const zc of [-30, -90]) {
    for (let x = -5.5; x <= 5.5; x += 1.1) caixa(g, 0.55, 0.012, 3, 0x8a8b8d, x, 0.046, zc + 7.6, { sombra: false });
  }

  // prédios da avenida, com janelas na fachada
  const janelas = new Janelas(g);
  for (const s of [1, -1]) {
    for (const [z0, z1] of [
      [60, -24],
      [-36, -84],
    ]) {
      let z = z0;
      while (z > z1 + 6) {
        const w = 8 + Math.floor(r() * 7);
        const largura = Math.min(w, z - z1);
        const h = 10 + Math.floor(r() * 26);
        const d = 12 + Math.floor(r() * 6);
        criarPredio(g, janelas, {
          x: s * (10.2 + d / 2),
          z: z - largura / 2,
          ry: -s * Math.PI / 2,
          w: largura - 0.4,
          h,
          d,
          cor: COR.predios[Math.floor(r() * COR.predios.length)],
          caixaDagua: r() > 0.6,
        });
        z -= largura;
      }
    }
  }
  // quarteirões de fundo, para a vista do alto
  for (let i = 0; i < 140; i++) {
    const s = r() > 0.5 ? 1 : -1;
    const x = s * (32 + r() * 120);
    const z = 50 - r() * 260;
    const w = 10 + r() * 14;
    const d = 10 + r() * 14;
    const h = 6 + Math.pow(r(), 1.6) * 44;
    caixa(g, w, h, d, COR.predios[Math.floor(r() * COR.predios.length)], x, h / 2, z);
  }

  // a torre no fim da avenida: todas as janelas escuras, menos uma
  const torre = criarPredio(g, janelas, {
    x: 0,
    z: -110,
    w: 24,
    h: 60,
    d: 16,
    cor: 0x2b2d31,
    passoX: 3.4,
    passoY: 3.6,
    janela: { w: 1.8, h: 2.3 },
    pular: (i, j) => i === 2 && j === 10,
  });
  const grade = torre.userData.grade;
  const acesa = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.3), luzPropria(COR.janelaAcesa));
  acesa.position.set(grade.x0 + 2 * grade.passoX, 5.2 + 10 * grade.passoY, 8.07);
  torre.add(acesa);
  const brilhoJanela = new THREE.PointLight(COR.janelaAcesa, 8, 7, 2);
  brilhoJanela.position.set(acesa.position.x, acesa.position.y, 9.2);
  torre.add(brilhoJanela);
  caixa(torre, 12, 6, 10, 0x26282b, 0, 61, 0);
  cilindro(torre, 0.12, 0.2, 9, 5, COR.poste, 2, 68.5, 0);
  const farol = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), luzPropria(COR.vermelho));
  farol.position.set(2, 73.2, 0);
  torre.add(farol);
  // prédio que fecha o começo da avenida (atrás de quem olha para a torre): o telhado da parte 6
  const telhadoPredio = criarPredio(g, janelas, { x: 0, z: 78, ry: Math.PI, w: 26, h: 28, d: 14, cor: 0x2d2f33, caixaDagua: true });
  for (const [w, d, x, z] of [[26, 0.3, 0, -6.85], [26, 0.3, 0, 6.85], [0.3, 14, 12.85, 0], [0.3, 14, -12.85, 0]]) {
    caixa(telhadoPredio, w, 0.9, d, 0x26282b, x, 28.45, z);
  }
  caixa(telhadoPredio, 3, 2.6, 3, 0x2a2b2e, -8, 29.3, 2);
  janelas.fechar();

  // carros largados (alguns com porta aberta, um com o pisca-alerta ligado)
  const carros = [];
  for (const [x, z, ry, sem, porta, alerta] of [
    [-3.2, -2, 0.14, 11, 0.95, false],
    [3.4, -11, -0.3, 12, 0, true],
    [-1.2, -19, 0.65, 13, 0.7, false],
    [3.6, -41, 1.2, 14, 0, false],
    [-3.4, -52, -0.12, 15, 1.0, false],
    [2.2, -63, 0.22, 16, 0, false],
    [-2.6, -74, -0.4, 17, 0.8, false],
    [5.8, 8, 1.75, 20, 0, false],
  ]) {
    const c = criarCarro(sem, { portaAberta: porta, alerta });
    c.position.set(x, 0, z);
    c.rotation.y = ry + Math.PI / 2;
    g.add(c);
    carros.push(c);
  }
  const onibus = criarOnibus(1);
  onibus.position.set(-2, 0, -31);
  onibus.rotation.y = 0.45;
  g.add(onibus);

  // semáforos travados no vermelho, postes apagados, lixo e papéis no chão
  const semaforos = [
    criarSemaforo(g, 7.6, -22.6, 0, true),
    criarSemaforo(g, -7.6, -37.4, Math.PI),
    criarSemaforo(g, 7.6, -82.6, 0, true),
  ];
  const postes = [];
  for (let z = 50; z > -90; z -= 18) {
    postes.push(criarPoste(g, 7.9, z, Math.PI));
    postes.push(criarPoste(g, -7.9, z - 9, 0));
  }
  const limiarPoste = postes.map(() => r());

  // fumaça dos motores ligados (parte 2): baforadas que sobem e somem
  const fumacas = [];
  const geoFumaca = new THREE.IcosahedronGeometry(0.2, 0);
  for (const c of [0, 1, 2, 4, 6]) {
    for (let k = 0; k < 6; k++) {
      const m = new THREE.Mesh(geoFumaca, new THREE.MeshStandardMaterial({ color: 0x9a9da2, transparent: true, opacity: 0, roughness: 1, flatShading: true, depthWrite: false }));
      m.visible = false;
      g.add(m);
      fumacas.push({ m, c, k });
    }
  }
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.38), mat(0x8e8f91));
    m.rotation.set(-Math.PI / 2, 0, r() * Math.PI);
    m.position.set((r() - 0.5) * 16, 0.05, 30 - r() * 120);
    m.receiveShadow = true;
    g.add(m);
  }
  for (let i = 0; i < 14; i++) {
    const s = r() > 0.5 ? 1 : -1;
    cilindro(g, 0.32, 0.28, 0.9, 7, 0x2e3033, s * 9.4, 0.45, 40 - i * 13);
  }

  // manhã nublada: luz mais de cima e sombras fracas, para a rua não sumir na sombra dos prédios
  const hemiC = new THREE.HemisphereLight(0x8a8f96, 0x1e1f21, 2.6);
  g.add(hemiC);
  const sol = luzSol(g, 0xb8bdc5, 1.7, new THREE.Vector3(-18, 90, 30), new THREE.Vector3(0, 0, -20), 70, 2048, 0.5);

  // modos: dia (nublado), entardecer (sol baixo avermelhado) e noite (tudo escuro, só a janela da torre)
  const MODOS = {
    dia: { hemiC: [2.6, 0x8a8f96, 0x1e1f21], sol: [1.7, 0xb8bdc5], brilhoJanela: [8, COR.janelaAcesa] },
    entardecer: { hemiC: [1.5, 0x8a6a62, 0x1a1414], sol: [1.6, 0xd27a5a], brilhoJanela: [8, COR.janelaAcesa] },
    noite: { hemiC: [0.85, 0x2c3548, 0x050506], sol: [0.45, 0x7d8cab], brilhoJanela: [10, COR.janelaAcesa] },
  };
  const ESTILO = {
    dia: { fundo: 0x484c52, nevoa: [0x4c5056, 40, 300], ceu: [0x24272b, 0x4d5157], sol: [-18, 90, 30] },
    entardecer: { fundo: 0x5a3a34, nevoa: [0x4a3634, 40, 260], ceu: [0x231a1d, 0x8a4a3a], sol: [-80, 22, -60] },
    noite: { fundo: 0x0b0d12, nevoa: [0x0b0d12, 30, 210], ceu: [0x040506, 0x11141b], sol: [-30, 80, 20] },
  };
  let luzesCidade = 0;
  let semaforosLigados = true;
  let fumacaLigada = false;
  const ret = {
    grupo: g,
    fundo: 0x484c52,
    nevoa: [0x4c5056, 40, 300],
    torre,
    sol,
    janelas,
    telhado: new THREE.Vector3(0, 28.15, 72.2),
    modo(nome) {
      if (nome === ret.modoAtual) return;
      ret.modoAtual = nome;
      const e = ESTILO[nome] || ESTILO.dia;
      aplicarLuz({ hemiC, sol, brilhoJanela }, MODOS[nome] || MODOS.dia);
      sol.position.set(...e.sol).add(sol.target.position);
      ret.fundoAtual = e.fundo;
      ret.nevoaAtual = e.nevoa;
      ceuC.userData.pintar(...e.ceu);
    },
    // fração das luzes da cidade acesas (janelas e postes), de 0 a 1
    luzes(nivel) {
      luzesCidade = nivel;
      janelas.acender(nivel);
      postes.forEach((p, i) => p.userData.acender(limiarPoste[i] < nivel));
    },
    semaforos(on) {
      if (on === semaforosLigados) return;
      semaforosLigados = on;
      for (const s of semaforos) s.userData.ligar(on);
    },
    fumaca(on) {
      fumacaLigada = on;
    },
    atualizar(t) {
      // pisca-alerta: 0.45 s aceso a cada 0.9 s (só de dia; à noite a bateria já acabou)
      const aceso = t % 0.9 < 0.45 && ret.modoAtual !== "noite";
      for (const c of carros) {
        if (!c.userData.alerta) continue;
        for (const l of c.userData.lanternas) l.material = aceso ? luzPropria(COR.vermelho) : mat(COR.vermelhoEscuro);
      }
      // farol de aviso no topo da torre: 0.5 s a cada 2 s (desliga junto com a cidade)
      farol.visible = t % 2 < 0.5 && semaforosLigados;
      // fumaça: cada baforada vive 1.6 s, sai do escapamento e sobe
      for (const f of fumacas) {
        f.m.visible = fumacaLigada;
        if (!fumacaLigada) continue;
        const car = carros[f.c];
        const idade = (t + f.k * 0.27 + f.c * 0.13) % 1.6;
        const p = new THREE.Vector3(-2.2 - idade * 0.7, 0.35 + idade * 0.55, 0.55 + Math.sin(idade * 3 + f.k) * 0.08);
        car.localToWorld(p);
        g.worldToLocal(p);
        f.m.position.copy(p);
        f.m.scale.setScalar(0.6 + idade * 1.5);
        f.m.material.opacity = 0.5 * (1 - idade / 1.6);
      }
    },
  };
  ret.luzes(luzesCidade);
  return ret;
}
