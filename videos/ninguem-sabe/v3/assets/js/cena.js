// Motor das partes do vídeo 2: uma cena Three.js por parte, com os planos (cortes de câmera e de cenário)
// em tempos da narração. Cada parte (compositions/parteNN.html) só descreve os seus dados: planos, câmera,
// poses, o reflexo, o celular e o que muda quadro a quadro. Tudo é render(t), puxado pelo relógio GSAP.
//
// Novidades em relação ao vídeo 1:
// - qualidade: sombras suaves (PCF soft) em alta, texturas com filtro anisotrópico;
// - vida: todo personagem pisca sozinho e mexe a cabeça de leve (dá para desligar ou forçar piscadas);
// - reflexo: um "dublê" do personagem refaz a pose dele com atraso (ou faz outra coisa), dentro do mundo
//   espelhado do banheiro/cozinha ou nos reflexos planos (celular, vitrine, janela do ônibus, espelho do quarto);
// - checagem: ctx.colisoes() lista partes de personagens dentro de móveis/paredes e objetos se atravessando.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
import { DESLOCAMENTO, criarCelular, rng } from "./mundo.js";
import { criarBanheiro, criarQuarto2, criarCozinha, criarRua, criarOnibusDentro } from "./mundo3.js";
import { criarPersonagem, poseBoneco, pontosDoBoneco, MEDIDAS } from "./personagem.js";
import { GANCHOS } from "./reflexo.js";

export { THREE, DESLOCAMENTO, MEDIDAS, rng };

const CONSTRUTORES = {
  banheiro: criarBanheiro,
  quarto2: criarQuarto2,
  cozinha: criarCozinha,
  rua: criarRua,
  onibus: criarOnibusDentro,
};

// ------------------------------------------------------------ curvas e chaves
export const CURVA = {
  linear: (k) => k,
  suave: (k) => k * k * (3 - 2 * k),
  entra: (k) => k * k * k,
  sai: (k) => 1 - Math.pow(1 - k, 3),
  ambos: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  longa: (k) => 1 - Math.pow(1 - k, 4),
  // corte seco: segura o valor anterior e salta no instante da chave (mudança de plano)
  corte: (k) => (k < 1 ? 0 : 1),
};
// chaves: [[t, valor, curva?], ...]; valor é número ou lista. Duas chaves no mesmo t = corte seco.
export function trilha(chaves, t) {
  if (t <= chaves[0][0]) return chaves[0][1];
  for (let i = 1; i < chaves.length; i++) {
    const [t1, v1, nome = "suave"] = chaves[i];
    if (t <= t1) {
      const [t0, v0] = chaves[i - 1];
      const k = CURVA[nome]((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, j) => a + (v1[j] - a) * k) : v0 + (v1 - v0) * k;
    }
  }
  return chaves[chaves.length - 1][1];
}
export function degrau(chaves, t) {
  let v = chaves[0][1];
  for (const [ti, vi] of chaves) if (t >= ti) v = vi;
  return v;
}
export const pisca = (t, periodo, aceso = 0.5) => ((t % periodo) + periodo) % periodo < periodo * aceso;

// REGRAS FIXAS DO CANAL (iluminação): tudo ~30% mais claro. A exposição e a luz de preenchimento
// multiplicam por CLARIDADE; as luzes ambiente e hemisféricas de cada cenário, por AMBIENTE
// (sobre o valor que o modo do cenário acabou de pôr: quando o modo muda, a base muda e reescala).
export const CLARIDADE = 1.3;
export const AMBIENTE = 1.3;
function clarearAmbiente(c) {
  for (const g of [c.grupo, c.grupoEspelho]) {
    if (!g) continue;
    if (!g.userData.luzesAmb) {
      g.userData.luzesAmb = [];
      g.traverse((o) => (o.isHemisphereLight || o.isAmbientLight) && g.userData.luzesAmb.push(o));
    }
    for (const l of g.userData.luzesAmb) {
      if (l.intensity !== l.userData.clareada) {
        l.intensity *= AMBIENTE;
        l.userData.clareada = l.intensity;
      }
    }
  }
}

