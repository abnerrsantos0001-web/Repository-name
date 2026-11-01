// Cenários do vídeo 2 ("E se o seu reflexo parasse de te copiar?"), no mesmo estilo low-poly do vídeo 1,
// mais cheios e mais claros: banheiro, quarto, cozinha, rua da padaria e o ônibus por dentro.
//
// Espelhos de verdade: o banheiro (e a cozinha) são montados duas vezes. A cópia espelhada (escala z = -1)
// fica atrás da parede do espelho, e o espelho é um vão nessa parede com um vidro quase invisível na frente.
// Tudo o que muda na cena (luz, porta, lençol...) é aplicado nas duas cópias; o reflexo do personagem é um
// segundo boneco dentro da cópia espelhada (o motor cuida dele), por isso ele pode atrasar, piscar e sorrir
// fora de hora, e até atravessar o vidro.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
import { COR, mat, caixa, cilindro, parede, luzPropria, criarRelogio, desenharSeteSegmentos, ceu, criarCarro, criarOnibus, rng, DESLOCAMENTO } from "./mundo.js";
import { EspelhoPlano, materialVidro } from "./reflexo.js";

// posições dos cenários do vídeo 2 (longe dos do vídeo 1 e uns dos outros)
Object.assign(DESLOCAMENTO, {
  banheiro: new THREE.Vector3(1000, 0, 0),
  quarto2: new THREE.Vector3(1000, 0, 100),
  cozinha: new THREE.Vector3(1000, 0, 200),
  rua: new THREE.Vector3(1300, 0, 0),
  onibus: new THREE.Vector3(1600, 0, 0),
});

// ------------------------------------------------------------ utilidades
// objeto nomeado (um móvel = um grupo): o checador de colisões trata cada grupo como uma peça só
function obj(pai, nome, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.Group();
  g.name = nome;
  g.position.set(x, y, z);
  g.rotation.y = ry;
  pai.add(g);
  return g;
}
// marca peças que podem ser atravessadas/encostadas sem contar como colisão (chão, tapete, teto, luz)
function passavel(m) {
  m.traverse((o) => (o.userData.passavel = true));
  return m;
}

// textura de azulejo/ladrilho em canvas, em alta (1024 px), com mipmaps e filtro anisotrópico
const cacheTex = new Map();
export function texturaAzulejo(cor, rejunte, { colunas = 4, linhas = 4, chanfro = 0.06, ruido = 0.04, semente = 1 } = {}) {
  const k = [cor, rejunte, colunas, linhas, chanfro, ruido, semente].join("|");
  if (cacheTex.has(k)) return cacheTex.get(k);
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  const r = rng(semente);
  g.fillStyle = "#" + new THREE.Color(rejunte).getHexString();
  g.fillRect(0, 0, 1024, 1024);
  const base = new THREE.Color(cor);
  const lw = 1024 / colunas;
  const lh = 1024 / linhas;
  const rj = Math.max(3, lw * 0.035);
  for (let i = 0; i < colunas; i++) {
    for (let j = 0; j < linhas; j++) {
      const v = 1 + (r() - 0.5) * ruido * 2;
      const cc = base.clone().multiplyScalar(v);
      g.fillStyle = "#" + cc.getHexString();
      g.fillRect(i * lw + rj / 2, j * lh + rj / 2, lw - rj, lh - rj);
      // chanfro claro em cima/esquerda, escuro embaixo/direita: o azulejo tem volume
      g.fillStyle = "rgba(255,255,255,0.10)";
      g.fillRect(i * lw + rj / 2, j * lh + rj / 2, lw - rj, lh * chanfro);
      g.fillStyle = "rgba(0,0,0,0.08)";
      g.fillRect(i * lw + rj / 2, (j + 1) * lh - rj / 2 - lh * chanfro, lw - rj, lh * chanfro);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  cacheTex.set(k, t);
  return t;
}
// material com textura repetida em blocos de "passo" metros, para uma face de w x h
function matTextura(tex, w, h, passo, o = {}) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(w / passo, h / passo);
  return new THREE.MeshLambertMaterial({ map: t, color: o.cor ?? 0xffffff });
}
// parede (com vãos) revestida por textura; mesma lógica de parede() do vídeo 1
function paredeTex(pai, { w, h, e = 0.12, x = 0, y = 0, z = 0, ry = 0, furos = [], tex, passo = 0.3, cor = 0xffffff, nome = "parede" }) {
  const g = new THREE.Group();
  g.name = nome;
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const xs = [...new Set([-w / 2, w / 2, ...furos.flatMap((f) => [f.x0, f.x1])])].sort((a, b) => a - b);
  const ys = [...new Set([0, h, ...furos.flatMap((f) => [f.y0, f.y1])])].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2;
      const cy = (ys[j] + ys[j + 1]) / 2;
      if (furos.some((f) => cx > f.x0 && cx < f.x1 && cy > f.y0 && cy < f.y1)) continue;
      const pw = xs[i + 1] - xs[i];
      const ph = ys[j + 1] - ys[j];
      const m = tex ? matTextura(tex, pw, ph, passo, { cor }) : mat(cor);
      if (tex) {
        // alinha o desenho do azulejo entre os pedaços da parede
        m.map.offset.set((xs[i] + w / 2) / passo, ys[j] / passo);
      }
      caixa(g, pw, ph, e, cor, cx, cy, 0, { material: m });
    }
  }
  pai.add(g);
  return g;
}
// placa com desenho em canvas de alta resolução (texto nítido, de perto e de lado)
export function placa(pai, w, h, desenhar, o = {}) {
  const ppm = o.ppm ?? 900; // pixels por metro
  const c = document.createElement("canvas");
  c.width = Math.min(2048, Math.max(64, Math.round(ppm * w)));
  c.height = Math.min(2048, Math.max(64, Math.round(ppm * h)));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    o.propria
      ? new THREE.MeshBasicMaterial({ map: tex, transparent: !!o.transparente, toneMapped: false })
      : new THREE.MeshStandardMaterial({ map: tex, transparent: !!o.transparente, roughness: o.aspereza ?? 0.8 }),
  );
  m.receiveShadow = true;
  pai.add(m);
  m.userData.redesenhar = (...a) => {
    const g = c.getContext("2d");
    g.save();
    g.clearRect(0, 0, c.width, c.height);
    // mundo espelhado (partes 8 e 9): todo texto sai ao contrário
    if (o.espelhado) {
      g.translate(c.width, 0);
      g.scale(-1, 1);
    }
    desenhar(g, c.width, c.height, ...a);
    g.restore();
    tex.needsUpdate = true;
  };
  m.userData.redesenhar();
  return m;
}
// luz pontual sem sombra (preenchimento)
function luzPonto(pai, cor, intensidade, x, y, z, alcance = 8, decaimento = 1.6) {
  const l = new THREE.PointLight(cor, intensidade, alcance, decaimento);
  l.position.set(x, y, z);
  pai.add(l);
  return l;
}
// spot com sombra suave (uma por cômodo: a luz principal)
function luzSpot(pai, cor, intensidade, de, para, angulo = 1.1, mapa = 1024, alcance = 14) {
  const l = new THREE.SpotLight(cor, intensidade, alcance, angulo, 0.6, 1.4);
  l.position.copy(de);
  l.target.position.copy(para);
  l.castShadow = true;
  l.shadow.mapSize.set(mapa, mapa);
  l.shadow.bias = -0.0005;
  l.shadow.normalBias = 0.02;
  l.shadow.radius = 3;
  l.shadow.camera.near = 0.2;
  pai.add(l);
  pai.add(l.target);
  return l;
}
// garrafa/frasco simples
function frasco(pai, r, h, cor, x, y, z, tampa = 0x2b2c30) {
  const g = obj(pai, "frasco", x, y, z);
  cilindro(g, r, r, h, 10, cor, 0, h / 2, 0, { aspereza: 0.4 });
  cilindro(g, r * 0.45, r * 0.55, h * 0.18, 8, tampa, 0, h + h * 0.09, 0);
  return g;
}
// pano dobrado/caído (lençol, toalha): caixa subdividida com ondas
function pano(w, h, d, cor, ondas = 0.03, semente = 3, o = {}) {
  const geo = new THREE.BoxGeometry(w, h, d, 10, 14, 1);
  const pos = geo.attributes.position;
  const r = rng(semente);
  const fase = r() * 6;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, pos.getZ(i) + ondas * Math.sin(x * 18 + fase) * (0.5 + 0.5 * Math.sin(y * 3 + fase)));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(cor, { aspereza: 0.95, lado: o.lado }));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
// cria a cópia espelhada de um cômodo: mesmo construtor, escala z = -1, encostada no plano do espelho
function comEspelho(cena, nome, construir, zEspelho) {
  const o = DESLOCAMENTO[nome];
  const real = new THREE.Group();
  real.name = nome;
  real.position.copy(o);
  cena.add(real);
  const esp = new THREE.Group();
  esp.name = nome + "-espelho";
  esp.position.set(o.x, o.y, o.z + 2 * zEspelho);
  esp.scale.set(1, 1, -1);
  cena.add(esp);
  const a = construir(real, false);
  const b = construir(esp, true);
  // desempenho: no mundo do espelho só a luz principal do cômodo projeta sombra
  esp.traverse((o) => {
    if (o.isLight && o.castShadow && !o.userData.principal) o.castShadow = false;
  });
  return { real, esp, a, b };
}

