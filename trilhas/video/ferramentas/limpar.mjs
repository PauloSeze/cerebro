// Corta pausas e hesitações, enquadra em 9:16 e deixa a voz em -14 LUFS.
// Uso: node ferramentas/limpar.mjs <midia> <pasta-do-projeto> [opções]
//   --trechos "12.5-40,95-130"  só esses intervalos da mídia original (corte de vídeo longo); padrão: tudo
//   --remover "w5,w9-w12"        palavras que saem (hesitação, frase repetida, tomada errada)
//   --pausa 0.5                  pausa maior que isso é cortada
//   --respiro 0.25               respiro que sobra depois de um corte (0,45 s se a palavra fecha frase)
//   --enquadrar recorte|encaixe  recorte = 9:16 cheio (padrão); encaixe = vídeo deitado no meio, fundo desfocado
//   --centro 0.5                 no recorte: onde está o rosto, de 0 (esquerda) a 1 (direita)
//   --so-audio                   para narração: gera limpo.wav em vez de limpo.mp4
//   --inteiro                    não corta nada (vídeo já editado que só precisa de legenda e nível de som)
// Lê <pasta>/palavras.json (de transcrever.mjs). Gera limpo.mp4 (ou limpo.wav), palavras-limpo.json e cortes.json.
import { join, resolve } from "node:path";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { args, run, probe, lerJSON, gravarJSON, fim } from "./comum.mjs";

const { pos, opt } = args();
if (pos.length < 2) {
  console.error("uso: node limpar.mjs <midia> <pasta-do-projeto> [--trechos a-b,c-d] [--remover w1,w3-w5] [--enquadrar recorte|encaixe] [--centro 0.5] [--so-audio]");
  process.exit(1);
}
const midia = resolve(pos[0]);
const pasta = resolve(pos[1]);
const PAUSA = +(opt.pausa ?? 0.5);
const RESPIRO = +(opt.respiro ?? 0.25);
const RESPIRO_FRASE = Math.max(RESPIRO, 0.45);
const PRE = 0.08;
const soAudio = !!opt["so-audio"];
const info = probe(midia);
const todas = lerJSON(join(pasta, "palavras.json"));

// 1. Quais palavras ficam
const trechos = opt.trechos
  ? String(opt.trechos).split(",").map((t) => t.split("-").map(Number))
  : [[0, info.duracao]];
const removidas = new Set();
if (opt.remover) {
  for (const parte of String(opt.remover).split(",")) {
    const [a, b] = parte.split("-").map((s) => +s.replace("w", ""));
    for (let i = a; i <= (b ?? a); i++) removidas.add(`w${i}`);
  }
}
const indice = new Map(todas.map((w, i) => [w.id, i]));

// 2. Segmentos: palavras seguidas, sem pausa longa e sem palavra removida no meio, dentro do mesmo trecho
const segs = [];
if (opt.inteiro) segs.push({ s: 0, e: Math.floor(info.duracao * 30) / 30, palavras: todas.filter((w) => !removidas.has(w.id)) });
for (const [ta, tb] of opt.inteiro ? [] : trechos) {
  let grupo = [];
  const fecha = () => {
    if (!grupo.length) return;
    const a = grupo[0], b = grupo[grupo.length - 1];
    const antes = todas[indice.get(a.id) - 1];
    const depois = todas[indice.get(b.id) + 1];
    let s = Math.max(a.start - PRE, ta, antes ? antes.end + 0.02 : 0);
    let e = Math.min(b.end + (fim(b) ? RESPIRO_FRASE : RESPIRO), tb, depois ? depois.start - 0.03 : info.duracao);
    if (e <= s) e = b.end;
    // Em quadros inteiros (30 fps): vídeo e áudio de cada pedaço com a mesma duração, sem atraso acumulado.
    s = Math.floor(s * 30) / 30;
    e = Math.max(s + 2 / 30, Math.round(e * 30) / 30);
    segs.push({ s, e, palavras: grupo });
    grupo = [];
  };
  for (let i = 0; i < todas.length; i++) {
    const w = todas[i];
    if (w.start < ta - 0.05 || w.end > tb + 0.05) { fecha(); continue; }
    if (removidas.has(w.id)) { fecha(); continue; }
    const ult = grupo[grupo.length - 1];
    if (ult && (w.start - ult.end > PAUSA || indice.get(w.id) !== indice.get(ult.id) + 1)) fecha();
    grupo.push(w);
  }
  fecha();
}
if (!segs.length) throw new Error("nenhuma palavra dentro dos trechos pedidos");