// Tempos das palavras: T("escadas") = início da 1ª ocorrência; T("chama", 3) = da 3ª; T.fim(...) = fim.
const chave = (s) => s.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}:]/gu, "");
export function tempos(palavras) {
  const achar = (texto, n = 1) => {
    const alvo = texto.split(/\s+/).map(chave);
    let visto = 0;
    for (let i = 0; i + alvo.length <= palavras.length; i++) {
      if (alvo.every((a, j) => chave(palavras[i + j].text) === a) && ++visto === n) return i;
    }
    throw new Error(`palavra não encontrada: ${texto} (${n})`);
  };
  const T = (texto, n) => palavras[achar(texto, n)].start;
  T.fim = (texto, n) => {
    const i = achar(texto, n);
    return palavras[i + texto.split(/\s+/).length - 1].end;
  };
  return T;
}

// tremor de câmera na mão: soma de senos com fases fixas
const fase = rng(91);
const F = Array.from({ length: 6 }, () => fase() * Math.PI * 2);
export const fovVertical = (fov) => Math.min(84, (2 * Math.atan(Math.tan((fov * Math.PI) / 360) / 0.5625) * 180) / Math.PI);
export const tremor = (t, a) => [
  a * (Math.sin(1.1 * t + F[0]) + 0.5 * Math.sin(2.7 * t + F[1]) + 0.25 * Math.sin(5.3 * t + F[2])),
  a * (Math.sin(0.9 * t + F[3]) + 0.5 * Math.sin(2.3 * t + F[4]) + 0.25 * Math.sin(4.9 * t + F[5])),
];

// piscadas naturais: a cada 2,4–5 s (determinístico por personagem); fecha em 0,07 s, abre em 0,11 s
const cachePiscadas = new Map();
function instantesDePiscar(semente) {
  if (!cachePiscadas.has(semente)) {
    const r = rng(semente);
    const lista = [];
    let t = 0.6 + r() * 1.5;
    while (t < 120) {
      lista.push(t);
      t += 2.4 + r() * 2.6;
    }
    cachePiscadas.set(semente, lista);
  }
  return cachePiscadas.get(semente);
}
function fechamento(t, t0) {
  const d = t - t0;
  if (d < 0 || d > 0.2) return 0;
  if (d < 0.07) return d / 0.07;
  if (d < 0.09) return 1;
  return 1 - (d - 0.09) / 0.11;
}
function olhosAbertos(def, t, semente) {
  let f = 0;
  const pausado = (def.semPiscar || []).some(([a, b]) => t >= a && t <= b);
  if (def.piscar !== false && !pausado) for (const t0 of instantesDePiscar(semente)) f = Math.max(f, fechamento(t, t0));
  for (const t0 of def.piscadas || []) f = Math.max(f, fechamento(t, t0));
  return 1 - f;
}