// ------------------------------------------------------------ banheiro
// Cômodo: x de -1.7 a 1.7, z de -1.5 a 1.5, pé-direito 2.6. Espelho na parede z = -1.5 (vão x ±0.5, y 1.0 a 1.95),
// pia embaixo dele, vaso à direita (x+), box à esquerda (x-), janelinha alta na parede x+, porta na parede z+.
export const BANHEIRO = {
  zEspelho: -1.5,
  espelho: { x0: -0.5, x1: 0.5, y0: 1.0, y1: 1.95 },
  bancada: 0.85, // altura do tampo da pia
  pia: [0, 0.88, -1.17], // centro da cuba
  secador: [0.8, 1.32, -1.43],
};
export function criarBanheiro(cena) {
  const H = 2.6;
  const E = BANHEIRO.espelho;
  const azulejo = texturaAzulejo(0xd7dce0, 0xb3b9be, { colunas: 4, linhas: 4, semente: 7 });
  const piso = texturaAzulejo(0x6f747b, 0x4e5257, { colunas: 3, linhas: 3, semente: 11, ruido: 0.07 });
  const pastilha = texturaAzulejo(0x9fb1bb, 0x7f8f98, { colunas: 8, linhas: 8, semente: 5, ruido: 0.08 });

  function construir(g, espelhado) {
    const api = {};
    // chão, teto e paredes
    const chao = passavel(obj(g, "chao"));
    caixa(chao, 3.4, 0.1, 3.0, 0xffffff, 0, -0.05, 0, { material: matTextura(piso, 3.4, 3.0, 0.45, { aspereza: 0.35 }) });
    const teto = passavel(obj(g, "teto"));
    caixa(teto, 3.4, 0.08, 3.0, 0xd9dbdc, 0, H + 0.04, 0);
    if (!espelhado) {
      // parede do espelho: fina, para o vão não virar um "túnel" atrás do vidro
      paredeTex(g, { w: 3.4, h: H, e: 0.02, z: BANHEIRO.zEspelho - 0.01, tex: azulejo, furos: [E], nome: "parede-espelho" });
    }
    paredeTex(g, { w: 3.0, h: H, x: -1.76, ry: Math.PI / 2, tex: azulejo, nome: "parede-oeste" });
    paredeTex(g, { w: 3.0, h: H, x: 1.76, ry: -Math.PI / 2, tex: azulejo, furos: [{ x0: -0.35, x1: 0.3, y0: 1.75, y1: 2.3 }], nome: "parede-leste" });
    paredeTex(g, { w: 3.4, h: H, z: 1.56, ry: Math.PI, tex: azulejo, furos: [{ x0: -0.75, x1: 0.1, y0: 0, y1: 2.05 }], nome: "parede-porta" });
    // faixa de pastilhas na altura da pia
    const faixa = passavel(obj(g, "faixa"));
    for (const [x0, x1] of [[-1.69, E.x0 - 0.06], [E.x1 + 0.06, 1.69]]) {
      caixa(faixa, x1 - x0, 0.18, 0.012, 0xffffff, (x0 + x1) / 2, 1.45, BANHEIRO.zEspelho + 0.006, { material: matTextura(pastilha, x1 - x0, 0.18, 0.09) });
    }

    // gabinete da pia, tampo, cuba, torneira
    const pia = obj(g, "pia");
    caixa(pia, 1.1, 0.78, 0.5, 0x4d525a, 0, 0.42, -1.25);
    caixa(pia, 1.1, 0.04, 0.5, 0x2e3136, 0, 0.02, -1.25); // rodapé
    for (const x of [-0.275, 0.275]) {
      caixa(pia, 0.53, 0.7, 0.012, 0x575d66, x, 0.43, -0.996, { sombra: false });
      caixa(pia, 0.012, 0.16, 0.02, 0xb9bcc0, x + (x < 0 ? 0.22 : -0.22), 0.6, -0.985, { aspereza: 0.3, metal: 0.6 });
    }
    caixa(pia, 1.14, 0.05, 0.54, 0xe9e8e4, 0, 0.835, -1.23, { aspereza: 0.35 });
    const cuba = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.15, 0.12, 20, 1, true), mat(0xf1f0ec, { aspereza: 0.3, lado: THREE.DoubleSide }));
    cuba.position.set(0, 0.92, -1.17);
    cuba.castShadow = cuba.receiveShadow = true;
    pia.add(cuba);
    cilindro(pia, 0.15, 0.15, 0.01, 20, 0xcfd2d4, 0, 0.866, -1.17, { aspereza: 0.3 });
    cilindro(pia, 0.022, 0.026, 0.26, 10, 0xc4c7ca, 0, 0.99, -1.43, { aspereza: 0.2, metal: 0.8 });
    cilindro(pia, 0.016, 0.016, 0.15, 8, 0xc4c7ca, 0, 1.11, -1.36, { aspereza: 0.2, metal: 0.8, rx: Math.PI / 2 });
    cilindro(pia, 0.012, 0.012, 0.04, 8, 0xc4c7ca, 0, 1.09, -1.29, { aspereza: 0.2, metal: 0.8 });
    caixa(pia, 0.02, 0.02, 0.1, 0xc4c7ca, 0.06, 1.1, -1.43, { aspereza: 0.2, metal: 0.8, ry: 0.5 });
    // água da torneira (lava o rosto)
    const jato = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.55, roughness: 0.05, emissive: 0x6f8a96, emissiveIntensity: 0.3 }));
    jato.position.set(0, 0.975, -1.29);
    jato.visible = false;
    jato.userData.passavel = true;
    pia.add(jato);
    api.torneira = (aberta) => (jato.visible = aberta);
    // coisas da pia (caem na parte 7): copo com escovas, saboneteira, perfume
    const coisas = [];
    const copo = obj(pia, "copo", 0.4, 0.86, -1.36);
    cilindro(copo, 0.036, 0.03, 0.1, 12, 0x7fa7ba, 0, 0.05, 0, { aspereza: 0.35 });
    caixa(copo, 0.012, 0.18, 0.012, 0xc4161c, 0.012, 0.12, 0, { rz: 0.12 });
    caixa(copo, 0.012, 0.18, 0.012, 0xe6e6e2, -0.012, 0.12, 0.01, { rz: -0.1 });
    coisas.push(copo);
    const sabao = frasco(pia, 0.032, 0.13, 0xe7e2d6, -0.42, 0.86, -1.36, 0x8f9499);
    coisas.push(sabao);
    const perfume = frasco(pia, 0.025, 0.09, 0x6b7f86, -0.3, 0.86, -1.42, 0x1e1f22);
    coisas.push(perfume);
    api.coisas = coisas;
    // posições de repouso e queda (parte 7): cada coisa sai da pia e para no chão
    const quedas = [
      { o: copo, de: [0.4, 0.86, -1.36], para: [0.62, 0.0, -0.7], giro: [1.4, 0.3, 1.57] },
      { o: sabao, de: [-0.42, 0.86, -1.36], para: [-0.7, 0.0, -0.55], giro: [0.2, 0.9, -1.57] },
      { o: perfume, de: [-0.3, 0.86, -1.42], para: [-0.25, 0.0, -0.45], giro: [1.57, 0.5, 0.2] },
    ];
    api.derrubar = (k) => {
      for (const [i, q] of quedas.entries()) {
        const kk = THREE.MathUtils.clamp(k * 1.3 - i * 0.15, 0, 1);
        const x = q.de[0] + (q.para[0] - q.de[0]) * kk;
        const z = q.de[2] + (q.para[2] - q.de[2]) * kk;
        // arco: sobe um pouco e cai com gravidade
        const y = q.de[1] + (q.para[1] - q.de[1]) * kk * kk + 0.12 * Math.sin(Math.PI * Math.min(1, kk * 1.2)) * (1 - kk);
        q.o.position.set(x, y, z);
        q.o.rotation.set(q.giro[0] * kk, q.giro[1] * kk, q.giro[2] * kk);
      }
    };

    // espelho: moldura, luz em cima (o vidro só existe no cômodo de verdade)
    const moldura = obj(g, "moldura");
    const zM = BANHEIRO.zEspelho + 0.015;
    const cm = 0x26272a;
    caixa(moldura, E.x1 - E.x0 + 0.1, 0.05, 0.03, cm, 0, E.y1 + 0.025, zM);
    caixa(moldura, E.x1 - E.x0 + 0.1, 0.05, 0.03, cm, 0, E.y0 - 0.025, zM);
    caixa(moldura, 0.05, E.y1 - E.y0, 0.03, cm, E.x0 - 0.025, (E.y0 + E.y1) / 2, zM);
    caixa(moldura, 0.05, E.y1 - E.y0, 0.03, cm, E.x1 + 0.025, (E.y0 + E.y1) / 2, zM);
    const barra = obj(g, "luz-espelho");
    caixa(barra, 0.8, 0.05, 0.07, 0x2b2c2f, 0, 2.08, BANHEIRO.zEspelho + 0.035);
    const lampEsp = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.02, 0.05), new THREE.MeshStandardMaterial({ color: 0x55575a, emissive: 0xfff1dc, emissiveIntensity: 0 }));
    lampEsp.position.set(0, 2.05, BANHEIRO.zEspelho + 0.04);
    barra.add(lampEsp);


    // secador de cabelo no gancho (a arma da parte 7)
    const secador = obj(g, "secador", ...BANHEIRO.secador);
    caixa(secador, 0.03, 0.05, 0.03, 0x8a8d91, 0, 0.12, 0.0); // gancho
    const corpoSec = new THREE.Group();
    corpoSec.position.set(0, 0, 0.07);
    secador.add(corpoSec);
    cilindro(corpoSec, 0.045, 0.05, 0.2, 12, 0x3a3f47, 0, 0.0, 0.0, { rx: Math.PI / 2 }); // corpo (aponta para z+)
    cilindro(corpoSec, 0.03, 0.04, 0.06, 12, 0x1f2125, 0, 0, 0.12, { rx: Math.PI / 2 }); // bico
    caixa(corpoSec, 0.035, 0.16, 0.045, 0x3a3f47, 0, -0.1, -0.03, { rx: 0.25 }); // cabo
    api.secador = secador;
    api.corpoSecador = corpoSec;

    // vaso sanitário (x+)
    const vaso = obj(g, "vaso", 1.25, 0, -1.0);
    cilindro(vaso, 0.15, 0.13, 0.36, 14, 0xf1f0ec, 0, 0.18, 0.05, { aspereza: 0.3 });
    const bacia = cilindro(vaso, 0.2, 0.17, 0.08, 16, 0xf1f0ec, 0, 0.38, 0.12, { aspereza: 0.3 });
    bacia.scale.set(1, 1, 1.25);
    const assento = cilindro(vaso, 0.21, 0.21, 0.025, 16, 0xe2e1dc, 0, 0.435, 0.12, { aspereza: 0.35 });
    assento.scale.set(1, 1, 1.25);
    caixa(vaso, 0.44, 0.38, 0.18, 0xf1f0ec, 0, 0.62, -0.38, { aspereza: 0.3 }); // caixa acoplada
    caixa(vaso, 0.46, 0.035, 0.2, 0xe2e1dc, 0, 0.83, -0.38);
    // papel higiênico
    const papel = obj(g, "papel", 1.66, 0.75, -0.4);
    caixa(papel, 0.06, 0.02, 0.14, 0xb9bcc0, -0.03, 0.06, 0, { metal: 0.6, aspereza: 0.3 });
    cilindro(papel, 0.055, 0.055, 0.11, 12, 0xf3f2ee, -0.08, 0, 0, { rx: Math.PI / 2 });

    // box do chuveiro (x-): base, vidro, registro e chuveiro, nicho com frascos
    const box = obj(g, "box");
    caixa(box, 0.95, 0.05, 1.3, 0xd5d9dc, -1.225, 0.025, -0.85, { aspereza: 0.4 });
    const vidroBox = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1.95, 0.95), new THREE.MeshStandardMaterial({ color: 0xbcd3dc, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1 }));
    vidroBox.position.set(-0.745, 1.02, -1.02);
    box.add(vidroBox);
    caixa(box, 0.03, 0.03, 0.97, 0xa9acb0, -0.745, 2.0, -1.02, { metal: 0.7, aspereza: 0.3 });
    caixa(box, 0.03, 1.98, 0.03, 0xa9acb0, -0.745, 0.99, -0.53, { metal: 0.7, aspereza: 0.3 });
    cilindro(box, 0.015, 0.015, 0.5, 8, 0xb8bbbf, -1.66, 1.75, -0.9, { metal: 0.8, aspereza: 0.2 });
    cilindro(box, 0.09, 0.06, 0.03, 16, 0xb8bbbf, -1.55, 2.02, -0.9, { metal: 0.8, aspereza: 0.2, rz: 0.4 });
    cilindro(box, 0.035, 0.035, 0.05, 10, 0xb8bbbf, -1.68, 1.1, -0.9, { metal: 0.8, aspereza: 0.2, rz: Math.PI / 2 });
    caixa(box, 0.12, 0.3, 0.5, 0xc9ced2, -1.68, 1.25, -1.2); // nicho
    frasco(box, 0.03, 0.17, 0x3d6b7a, -1.64, 1.16, -1.34);
    frasco(box, 0.028, 0.15, 0xe0d7c4, -1.64, 1.16, -1.22);
    frasco(box, 0.025, 0.12, 0x8a8f94, -1.64, 1.16, -1.1);

    // toalheiro com toalha, tapete, cesto, armarinho perto da porta
    const toalha = obj(g, "toalha", 1.67, 0, 0.55);
    cilindro(toalha, 0.012, 0.012, 0.6, 8, 0xb8bbbf, 0, 1.25, 0, { rx: Math.PI / 2, metal: 0.7 });
    const tw = pano(0.5, 0.62, 0.05, 0x8fa4af, 0.012, 9);
    tw.rotation.y = Math.PI / 2;
    tw.position.set(-0.03, 0.95, 0);
    toalha.add(tw);
    const tapete = passavel(obj(g, "tapete"));
    caixa(tapete, 0.75, 0.012, 0.45, 0x7f8f99, 0, 0.006, -0.68, { sombra: false });
    const cesto = obj(g, "cesto", 1.35, 0, 1.05);
    cilindro(cesto, 0.19, 0.16, 0.48, 12, 0x8c7c66, 0, 0.24, 0);
    cilindro(cesto, 0.2, 0.2, 0.03, 12, 0x6f624f, 0, 0.49, 0);
    const armario = obj(g, "armarinho", -1.45, 0, 1.15);
    caixa(armario, 0.45, 0.9, 0.4, 0xd0cfca, 0, 0.45, 0);
    caixa(armario, 0.012, 0.75, 0.36, 0xe0dfda, 0.23, 0.47, 0, { sombra: false });
    for (const [y, cor] of [[0.95, 0x9fb1bb], [1.02, 0xd6cbb6], [1.09, 0x8f9fa8]]) caixa(armario, 0.36, 0.07, 0.3, cor, 0, y, 0);

    // janelinha alta (luz da manhã), com vidro fosco que acende de dia
    const janela = obj(g, "janelinha", 1.7, 0, 0);
    caixa(janela, 0.06, 0.04, 0.69, 0x9aa0a6, 0, 1.73, -0.025);
    caixa(janela, 0.06, 0.04, 0.69, 0x9aa0a6, 0, 2.32, -0.025);
    const fosco = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.55), new THREE.MeshStandardMaterial({ color: 0x9aa4ab, emissive: 0xfff3e0, emissiveIntensity: 0, roughness: 0.6 }));
    fosco.rotation.y = -Math.PI / 2;
    fosco.position.set(0.02, 2.025, -0.025);
    janela.add(fosco);
    passavel(janela);

    // luminária do teto e as luzes do cômodo
    const plafon = passavel(obj(g, "plafon"));
    cilindro(plafon, 0.2, 0.22, 0.05, 20, 0xe9e8e4, 0, H - 0.03, 0.1);
    const disco = new THREE.Mesh(new THREE.CircleGeometry(0.18, 20), new THREE.MeshStandardMaterial({ color: 0xdadad6, emissive: 0xfff4e4, emissiveIntensity: 0 }));
    disco.rotation.x = Math.PI / 2;
    disco.position.set(0, H - 0.056, 0.1);
    plafon.add(disco);
    const luzTeto = luzSpot(g, 0xfff3e2, 0, new THREE.Vector3(0, H - 0.08, 0.1), new THREE.Vector3(0, 0, -0.1), 1.35, 1024, 9);
    luzTeto.userData.principal = true;
    // preenchimento e hemisférica só no cômodo de verdade (iluminam as duas cópias; menos luzes = render mais leve)
    const fillTeto = espelhado ? { intensity: 0 } : luzPonto(g, 0xfff3e2, 0, 0, 1.9, -0.2, 7, 1.4);
    const sol = luzSpot(g, 0xffe6c2, 0, new THREE.Vector3(2.9, 2.75, 0.0), new THREE.Vector3(-0.2, 0.2, -0.7), 0.42, 1024, 10);
    const lua = luzPonto(g, 0x7d93b8, 0, 1.2, 2.1, 0.0, 5, 1.5);
    const hemi = espelhado ? { intensity: 0 } : new THREE.HemisphereLight(0xe6ecf2, 0x4a4b4f, 0);
    if (!espelhado) g.add(hemi);
    api.luz = ({ teto = 0, espelho = 0, janela = 0, lua: l = 0, ambiente = 0 }) => {
      luzTeto.intensity = 15 * teto;
      fillTeto.intensity = 1.2 * teto + 1.0 * espelho;
      disco.material.emissiveIntensity = 1.4 * teto;
      lampEsp.material.emissiveIntensity = 1.6 * espelho;
      sol.intensity = 34 * janela;
      fosco.material.emissiveIntensity = 0.9 * janela + 0.25 * l;
      lua.intensity = 1.2 * l;
      hemi.intensity = ambiente;
    };

    // porta (abre para dentro, dobradiça em x = 0.75) e o corredor escuro do outro lado
    const dob = obj(g, "porta", 0.75, 0, 1.5);
    caixa(dob, 0.84, 2.03, 0.04, 0xd9d5cc, -0.42, 1.015, -0.02);
    cilindro(dob, 0.02, 0.02, 0.08, 8, 0xa9acb0, -0.76, 1.0, -0.06, { rx: Math.PI / 2, metal: 0.7 });
    // batentes do vão da porta (x de -0.1 a 0.75)
    const batente = obj(g, "batente");
    caixa(batente, 0.05, 2.08, 0.14, 0xc8c4bb, -0.125, 1.04, 1.53);
    caixa(batente, 0.05, 2.08, 0.14, 0xc8c4bb, 0.775, 1.04, 1.53);
    caixa(batente, 0.95, 0.05, 0.14, 0xc8c4bb, 0.325, 2.075, 1.53);
    const corredor = obj(g, "corredor", 0, 0, 2.6);
    caixa(corredor, 2.6, 0.1, 2.0, 0x3d3a36, -0.3, -0.05, 0);
    caixa(corredor, 2.6, 0.1, 2.0, 0x2a2b2e, -0.3, H + 0.05, 0);
    caixa(corredor, 0.1, H, 2.0, 0x47484c, -1.6, H / 2, 0);
    caixa(corredor, 0.1, H, 2.0, 0x47484c, 1.0, H / 2, 0);
    caixa(corredor, 2.6, H, 0.1, 0x3c3d41, -0.3, H / 2, 1.0);
    const luzCorredor = luzPonto(corredor, 0xd9c7a8, 0, -0.3, 2.2, 0.2, 4, 1.6);
    api.porta = (ab) => {
      dob.rotation.y = -ab;
    };
    api.corredor = (n) => {
      luzCorredor.intensity = 1.6 * n;
    };

    // lençol sobre o espelho (partes 5 e 6): k = 1 cobrindo; ao tirar, escorrega para a direita e cai
    const lencol = obj(g, "lencol");
    const pl = pano(1.3, 1.45, 0.02, 0xd9d6cf, 0.025, 4, { lado: THREE.DoubleSide });
    pl.position.set(0, 1.42, BANHEIRO.zEspelho + 0.06);
    lencol.add(pl);
    lencol.visible = false;
    api.lencol = (cobre, tirar = 0) => {
      lencol.visible = cobre > 0 && tirar < 1;
      // puxado para o lado e para baixo, girando
      pl.position.set(0.9 * tirar, 1.42 - 0.9 * tirar * tirar, BANHEIRO.zEspelho + 0.06 + 0.5 * tirar);
      pl.rotation.set(0.3 * tirar, -0.6 * tirar, -0.8 * tirar);
    };
    api.grupo = g;
    return api;
  }

  const { real, esp, a, b } = comEspelho(cena, "banheiro", construir, BANHEIRO.zEspelho);

  // vidro do espelho (só no cômodo de verdade) e o fundo que aparece quando o espelho quebra
  const E2 = E;
  const larg = E2.x1 - E2.x0;
  const alt = E2.y1 - E2.y0;
  const matV = materialVidro(larg, alt);
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), matV);
  vidro.position.set((E2.x0 + E2.x1) / 2, (E2.y0 + E2.y1) / 2, BANHEIRO.zEspelho + 0.002);
  vidro.renderOrder = 5;
  vidro.userData.passavel = true;
  real.add(vidro);
  const fundo = caixa(real, larg + 0.02, alt + 0.02, 0.02, 0x3a3836, (E2.x0 + E2.x1) / 2, (E2.y0 + E2.y1) / 2, BANHEIRO.zEspelho - 0.03);
  fundo.visible = false;

  // cacos (parte 7): o vidro vira ~70 triângulos que voam para frente e caem na pia e no chão
  const cacos = new THREE.Group();
  cacos.name = "cacos";
  real.add(cacos);
  passavel(cacos);
  const rc = rng(33);
  const matCaco = new THREE.MeshStandardMaterial({ color: 0xd8e0e6, metalness: 0.85, roughness: 0.12, side: THREE.DoubleSide, flatShading: true });
  const nx = 8;
  const ny = 7;
  const grade = [];
  for (let i = 0; i <= nx; i++) {
    grade.push([]);
    for (let j = 0; j <= ny; j++) {
      const borda = i === 0 || j === 0 || i === nx || j === ny;
      const jx = borda ? 0 : (rc() - 0.5) * 0.7;
      const jy = borda ? 0 : (rc() - 0.5) * 0.7;
      grade[i].push([E2.x0 + ((i + jx) / nx) * larg, E2.y0 + ((j + jy) / ny) * alt]);
    }
  }
  const pedacos = [];
  const centroImpacto = [0.12, 1.5];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const p00 = grade[i][j], p10 = grade[i + 1][j], p01 = grade[i][j + 1], p11 = grade[i + 1][j + 1];
      for (const tri of [[p00, p10, p11], [p00, p11, p01]]) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const forma = new THREE.Shape(tri.map(([x, y]) => new THREE.Vector2(x - cx, y - cy)));
        const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.004, bevelEnabled: false });
        const m = new THREE.Mesh(geo, matCaco);
        m.castShadow = true;
        cacos.add(m);
        // cada caco: sai do centro do impacto, voa para frente e cai; para em cima da pia ou no chão
        const dx = cx - centroImpacto[0];
        const dy = cy - centroImpacto[1];
        const dist = Math.hypot(dx, dy) + 0.05;
        const sobrePia = Math.abs(cx) < 0.5;
        pedacos.push({
          m, cx, cy,
          vx: (dx / dist) * (0.6 + rc() * 0.9),
          vy: (dy / dist) * (0.4 + rc() * 0.6) + 0.4,
          vz: 0.6 + rc() * 1.4,
          gx: (rc() - 0.5) * 9, gy: (rc() - 0.5) * 9, gz: (rc() - 0.5) * 9,
          chao: sobrePia && rc() < 0.45 ? BANHEIRO.bancada + 0.004 : 0.004,
        });
      }
    }
  }
  cacos.visible = false;
  // dt = segundos desde a quebra (negativo = inteiro). Física determinística: queda, quique pequeno e para.
  const quebrar = (dt) => {
    const quebrado = dt >= 0;
    vidro.visible = !quebrado;
    cacos.visible = quebrado;
    fundo.visible = quebrado;
    if (!quebrado) return;
    for (const p of pedacos) {
      let x = p.cx + p.vx * dt;
      let z = BANHEIRO.zEspelho + 0.01 + p.vz * dt;
      let y = p.cy + p.vy * dt - 4.9 * dt * dt;
      let k = 1;
      // a pia: os cacos que caem na frente da cuba param no tampo
      const chao = p.chao > 0.1 && z < -0.98 ? p.chao : 0.004;
      if (y <= chao) {
        // tempo do toque no chão e para (sem atravessar)
        const a = -4.9, bb = p.vy, c = p.cy - chao;
        const tc = (-bb - Math.sqrt(bb * bb - 4 * a * c)) / (2 * a);
        x = p.cx + p.vx * tc;
        z = BANHEIRO.zEspelho + 0.01 + p.vz * tc;
        y = chao;
        k = tc / Math.max(dt, 1e-3);
        p.m.position.set(x, y, Math.min(z, 1.3));
        p.m.rotation.set(Math.PI / 2, 0, p.gz * tc);
        continue;
      }
      p.m.position.set(x, y, z);
      p.m.rotation.set(p.gx * dt * k, p.gy * dt * k, p.gz * dt * k);
    }
  };

  // as duas cópias recebem as mesmas mudanças
  const ambos = (f) => (...args) => {
    a[f](...args);
    b[f](...args);
  };
  const ret = {
    grupo: real,
    grupoEspelho: esp,
    fundo: 0x1a1b1d,
    nevoa: [0x1a1b1d, 30, 60],
    vidro,
    materialVidro: matV,
    real: a,
    copia: b,
    luz: ambos("luz"),
    porta: ambos("porta"),
    torneira: ambos("torneira"),
    corredor: ambos("corredor"),
    lencol: ambos("lencol"),
    derrubar: (k, soReal = false) => {
      a.derrubar(k);
      if (!soReal) b.derrubar(k);
    },
    quebrar,
    // mundo espelhado visível? (vazio = sem o reflexo do personagem; o motor esconde o dublê)
    espelhoVisivel: (v) => (esp.visible = v),
    modoAtual: null,
    modo(nome) {
      if (nome === ret.modoAtual) return;
      ret.modoAtual = nome;
      const L = {
        manha: { teto: 1, espelho: 1, janela: 1, ambiente: 0.55 },
        manhaChao: { teto: 0, espelho: 0, janela: 1.15, ambiente: 0.65 },
        dia: { teto: 1, espelho: 1, janela: 0.6, ambiente: 0.5 },
        noiteAcesa: { teto: 1, espelho: 1, lua: 0.2, ambiente: 0.35 },
        noite: { lua: 1, ambiente: 0.12 },
        apagada: { lua: 0.35, ambiente: 0.04 },
      }[nome] || {};
      ret.luz(L);
    },
    atualizar() {},
  };
  return ret;
}

