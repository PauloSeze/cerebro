// Monta o index.html do HyperFrames a partir do roteiro.json do projeto, das palavras e da marca.
// Uso: node ferramentas/montar.mjs <pasta-do-projeto> [--marca caminho/para/marca.md]
// A marca vem de perfil/marca.md (rótulos fixos); o roteiro.json pode sobrescrever qualquer campo em "marca".
import { join, resolve, dirname, extname } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { args, run, probe, lerJSON, existe } from "./comum.mjs";

const { pos, opt } = args();
if (!pos[0]) {
  console.error("uso: node montar.mjs <pasta-do-projeto> [--marca perfil/marca.md]");
  process.exit(1);
}
const pasta = resolve(pos[0]);
const trilha = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cerebro = resolve(trilha, "..", "..");
const roteiro = lerJSON(join(pasta, "roteiro.json"));
const avisos = [];

// ---------- Marca: lê perfil/marca.md pelos rótulos ----------
const PADRAO = {
  nome: "", arroba: "", cta: "",
  cores: { primaria: "#2563EB", secundaria: "#1E293B", destaque: "#FACC15", fundo: "#0F1115", texto: "#FFFFFF" },
  fonte_titulo: "Montserrat", peso_titulo: 800, fonte_texto: "Inter", peso_texto: 500,
  logo: "", logo_escuro: "", caixa_alta: false,
};
function lerMarca(arquivo) {
  const m = structuredClone(PADRAO);
  if (!existe(arquivo)) { avisos.push(`marca não encontrada em ${arquivo}: usei cores e fontes neutras`); return m; }
  const txt = readFileSync(arquivo, "utf-8").replace(/<!--[\s\S]*?-->/g, "");
  let secao = "";
  for (const linha of txt.split(/\r?\n/)) {
    const h = linha.match(/^##\s+(.+)/);
    if (h) { secao = h[1].trim().toLowerCase(); continue; }
    const item = linha.match(/^-\s*(?:([^:]+):\s*)?(.*)$/);
    if (!item) continue;
    const rotulo = (item[1] || "").trim().toLowerCase();
    const valor = item[2].trim();
    if (!valor || /^_+$/.test(valor)) continue;
    const cor = valor.match(/#[0-9a-fA-F]{6}\b/)?.[0];
    if (secao.startsWith("identidade")) {
      if (rotulo === "nome da marca") m.nome = valor;
      if (rotulo === "perfis") m.arroba = valor.match(/@[\w.]+/)?.[0] || "";
    } else if (secao.startsWith("cores") && cor) {
      const mapa = { "primária": "primaria", "secundária": "secundaria", destaque: "destaque", fundo: "fundo", texto: "texto" };
      if (mapa[rotulo]) m.cores[mapa[rotulo]] = cor;
    } else if (secao.startsWith("fontes")) {
      const nome = valor.replace(/\b[1-9]00\b/g, "").split(/[,(]/)[0].replace(/\s+/g, " ").trim();
      const peso = valor.match(/\b([1-9]00)\b/)?.[1];
      if (rotulo === "títulos") { m.fonte_titulo = nome; if (peso) m.peso_titulo = +peso; }
      if (rotulo === "texto") { m.fonte_texto = nome; if (peso) m.peso_texto = +peso; }
    } else if (secao.startsWith("logo")) {
      if (rotulo === "arquivo") m.logo = valor;
      if (rotulo.startsWith("versão para fundo escuro")) m.logo_escuro = valor;
    } else if (secao.startsWith("legenda")) {
      if (/caixa alta|mai[uú]scula/i.test(valor)) m.caixa_alta = true;
    } else if (secao.startsWith("chamada")) {
      m.cta = valor.replace(/^["“]|["”]$/g, "");
    }
  }
  if (!m.nome) avisos.push("marca.md sem nome da marca: o fecho fica só com o @ (ou vazio)");
  return m;
}
const marca = lerMarca(resolve(opt.marca || join(cerebro, "perfil", "marca.md")));
Object.assign(marca, roteiro.marca || {});
if (roteiro.marca?.cores) marca.cores = { ...PADRAO.cores, ...marca.cores, ...roteiro.marca.cores };
if (/coment[ae]/i.test(marca.cta) && /\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}\b/.test(marca.cta)) {
  avisos.push(`chamada "${marca.cta}" pede "comenta PALAVRA": o Instagram não recomenda isso para quem não segue. Ignorada; use pedido de envio ou pergunta aberta (gosto.md §7)`);
  marca.cta = "";
}

// Logo copiado para dentro do projeto
mkdirSync(join(pasta, "assets"), { recursive: true });
for (const k of ["logo", "logo_escuro"]) {
  if (!marca[k]) continue;
  const origem = resolve(cerebro, marca[k]);
  if (!existe(origem)) { avisos.push(`logo não encontrado: ${marca[k]}`); marca[k] = ""; continue; }
  const destino = `assets/${k}${extname(origem)}`;
  copyFileSync(origem, join(pasta, destino));
  marca[k] = destino;
}

// ---------- Efeitos sonoros gerados no próprio computador (sem licença de terceiros) ----------
mkdirSync(join(pasta, "sons"), { recursive: true });
const SONS = {
  pop: ["aevalsrc=0.55*sin(2*PI*(950-500*t/0.09)*t)*exp(-t*32):d=0.14:s=48000"],
  tick: ["aevalsrc=0.4*sin(2*PI*2100*t)*exp(-t*90):d=0.06:s=48000"],
  whoosh: ["anoisesrc=d=0.5:c=pink:a=0.45:r=48000", "highpass=f=500,lowpass=f=5000,afade=t=in:d=0.3:curve=exp,afade=t=out:st=0.3:d=0.2"],
};
for (const [nome, [src, af]] of Object.entries(SONS)) {
  const f = join(pasta, "sons", `${nome}.wav`);
  if (!existe(f)) run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", src, ...(af ? ["-af", af] : []), "-ac", "2", f]);
}

// ---------- Utilidades para os moldes ----------
const palavras = lerJSON(join(pasta, roteiro.palavras || "palavras-limpo.json"));
const porId = new Map(palavras.map((w) => [w.id, w]));
const util = {
  esc: (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
  // "em": "w12" vira o início da palavra; número vale como segundos
  tempo: (x, padrao = 0) => {
    if (x === undefined || x === null || x === "") return padrao;
    if (typeof x === "number") return x;
    const w = porId.get(String(x));
    if (!w) { avisos.push(`palavra ${x} não existe em palavras-limpo.json`); return padrao; }
    return w.start;
  },
  probe, run, avisos,
  // "Perdi *R$ 4 mil* hoje" → [{p:"Perdi",d:false},{p:"R$",d:true},{p:"4",d:true},{p:"mil",d:true},{p:"hoje",d:false}]
  destacar: (s) => {
    let dentro = false;
    return String(s || "").split(/\s+/).filter(Boolean).map((p) => {
      const abre = p.startsWith("*"), fecha = p.endsWith("*") && p.length > 1;
      if (abre) dentro = true;
      const r = { p: p.replace(/\*/g, ""), d: dentro };
      if (fecha) dentro = false;
      return r;
    });
  },
  // Fonte do Google: o HyperFrames embute no render
  fontesLink: (m) => {
    const fam = new Map();
    fam.set(m.fonte_titulo, new Set([m.peso_titulo]));
    if (!fam.has(m.fonte_texto)) fam.set(m.fonte_texto, new Set());
    fam.get(m.fonte_texto).add(m.peso_texto);
    const q = [...fam].map(([f, p]) => `family=${f.replace(/ /g, "+")}:wght@${[...p].sort().join(";")}`).join("&");
    return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${q}&display=block">`;
  },
  // Páginas de legenda: 2 a 4 palavras, quebra na pontuação e nas pausas
  paginas: (ws, maxPal = 3, maxCar = 18) => {
    const pags = [];
    let p = [];
    ws.forEach((w, i) => {
      const prox = ws[i + 1];
      p.push(w);
      const car = p.map((x) => x.text).join(" ").length;
      const quebra = !prox || /[.,!?;:…]$/.test(w.text) || prox.start - w.end > 0.35 || p.length >= maxPal ||
        car + 1 + prox.text.length > maxCar;
      if (quebra) { pags.push(p); p = []; }
    });
    return pags.map((p, i) => ({ palavras: p, start: p[0].start, end: Math.min(pags[i + 1]?.[0].start ?? 1e9, p[p.length - 1].end + 0.4) }));
  },
};

const nomeMolde = roteiro.molde === "explicativo" ? "explicativo" : "reel";
const { montar } = await import(pathToFileURL(join(trilha, "moldes", nomeMolde, "molde.mjs")).href);
const html = montar({ pasta, roteiro, marca, palavras, util });
writeFileSync(join(pasta, "index.html"), html, "utf-8");
for (const a of avisos) console.warn("aviso:", a);
console.log(`ok: ${join(pasta, "index.html")} (molde ${nomeMolde})`);