// pós-efeito leve (só liga quando a parte pede): onda, separação de cor, tom
const SHADER_POS = {
  uniforms: { tDiffuse: { value: null }, onda: { value: 0 }, tom: { value: 0 }, tempo: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float onda; uniform float tom; uniform float tempo; varying vec2 vUv;
    void main(){
      vec2 uv = vUv;
      uv.x += sin(uv.y * 16.0 + tempo * 1.7) * 0.0028 * onda;
      uv.y += sin(uv.x * 12.0 + tempo * 1.3) * 0.0018 * onda;
      float d = 0.0018 * onda;
      vec3 c = vec3(texture2D(tDiffuse, uv + vec2(d, 0.0)).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - vec2(d, 0.0)).b);
      float l = dot(c, vec3(0.3, 0.55, 0.15));
      c = mix(c, l * vec3(0.72, 0.9, 1.25), tom);
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
};

// ------------------------------------------------------------ a parte
export function iniciarParte(cfg) {
  const id = cfg.host.replace(/^__/, "");
  const feitos = new WeakSet();
  const montar = (host) => {
    if (!host || feitos.has(host)) return;
    feitos.add(host);
    montarParte(cfg, host);
  };
  window.__aoHost = window.__aoHost || {};
  window.__aoHost[id] = montar;
  montar(window[cfg.host]);
}

function montarParte(cfg, host) {
  const vars = host.vars || {};
  const vertical = vars.formato === "vertical";
  const inicio = Number(vars.inicio) || 0;
  // cortes verticais: "ate" congela a cena nesse instante (o cartão final fica sobre o último quadro do corte)
  const ate = vars.ate !== undefined && vars.ate !== null && vars.ate !== "" ? Number(vars.ate) : Infinity;
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const tela = host.tela;
  tela.width = W;
  tela.height = H;
  tela.style.width = W + "px";
  tela.style.height = H + "px";

  const renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // (r184: PCF com raio = sombra suave)
  // tone mapping filmico: luz forte não estoura em branco (rosto claro sob a luz do banheiro)
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // REGRAS FIXAS DO CANAL: sombrio, mas ~30% mais claro que o padrão dos vídeos 1 e 2 (exposição 1,1 -> ~1,43)
  renderer.toneMappingExposure = (cfg.exposicao ?? 1.1) * CLARIDADE;
  const anisotropia = renderer.capabilities.getMaxAnisotropy();

  const cena = new THREE.Scene();
  cena.fog = new THREE.Fog(0x000000, 10, 100);
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.02, 900);
  const luzDaCamera = new THREE.PointLight(0xdfe2e6, 0, 12, 1.6);
  cena.add(luzDaCamera);
  const PREENCHIMENTO = { banheiro: 0.35, quarto2: 0.6, cozinha: 0.5, rua: 0, onibus: 0.5, ...(cfg.preenchimento || {}) };

  const cenarios = {};
  for (const nome of cfg.cenarios) cenarios[nome] = CONSTRUTORES[nome](cena, cfg.opcoesCenario?.[nome] || {});

  // personagem principal, o reflexo (fantasma no mundo real, dublê no mundo espelhado) e os outros
  const boneco = criarPersonagem();
  cena.add(boneco);
  const fantasma = criarPersonagem();
  fantasma.visible = false;
  cena.add(fantasma);
  const duble = criarPersonagem();
  duble.visible = false;
  const outros = {};
  for (const o of cfg.outros || []) {
    const b = criarPersonagem(o.variante);
    cena.add(b);
    outros[o.id] = { ...o, boneco: b };
  }

  // celular: do personagem; cópias para o fantasma e para o dublê (mesma tela)
  const celular = criarCelular();
  celular.userData.vidro.material.toneMapped = false;
  cena.add(celular);
  const celularFantasma = celular.clone();
  celularFantasma.visible = false;
  cena.add(celularFantasma);
  const celularDuble = celular.clone();
  celularDuble.matrixAutoUpdate = false;
  celularDuble.visible = false;
  const lanterna = new THREE.SpotLight(0xf2f0ea, 0, 14, 0.5, 0.55, 1.2);
  lanterna.castShadow = false;
  cena.add(lanterna);
  cena.add(lanterna.target);
  const lanternaDuble = new THREE.SpotLight(0xf2f0ea, 0, 14, 0.5, 0.55, 1.2);
  const ctxTela = celular.userData.tela.getContext("2d");

  // o dublê vive no mundo espelhado do cenário do reflexo
  const cenEsp = cfg.reflexo?.cenario ? cenarios[cfg.reflexo.cenario] : null;
  if (cenEsp?.grupoEspelho) {
    cenEsp.grupoEspelho.add(duble);
    cenEsp.grupoEspelho.add(celularDuble);
    cenEsp.grupoEspelho.add(lanternaDuble);
    cenEsp.grupoEspelho.add(lanternaDuble.target);
  }

  // pós-efeito (só liga quando a parte pede)
  const alvoPos = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
  const matPos = new THREE.ShaderMaterial({ ...SHADER_POS, uniforms: THREE.UniformsUtils.clone(SHADER_POS.uniforms), depthTest: false, depthWrite: false });
  const triangulo = new THREE.BufferGeometry();
  triangulo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  triangulo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const cenaPos = new THREE.Scene();
  cenaPos.add(new THREE.Mesh(triangulo, matPos));
  const cameraPos = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // espelhar um ponto do mundo pelo espelho de um cenário (para mãos que atravessam o vidro etc.)
  const espelhar = (v, nome = cfg.reflexo?.cenario) => {
    const c = cenarios[nome];
    const o = DESLOCAMENTO[nome];
    return c.grupoEspelho.localToWorld(v.clone().sub(o));
  };
  const ctx = { THREE, cena, camera, cenarios, boneco, fantasma, duble, outros, celular, lanterna, vertical, W, H, trilha, degrau, pisca, espelhar, renderer };
  window.__cenaAtual = ctx;
  if (cfg.montar) cfg.montar(ctx);

  // texturas mais nítidas de lado (azulejos, placas, telas)
  cena.traverse((o) => {
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) if (m.map && m.map.anisotropy < anisotropia) m.map.anisotropy = anisotropia;
  });

  const planos = cfg.planos;
  const planoEm = (t) => planos.reduce((a, p) => (t >= p.de ? p : a), planos[0]);
  const escuro = host.escuro || null;

  function distancia(posChaves, t0, t) {
    let d = 0;
    let a = trilha(posChaves, t0);
    for (let s = t0 + 1 / 30; s <= t + 1e-6; s += 1 / 30) {
      const b = trilha(posChaves, s);
      d += Math.hypot(b[0] - a[0], b[2] - a[2]);
      a = b;
    }
    return d;
  }

  // def: { pos, onde, pose: {chave: trilha}, passos, piscar, piscadas, semPiscar, vida, semente }
  // sobre: def com pose/pos que valem no instante tSobre (o reflexo que faz outra coisa)
  function poseDe(def, t, sobre = null, tSobre = t) {
    const p = {};
    for (const [k, chaves] of Object.entries(def.pose || {})) p[k] = trilha(chaves, t);
    if (sobre?.pose) for (const [k, chaves] of Object.entries(sobre.pose)) p[k] = trilha(chaves, tSobre);
    const [x, y, z] = sobre?.pos ? trilha(sobre.pos, tSobre) : trilha(def.pos, t);
    const onde = degrau(def.onde, t);
    const o = DESLOCAMENTO[onde];
    const semente = def.semente ?? 7;
    const vida = def.vida ?? 1;
    // cabeça viva: um balanço lento e pequeno, diferente em cada personagem
    const vg = vida * (0.022 * Math.sin(0.61 * t + semente) + 0.012 * Math.sin(1.37 * t + semente * 2.1));
    const vi = vida * (0.014 * Math.sin(0.47 * t + semente * 1.3) + 0.008 * Math.sin(1.13 * t + semente));
    const olhosDef = sobre ? { ...def, piscadas: sobre.piscadas ?? def.piscadas, semPiscar: sobre.semPiscar ?? def.semPiscar, piscar: sobre.piscar ?? def.piscar } : def;
    const tOlho = sobre ? tSobre : t;
    const pose = {
      x: x + o.x,
      y: y + o.y,
      z: z + o.z,
      giro: p.giro ?? 0,
      deitar: p.deitar ?? 0,
      inclinar: p.inclinar ?? 0,
      cabecaGiro: (p.cabecaGiro ?? 0) + vg,
      cabecaInclina: (p.cabecaInclina ?? 0) + vi,
      cabecaTomba: p.cabecaTomba ?? 0,
      quadrilE: p.quadrilE ?? p.quadril ?? 0,
      quadrilD: p.quadrilD ?? p.quadril ?? 0,
      joelhoE: p.joelhoE ?? p.joelho ?? 0,
      joelhoD: p.joelhoD ?? p.joelho ?? 0,
      ombroE: p.ombroE ?? p.ombro ?? 0,
      ombroD: p.ombroD ?? (p.ombro ?? 0) * 0.9,
      aberturaE: p.aberturaE ?? p.abertura ?? 0.12,
      aberturaD: p.aberturaD ?? (p.abertura ?? 0.12) * 1.1,
      cotoveloE: p.cotoveloE ?? p.cotovelo ?? 0.15,
      cotoveloD: p.cotoveloD ?? (p.cotovelo ?? 0.15) * 0.95,
      olhos: (p.olhos ?? 1) * olhosAbertos(olhosDef, tOlho, semente),
      apertar: p.apertar ?? 0,
      boca: p.boca ?? 0,
      sorriso: p.sorriso ?? 0,
      sorrisoLargo: p.sorrisoLargo ?? 0,
      lingua: p.lingua ?? 0,
      sobrancelha: p.sobrancelha ?? 0,
      sobrancelhaMedo: p.sobrancelhaMedo ?? 0,
      respirar: t * (1.9 + 0.8 * (p.ofegar ?? 0)),
    };
    // caminhada / corrida: trechos [t0, t1, amplitude, meioPasso]
    const posPassos = sobre?.pos || def.pos;
    const tPassos = sobre?.pos ? tSobre : t;
    for (const [t0, t1, amp = 1, meio = 0.62] of (sobre?.pos ? sobre.passos : def.passos) || []) {
      if (tPassos >= t0 && tPassos <= t1 + 0.6) {
        pose.andar = (Math.PI * distancia(posPassos, t0, Math.min(tPassos, t1))) / meio;
        pose.passo = amp * trilha([[t0, 0], [t0 + 0.25, 1], [t1, 1], [t1 + 0.5, 0, "sai"]], tPassos);
      }
    }
    return { pose, onde };
  }

  function aplicarPersonagem(b, def, t, plano, sobre = null, tSobre = t) {
    const { pose, onde } = poseDe(def, t, sobre, tSobre);
    poseBoneco(b, pose);
    let final = pose;
    const maos = sobre?.maos ?? def.maos;
    if (maos) {
      const pts = pontosDoBoneco(b);
      const m = maos(sobre?.maos ? tSobre : t, pts, ctx, b);
      if (m && (m.pesoE > 0 || m.pesoD > 0)) {
        final = { ...pose, ...m };
        poseBoneco(b, final);
      }
    }
    b.visible = onde === plano.cenario && (!def.visivel || def.visivel(t, plano));
    return { onde, pose: final };
  }

  // personagem que mora no mundo espelhado: mesma pose, coordenadas locais do cenário
  const _m = new THREE.Matrix4();
  function poseNoEspelho(b, pose, nome) {
    const c = cenarios[nome];
    const o = DESLOCAMENTO[nome];
    c.grupoEspelho.updateMatrixWorld(true);
    const mapa = (v) => (v ? c.grupoEspelho.localToWorld(v.clone().sub(o)) : v);
    poseBoneco(b, { ...pose, x: pose.x - o.x, y: pose.y - o.y, z: pose.z - o.z, alvoE: mapa(pose.alvoE), alvoD: mapa(pose.alvoD) });
  }
  function celularNaMao(cel, b) {
    const _p = new THREE.Vector3();
    b.userData.rig.bracoE.pega.getWorldPosition(_p);
    cel.position.copy(_p);
    cel.lookAt(pontosDoBoneco(b).cabeca);
    cel.translateY(0.055);
    cel.translateZ(0.035);
    cel.updateMatrixWorld(true);
  }

  // reflexos planos: durante o render do reflexo o personagem dá lugar ao fantasma (pose do reflexo)
  let reflexoPlanoAtivo = false;
  let celularVisivel = false;
  const guardado = { boneco: false, celular: false };
  GANCHOS.antes = () => {
    if (!reflexoPlanoAtivo) return;
    guardado.boneco = boneco.visible;
    guardado.celular = celular.visible;
    boneco.visible = false;
    fantasma.visible = true;
    celularFantasma.visible = guardado.celular || !!celularFantasma.userData.sempre;
    celular.visible = false;
  };
  GANCHOS.depois = () => {
    if (!reflexoPlanoAtivo) return;
    boneco.visible = guardado.boneco;
    fantasma.visible = false;
    celular.visible = guardado.celular;
    celularFantasma.visible = false;
  };

  const _a = new THREE.Vector3();
  const _b = new THREE.Vector3();
  let ultimaTela = null;

  function render(tLocal) {
    const t = Math.min((Number(tLocal) || 0) + inicio, ate);
    const plano = planoEm(t);
    const atual = cenarios[plano.cenario];
    for (const [nome, c] of Object.entries(cenarios)) {
      c.grupo.visible = nome === plano.cenario;
      if (c.grupoEspelho) c.grupoEspelho.visible = nome === plano.cenario && c.espelhoLigado !== false;
    }
    if (atual.modo) atual.modo(plano.modo || "dia", t);
    clarearAmbiente(atual);
    const nevoa = atual.nevoaAtual || atual.nevoa;
    cena.fog.color.setHex(nevoa[0]);
    cena.fog.near = nevoa[1];
    cena.fog.far = nevoa[2];
    renderer.setClearColor(atual.fundoAtual ?? atual.fundo);

    if (cfg.quadro) cfg.quadro(t, plano, ctx, "antes");

    const { pose: poseEle } = aplicarPersonagem(boneco, cfg.personagem, t, plano);
    for (const o of Object.values(outros)) {
      if (o.espelho) {
        const { pose, onde } = poseDe(o, t);
        poseNoEspelho(o.boneco, pose, onde);
        o.boneco.visible = onde === plano.cenario && (!o.visivel || o.visivel(t, plano));
        if (o.boneco.parent !== cenarios[onde].grupoEspelho) cenarios[onde].grupoEspelho.add(o.boneco);
      } else {
        aplicarPersonagem(o.boneco, o, t, plano);
      }
    }
    boneco.userData.rig.cabeca.visible = !(cfg.semCabeca && cfg.semCabeca(t, plano));

    // o reflexo: pose do personagem atrasada (ou a pose própria do reflexo)
    const R = cfg.reflexo;
    let reflexoVisivel = false;
    if (R) {
      const atraso = R.atraso ? R.atraso(t) : 0;
      const tr = t - atraso;
      // janelas de tempo em que o reflexo faz outra coisa (pose/pos/mãos próprias); fora delas, copia com atraso
      const jan = (R.janelas || []).find((j) => t >= j.de && t < j.ate);
      const sobre = jan ? { piscadas: R.piscadas, semPiscar: R.semPiscar, ...jan } : R.pose || R.pos || R.maos || R.piscadas || R.semPiscar ? R : null;
      const r = aplicarPersonagem(fantasma, cfg.personagem, tr, plano, sobre, t);
      fantasma.visible = false;
      reflexoVisivel = r.onde === plano.cenario && (!R.visivel || R.visivel(t, plano));
      reflexoPlanoAtivo = reflexoVisivel && !(R.cenario && plano.cenario === R.cenario);
      if (cenEsp?.grupoEspelho) {
        poseNoEspelho(duble, r.pose, R.cenario);
        duble.visible = reflexoVisivel && plano.cenario === R.cenario;
      }
    }

    // celular: na mão esquerda virado para o rosto, ou parado num lugar, ou guardado
    const lugar = cfg.celular ? cfg.celular(t, plano, ctx) : null;
    celular.visible = !!lugar;
    if (lugar === "mao") {
      celularNaMao(celular, boneco);
    } else if (lugar) {
      const o = DESLOCAMENTO[lugar.cenario];
      celular.position.set(lugar.pos[0] + o.x, lugar.pos[1] + o.y, lugar.pos[2] + o.z);
      celular.rotation.set(...lugar.rot);
    }
    celularVisivel = celular.visible;
    // o celular do reflexo segue a mão do fantasma (atrasada) e aparece espelhado no mundo do espelho
    if (R) {
      const lugarR = R.celular ? R.celular(t, plano, ctx) : lugar;
      if (lugarR === "mao") celularNaMao(celularFantasma, fantasma);
      else if (lugarR) {
        const o = DESLOCAMENTO[lugarR.cenario];
        celularFantasma.position.set(lugarR.pos[0] + o.x, lugarR.pos[1] + o.y, lugarR.pos[2] + o.z);
        celularFantasma.rotation.set(...lugarR.rot);
        celularFantasma.updateMatrixWorld(true);
      }
      if (cenEsp?.grupoEspelho) {
        const o = DESLOCAMENTO[R.cenario];
        celularDuble.matrix.makeTranslation(-o.x, -o.y, -o.z).multiply(celularFantasma.matrixWorld);
        celularDuble.visible = !!lugarR && duble.visible;
      }
    }
    if (cfg.tela) {
      const chaveTela = cfg.tela(ctxTela, t, null);
      if (chaveTela !== ultimaTela) {
        cfg.tela(ctxTela, t, true);
        celular.userData.textura.needsUpdate = true;
        ultimaTela = chaveTela;
      }
    }
    const luzLanterna = cfg.lanterna ? cfg.lanterna(t, plano) : 0;
    lanterna.intensity = luzLanterna * 60;
    lanternaDuble.intensity = duble.visible ? luzLanterna * 60 : 0;
    if (luzLanterna > 0) {
      celular.updateMatrixWorld(true);
      celular.getWorldPosition(lanterna.position);
      lanterna.target.position.copy(lanterna.position).add(_b.set(0, 0, -1).transformDirection(celular.matrixWorld).multiplyScalar(4));
      if (duble.visible) {
        const o = DESLOCAMENTO[R.cenario];
        celularFantasma.getWorldPosition(_a);
        lanternaDuble.position.copy(_a).sub(o);
        _b.set(0, 0, -1).transformDirection(celularFantasma.matrixWorld).multiplyScalar(4);
        lanternaDuble.target.position.copy(lanternaDuble.position).add(_b);
      }
    }

    if (cfg.quadro) cfg.quadro(t, plano, ctx, "depois");

    // câmera: chaves [t, posição, alvo, fov, curva?] no espaço do cenário, ou uma função
    const o = DESLOCAMENTO[plano.cenario];
    const cam = cfg.cameras[plano.nome];
    let fov;
    if (typeof cam === "function") {
      const r = cam(t, ctx);
      camera.position.copy(r.pos);
      camera.up.set(0, 1, 0);
      camera.lookAt(r.alvo);
      fov = r.fov;
    } else {
      const chaves = (vertical && cam.v) || cam.k;
      const pos = trilha(chaves.map(([ti, p, , , c]) => [ti, p, c ?? "suave"]), t);
      const alvo = trilha(chaves.map(([ti, , a, , c]) => [ti, a, c ?? "suave"]), t);
      fov = trilha(chaves.map(([ti, , , f, c]) => [ti, f, c ?? "suave"]), t);
      camera.position.set(pos[0] + o.x, pos[1] + o.y, pos[2] + o.z);
      const d = Math.hypot(alvo[0] - pos[0], alvo[1] - pos[1], alvo[2] - pos[2]);
      const extra = cfg.chacoalhar ? cfg.chacoalhar(t, plano) : 0;
      const [dx, dy] = tremor(t * (1 + extra * 2.5), (cam.tremor ?? 0.003) * (1 + extra * 2));
      camera.up.set(0, 1, 0);
      camera.lookAt(alvo[0] + o.x + dx * d, alvo[1] + o.y + dy * d, alvo[2] + o.z);
    }
    camera.fov = vertical && !(typeof cam !== "function" && cam.v) ? fovVertical(fov) : fov;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    luzDaCamera.position.copy(camera.position).add(_b.set(0, 0.3, 0));
    luzDaCamera.intensity = ((plano.preenchimento ?? PREENCHIMENTO[plano.cenario]) || 0) * CLARIDADE;

    for (const c of Object.values(cenarios)) if (c.atualizar) c.atualizar(t, plano);

    if (escuro) {
      const nivel = cfg.escurecer ? cfg.escurecer(t) : 0;
      escuro.style.opacity = nivel.toFixed(3);
    }

    // desempenho: luz apagada sai da conta (e não renderiza mapa de sombra)
    for (const g of [atual.grupo, atual.grupoEspelho]) {
      if (!g) continue;
      if (!g.userData.luzes) {
        g.userData.luzes = [];
        g.traverse((o) => o.isLight && g.userData.luzes.push(o));
      }
      for (const l of g.userData.luzes) l.visible = l.intensity > 0.001;
    }
    for (const l of [luzDaCamera, lanterna, lanternaDuble]) l.visible = l.intensity > 0.001;

    const pos = cfg.pos ? cfg.pos(t, plano) : null;
    if (pos && (pos.onda > 0 || pos.tom > 0)) {
      renderer.setRenderTarget(alvoPos);
      renderer.render(cena, camera);
      renderer.setRenderTarget(null);
      matPos.uniforms.tDiffuse.value = alvoPos.texture;
      matPos.uniforms.onda.value = pos.onda || 0;
      matPos.uniforms.tom.value = pos.tom || 0;
      matPos.uniforms.tempo.value = t;
      renderer.render(cenaPos, cameraPos);
    } else {
      renderer.render(cena, camera);
    }
  }
  ctx.render = render;

  // ------------------------------------------------ checagem de colisões (para a revisão antes do render)
  // Cada vértice de cada personagem visível é testado contra a caixa local de cada malha sólida do cenário
  // (e dos outros personagens); objetos soltos (filhos diretos do cenário) também são testados entre si.
  // Retorna as invasões mais fundas que a tolerância, com o nome da peça.
  ctx.colisoes = (tol = 0.02) => {
    const plano = planoEm(ctx.ultimoT ?? 0);
    const grupos = [cenarios[plano.cenario]?.grupo, cenarios[plano.cenario]?.grupoEspelho].filter((g) => g && g.visible);
    const solidos = [];
    const nomeDe = (o) => {
      const partes = [];
      for (let p = o; p && !(p.parent && p.parent.isScene); p = p.parent) if (p.name) partes.unshift(p.name);
      return partes.join("/") || "?";
    };
    const pecaDe = (o) => {
      let p = o;
      while (p.parent && !grupos.includes(p.parent) && !(p.parent && p.parent.isScene)) p = p.parent;
      return p;
    };
    for (const g of grupos) {
      g.updateMatrixWorld(true);
      g.traverseVisible((m) => {
        if (!m.isMesh || m.userData.passavel || m.material?.transparent) return;
        for (let p = m; p; p = p.parent) if (p.userData.passavel || /^personagem-/.test(p.name) || p === celularDuble) return;
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        solidos.push({ m, inv: new THREE.Matrix4().copy(m.matrixWorld).invert(), caixa: m.geometry.boundingBox, peca: pecaDe(m), nome: nomeDe(m) });
      });
    }
    const pessoas = [["ele", boneco], ...Object.entries(outros).map(([k, o]) => [k, o.boneco]), ["reflexo", duble]].filter(([, b]) => b.visible);
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    const achados = new Map();
    const testar = (rotulo, malha, contra) => {
      const pos = malha.geometry.attributes.position;
      malha.updateMatrixWorld(true);
      for (let i = 0; i < pos.count; i += 1) {
        v.fromBufferAttribute(pos, i).applyMatrix4(malha.matrixWorld);
        for (const so of contra) {
          s.copy(v).applyMatrix4(so.inv);
          const c = so.caixa;
          const d = Math.min(s.x - c.min.x, c.max.x - s.x, s.y - c.min.y, c.max.y - s.y, s.z - c.min.z, c.max.z - s.z);
          if (d <= 0) continue;
          const escala = so.m.matrixWorld.getMaxScaleOnAxis();
          const fundo = d * escala;
          if (fundo < tol) continue;
          const k = rotulo + " × " + so.nome;
          const at = achados.get(k);
          if (!at || at.fundo < fundo) achados.set(k, { quem: rotulo, onde: so.nome, fundo: +fundo.toFixed(3) });
        }
      }
    };
    for (const [nome, b] of pessoas) {
      const outrosCorpos = [];
      for (const [n2, b2] of pessoas) {
        if (n2 === nome) continue;
        b2.updateMatrixWorld(true);
        b2.traverseVisible((m) => {
          if (!m.isMesh) return;
          if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
          outrosCorpos.push({ m, inv: new THREE.Matrix4().copy(m.matrixWorld).invert(), caixa: m.geometry.boundingBox, nome: n2 + ":" + (m.name || "corpo") });
        });
      }
      b.traverseVisible((m) => {
        if (m.isMesh) testar(nome + ":" + (m.name || "corpo"), m, [...solidos, ...outrosCorpos]);
      });
    }
    // objetos entre si (peças diferentes)
    for (const a of solidos) {
      const contra = solidos.filter((b) => b.peca !== a.peca && !/parede|chao|teto|piso|calcada|rua|batente|corredor/.test(b.nome) && !/parede|chao|teto|piso|calcada|rua|batente|corredor/.test(a.nome));
      if (contra.length) testar("obj:" + a.nome, a.m, contra);
    }
    return [...achados.values()].sort((x, y) => y.fundo - x.fundo);
  };

  // escurece alguns quadros antes de trocar de cenário, para o corte ficar intencional
  if (!cfg.escurecer && cfg.cortesEscuros) {
    cfg.escurecer = (t) => {
      const c = cfg.cortesEscuros.find((x) => t >= x - 0.14 && t < x);
      return c ? (0.55 * (t - (c - 0.14))) / 0.14 : 0;
    };
  }

  function preparar() {
    document.fonts.load("700 66px Inter").catch(() => {});
    const vistos = new Set();
    for (const p of planos) {
      const k = p.cenario + "|" + (p.modo || "dia") + "|" + (cfg.pos ? 1 : 0);
      if (vistos.has(k) || p.de < inicio - 0.01) continue;
      vistos.add(k);
      render(Math.max(0, p.de - inicio + 0.05));
    }
    host.render = (t) => {
      ctx.ultimoT = (Number(t) || 0) + inicio;
      render(t);
    };
    host.render(host.relogio.t);
    host.pronto();
  }
  preparar();
  return ctx;
}