// ------------------------------------------------------------ peças comuns de casa
function cadeiraMadeira(pai, nome, x, z, ry, cor = 0x5a4636) {
  const c = obj(pai, nome, x, 0, z, ry);
  caixa(c, 0.44, 0.05, 0.42, cor, 0, 0.46, 0);
  for (const [lx, lz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) caixa(c, 0.04, 0.46, 0.04, cor, lx, 0.23, lz);
  caixa(c, 0.44, 0.48, 0.04, cor, 0, 0.72, -0.2);
  caixa(c, 0.38, 0.1, 0.03, 0x6b5543, 0, 0.86, -0.18);
  return c;
}
function textoCentro(g, txt, x, y, px, cor, peso = 800, fonte = "Montserrat") {
  g.font = `${peso} ${px}px ${fonte}, Arial, sans-serif`;
  g.fillStyle = cor;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(txt, x, y);
}
// relógio digital de parede (sete segmentos); espelhado = números ao contrário
function relogioParede(pai, nome, x, y, z, ry, espelhado) {
  const r = obj(pai, nome, x, y, z, ry);
  caixa(r, 0.6, 0.24, 0.05, 0x1b1c1f, 0, 0, 0, { aspereza: 0.5 });
  let atual = null;
  const face = placa(r, 0.54, 0.18, (g, w, h, txt = "7:12") => {
    g.fillStyle = "#070708";
    g.fillRect(0, 0, w, h);
    desenharSeteSegmentos(g, txt, w * 0.08, h * 0.14, h * 0.72, "#e01b22", "#1c0b0c");
  }, { propria: true, espelhado, ppm: 1400 });
  face.position.z = 0.027;
  r.userData.mostrar = (txt) => {
    if (txt === atual) return;
    atual = txt;
    face.userData.redesenhar(txt);
  };
  r.userData.mostrar("7:12");
  return r;
}
// caderno fechado deitado (capa com o nome)
function caderno(pai, nome, x, y, z, ry, espelhado) {
  const c = obj(pai, nome, x, y, z, ry);
  caixa(c, 0.21, 0.015, 0.29, 0x2e3440, 0, 0.0075, 0);
  caixa(c, 0.2, 0.012, 0.28, 0xe9e6dd, 0.004, 0.0075, 0, { sombra: false });
  const capa = placa(c, 0.2, 0.28, (g, w, h) => {
    g.fillStyle = "#33435a";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#c4161c";
    g.fillRect(0, h * 0.08, w, h * 0.05);
    textoCentro(g, "CADERNO", w / 2, h * 0.3, h * 0.07, "#d9dee6", 700, "Inter");
    g.fillStyle = "#e9e6dd";
    g.fillRect(w * 0.12, h * 0.48, w * 0.76, h * 0.2);
    textoCentro(g, "LUCAS", w / 2, h * 0.585, h * 0.12, "#1a1c22", 900);
    textoCentro(g, "8º ANO", w / 2, h * 0.8, h * 0.06, "#d9dee6", 700, "Inter");
  }, { espelhado, ppm: 2400 });
  capa.rotation.x = -Math.PI / 2;
  capa.position.y = 0.0155;
  return c;
}

// ------------------------------------------------------------ quarto (vídeo 2)
// x de -2.3 a 2.3, z de -2.0 a 2.0, pé-direito 2.6. Cama na parede oeste (cabeceira ao norte), guarda-roupa com
// espelho na parede norte, escrivaninha embaixo da janela (parede leste), porta na parede sul.
export const QUARTO2 = {
  espelho: { x: 1.1, y: 1.08, z: -1.443, w: 0.5, h: 1.45 },
  janela: { x: 2.29, y: 1.55, z: 0.4, w: 1.2, h: 1.2 },
  cama: { colchao: 0.52 },
};
export function criarQuarto2(cena, op = {}) {
  const g = new THREE.Group();
  g.name = "quarto2";
  g.position.copy(DESLOCAMENTO.quarto2);
  cena.add(g);
  const H = 2.6;
  const api = { grupo: g, fundo: 0x15161a, nevoa: [0x15161a, 30, 70] };
  const tabua = texturaAzulejo(0x7a6553, 0x5a4a3d, { colunas: 1, linhas: 6, ruido: 0.12, chanfro: 0.03, semente: 21 });
  const chao = passavel(obj(g, "chao"));
  caixa(chao, 4.6, 0.1, 4.0, 0xffffff, 0, -0.05, 0, { material: matTextura(tabua, 4.6, 4.0, 1.2, { aspereza: 0.7 }) });
  const teto = passavel(obj(g, "teto"));
  caixa(teto, 4.6, 0.08, 4.0, 0xdcdcda, 0, H + 0.04, 0);
  const corParede = 0xb4bcc5;
  paredeTex(g, { w: 4.6, h: H, z: -2.06, cor: corParede, nome: "parede-norte" });
  paredeTex(g, { w: 4.0, h: H, x: -2.36, ry: Math.PI / 2, cor: corParede, nome: "parede-oeste" });
  paredeTex(g, { w: 4.0, h: H, x: 2.36, ry: -Math.PI / 2, cor: corParede, furos: [{ x0: -0.2, x1: 1.0, y0: 0.95, y1: 2.15 }], nome: "parede-leste" });
  paredeTex(g, { w: 4.6, h: H, z: 2.06, ry: Math.PI, cor: corParede, furos: [{ x0: -1.25, x1: -0.4, y0: 0, y1: 2.05 }], nome: "parede-sul" });
  const rodape = passavel(obj(g, "rodape"));
  caixa(rodape, 4.58, 0.08, 0.015, 0xe4e2dc, 0, 0.04, -1.995);
  caixa(rodape, 0.015, 0.08, 3.98, 0xe4e2dc, -2.295, 0.04, 0);

  // cama de solteiro
  const cama = obj(g, "cama", -1.78, 0, -0.95);
  caixa(cama, 1.0, 0.32, 2.0, 0x4a3a2e, 0, 0.16, 0);
  caixa(cama, 0.94, 0.2, 1.94, 0xd9d6cf, 0, 0.42, 0, { aspereza: 0.95 });
  caixa(cama, 1.04, 0.85, 0.06, 0x4a3a2e, 0, 0.6, -1.0);
  // travesseiro: macio (a cabeça afunda nele sem contar como colisão)
  caixa(cama, 0.6, 0.12, 0.34, 0xeceae4, 0, 0.58, -0.75).userData.passavel = true;
  const cobertor = pano(0.98, 1.25, 0.07, 0x5b6c7b, 0.025, 8);
  cobertor.rotation.x = -Math.PI / 2;
  cobertor.position.set(0, 0.555, 0.3);
  cama.add(cobertor);
  api.cobertor = cobertor;
  // criado-mudo com despertador e abajur
  const criado = obj(g, "criado-mudo", -1.0, 0, -1.72);
  caixa(criado, 0.45, 0.55, 0.4, 0x5a4636, 0, 0.275, 0);
  caixa(criado, 0.4, 0.012, 0.012, 0x3c2f25, 0, 0.36, 0.2, { sombra: false });
  const relogio = criarRelogio("7:12");
  relogio.position.set(0.05, 0.55, 0.03);
  relogio.rotation.y = -0.5;
  criado.add(relogio);
  api.relogio = relogio;
  cilindro(criado, 0.07, 0.09, 0.03, 12, 0x2b2c2f, -0.14, 0.565, -0.06);
  cilindro(criado, 0.012, 0.012, 0.28, 8, 0x2b2c2f, -0.14, 0.7, -0.06);
  const cupula = cilindro(criado, 0.09, 0.14, 0.16, 14, 0xe8dcc3, -0.14, 0.88, -0.06);
  const luzAbajur = luzPonto(criado, 0xffd9a6, 0, -0.14, 0.82, -0.06, 4, 1.6);

  // guarda-roupa com a porta de espelho (reflexo de verdade)
  const gr = obj(g, "guarda-roupa", 0.75, 0, -1.725);
  caixa(gr, 1.4, 2.1, 0.55, 0x8a7a68, 0, 1.05, 0);
  caixa(gr, 0.012, 2.0, 0.01, 0x5d5246, 0, 1.05, 0.28, { sombra: false });
  for (const x of [-0.08, 0.08]) caixa(gr, 0.02, 0.22, 0.03, 0xb9bcc0, x, 1.05, 0.29, { metal: 0.6, aspereza: 0.3 });
  const E = QUARTO2.espelho;
  const espelho = new EspelhoPlano(E.w, E.h, { resolucao: 1024, cor: 0xe6eef2, brilho: 0.05 });
  espelho.position.set(E.x - 0.75, E.y, 0.282);
  espelho.userData.passavel = true;
  gr.add(espelho);
  for (const [w, h, x, y] of [[E.w + 0.06, 0.03, 0, E.h / 2 + 0.015], [E.w + 0.06, 0.03, 0, -E.h / 2 - 0.015], [0.03, E.h, -E.w / 2 - 0.015, 0], [0.03, E.h, E.w / 2 + 0.015, 0]]) {
    caixa(gr, w, h, 0.015, 0x3a3532, E.x - 0.75 + x, E.y + y, 0.284);
  }
  api.espelho = espelho;
  const lencolGR = pano(0.7, 1.7, 0.02, 0xd9d6cf, 0.025, 6, { lado: THREE.DoubleSide });
  lencolGR.position.set(E.x - 0.75, 1.1, 0.31);
  lencolGR.visible = false;
  gr.add(lencolGR);
  api.lencolEspelho = (v) => {
    lencolGR.visible = v;
    espelho.ativo = !v;
  };

  // escrivaninha embaixo da janela, cadeira, caderno, luminária, livros
  const mesa = obj(g, "escrivaninha", 1.97, 0, 0.4);
  caixa(mesa, 0.62, 0.04, 1.3, 0x6b5543, 0, 0.74, 0);
  for (const z of [-0.6, 0.6]) caixa(mesa, 0.58, 0.72, 0.04, 0x5a4636, 0, 0.36, z);
  caixa(mesa, 0.5, 0.3, 0.4, 0x5a4636, 0, 0.55, 0.38);
  const cad = caderno(mesa, "caderno", -0.05, 0.76, -0.25, 0.25, !!op.invertida);
  api.caderno = cad;
  for (const [i, cor] of [0x7a2a2c, 0x34495e, 0xc9b98f, 0x4d5b4a].entries()) caixa(mesa, 0.2, 0.035, 0.27, cor, 0.1, 0.78 + i * 0.036, 0.42, { ry: 0.08 * i });
  cilindro(mesa, 0.035, 0.035, 0.1, 10, 0x3a3f47, 0.18, 0.81, -0.5);
  const lumi = obj(mesa, "luminaria", 0.15, 0.76, 0.15);
  cilindro(lumi, 0.06, 0.07, 0.02, 12, 0x2b2c2f, 0, 0.01, 0);
  cilindro(lumi, 0.01, 0.01, 0.35, 6, 0x2b2c2f, 0, 0.18, 0, { rz: 0.25 });
  cilindro(lumi, 0.05, 0.08, 0.1, 12, 0x2b2c2f, -0.06, 0.36, 0.0, { rz: 1.1 });
  const cadeira = cadeiraMadeira(g, "cadeira", 1.35, 0.4, Math.PI / 2, 0x3e4450);
  api.cadeira = cadeira;
  // mochila no chão
  const mochila = obj(g, "mochila", 1.95, 0, 1.55, 0.3);
  caixa(mochila, 0.32, 0.42, 0.18, 0x2c3a4a, 0, 0.21, 0);
  caixa(mochila, 0.26, 0.16, 0.06, 0x24303d, 0, 0.14, 0.11);
  caixa(mochila, 0.04, 0.3, 0.03, 0x1c252f, 0.1, 0.25, -0.1);

  // janela: vidro que reflete (à noite o quarto aparece nele), cortinas e o lado de fora
  const J = QUARTO2.janela;
  const janela = obj(g, "janela", J.x, J.y, J.z);
  for (const [w, h, y, z] of [[0.08, 0.06, 0.63, 0], [0.08, 0.06, -0.63, 0], [0.08, 1.26, 0, 0.63], [0.08, 1.26, 0, -0.63], [0.06, 1.2, 0, 0]]) caixa(janela, 0.08, h, w === 0.06 ? 0.05 : w === 0.08 && h > 1 ? 0.06 : 1.32, 0xe9e8e4, 0.02, y, z);
  const vidroJ = new EspelhoPlano(J.w, J.h, { resolucao: 768, transparente: true, mistura: 0.18, cor: 0xdfe8ee, brilho: 0.04 });
  vidroJ.rotation.y = -Math.PI / 2;
  vidroJ.position.set(0.0, 0, 0);
  vidroJ.userData.passavel = true;
  janela.add(vidroJ);
  api.janela = vidroJ;
  caixa(janela, 0.25, 0.04, 1.4, 0xe9e8e4, -0.1, -0.62, 0); // peitoril
  const varao = passavel(obj(g, "varao"));
  cilindro(varao, 0.015, 0.015, 1.9, 8, 0x3a3532, 2.2, 2.3, J.z, { rx: Math.PI / 2 });
  const cortinas = [];
  for (const lado of [-1, 1]) {
    const c = pano(0.5, 1.55, 0.03, 0x7b8794, 0.04, lado > 0 ? 12 : 13);
    c.rotation.y = -Math.PI / 2;
    varao.add(c);
    cortinas.push({ c, lado });
  }
  api.cortinas = (fechado) => {
    for (const { c, lado } of cortinas) {
      const aberto = J.z + lado * 0.85;
      const fech = J.z + lado * 0.3;
      c.position.set(2.18, 1.5, aberto + (fech - aberto) * fechado);
      c.scale.set(1, 1, 1 + 0.25 * fechado);
    }
  };
  api.cortinas(0);
  // lá fora: céu e casas do outro lado da rua
  const fora = passavel(obj(g, "fora", 0, 0, 0));
  const ceuJ = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshBasicMaterial({ color: 0x9fb3c8, fog: false }));
  ceuJ.rotation.y = -Math.PI / 2;
  ceuJ.position.set(14, 4, 0);
  fora.add(ceuJ);
  const rc = rng(41);
  const janelasFora = [];
  for (let i = 0; i < 5; i++) {
    const z = -6 + i * 3.2;
    const h = 3 + rc() * 2.5;
    caixa(fora, 4, h, 2.8, [0x5a5e66, 0x4d5159, 0x666a72][i % 3], 10, h / 2 - 1.2, z);
    caixa(fora, 4.4, 0.4, 3.2, 0x2f3135, 10, h - 1.0, z, { rz: 0.0 });
    const jl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.8), new THREE.MeshStandardMaterial({ color: 0x23262b, emissive: 0xffd49a, emissiveIntensity: 0 }));
    jl.rotation.y = -Math.PI / 2;
    jl.position.set(7.98, h * 0.55 - 1.0, z + (rc() - 0.5));
    fora.add(jl);
    janelasFora.push(jl);
  }

  // estante, pôsteres, tapete, porta
  const estante = obj(g, "estante", -1.95, 0, 1.72);
  caixa(estante, 0.7, 1.7, 0.32, 0x6b5543, 0, 0.85, 0);
  const rl = rng(43);
  for (const y of [0.45, 0.85, 1.25]) {
    caixa(estante, 0.66, 0.02, 0.3, 0x5a4636, 0, y - 0.03, 0.0);
    let x = -0.3;
    while (x < 0.28) {
      const lw = 0.03 + rl() * 0.03;
      const lh = 0.2 + rl() * 0.1;
      caixa(estante, lw, lh, 0.22, [0x7a2a2c, 0x34495e, 0xc9b98f, 0x4d5b4a, 0x8a8d91][Math.floor(rl() * 5)], x + lw / 2, y - 0.02 + lh / 2, 0.02);
      x += lw + 0.004;
    }
  }
  const poster = passavel(obj(g, "posteres"));
  const p1 = placa(poster, 0.6, 0.85, (c, w, h) => {
    c.fillStyle = "#1d1f24";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#c4161c";
    c.beginPath();
    c.arc(w / 2, h * 0.42, w * 0.3, 0, Math.PI * 2);
    c.fill();
    textoCentro(c, "RUÍDO", w / 2, h * 0.82, h * 0.1, "#e9e6df", 900);
    textoCentro(c, "TURNÊ 2026", w / 2, h * 0.92, h * 0.04, "#9a9ca1", 700, "Inter");
  }, { espelhado: !!op.invertida });
  p1.rotation.y = Math.PI / 2;
  p1.position.set(-2.29, 1.65, -0.2);
  const p2 = placa(poster, 0.5, 0.7, (c, w, h) => {
    c.fillStyle = "#c9cdd2";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#2e3440";
    for (let i = 0; i < 6; i++) c.fillRect(w * 0.1, h * (0.12 + i * 0.13), w * (0.4 + (i % 3) * 0.15), h * 0.05);
  });
  p2.rotation.y = Math.PI;
  p2.position.set(-0.6, 1.6, 1.99);
  const tapete = passavel(obj(g, "tapete"));
  caixa(tapete, 1.8, 0.012, 1.2, 0x6f7782, 0.1, 0.006, 0.35, { sombra: false });
  const dob = obj(g, "porta", 1.25, 0, 2.0);
  caixa(dob, 0.84, 2.03, 0.04, 0xd9d5cc, -0.42, 1.015, -0.02);
  cilindro(dob, 0.02, 0.02, 0.08, 8, 0xa9acb0, -0.76, 1.0, -0.06, { rx: Math.PI / 2, metal: 0.7 });
  api.porta = (ab) => (dob.rotation.y = -ab);

  // luzes
  const plafon = passavel(obj(g, "plafon"));
  cilindro(plafon, 0.25, 0.28, 0.06, 20, 0xe9e8e4, 0, H - 0.03, 0);
  const disco = new THREE.Mesh(new THREE.CircleGeometry(0.23, 20), new THREE.MeshStandardMaterial({ color: 0xdadad6, emissive: 0xfff4e4, emissiveIntensity: 0 }));
  disco.rotation.x = Math.PI / 2;
  disco.position.set(0, H - 0.062, 0);
  plafon.add(disco);
  const luzTeto = luzSpot(g, 0xfff1de, 0, new THREE.Vector3(0, H - 0.1, 0), new THREE.Vector3(0, 0, -0.2), 1.4, 1024, 10);
  const fill = luzPonto(g, 0xfff1de, 0, 0, 2.0, 0.8, 7, 1.4);
  const sol = luzSpot(g, 0xffe8c8, 0, new THREE.Vector3(4.5, 3.4, 0.6), new THREE.Vector3(0.2, 0, -0.4), 0.55, 1024, 14);
  const lua = luzSpot(g, 0x8ea6cc, 0, new THREE.Vector3(4.5, 3.0, 0.6), new THREE.Vector3(0.0, 0, -0.6), 0.55, 1024, 14);
  const hemi = new THREE.HemisphereLight(0xe6ecf2, 0x4a4540, 0);
  g.add(hemi);
  api.modoAtual = null;
  api.modo = (nome) => {
    if (nome === api.modoAtual) return;
    api.modoAtual = nome;
    const dia = nome === "dia" || nome === "manha";
    const L = { dia: [1, 0, 1, 0, 0.55, 0], manha: [0.6, 0, 1.1, 0, 0.6, 0], noite: [0, 0.6, 0, 1, 0.2, 0.4], noiteAcesa: [1, 0.4, 0, 0.4, 0.35, 0.3], escuro: [0, 0, 0, 0.55, 0.06, 0] }[nome] || [1, 0, 1, 0, 0.5, 0];
    luzTeto.intensity = 22 * L[0];
    fill.intensity = 2.0 * L[0];
    disco.material.emissiveIntensity = 1.3 * L[0];
    luzAbajur.intensity = 1.6 * L[1];
    cupula.material = mat(0xe8dcc3, { emissivo: 0xffd9a6, brilho: 0.5 * L[1] });
    sol.intensity = 70 * L[2];
    lua.intensity = 18 * L[3];
    hemi.intensity = L[4];
    ceuJ.material.color.setHex(dia ? 0xb6c8da : 0x111a2a);
    for (const [i, j] of janelasFora.entries()) j.material.emissiveIntensity = dia ? 0 : L[5] * (i % 2 ? 1 : 0.4);
    api.fundo = dia ? 0x9fb3c8 : 0x0b0f17;
  };
  api.atualizar = () => {};
  return api;
}

