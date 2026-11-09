// Elenco do vídeo 1 (ROTEIRO.md): você e o grupo do supermercado. Cada um = tipo + variante do kit 2D (desenho2d.js).
// Rui: ex-policial, líder (colete, barba, cabelo raspado). Bia: enfermeira (roupa de hospital, estetoscópio, rabo de
// cavalo). Dois irmãos adolescentes (mais baixos). O senhor da bengala (careca grisalho, óculos). O casal que quase não fala.
export const ELENCO = {
  voce: { nome: "VOCÊ", tipo: "protagonista", escala: 1, variante: {} },
  rui: {
    nome: "RUI", tipo: "pessoa", escala: 1.04, sobrancelha: -0.35, boca: "neutra",
    variante: { pele: "#B5785A", peleSombra: "#93603F", camisa: "#3E4A5C", colete: "#262B33", calca: "#2B2B30", sapato: "#1E1E22",
      cabelo: { estilo: "raspado", cor: "#3A3A3A" }, barba: "#3A3A3A" },
  },
  bia: {
    nome: "BIA", tipo: "pessoa", escala: 0.95, sobrancelha: 0.15, boca: "sorriso",
    variante: { pele: "#E2B08A", peleSombra: "#C08E6A", camisa: "#5FB3A8", calca: "#4E9C92", sapato: "#F3F0E8",
      cabelo: { estilo: "rabo", cor: "#5A3320" }, estetoscopio: true },
  },
  irmao1: {
    nome: "IRMÃOS", tipo: "pessoa", escala: 0.86, sobrancelha: 0.1, boca: "neutra",
    variante: { pele: "#8A5A3C", peleSombra: "#6E4630", camisa: "#C0503A", calca: "#2F3B63", sapato: "#F3F0E8", listra: true,
      cabelo: { estilo: "curto", cor: "#151010" } },
  },
  irmao2: {
    nome: "", tipo: "pessoa", escala: 0.82, sobrancelha: 0.25, boca: "neutra",
    variante: { pele: "#8A5A3C", peleSombra: "#6E4630", camisa: "#3D7A4A", calca: "#3A3A44", sapato: "#F3F0E8", listra: true,
      cabelo: { estilo: "raspado", cor: "#151010" } },
  },
  senhor: {
    nome: "O SENHOR", tipo: "pessoa", escala: 0.92, inclinar: 0.14, sobrancelha: 0.05, boca: "neutra",
    variante: { pele: "#D9A988", peleSombra: "#B88868", camisa: "#8C7B5C", calca: "#5A5550", sapato: "#3A2E26",
      cabelo: { estilo: "careca", cor: "#D8D8D8" }, oculos: true, bengala: true },
  },
  casalEle: {
    nome: "O CASAL", tipo: "pessoa", escala: 1.0, sobrancelha: 0, boca: "neutra",
    variante: { pele: "#A86F4A", peleSombra: "#8A5A3A", camisa: "#6A5A8C", calca: "#2E3346", sapato: "#2A2A30",
      cabelo: { estilo: "curto", cor: "#2A1A12" } },
  },
  casalEla: {
    nome: "", tipo: "pessoa", escala: 0.94, sobrancelha: 0.1, boca: "neutra",
    variante: { pele: "#F0C8A8", peleSombra: "#D0A888", camisa: "#9C4A6A", calca: "#3A3046", sapato: "#2A2A30",
      cabelo: { estilo: "comprido", cor: "#B8862E" } },
  },
};