// 3. Tempos novos
let t = 0;
const novas = [];
const cortes = [];
for (const g of segs) {
  for (const w of g.palavras) novas.push({ id: w.id, text: w.text, start: +(t + w.start - g.s).toFixed(3), end: +(t + w.end - g.s).toFixed(3) });
  t += g.e - g.s;
  cortes.push(+t.toFixed(3));
}
cortes.pop();

// 4. Corta cada segmento (busca rápida) e junta
const tmp = join(pasta, "_segmentos");
mkdirSync(tmp, { recursive: true });
const W = 1080, H = 1920;
let vf = null;
if (!soAudio) {
  const modo = opt.enquadrar || "recorte";
  const deitado = info.largura / info.altura > 0.6;
  if (!deitado) vf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
  else if (modo === "encaixe") {
    vf = `split[a][b];[a]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=40:2,eq=brightness=-0.18[f];` +
      `[b]scale=${W}:-2[v];[f][v]overlay=0:${Math.round(H * 0.42)}-h/2`;
  } else {
    const sw = Math.round((info.largura * H) / info.altura / 2) * 2;
    const x = Math.max(0, Math.min(sw - W, Math.round(+(opt.centro ?? 0.5) * sw - W / 2)));
    vf = `scale=${sw}:${H},crop=${W}:${H}:${x}:0`;
  }
  vf += ",fps=30,format=yuv420p";
}
const lista = [];
segs.forEach((g, i) => {
  const d = g.e - g.s;
  const f = join(tmp, `s${String(i).padStart(3, "0")}.${soAudio ? "wav" : "mov"}`);
  const af = `afade=t=in:d=0.015,afade=t=out:st=${Math.max(0, d - 0.015).toFixed(3)}:d=0.015,aresample=48000`;
  const base = ["-y", "-v", "error", "-ss", g.s.toFixed(3), "-i", midia, "-t", d.toFixed(3)];
  if (soAudio) run("ffmpeg", [...base, "-vn", "-af", af, "-ac", "2", "-c:a", "pcm_s16le", f]);
  else run("ffmpeg", [...base, "-filter_complex", `[0:v]${vf}[vo];[0:a]${af}[ao]`, "-map", "[vo]", "-map", "[ao]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-c:a", "pcm_s16le", "-ac", "2", f]);
  lista.push(`file '${f.replace(/\\/g, "/")}'`);
});
writeFileSync(join(tmp, "lista.txt"), lista.join("\n"), "utf-8");
const junto = join(tmp, soAudio ? "junto.wav" : "junto.mov");
run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", join(tmp, "lista.txt"), "-c", "copy", junto]);

// 5. Voz em -14 LUFS (duas passadas do loudnorm)
const medir = run("ffmpeg", ["-hide_banner", "-i", junto, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], { quiet: true });
const m = JSON.parse(medir.stderr.slice(medir.stderr.lastIndexOf("{"), medir.stderr.lastIndexOf("}") + 1));
const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
const saida = join(pasta, soAudio ? "limpo.wav" : "limpo.mp4");
if (soAudio) run("ffmpeg", ["-y", "-v", "error", "-i", junto, "-af", ln, "-ar", "48000", "-ac", "2", saida]);
else run("ffmpeg", ["-y", "-v", "error", "-i", junto, "-af", ln, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", saida]);
rmSync(tmp, { recursive: true, force: true });

gravarJSON(join(pasta, "palavras-limpo.json"), novas);
gravarJSON(join(pasta, "cortes.json"), { duracao: +t.toFixed(3), cortes });
console.log(`ok: ${segs.length} trechos, ${t.toFixed(1)} s (original ${info.duracao.toFixed(1)} s) → ${saida}`);