// ------------------------------------------------------------ cozinha (com o espelho da sala de jantar)
// x de -3 a 3, z de -2.4 a 2.4, pé-direito 2.6. Bancada, pia, fogão e geladeira na parede norte; mesa no meio;
// relógio digital na parede oeste; janela para a rua na parede leste; espelho decorativo na parede sul.
// op.invertida: o mundo do lado de dentro do espelho (partes 8 e 9), com todo texto ao contrário.
export const COZINHA = {
  zEspelho: 2.4,
  espelho: { x0: -1.75, x1: -0.75, y0: 0.95, y1: 2.05 },
  mesa: { x: 0.4, z: 0.5, y: 0.76 },
};
export function criarCozinha(cena, op = {}) {
  const H = 2.6;
  const inv = !!op.invertida;
  const E = COZINHA.espelho;
  const azulejo = texturaAzulejo(0xe3e0d8, 0xc4c0b7, { colunas: 6, linhas: 3, semente: 31 });
  const piso = texturaAzulejo(0x8d8a84, 0x6c6964, { colunas: 2, linhas: 2, semente: 17, ruido: 0.05 });

  function construir(g, espelhado) {
    const api = {};
    const chao = passavel(obj(g, "chao"));
    caixa(chao, 6.0, 0.1, 4.8, 0xffffff, 0, -0.05, 0, { material: matTextura(piso, 6.0, 4.8, 0.6, { aspereza: 0.5 }) });
    const teto = passavel(obj(g, "teto"));
    caixa(teto, 6.0, 0.08, 4.8, 0xdedcd7, 0, H + 0.04, 0);
    const corParede = 0xc9c4ba;
    paredeTex(g, { w: 6.0, h: H, z: -2.46, cor: corParede, nome: "parede-norte" });
    paredeTex(g, { w: 4.8, h: H, x: -3.06, ry: Math.PI / 2, cor: corParede, furos: [{ x0: -1.9, x1: -1.0, y0: 0, y1: 2.05 }], nome: "parede-oeste" });
    paredeTex(g, { w: 4.8, h: H, x: 3.06, ry: -Math.PI / 2, cor: corParede, furos: [{ x0: -0.7, x1: 0.8, y0: 0.95, y1: 2.15 }], nome: "parede-leste" });
    if (!espelhado) paredeTex(g, { w: 6.0, h: H, e: 0.02, z: COZINHA.zEspelho + 0.01, ry: Math.PI, cor: corParede, furos: [{ x0: -E.x1, x1: -E.x0, y0: E.y0, y1: E.y1 }], nome: "parede-espelho" });
    // azulejo atrás da bancada
    const revest = passavel(obj(g, "revestimento"));
    caixa(revest, 5.9, 0.6, 0.012, 0xffffff, 0, 1.2, -2.394, { material: matTextura(azulejo, 5.9, 0.6, 0.6) });

    // bancada: armários, tampo, pia, fogão, armários de cima, coifa
    const bancada = obj(g, "bancada");
    caixa(bancada, 4.3, 0.84, 0.6, 0x6d7480, -0.8, 0.44, -2.1);
    caixa(bancada, 4.3, 0.05, 0.6, 0x2a2d32, -0.8, 0.02, -2.1);
    for (let i = 0; i < 7; i++) {
      const x = -2.75 + i * 0.6;
      caixa(bancada, 0.57, 0.74, 0.012, 0x7b828e, x + 0.3, 0.45, -1.794, { sombra: false });
      caixa(bancada, 0.14, 0.015, 0.02, 0xbfc2c6, x + 0.3, 0.76, -1.785, { metal: 0.6, aspereza: 0.3 });
    }
    caixa(bancada, 4.34, 0.05, 0.64, 0x3b3e43, -0.8, 0.885, -2.1, { aspereza: 0.35 });
    caixa(bancada, 0.6, 0.012, 0.4, 0x1e2024, -0.7, 0.912, -2.1, { aspereza: 0.25, metal: 0.4 }); // cuba
    cilindro(bancada, 0.018, 0.022, 0.3, 10, 0xc4c7ca, -0.7, 1.06, -2.33, { metal: 0.8, aspereza: 0.2 });
    cilindro(bancada, 0.014, 0.014, 0.2, 8, 0xc4c7ca, -0.7, 1.2, -2.24, { metal: 0.8, aspereza: 0.2, rx: Math.PI / 2 });
    // fogão (cooktop + forno)
    const fogao = obj(g, "fogao", 0.85, 0, -2.1);
    caixa(fogao, 0.66, 0.86, 0.6, 0xd5d7d9, 0, 0.43, 0, { aspereza: 0.4 });
    caixa(fogao, 0.6, 0.4, 0.012, 0x15171a, 0, 0.42, 0.302, { aspereza: 0.2 });
    caixa(fogao, 0.68, 0.04, 0.62, 0x1b1d20, 0, 0.88, 0, { aspereza: 0.3 });
    for (const [x, z] of [[-0.15, -0.13], [0.15, -0.13], [-0.15, 0.13], [0.15, 0.13]]) cilindro(fogao, 0.07, 0.07, 0.012, 14, 0x3a3c40, x, 0.905, z);
    const chaleira = obj(fogao, "chaleira", 0.15, 0.91, 0.13);
    cilindro(chaleira, 0.08, 0.1, 0.16, 14, 0xb9bcc0, 0, 0.08, 0, { metal: 0.6, aspereza: 0.3 });
    cilindro(chaleira, 0.015, 0.015, 0.12, 6, 0x2b2c2f, 0.08, 0.13, 0, { rz: 0.9 });
    const cima = obj(g, "armario-alto");
    caixa(cima, 3.0, 0.7, 0.35, 0x8a909b, -1.45, 1.85, -2.225);
    for (let i = 0; i < 5; i++) caixa(cima, 0.58, 0.66, 0.012, 0x9aa0aa, -2.65 + i * 0.6, 1.85, -2.043, { sombra: false });
    const coifa = obj(g, "coifa", 0.85, 0, -2.2);
    caixa(coifa, 0.7, 0.14, 0.45, 0xb9bcc0, 0, 1.75, 0, { metal: 0.5, aspereza: 0.35 });
    caixa(coifa, 0.25, 0.75, 0.25, 0xb9bcc0, 0, 2.2, -0.08, { metal: 0.5, aspereza: 0.35 });
    // cafeteira com a jarra e o rádio
    const cafeteira = obj(g, "cafeteira", -1.85, 0.91, -2.18);
    caixa(cafeteira, 0.2, 0.32, 0.2, 0x22252a, 0, 0.16, 0);
    caixa(cafeteira, 0.2, 0.06, 0.26, 0x22252a, 0, 0.35, 0.03);
    const jarra = cilindro(cafeteira, 0.07, 0.065, 0.13, 12, 0x2a1d17, 0, 0.075, 0.07, { aspereza: 0.2 });
    const ledCafe = caixa(cafeteira, 0.025, 0.012, 0.01, 0x5c1114, 0.06, 0.03, 0.105, { sombra: false });
    api.cafe = (ligada) => {
      ledCafe.material = ligada ? luzPropria(0xe01b22) : mat(0x5c1114);
      jarra.scale.y = 1;
    };
    const radio = obj(g, "radio", -2.5, 0.91, -2.2, 0.2);
    caixa(radio, 0.36, 0.2, 0.13, 0x6b4a36, 0, 0.1, 0, { aspereza: 0.6 });
    const grade = placa(radio, 0.16, 0.13, (c, w, h) => {
      c.fillStyle = "#2a2522";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#4d4540";
      for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) {
        c.beginPath();
        c.arc((i + 0.5) * (w / 9), (j + 0.5) * (h / 7), w / 32, 0, Math.PI * 2);
        c.fill();
      }
    });
    grade.position.set(-0.08, 0.1, 0.066);
    const dial = placa(radio, 0.12, 0.05, (c, w, h, ligado = false) => {
      c.fillStyle = ligado ? "#e6c48a" : "#3a332d";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#3a2a20";
      for (let i = 0; i < 12; i++) c.fillRect((i + 0.5) * (w / 12), h * 0.3, 1.5, h * 0.4);
      c.fillStyle = "#c4161c";
      c.fillRect(w * 0.62, h * 0.1, 3, h * 0.8);
    }, { propria: true });
    dial.position.set(0.09, 0.13, 0.066);
    cilindro(radio, 0.02, 0.02, 0.02, 10, 0x2a2522, 0.09, 0.06, 0.07, { rx: Math.PI / 2 });
    cilindro(radio, 0.004, 0.004, 0.42, 4, 0xb9bcc0, 0.12, 0.38, -0.03, { rz: -0.5, metal: 0.8 });
    api.radio = (ligado) => dial.userData.redesenhar(ligado);

    // geladeira
    const geladeira = obj(g, "geladeira", 1.95, 0, -2.06);
    caixa(geladeira, 0.78, 1.85, 0.68, 0xc9ccd0, 0, 0.925, 0, { aspereza: 0.35 });
    caixa(geladeira, 0.76, 0.012, 0.012, 0x8e9196, 0, 1.25, 0.345, { sombra: false });
    caixa(geladeira, 0.025, 0.4, 0.04, 0x8e9196, -0.32, 1.5, 0.36, { metal: 0.5 });
    caixa(geladeira, 0.025, 0.5, 0.04, 0x8e9196, -0.32, 0.85, 0.36, { metal: 0.5 });
    for (const [x, y, cor] of [[0.1, 1.6, 0xc4161c], [0.2, 1.45, 0x3d6b7a], [0.05, 1.38, 0xe0c45a]]) caixa(geladeira, 0.07, 0.07, 0.012, cor, x, y, 0.345);

    // relógio digital na parede oeste (o primeiro sinal de que o mundo está ao contrário)
    const rel = relogioParede(g, "relogio-cozinha", -2.995, 1.95, -0.4, Math.PI / 2, inv);
    api.relogio = rel;

    // mesa com quatro cadeiras, café da manhã, caixa de leite, caderno
    const M = COZINHA.mesa;
    const mesa = obj(g, "mesa", M.x, 0, M.z);
    caixa(mesa, 1.5, 0.05, 0.9, 0x7a6350, 0, 0.735, 0);
    for (const [x, z] of [[-0.68, -0.38], [0.68, -0.38], [-0.68, 0.38], [0.68, 0.38]]) caixa(mesa, 0.06, 0.71, 0.06, 0x5a4636, x, 0.355, z);
    api.cadeiras = [
      cadeiraMadeira(g, "cadeira-1", M.x - 0.38, M.z - 0.68, 0),
      cadeiraMadeira(g, "cadeira-2", M.x + 0.38, M.z - 0.68, 0),
      cadeiraMadeira(g, "cadeira-3", M.x - 0.38, M.z + 0.68, Math.PI),
      cadeiraMadeira(g, "cadeira-4", M.x + 0.38, M.z + 0.68, Math.PI),
    ];
    const mesaPosta = obj(mesa, "cafe-da-manha", 0, 0.76, 0);
    for (const [x, z] of [[-0.38, -0.22], [0.38, 0.22], [0.38, -0.22]]) {
      caixa(mesaPosta, 0.36, 0.006, 0.26, 0xb9aea0, x, 0.003, z, { sombra: false });
      cilindro(mesaPosta, 0.11, 0.09, 0.015, 16, 0xeeeeea, x, 0.012, z);
    }
    for (const [x, z] of [[-0.24, -0.26], [0.52, 0.18]]) {
      cilindro(mesaPosta, 0.042, 0.036, 0.09, 12, 0xe8e6e0, x, 0.045, z);
      cilindro(mesaPosta, 0.038, 0.038, 0.004, 12, 0x3b2418, x, 0.083, z);
    }
    cilindro(mesaPosta, 0.06, 0.06, 0.26, 12, 0x8c2a2c, -0.05, 0.13, 0.05); // garrafa térmica
    cilindro(mesaPosta, 0.03, 0.04, 0.05, 10, 0x2b2c2f, -0.05, 0.285, 0.05);
    const pao = obj(mesaPosta, "paes", 0.05, 0, 0.28);
    cilindro(pao, 0.14, 0.11, 0.05, 14, 0x8c7c66, 0, 0.025, 0);
    for (const [x, z, r] of [[-0.04, 0, 0.2], [0.05, 0.03, -0.4], [0.0, -0.05, 0.9]]) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0xc9975e, { aspereza: 0.8 }));
      p.scale.set(1.4, 0.65, 0.85);
      p.position.set(x, 0.07, z);
      p.rotation.y = r;
      p.castShadow = true;
      pao.add(p);
    }
    // caixa de leite (o nome sai ao contrário no mundo do espelho)
    const leite = obj(mesaPosta, "caixa-de-leite", 0.2, 0, -0.12, -0.35);
    caixa(leite, 0.09, 0.22, 0.09, 0xf1efe9, 0, 0.11, 0);
    const tampaL = new THREE.Mesh(new THREE.ConeGeometry(0.066, 0.05, 4), mat(0xf1efe9));
    tampaL.rotation.y = Math.PI / 4;
    tampaL.position.y = 0.245;
    leite.add(tampaL);
    const rotulo = placa(leite, 0.088, 0.2, (c, w, h) => {
      c.fillStyle = "#f1efe9";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#2f5d8a";
      c.fillRect(0, h * 0.62, w, h * 0.38);
      textoCentro(c, "LEITE", w / 2, h * 0.2, w * 0.24, "#2f5d8a", 900);
      textoCentro(c, "SERENO", w / 2, h * 0.38, w * 0.13, "#c4161c", 800);
      textoCentro(c, "INTEGRAL", w / 2, h * 0.75, w * 0.12, "#f1efe9", 800);
      textoCentro(c, "1 LITRO", w / 2, h * 0.88, w * 0.1, "#f1efe9", 700, "Inter");
    }, { espelhado: inv, ppm: 3000 });
    rotulo.position.set(0, 0.11, 0.0455);
    api.leite = leite;
    api.caderno = caderno(mesaPosta, "caderno", -0.5, 0, 0.18, -0.2, inv);

    // janela para a rua e a rua lá fora (o ônibus passa nela na parte 9)
    const janela = obj(g, "janela", 3.0, 0, 0.05);
    for (const [h, y, d, z] of [[0.06, 0.95, 1.6, 0], [0.06, 2.15, 1.6, 0], [1.26, 1.55, 0.06, -0.75], [1.26, 1.55, 0.06, 0.8], [1.2, 1.55, 0.05, 0.05]]) caixa(janela, 0.1, h, d, 0xe9e8e4, 0, y, z);
    const vidroC = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2), new THREE.MeshStandardMaterial({ color: 0xcfe0e8, transparent: true, opacity: 0.12, roughness: 0.05 }));
    vidroC.rotation.y = -Math.PI / 2;
    vidroC.position.set(0.0, 1.55, 0.05);
    janela.add(vidroC);
    caixa(janela, 0.28, 0.04, 1.62, 0xe9e8e4, -0.12, 0.93, 0.05);
    const fora = passavel(obj(g, "rua-fora", 0, 0, 0));
    caixa(fora, 4, 0.1, 40, 0x6a6c70, 5.0, -0.25, 0); // calçada
    caixa(fora, 7, 0.1, 40, 0x3a3c40, 10.5, -0.35, 0); // rua
    caixa(fora, 0.12, 0.02, 40, 0xd9d6cf, 10.5, -0.29, 0);
    caixa(fora, 4, 0.1, 40, 0x6a6c70, 16, -0.25, 0);
    const rf = rng(77);
    for (let i = 0; i < 6; i++) {
      const z = -15 + i * 6;
      const h = 4 + rf() * 4;
      caixa(fora, 5, h, 5, [0x8a8f97, 0x7a7f87, 0x969aa1][i % 3], 20.5, h / 2 - 0.3, z);
      for (let j = 0; j < 3; j++) caixa(fora, 0.05, 0.9, 1.0, 0x2f3338, 17.97, 1.2 + j * 1.4, z - 1.2 + (j % 2) * 2.2);
    }
    const ceuC = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), new THREE.MeshBasicMaterial({ color: 0xbfd0df, fog: false }));
    ceuC.rotation.y = -Math.PI / 2;
    ceuC.position.set(30, 8, 0);
    fora.add(ceuC);
    const bus = criarOnibus(3);
    bus.position.set(9.6, -0.3, 30);
    bus.rotation.y = Math.PI / 2;
    fora.add(bus);
    const letreiro = placa(bus, 1.6, 0.32, (c, w, h) => {
      c.fillStyle = "#111214";
      c.fillRect(0, 0, w, h);
      textoCentro(c, "512  CENTRO", w / 2, h / 2 + 2, h * 0.62, "#f2b43a", 800);
    }, { propria: true, espelhado: inv, ppm: 1200 });
    letreiro.userData.base = true;
    api.letreiro = letreiro;
    api.bus = bus;
    // o letreiro vai na lateral do ônibus virada para a casa (o ônibus anda em z)
    api.onibus = (z, visivel = true) => {
      bus.visible = visivel;
      bus.position.z = z;
    };

    // espelho da sala de jantar (parede sul) com a moldura e o aparador embaixo
    const molduraC = obj(g, "moldura-espelho");
    const zM = COZINHA.zEspelho - 0.02;
    const cm = 0x5a4636;
    caixa(molduraC, E.x1 - E.x0 + 0.12, 0.06, 0.04, cm, (E.x0 + E.x1) / 2, E.y1 + 0.03, zM);
    caixa(molduraC, E.x1 - E.x0 + 0.12, 0.06, 0.04, cm, (E.x0 + E.x1) / 2, E.y0 - 0.03, zM);
    caixa(molduraC, 0.06, E.y1 - E.y0, 0.04, cm, E.x0 - 0.03, (E.y0 + E.y1) / 2, zM);
    caixa(molduraC, 0.06, E.y1 - E.y0, 0.04, cm, E.x1 + 0.03, (E.y0 + E.y1) / 2, zM);
    const aparador = obj(g, "aparador", (E.x0 + E.x1) / 2, 0, 2.17);
    caixa(aparador, 1.4, 0.78, 0.42, 0x6b5543, 0, 0.39, 0);
    caixa(aparador, 1.36, 0.01, 0.01, 0x4a3a2e, 0, 0.5, 0.212, { sombra: false });
    const vaso = obj(aparador, "vaso-planta", 0.45, 0.78, 0);
    cilindro(vaso, 0.07, 0.05, 0.16, 10, 0xd9d6cf, 0, 0.08, 0);
    for (const [x, z, r] of [[0, 0, 0], [0.04, 0.02, 0.5], [-0.03, -0.02, -0.4]]) {
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(0x55704f));
      f.position.set(x, 0.24, z);
      f.rotation.set(r, r * 2, 0);
      f.scale.set(0.7, 1.3, 0.7);
      f.castShadow = true;
      vaso.add(f);
    }

    // luzes: pendente sobre a mesa (sombra), sol pela janela, fita embaixo dos armários
    const pend = passavel(obj(g, "pendente", M.x, 0, M.z));
    cilindro(pend, 0.006, 0.006, 0.8, 4, 0x2b2c2f, 0, H - 0.4, 0);
    const cup = cilindro(pend, 0.07, 0.24, 0.18, 16, 0x2f3338, 0, H - 0.85, 0);
    const lampada = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0xdddad2, emissive: 0xfff0d8, emissiveIntensity: 0 }));
    lampada.position.y = H - 0.95;
    pend.add(lampada);
    const luzMesa = luzSpot(g, 0xffefd8, 0, new THREE.Vector3(M.x, H - 0.95, M.z), new THREE.Vector3(M.x, 0, M.z), 1.15, 1024, 8);
    luzMesa.userData.principal = true;
    const fill = espelhado ? { intensity: 0 } : luzPonto(g, 0xfff1de, 0, 0, 2.2, 0.6, 9, 1.3);
    const sol = luzSpot(g, 0xffe6c2, 0, new THREE.Vector3(6.5, 4.2, 0.3), new THREE.Vector3(0.2, 0, -0.3), 0.45, 1024, 16);
    const fita = espelhado ? { intensity: 0 } : luzPonto(g, 0xfff3e0, 0, -1.2, 1.4, -2.0, 3, 1.6);
    const hemi = espelhado ? { intensity: 0 } : new THREE.HemisphereLight(0xeef1f4, 0x55504a, 0);
    if (!espelhado) g.add(hemi);
    api.luz = ({ mesa = 0, janela = 0, fita: fi = 0, ambiente = 0 }) => {
      luzMesa.intensity = 24 * mesa;
      lampada.material.emissiveIntensity = 1.5 * mesa;
      fill.intensity = 2.4 * Math.max(mesa, 0.5 * janela);
      sol.intensity = 80 * janela;
      fita.intensity = 1.4 * fi;
      hemi.intensity = ambiente;
    };
    api.grupo = g;
    return api;
  }

  const { real, esp, a, b } = comEspelho(cena, "cozinha", construir, COZINHA.zEspelho);
  const larg = E.x1 - E.x0;
  const alt = E.y1 - E.y0;
  const matV = materialVidro(larg, alt);
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), matV);
  vidro.rotation.y = Math.PI;
  vidro.position.set((E.x0 + E.x1) / 2, (E.y0 + E.y1) / 2, COZINHA.zEspelho - 0.002);
  vidro.renderOrder = 5;
  vidro.userData.passavel = true;
  real.add(vidro);
  const ambos = (f) => (...args) => {
    a[f](...args);
    b[f](...args);
  };
  const ret = {
    grupo: real,
    grupoEspelho: esp,
    fundo: 0xbfd0df,
    nevoa: [0xbfd0df, 30, 80],
    vidro,
    materialVidro: matV,
    real: a,
    copia: b,
    luz: ambos("luz"),
    radio: ambos("radio"),
    cafe: ambos("cafe"),
    onibus: ambos("onibus"),
    relogio: { mostrar: (txt) => (a.relogio.userData.mostrar(txt), b.relogio.userData.mostrar(txt)) },
    modoAtual: null,
    modo(nome) {
      if (nome === ret.modoAtual) return;
      ret.modoAtual = nome;
      const L = { manha: { mesa: 0.6, janela: 1, fita: 1, ambiente: 0.6 }, dia: { mesa: 0.4, janela: 1, fita: 0.6, ambiente: 0.6 }, noite: { mesa: 1, fita: 1, ambiente: 0.3 } }[nome] || { mesa: 1, janela: 1, ambiente: 0.5 };
      ret.luz(L);
    },
    atualizar() {},
  };
  return ret;
}

