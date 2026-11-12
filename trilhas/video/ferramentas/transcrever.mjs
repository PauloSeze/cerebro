// Transcreve um vídeo ou áudio no próprio computador com whisper.cpp: sem conta, sem custo, sem Python.
// Uso: node ferramentas/transcrever.mjs <midia> <pasta-do-projeto> [--modelo small] [--idioma pt] [--inicio 0] [--fim 0]
//   --modelo base   rápido, para achar trechos num vídeo longo; small (padrão) para a legenda final
//   --inicio/--fim  transcreve só esse intervalo (segundos); os tempos saem no relógio da mídia original
// Saída na pasta: palavras.json (tempo por palavra) e texto.txt (frases com tempo e ids, para ler e escolher).
// Precisa de: ffmpeg e whisper-cli (a skill verificar-ambiente instala). O modelo baixa sozinho na 1ª vez.
import { join, resolve } from "node:path";
import { homedir, cpus } from "node:os";
import { mkdirSync, rmSync, readdirSync, writeFileSync, createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawnSync } from "node:child_process";
import { args, run, lerJSON, gravarJSON, existe, fim } from "./comum.mjs";

const { pos, opt } = args();
if (pos.length < 2) {
  console.error("uso: node transcrever.mjs <midia> <pasta-do-projeto> [--modelo small] [--idioma pt] [--inicio s] [--fim s]");
  process.exit(1);
}
const midia = resolve(pos[0]);
const pasta = resolve(pos[1]);
const modelo = String(opt.modelo || "small");
const idioma = String(opt.idioma || "pt");
const ini = +(opt.inicio || 0);
const fimT = +(opt.fim || 0);
const casa = join(homedir(), ".cerebro", "whisper");
const exe = process.platform === "win32" ? "whisper-cli.exe" : "whisper-cli";
mkdirSync(pasta, { recursive: true });
mkdirSync(casa, { recursive: true });

function acharWhisper() {
  for (const v of [process.env.WHISPER_CLI, process.env.HYPERFRAMES_WHISPER_PATH]) if (v && existe(v)) return v;
  const r = spawnSync(process.platform === "win32" ? "where" : "which", ["whisper-cli"], { encoding: "utf-8" });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.split(/\r?\n/)[0].trim();
  const procurar = (d, n = 0) => {
    if (n > 3 || !existe(d)) return null;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isFile() && e.name === exe) return p;
      if (e.isDirectory()) { const a = procurar(p, n + 1); if (a) return a; }
    }
    return null;
  };
  const achado = procurar(casa);
  if (achado) return achado;
  throw new Error(`whisper-cli não encontrado. Rode a skill verificar-ambiente (instala em ${casa}).`);
}

async function acharModelo() {
  const nome = `ggml-${modelo}.bin`;
  for (const d of [casa, join(homedir(), ".cache", "hyperframes", "whisper", "models")]) if (existe(join(d, nome))) return join(d, nome);
  const destino = join(casa, nome);
  console.log(`baixando o modelo ${nome} (uma vez só; small ≈ 470 MB)…`);
  const r = await fetch(`https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${nome}`);
  if (!r.ok) throw new Error(`download do modelo falhou: HTTP ${r.status}`);
  const total = +(r.headers.get("content-length") || 0);
  let lido = 0, marco = 0;
  const contar = async function* (fonte) {
    for await (const pedaco of fonte) {
      lido += pedaco.length;
      if (total && lido / total >= marco + 0.1) { marco = Math.floor((lido / total) * 10) / 10; console.log(`  ${Math.round(marco * 100)}%`); }
      yield pedaco;
    }
  };
  await pipeline(Readable.fromWeb(r.body), contar, createWriteStream(destino + ".parcial"));
  (await import("node:fs")).renameSync(destino + ".parcial", destino);
  return destino;
}

const whisper = acharWhisper();
const arqModelo = await acharModelo();
const wav = join(pasta, "_audio16k.wav");
const corte = [...(ini ? ["-ss", String(ini)] : []), ...(fimT ? ["-to", String(fimT)] : [])];
run("ffmpeg", ["-y", "-v", "error", ...corte, "-i", midia, "-vn", "-ac", "1", "-ar", "16000", wav]);

const t0 = Date.now();
const threads = String(Math.max(1, Math.min(cpus().length, 8)));
const dtw = modelo.replace("-v", ".v").replace("-turbo", ".turbo");
run(whisper, ["-m", arqModelo, "-l", idioma, "-t", threads, "-nfa", "--dtw", dtw, "-ojf", "-of", join(pasta, "_whisper"), "-np", wav], { quiet: true });
const bruto = lerJSON(join(pasta, "_whisper.json"));

// Tokens → palavras. Token que começa com espaço abre palavra nova; o tempo é o do DTW (alinhamento por atenção).
const palavras = [];
for (const seg of bruto.transcription) {
  const fimSeg = seg.offsets.to / 1000;
  for (const tk of seg.tokens) {
    if (tk.text.startsWith("[_") || !tk.text.trim()) continue;
    const t = (tk.t_dtw >= 0 ? tk.t_dtw / 100 : tk.offsets.from / 1000) + ini;
    const nova = /^\s/.test(tk.text) || !palavras.length || /^[«"(]/.test(tk.text);
    const sopont = /^[.,!?;:…»")]+$/.test(tk.text.trim());
    if (nova && !sopont) palavras.push({ text: tk.text.trim(), start: t, end: t, fimSeg: fimSeg + ini });
    else palavras[palavras.length - 1].text += tk.text.trim();
  }
}
// Fora: marcações do whisper que não são fala ("[Música]", "(risos)")
for (let i = palavras.length - 1; i >= 0; i--) if (/^[[(].*[\])]$/.test(palavras[i].text)) palavras.splice(i, 1);
palavras.forEach((w, i) => {
  const prox = palavras[i + 1];
  const limite = prox ? Math.min(prox.start, w.fimSeg) : w.fimSeg;
  w.start = +Math.max(0, w.start - 0.04).toFixed(2);
  w.end = +Math.max(w.start + 0.12, Math.min(limite, w.start + 0.04 + 0.12 * w.text.length + 0.25)).toFixed(2);
  w.id = `w${i}`;
  delete w.fimSeg;
});
const final = palavras.map(({ id, text, start, end }) => ({ id, text, start, end }));
gravarJSON(join(pasta, "palavras.json"), final);
rmSync(wav, { force: true });
rmSync(join(pasta, "_whisper.json"), { force: true });

// Frases com tempo: quebra no fim de frase ou em pausa maior que 0,6 s.
const linhas = [];
let atual = [];
const fecha = () => {
  if (!atual.length) return;
  const a = atual[0], b = atual[atual.length - 1];
  linhas.push(`[${a.start.toFixed(1)}–${b.end.toFixed(1)}] ${a.id}–${b.id}  ${atual.map((w) => w.text).join(" ")}`);
  atual = [];
};
final.forEach((w, i) => {
  const prox = final[i + 1];
  atual.push(w);
  if (fim(w) || !prox || prox.start - w.end > 0.6 || atual.length >= 25) fecha();
});
writeFileSync(join(pasta, "texto.txt"), linhas.join("\n") + "\n", "utf-8");
console.log(`ok: ${final.length} palavras em ${((Date.now() - t0) / 1000).toFixed(0)} s → palavras.json e texto.txt`);
