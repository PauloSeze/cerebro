// Confere o vídeo pronto antes de mostrar: tamanho, som, nível e uma folha de quadros com a zona segura desenhada.
// Uso: node ferramentas/qa.mjs <video.mp4> [--quadros 0.5,3,12.4]
// Saída em <pasta do vídeo>/qa/: folha.jpg (24 quadros), quadro-<t>.png (tamanho cheio) e relatorio.txt.
// Vermelho = zona segura do texto (x 110–970, y 250–1480); amarelo = coluna de botões do Instagram.
import { join, resolve, dirname } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { args, run, probe, existe } from "./comum.mjs";

const { pos, opt } = args();
if (!pos[0]) { console.error("uso: node qa.mjs <video.mp4> [--quadros 0.5,3,12]"); process.exit(1); }
const video = resolve(pos[0]);
if (!existe(video)) { console.error(`não achei ${video}: o render terminou? Veja a mensagem do render.`); process.exit(1); }
const qa = join(dirname(video), "qa");
mkdirSync(qa, { recursive: true });
const p = probe(video);
const zona = "drawbox=x=110:y=250:w=860:h=1230:color=red@0.85:t=5,drawbox=x=940:y=1050:w=140:h=650:color=yellow@0.85:t=5";

// Folha: 24 quadros espalhados
const passo = Math.max(0.5, p.duracao / 24);
run("ffmpeg", ["-y", "-v", "error", "-i", video, "-vf", `fps=1/${passo.toFixed(3)},${zona},scale=270:480,tile=6x4:padding=6:color=white`, "-frames:v", "1", join(qa, "folha.jpg")]);
// Quadros em tamanho cheio
const quadros = opt.quadros ? String(opt.quadros).split(",").map(Number) : [0.3, Math.min(3, p.duracao / 2), p.duracao - 1];
for (const t of quadros) {
  run("ffmpeg", ["-y", "-v", "error", "-ss", t.toFixed(2), "-i", video, "-frames:v", "1", "-vf", zona, join(qa, `quadro-${t.toFixed(1)}.png`)]);
}

// Nível do som
let lufs = NaN, pico = NaN;
if (p.temAudio) {
  const r = run("ffmpeg", ["-hide_banner", "-nostats", "-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"], { quiet: true });
  const resumo = r.stderr.slice(r.stderr.lastIndexOf("Summary:"));
  lufs = +(resumo.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]);
  pico = +(resumo.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]);
}

const itens = [
  [p.largura === 1080 && p.altura === 1920, `resolução ${p.largura}×${p.altura} (esperado 1080×1920)`],
  [p.temAudio, p.temAudio ? `áudio ${p.taxaAudio} Hz` : "vídeo sem áudio"],
  [p.taxaAudio === 48000, "áudio em 48 kHz"],
  [Math.abs(lufs + 14) <= 1.5, `volume ${lufs} LUFS (esperado −14 ± 1,5)`],
  [pico <= -1, `pico ${pico} dBTP (esperado ≤ −1)`],
  [p.duracao >= 8 && p.duracao <= 180, `duração ${p.duracao.toFixed(1)} s`],
];
const txt = [
  `QA de ${video}`,
  ...itens.map(([ok, s]) => `${ok ? "ok   " : "FALHA"}  ${s}`),
  "",
  "Agora olhe (não pule):",
  `- ${join(qa, "folha.jpg")}: gancho legível no 1º quadro, nada parado, nada fora da caixa vermelha, nada na amarela.`,
  ...quadros.map((t) => `- ${join(qa, `quadro-${t.toFixed(1)}.png`)} em tamanho cheio: texto cortado na borda? legenda sobre a boca?`),
].join("\n");
writeFileSync(join(qa, "relatorio.txt"), txt + "\n", "utf-8");
console.log(txt);
if (itens.some(([ok]) => !ok)) process.exitCode = 2;