// ------------------------------------------------------------ rua da padaria
// Fachadas em z = 3.5 viradas para a rua (z-); calçada z de 0 a 3.5 (altura 0.12), rua z de -7 a 0,
// calçada do outro lado e prédios. A padaria fica em x de -3.5 a 3.5; a vitrine reflete a rua e quem passa.
export const RUA = {
  calcada: 0.12,
  vitrine: { x0: -3.1, x1: 0.5, y0: 0.55, y1: 2.45, z: 3.44 },
};
function arvore(pai, nome, x, z, sem) {
  const a = obj(pai, nome, x, RUA.calcada, z);
  const r = rng(sem);
  cilindro(a, 0.09, 0.13, 2.2, 7, 0x4a3b30, 0, 1.1, 0);
  for (let i = 0; i < 4; i++) {
    const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 + r() * 0.3, 0), mat(i % 2 ? 0x5d6e54 : 0x52634a));
    copa.position.set((r() - 0.5) * 0.8, 2.5 + r() * 0.7, (r() - 0.5) * 0.8);
    copa.rotation.set(r() * 3, r() * 3, 0);
    copa.castShadow = true;
    a.add(copa);
  }
  caixa(a, 0.9, 0.04, 0.9, 0x4a3b30, 0, 0.02, 0, { sombra: false });
  return a;
}
function fachada(pai, nome, x0, x1, h, cor, letreiro, sem) {
  const f = obj(pai, nome);
  const w = x1 - x0;
  const cx = (x0 + x1) / 2;
  caixa(f, w, h, 0.3, cor, cx, h / 2, 3.65);
  caixa(f, w, 0.12, 0.4, 0x3a3c40, cx, h - 0.06, 3.6);
  // vitrine escura e porta
  caixa(f, w * 0.55, 1.7, 0.04, 0x1d2228, cx - w * 0.15, 1.35, 3.49, { aspereza: 0.15, metal: 0.3 });
  caixa(f, 1.0, 2.2, 0.04, 0x262b31, cx + w * 0.3, 1.1 + RUA.calcada, 3.49, { aspereza: 0.2 });
  const p = placa(f, Math.min(3.2, w * 0.7), 0.5, (c, ww, hh) => {
    c.fillStyle = "#2a2d33";
    c.fillRect(0, 0, ww, hh);
    textoCentro(c, letreiro, ww / 2, hh / 2 + 2, hh * 0.55, "#e6e2da", 800);
  }, { propria: true });
  p.rotation.y = Math.PI;
  p.position.set(cx, 2.85, 3.48);
  // janelas do andar de cima
  const r = rng(sem);
  for (let i = 0; i < Math.floor(w / 1.8); i++) {
    const jx = x0 + 0.9 + i * 1.8;
    caixa(f, 1.0, 1.2, 0.04, r() < 0.3 ? 0x5a6470 : 0x262b31, jx, 4.3, 3.49, { aspereza: 0.2 });
    caixa(f, 1.1, 0.06, 0.12, 0xd9d6cf, jx, 3.68, 3.46);
  }
  return f;
}
export function criarRua(cena) {
  const g = new THREE.Group();
  g.name = "rua";
  g.position.copy(DESLOCAMENTO.rua);
  cena.add(g);
  const C = RUA.calcada;
  const api = { grupo: g, fundo: 0xbfd0df, nevoa: [0xc9d6e2, 40, 160] };
  const ladrilho = texturaAzulejo(0x9a9893, 0x7c7a75, { colunas: 4, linhas: 4, semente: 51, ruido: 0.06 });
  const calc = passavel(obj(g, "calcada"));
  caixa(calc, 60, C, 3.5, 0xffffff, 0, C / 2, 1.75, { material: matTextura(ladrilho, 60, 3.5, 0.8, { aspereza: 0.8 }) });
  caixa(calc, 60, C + 0.02, 0.15, 0xb4b2ad, 0, C / 2, 0.07);
  caixa(calc, 60, C, 3.5, 0x8f8d88, 0, C / 2, -8.75);
  const asfalto = passavel(obj(g, "rua"));
  caixa(asfalto, 60, 0.04, 7, 0x3d3f43, 0, 0.0, -3.5, { aspereza: 0.95 });
  for (let x = -28; x < 30; x += 4) caixa(asfalto, 2, 0.01, 0.12, 0xe6e2da, x, 0.025, -3.5, { sombra: false });

  // padaria: fachada com a vitrine (vão), porta de vidro, letreiro, toldo e o interior iluminado
  const V = RUA.vitrine;
  const pad = obj(g, "padaria");
  const furos = [{ x0: -V.x1, x1: -V.x0, y0: V.y0, y1: V.y1 }, { x0: -2.1, x1: -0.9, y0: 0, y1: 2.35 }];
  paredeTex(pad, { w: 7.0, h: 6.2, e: 0.25, x: 0, z: 3.6, ry: Math.PI, cor: 0xbfae94, furos, nome: "fachada-padaria" });
  caixa(pad, 7.0, 0.12, 0.4, 0x6b5d4c, 0, V.y0 - 0.06, 3.5);
  const letreiro = placa(pad, 3.4, 0.6, (c, w, h) => {
    c.fillStyle = "#2b231c";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#c4161c";
    c.fillRect(0, h - h * 0.08, w, h * 0.08);
    textoCentro(c, "PADARIA", w / 2, h * 0.47, h * 0.58, "#f1e6cf", 900);
  }, { propria: true });
  letreiro.rotation.y = Math.PI;
  letreiro.position.set(-1.2, 3.0, 3.46);
  // toldo listrado (vermelho-escuro e creme)
  const toldo = obj(pad, "toldo", -1.2, 0, 0);
  for (let i = 0; i < 12; i++) {
    const x = -2.9 + i * 0.5 + 0.25;
    caixa(toldo, 0.5, 0.025, 0.95, i % 2 ? 0xe8dcc5 : 0x7a1f22, x, 2.6, 3.0, { rx: -0.32 });
  }
  caixa(toldo, 6.0, 0.18, 0.02, 0x7a1f22, 0, 2.38, 2.53);
  // porta de vidro
  const portaP = obj(pad, "porta-padaria", 1.5, C, 3.5);
  caixa(portaP, 1.2, 0.05, 0.06, 0x3a3532, 0, 2.2, 0);
  caixa(portaP, 0.05, 2.2, 0.06, 0x3a3532, -0.58, 1.1, 0);
  caixa(portaP, 0.05, 2.2, 0.06, 0x3a3532, 0.58, 1.1, 0);
  const vidroPorta = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.15), new THREE.MeshStandardMaterial({ color: 0xcfe0e8, transparent: true, opacity: 0.18, roughness: 0.05 }));
  vidroPorta.rotation.y = Math.PI;
  vidroPorta.position.set(0, 1.1, 0);
  portaP.add(vidroPorta);
  const aberto = placa(portaP, 0.36, 0.14, (c, w, h) => {
    c.fillStyle = "#1d1f24";
    c.fillRect(0, 0, w, h);
    textoCentro(c, "ABERTO", w / 2, h / 2 + 1, h * 0.6, "#e01b22", 800);
  }, { propria: true });
  aberto.rotation.y = Math.PI;
  aberto.position.set(0, 1.5, -0.01);
  // vidro da vitrine: reflete a rua (e o reflexo), deixa ver os pães
  const vit = new EspelhoPlano(V.x1 - V.x0, V.y1 - V.y0, { resolucao: 1024, transparente: true, mistura: 0.5, cor: 0xe8eef2, brilho: 0.05 });
  vit.rotation.y = Math.PI;
  vit.position.set((V.x0 + V.x1) / 2, (V.y0 + V.y1) / 2, V.z);
  vit.userData.passavel = true;
  pad.add(vit);
  api.vitrine = vit;
  // dentro: chão, parede do fundo, prateleiras com pães, balcão de vidro
  const dentro = obj(pad, "interior");
  caixa(dentro, 6.8, 0.05, 4.4, 0x8a7a68, 0, C - 0.025, 5.9);
  caixa(dentro, 6.8, 3.4, 0.1, 0xe2d8c6, 0, 1.7, 8.1);
  caixa(dentro, 6.8, 0.1, 4.4, 0xe9e5dc, 0, 3.3, 5.9);
  const rp = rng(61);
  for (let i = 0; i < 3; i++) {
    const y = 1.0 + i * 0.5;
    caixa(dentro, 4.6, 0.04, 0.45, 0x6b5543, -0.5, y, 7.8);
    for (let k = 0; k < 14; k++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mat([0xc9975e, 0xb98048, 0xd8ab72][k % 3], { aspereza: 0.85 }));
      p.scale.set(1.5, 0.7, 0.8);
      p.position.set(-2.6 + k * 0.32 + rp() * 0.05, y + 0.09, 7.75);
      p.rotation.y = rp() * 0.6;
      p.castShadow = true;
      dentro.add(p);
    }
  }
  caixa(dentro, 3.2, 0.95, 0.6, 0xd9d6cf, -0.8, C + 0.475, 6.4);
  const vidroBalcao = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 0.6), new THREE.MeshStandardMaterial({ color: 0xcfe0e8, transparent: true, opacity: 0.2, roughness: 0.05 }));
  vidroBalcao.position.set(-0.8, C + 1.17, 6.4);
  dentro.add(vidroBalcao);
  for (let k = 0; k < 8; k++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat([0xe0b27a, 0xa86a3a][k % 2]));
    b.scale.set(1.2, 0.6, 1.0);
    b.position.set(-2.2 + k * 0.38, C + 1.0, 6.4);
    dentro.add(b);
  }
  const luzDentro = luzPonto(dentro, 0xffe2b8, 6, -1.0, 2.9, 5.6, 9, 1.4);
  luzPonto(dentro, 0xffe2b8, 3, 1.6, 2.9, 5.6, 7, 1.4);

  // vizinhos, prédios do outro lado, árvores, postes, ponto de ônibus, carros
  fachada(g, "papelaria", -12, -3.5, 6.2, 0x8c949c, "PAPELARIA", 3);
  fachada(g, "lavanderia", 3.5, 12, 6.2, 0x9c968c, "LAVANDERIA", 4);
  fachada(g, "loja-fim", 12, 22, 7.0, 0x7d858d, "FARMÁCIA", 5);
  fachada(g, "loja-inicio", -22, -12, 7.0, 0xa39b8e, "MERCADO", 6);
  const outroLado = passavel(obj(g, "outro-lado"));
  const ro = rng(71);
  for (let x = -26; x < 28; x += 6.5) {
    const h = 6 + ro() * 8;
    caixa(outroLado, 6.2, h, 6, [0x8a9098, 0x9a9488, 0x7f878f, 0xa0a4a8][Math.floor(ro() * 4)], x, h / 2, -13.5);
    for (let j = 0; j < Math.floor(h / 2.2); j++) for (let i = 0; i < 2; i++) caixa(outroLado, 1.0, 1.1, 0.05, 0x2f3338, x - 1.4 + i * 2.8, 2.0 + j * 2.2, -10.47);
  }
  arvore(g, "arvore-1", -7.5, 0.8, 81);
  arvore(g, "arvore-2", 7.0, 0.8, 82);
  arvore(g, "arvore-3", -16, 0.8, 83);
  for (const x of [-10, 4.2, 16]) {
    const poste = obj(g, "poste-" + x, x, C, 0.35);
    cilindro(poste, 0.06, 0.08, 4.6, 8, 0x3a3c40, 0, 2.3, 0);
    caixa(poste, 0.08, 0.06, 1.0, 0x3a3c40, 0, 4.55, -0.45);
    caixa(poste, 0.25, 0.1, 0.4, 0x2a2b2e, 0, 4.5, -0.9);
  }
  const ponto = obj(g, "ponto-de-onibus", 10.0, C, 1.4);
  caixa(ponto, 2.4, 0.06, 1.2, 0x3a3c40, 0, 2.3, 0);
  caixa(ponto, 0.06, 2.3, 0.06, 0x3a3c40, -1.15, 1.15, 0.5);
  caixa(ponto, 0.06, 2.3, 0.06, 0x3a3c40, 1.15, 1.15, 0.5);
  caixa(ponto, 2.3, 1.6, 0.03, 0x9fb3be, 0, 1.4, 0.55, { opacidade: 0.35 });
  caixa(ponto, 1.8, 0.06, 0.4, 0x6b5543, 0, 0.48, 0.3);
  caixa(ponto, 1.8, 0.4, 0.04, 0x6b5543, 0, 0.7, 0.5);
  const placaPonto = placa(ponto, 0.5, 0.3, (c, w, h) => {
    c.fillStyle = "#2f5d8a";
    c.fillRect(0, 0, w, h);
    textoCentro(c, "ÔNIBUS", w / 2, h / 2 + 2, h * 0.35, "#ffffff", 800);
  }, { propria: true });
  placaPonto.position.set(1.4, 2.6, 0.5);
  placaPonto.rotation.y = Math.PI;
  for (const [x, sem] of [[-16.5, 21], [14.5, 22]]) {
    const c = criarCarro(sem);
    c.position.set(x, 0, -1.1);
    g.add(c);
  }
  const ceuR = ceu(g, 0x8fb0d0, 0xd6e1ea, 300);
  passavel(ceuR);
  const sol = new THREE.DirectionalLight(0xfff1dc, 2.6);
  sol.position.set(-20, 30, -18);
  sol.target.position.set(0, 0, 2);
  sol.castShadow = true;
  sol.shadow.mapSize.set(4096, 4096);
  const S = 18;
  Object.assign(sol.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 1, far: 90 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.03;
  sol.shadow.radius = 3;
  g.add(sol);
  g.add(sol.target);
  const hemi = new THREE.HemisphereLight(0xdbe6f0, 0x6a655e, 1.25);
  g.add(hemi);
  api.modo = (nome) => {
    const tarde = nome === "tarde";
    sol.color.setHex(tarde ? 0xffd8a8 : 0xfff1dc);
    sol.intensity = tarde ? 2.0 : 2.6;
    hemi.intensity = tarde ? 0.95 : 1.25;
    luzDentro.intensity = 6;
  };
  api.atualizar = () => {};
  return api;
}

