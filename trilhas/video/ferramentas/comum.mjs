// Funções compartilhadas pelas ferramentas da trilha de vídeo.
// Só Node 22 + ffmpeg/ffprobe no PATH. Nada de Python.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export function args(argv = process.argv.slice(2)) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      opt[k] = v;
    } else pos.push(a);
  }
  return { pos, opt };
}

export function run(cmd, list, { quiet = false, cwd } = {}) {
  const r = spawnSync(cmd, list, {
    encoding: "utf-8",
    cwd,
    shell: process.platform === "win32" && cmd === "npx",
    maxBuffer: 1 << 28,
  });
  if (r.status !== 0) {
    console.error(r.stdout || "");
    console.error(r.stderr || "");
    throw new Error(`falhou: ${cmd} ${list.join(" ")}`);
  }
  if (!quiet && r.stdout) process.stdout.write(r.stdout);
  return r;
}

export function probe(file) {
  const r = run("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file], { quiet: true });
  const j = JSON.parse(r.stdout);
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.find((s) => s.codec_type === "audio");
  const [n, d] = (v?.avg_frame_rate || "30/1").split("/").map(Number);
  return {
    duracao: Number(j.format.duration),
    largura: v?.width,
    altura: v?.height,
    fps: d ? n / d : 30,
    temVideo: !!v,
    temAudio: !!a,
    taxaAudio: a ? Number(a.sample_rate) : 0,
  };
}

export const lerJSON = (f) => JSON.parse(readFileSync(f, "utf-8"));
export const gravarJSON = (f, o) => writeFileSync(f, JSON.stringify(o, null, 2), "utf-8");
export const existe = existsSync;
export const fim = (w) => /[.!?…]$/.test(w.text.trim());