// ------------------------------------------------------------ ônibus por dentro
// x de -5.5 a 5.5 (frente em x+), z de -1.25 a 1.25, piso em y = 0, teto 2.25. Bancos em pares nos dois lados.
// A paisagem lá fora passa (bloco de 60 m repetido); a janela ao lado do banco dele reflete (EspelhoPlano).
export const ONIBUS = {
  fileiras: [-4.2, -3.0, -1.8, -0.6, 0.6, 1.8, 3.0],
  assento: 0.47,
  janelaDele: { x: -0.6, z: 1.215 },
};
function bancoOnibus(pai, nome, x, lado) {
  const b = obj(pai, nome, x, 0, lado * 0.72);
  caixa(b, 0.46, 0.1, 0.86, 0x3f4c5c, 0.0, ONIBUS.assento - 0.05, 0);
  caixa(b, 0.08, 0.62, 0.86, 0x3f4c5c, -0.23, 0.78, 0, { rz: 0.12 });
  caixa(b, 0.09, 0.16, 0.86, 0x56657a, -0.26, 1.13, 0, { rz: 0.12 });
  caixa(b, 0.06, 0.42, 0.06, 0x8e9196, 0.0, 0.21, -lado * 0.36, { metal: 0.6 });
  caixa(b, 0.4, 0.04, 0.06, 0x8e9196, 0.0, 0.02, -lado * 0.36, { metal: 0.6 });
  cilindro(b, 0.016, 0.016, 0.22, 8, 0xb9bcc0, -0.26, 1.28, -lado * 0.4, { metal: 0.7, rz: Math.PI / 2 });
  return b;
}
export function criarOnibusDentro(cena) {
  const g = new THREE.Group();
  g.name = "onibus";
  g.position.copy(DESLOCAMENTO.onibus);
  cena.add(g);
  const api = { grupo: g, fundo: 0xc7d3de, nevoa: [0xc7d3de, 25, 120] };
  const corpo = obj(g, "carroceria");
  api.carroceria = corpo;
  const H = 2.25;
  const chao = passavel(obj(corpo, "chao"));
  caixa(chao, 11, 0.06, 2.5, 0x3d4045, 0, -0.03, 0, { aspereza: 0.9 });
  caixa(chao, 11, 0.004, 0.7, 0x53575d, 0, 0.003, 0, { sombra: false });
  const teto = passavel(obj(corpo, "teto"));
  caixa(teto, 11, 0.06, 2.5, 0xd9dbdc, 0, H + 0.03, 0);
  // laterais: painel de baixo, colunas entre as janelas, painel de cima
  const pilares = [-5.25, -4.55, -3.35, -2.15, -0.95, 0.25, 1.45, 2.65, 3.85, 5.0];
  for (const lado of [-1, 1]) {
    const lat = obj(corpo, "lateral-" + (lado > 0 ? "dir" : "esq"));
    caixa(lat, 11, 0.95, 0.06, 0xb7bcc2, 0, 0.475, lado * 1.25);
    caixa(lat, 11, 0.3, 0.06, 0xc7cbd0, 0, H - 0.15, lado * 1.25);
    for (const x of pilares) caixa(lat, 0.14, 1.0, 0.07, 0xb7bcc2, x, 1.45, lado * 1.25);
    // vidros (o reflexivo é o da janela dele)
    for (let i = 0; i < pilares.length - 1; i++) {
      const x0 = pilares[i] + 0.07;
      const x1 = pilares[i + 1] - 0.07;
      const cx = (x0 + x1) / 2;
      if (lado > 0 && Math.abs(cx - ONIBUS.janelaDele.x) < 0.5) continue;
      const v = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 1.0), new THREE.MeshStandardMaterial({ color: 0xd6e2ea, transparent: true, opacity: 0.12, roughness: 0.05 }));
      v.position.set(cx, 1.45, lado * 1.22);
      v.rotation.y = lado > 0 ? Math.PI : 0;
      v.userData.passavel = true;
      lat.add(v);
    }
    // corrimão comprido no teto
    cilindro(lat, 0.016, 0.016, 10.5, 8, 0xb9bcc0, 0, 1.95, lado * 0.45, { rz: Math.PI / 2, metal: 0.7 });
  }
  const J = ONIBUS.janelaDele;
  const jx0 = pilares.find((x, i) => pilares[i + 1] > J.x && x < J.x) + 0.07;
  const jx1 = pilares.find((x) => x > J.x) - 0.07;
  const janela = new EspelhoPlano(jx1 - jx0, 1.0, { resolucao: 1024, transparente: true, mistura: 0.42, cor: 0xe8eef2, brilho: 0.04 });
  janela.position.set((jx0 + jx1) / 2, 1.45, J.z);
  janela.rotation.y = Math.PI;
  janela.userData.passavel = true;
  corpo.add(janela);
  api.janela = janela;
  // frente (para-brisa e motorista) e fundo
  const frente = obj(corpo, "frente");
  caixa(frente, 0.08, 0.95, 2.5, 0x9ea4aa, 5.5, 0.475, 0);
  const parabrisa = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), new THREE.MeshStandardMaterial({ color: 0xd6e2ea, transparent: true, opacity: 0.1, roughness: 0.05 }));
  parabrisa.rotation.y = -Math.PI / 2;
  parabrisa.position.set(5.5, 1.5, 0);
  parabrisa.userData.passavel = true;
  frente.add(parabrisa);
  caixa(frente, 0.9, 0.5, 2.3, 0x2b2d31, 5.05, 0.95, 0);
  caixa(frente, 0.12, 2.25, 0.85, 0xb7bcc2, 4.35, 1.125, 0.82);
  const volante = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 16), mat(0x1c1d20));
  volante.position.set(4.52, 1.3, -0.7);
  volante.rotation.set(0, Math.PI / 2, 0.0);
  volante.rotation.order = "YXZ";
  volante.rotation.x = -0.45;
  volante.userData.passavel = true; // as mãos do motorista seguram o volante
  frente.add(volante);
  const assentoMot = obj(corpo, "banco-motorista", 4.15, 0, -0.7);
  caixa(assentoMot, 0.5, 0.1, 0.5, 0x2b2d31, 0, ONIBUS.assento - 0.05, 0);
  caixa(assentoMot, 0.08, 0.7, 0.5, 0x2b2d31, -0.24, 0.85, 0);
  caixa(assentoMot, 0.1, 0.42, 0.1, 0x55595f, 0, 0.21, 0);
  const fundo = obj(corpo, "fundo");
  caixa(fundo, 0.08, H, 2.5, 0xb7bcc2, -5.5, H / 2, 0);
  for (const x of ONIBUS.fileiras) for (const lado of [-1, 1]) bancoOnibus(corpo, `banco-${x}-${lado > 0 ? "d" : "e"}`, x, lado);
  // barras verticais
  for (const x of [-3.6, -1.2, 1.2, 3.6]) {
    const b = obj(corpo, "barra-" + x, x, 0, -0.32);
    cilindro(b, 0.018, 0.018, H, 8, 0xc9a43a, 0, H / 2, 0, { metal: 0.6, aspereza: 0.35 });
  }
  // luzes do teto (faixas que acendem)
  const faixas = passavel(obj(corpo, "luzes-teto"));
  const matFaixa = new THREE.MeshStandardMaterial({ color: 0xe6e6e2, emissive: 0xf4f6ff, emissiveIntensity: 1.2 });
  for (const lado of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.03, 0.12), matFaixa);
    f.position.set(-0.2, H - 0.02, lado * 0.62);
    faixas.add(f);
  }
  const luzA = luzSpot(corpo, 0xeef2ff, 14, new THREE.Vector3(-1.5, H - 0.1, 0), new THREE.Vector3(-1.5, 0, 0.2), 1.35, 1024, 8);
  const luzB = luzSpot(corpo, 0xeef2ff, 12, new THREE.Vector3(2.0, H - 0.1, 0), new THREE.Vector3(2.0, 0, 0.2), 1.35, 1024, 8);
  luzPonto(corpo, 0xeef2ff, 2.2, -0.6, 1.9, 0.6, 5, 1.5);

  // paisagem lá fora: dois blocos de 60 m que passam e se repetem
  const fora = passavel(obj(g, "paisagem"));
  api.paisagem = fora;
  const blocos = [];
  for (let k = 0; k < 2; k++) {
    const bl = obj(fora, "bloco-" + k, k * 60, 0, 0);
    blocos.push(bl);
    const rb = rng(91 + k);
    for (const lado of [-1, 1]) {
      caixa(bl, 60, 0.1, 3, 0x8f8d88, 0, -0.55, lado * 4.6);
      caixa(bl, 60, 0.05, 6, 0x3d3f43, 0, -0.7, lado * 1.8 + (lado > 0 ? 0 : 0));
      let x = -30;
      while (x < 30) {
        const w = 5 + rb() * 6;
        const h = 4 + rb() * 9;
        const pr = caixa(bl, w - 0.4, h, 5, [0x8a9098, 0x9a9488, 0x7f878f, 0xa0a4a8, 0x8c7f74][Math.floor(rb() * 5)], x + w / 2, h / 2 - 0.6, lado * 9.5);
        for (let j = 0; j < Math.floor(h / 2.4); j++) caixa(bl, w * 0.6, 0.9, 0.05, 0x2f3338, x + w / 2, 1.2 + j * 2.4, lado * 6.97);
        x += w;
      }
      for (let i = 0; i < 6; i++) {
        const ax = -27 + i * 10 + rb() * 3;
        const tr = obj(bl, "arvore", ax, -0.5, lado * 5.4);
        cilindro(tr, 0.08, 0.11, 2.0, 6, 0x4a3b30, 0, 1.0, 0);
        const cp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), mat(0x58694f));
        cp.position.y = 2.5;
        tr.add(cp);
        const po = obj(bl, "poste", ax + 5, -0.5, lado * 5.9);
        cilindro(po, 0.05, 0.07, 4.2, 6, 0x3a3c40, 0, 2.1, 0);
      }
    }
  }
  const ceuO = ceu(g, 0x9db6cf, 0xe6d6c2, 250);
  passavel(ceuO);
  const sol = new THREE.DirectionalLight(0xffd9b0, 1.6);
  sol.position.set(-30, 18, 25);
  sol.target.position.set(0, 0, 0);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 80 });
  sol.shadow.radius = 3;
  g.add(sol);
  g.add(sol.target);
  const hemi = new THREE.HemisphereLight(0xdbe3ec, 0x5d5a55, 0.9);
  g.add(hemi);
  // o ônibus anda: a paisagem passa a v m/s e a carroceria balança de leve
  api.andar = (t, v = 8) => {
    const d = (v * t) % 60;
    blocos[0].position.x = -d;
    blocos[1].position.x = 60 - d;
    corpo.rotation.x = 0.004 * Math.sin(t * 2.3) + 0.002 * Math.sin(t * 5.1);
    corpo.position.y = 0.006 * Math.sin(t * 3.7);
  };
  api.modo = () => {};
  api.atualizar = () => {};
  return api;
}
