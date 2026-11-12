// Molde "reel": gravação de fala (própria ou trecho de vídeo longo) em 9:16 com gancho, legenda palavra a palavra,
// aproximação alternada nos cortes, destaques no lugar da legenda e fecho de marca.
// Quem chama é ferramentas/montar.mjs; o roteiro de exemplo está em roteiro.exemplo.json.
import { join } from "node:path";
import { readFileSync } from "node:fs";

export function montar({ pasta, roteiro, marca, palavras, util }) {
  const { esc, tempo, paginas, fontesLink, probe, run, avisos } = util;
  const c = marca.cores;
  const video = roteiro.fonte || "limpo.mp4";
  const dv = probe(join(pasta, video)).duracao;
  const semFecho = roteiro.fecho === false; // só legenda num vídeo já editado
  const SEGURA = semFecho ? 0 : 2.4; // fecho: quadro final segurado depois da fala
  const D = +(dv + SEGURA).toFixed(2);
  if (!semFecho) run("ffmpeg", ["-y", "-v", "error", "-sseof", "-0.1", "-i", join(pasta, video), "-frames:v", "1", "-update", "1", join(pasta, "assets", "ultimo.jpg")]);

  // Gancho
  const g = roteiro.gancho || {};
  const gAte = +(g.ate ?? 2.8);
  const gTexto = (g.texto || "").trim();
  if (gTexto.split(/\s+/).length > 8) avisos.push("gancho com mais de 8 palavras (gosto.md §1.3)");
  const gHtml = gTexto
    ? util.destacar(gTexto).map(({ p, d }) => `<span class="gp"><span class="gw${d ? " d" : ""}">${esc(p)}</span></span>`).join(" ")
    : "";

  // Destaques: número ou frase curta, no lugar da legenda
  const destaques = (roteiro.destaques || []).map((d, i) => {
    const t = tempo(d.em ?? d.t);
    return { ...d, i, t, fim: t + +(d.dur ?? 2.6) };
  });
  destaques.forEach((d, i) => { if (i && d.t - destaques[i - 1].t < 8) avisos.push(`destaques ${i - 1} e ${i} com menos de 8 s entre eles (gosto.md §4.2)`); });
  const fechoIni = semFecho ? D : Math.max(0, (palavras[palavras.length - 1]?.end ?? dv) + 0.15);
  const ocultos = [[0, gTexto ? gAte : 0], ...destaques.map((d) => [d.t - 0.05, d.fim]), [fechoIni, D]];
  const dentro = (t) => ocultos.find(([a, b]) => t >= a && t < b);

  // Legenda
  const pags = paginas(palavras, roteiro.legenda?.palavras ?? 3, roteiro.legenda?.caracteres ?? 18)
    .map((p) => {
      if (dentro(p.start)) return null;
      const corte = ocultos.find(([a]) => a > p.start && a < p.end);
      return corte ? { ...p, end: corte[0] } : p;
    })
    .filter(Boolean);
  const legHtml = pags.map((p, i) => `<div class="pag caption-group" id="p${i}">${p.palavras.map((w, j) => `<span class="lw" id="p${i}w${j}">${esc(w.text)}</span>`).join(" ")}</div>`).join("\n");

  // Aproximação alternada: em cada corte e, se ficar mais de 3,2 s sem evento, numa pausa entre palavras
  const cortes = (() => { try { return JSON.parse(readFileSync(join(pasta, "cortes.json"), "utf-8")).cortes; } catch { return []; } })();
  const eventos = [...cortes, ...destaques.map((d) => d.t)].sort((a, b) => a - b);
  const extras = [];
  for (let i = 1; i < palavras.length; i++) {
    const t = palavras[i].start;
    if (t >= fechoIni) break;
    const anterior = Math.max(0, ...eventos.filter((e) => e <= t), ...extras);
    if (t - anterior > 3.2 && t - palavras[i - 1].end > 0.12) extras.push(t - 0.04);
  }
  eventos.push(...extras);
  eventos.sort((a, b) => a - b);
  const zoom = roteiro.zoom ?? 1.1;
  const zooms = eventos.map((t, i) => ({ t: +t.toFixed(3), s: i % 2 ? 1 : zoom }));

  // Sons: só em evento visual de destaque
  const sons = [];
  if (gTexto) sons.push(["pop", 0.08]);
  destaques.forEach((d) => sons.push(["pop", d.t]));
  if (!semFecho) sons.push(["whoosh", fechoIni - 0.15]);
  const sonsHtml = sons.map(([n, t], i) => `<audio id="sfx${i}" class="clip" src="sons/${n}.wav" data-start="${Math.max(0, t).toFixed(2)}" data-duration="0.6" data-track-index="${3 + (i % 2)}" data-volume="0.3"></audio>`).join("\n");

  const destHtml = destaques.map((d) => {
    if (d.tipo === "numero") {
      return `<div class="dest" id="d${d.i}"><div class="num"><span class="pre">${esc(d.prefixo || "")}</span><span class="val" id="d${d.i}v">${esc(d.valor)}</span><span class="suf">${esc(d.sufixo || "")}</span></div>${d.rotulo ? `<div class="rot">${esc(d.rotulo)}</div>` : ""}</div>`;
    }
    const txt = util.destacar(d.texto).map((x) => x.d ? `<b>${esc(x.p)}</b>` : esc(x.p)).join(" ");
    return `<div class="dest" id="d${d.i}"><div class="frase">${txt}</div></div>`;
  }).join("\n");

  const logo = marca.logo_escuro || marca.logo;
  const cta = roteiro.fecho?.cta ?? marca.cta;
  const fechoHtml = semFecho ? "" : `
    <div id="fecho">
      <div id="veu"></div>
      <div id="placa">
        ${logo ? `<img id="flogo" src="${esc(logo)}" alt="">` : ""}
        ${marca.nome ? `<div id="fnome">${esc(marca.nome)}</div>` : ""}
        ${marca.arroba ? `<div id="farroba">${esc(marca.arroba)}</div>` : ""}
        ${cta ? `<div id="fcta">${esc(cta)}</div>` : ""}
      </div>
      ${roteiro.credito ? `<div id="credito">${esc(roteiro.credito)}</div>` : ""}
    </div>`;

  const dados = {
    D, gAte, temGancho: !!gTexto, zooms, fechoIni, semFecho, destaque: c.destaque,
    pags: pags.map((p, i) => ({ i, s: +p.start.toFixed(3), e: +p.end.toFixed(3), w: p.palavras.map((w) => [+w.start.toFixed(3), +w.end.toFixed(3)]) })),
    dest: destaques.map((d) => ({ i: d.i, t: d.t, fim: d.fim, numero: d.tipo === "numero" ? +String(d.valor).replace(/\./g, "").replace(",", ".") : null, casas: String(d.valor ?? "").includes(",") ? String(d.valor).split(",")[1].length : 0 })),
  };
  const caixa = marca.caixa_alta ? "uppercase" : "none";
  const gTopo = (g.posicao || "topo") === "topo";

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080, height=1920">
<title>${esc(roteiro.titulo || "Reel")}</title>
${fontesLink(marca)}
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
  body { margin: 0; background: #000; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #000;
    font-family: "${marca.fonte_texto}", sans-serif; color: ${c.texto}; }
  #cam { position: absolute; inset: 0; transform-origin: 50% 36%; }
  #cam video, #cam img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .t { font-family: "${marca.fonte_titulo}", sans-serif; font-weight: ${marca.peso_titulo}; }
  #gancho { position: absolute; left: 110px; right: 110px; ${gTopo ? "top: 290px" : "bottom: 500px"}; display: flex; justify-content: center; }
  #gplaca { background: ${c.primaria}; padding: 22px 30px 26px; border-radius: 14px; text-align: center;
    box-shadow: 0 18px 50px rgba(0,0,0,.35); font-size: 92px; line-height: 1.04; letter-spacing: -0.01em; text-transform: ${caixa}; }
  .gp { display: inline-block; overflow: hidden; vertical-align: top; padding: 0 0 6px; }
  .gw { display: inline-block; }
  .gw.d { color: ${c.destaque}; }
  #leg { position: absolute; left: 110px; right: 110px; bottom: 470px; height: 0; }
  .pag { position: absolute; left: 0; right: 0; bottom: 0; text-align: center; opacity: 0;
    font-family: "${marca.fonte_titulo}", sans-serif; font-weight: ${marca.peso_titulo}; font-size: 88px; line-height: 1.08;
    text-transform: ${caixa}; color: #fff; paint-order: stroke fill; -webkit-text-stroke: 10px rgba(0,0,0,.82);
    text-shadow: 0 6px 22px rgba(0,0,0,.55); }
  .dest { position: absolute; left: 110px; right: 110px; bottom: 440px; display: flex; flex-direction: column; align-items: center; opacity: 0; }
  .dest .num, .dest .frase { background: ${c.fundo}; border-radius: 16px; padding: 18px 34px 24px; box-shadow: 0 20px 60px rgba(0,0,0,.45);
    font-family: "${marca.fonte_titulo}", sans-serif; font-weight: ${marca.peso_titulo}; text-align: center; text-transform: ${caixa}; }
  .dest .num { font-size: 190px; line-height: 1; color: ${c.destaque}; font-variant-numeric: tabular-nums; }
  .dest .num .pre, .dest .num .suf { font-size: 110px; }
  .dest .rot { margin-top: 14px; background: ${c.primaria}; color: ${c.texto}; border-radius: 12px; padding: 10px 24px 14px;
    font-size: 54px; font-weight: 700; text-align: center; }
  .dest .frase { font-size: 104px; line-height: 1.04; color: ${c.texto}; }
  .dest .frase b { color: ${c.destaque}; font-weight: inherit; }
  #fecho { position: absolute; inset: 0; }
  #veu { position: absolute; inset: 0; opacity: 0; background: linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.55) 45%, ${c.fundo}F2 100%); }
  #placa { position: absolute; left: 110px; right: 110px; top: 820px; display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; }
  #placa > * { opacity: 0; }
  #flogo { max-height: 150px; max-width: 520px; object-fit: contain; }
  #fnome { font-family: "${marca.fonte_titulo}", sans-serif; font-weight: ${marca.peso_titulo}; font-size: 96px; line-height: 1.05; color: #fff; }
  #farroba { font-size: 56px; font-weight: 700; color: ${c.destaque}; }
  #fcta { margin-top: 26px; background: ${c.primaria}; color: ${c.texto}; border-radius: 14px; padding: 18px 30px 22px;
    font-family: "${marca.fonte_titulo}", sans-serif; font-weight: ${marca.peso_titulo}; font-size: 54px; line-height: 1.1; max-width: 860px; }
  #credito { position: absolute; left: 110px; right: 110px; top: 1430px; text-align: center; font-size: 28px; color: rgba(255,255,255,.75); opacity: 0; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="${D}">
  <div id="cam">
    <video id="base" class="clip" src="${esc(video)}" playsinline data-has-audio="true" data-start="0" data-duration="${dv.toFixed(3)}" data-track-index="0" data-volume="1"></video>
    ${semFecho ? "" : `<img id="congelado" class="clip" src="assets/ultimo.jpg" data-start="${dv.toFixed(3)}" data-duration="${SEGURA}" data-track-index="0" alt="">`}
  </div>
  ${gTexto ? `<div id="gancho"><div id="gplaca" class="t">${gHtml}</div></div>` : ""}
  <div id="leg" class="captions">
${legHtml}
  </div>
${destHtml}
${fechoHtml}
${sonsHtml}
</div>
<script>
  const DADOS = ${JSON.stringify(dados)};
  const tl = gsap.timeline({ paused: true });
  // Câmera: aproximação seca e alternada nos cortes
  tl.set("#cam", { scale: 1 }, 0);
  DADOS.zooms.forEach((z) => tl.set("#cam", { scale: z.s }, z.t));
  // Gancho
  if (DADOS.temGancho) {
    tl.fromTo("#gplaca", { scaleX: 0.2, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.35, ease: "expo.out" }, 0.02);
    tl.fromTo(".gw", { yPercent: 115 }, { yPercent: 0, duration: 0.5, ease: "expo.out", stagger: 0.06 }, 0.12);
    tl.to("#gancho", { opacity: 0, y: -20, duration: 0.25, ease: "power2.in" }, DADOS.gAte - 0.25);
  }
  // Legenda: página aparece seca; a palavra dita muda só de cor
  DADOS.pags.forEach((p) => {
    tl.set("#p" + p.i, { opacity: 1 }, p.s);
    tl.set("#p" + p.i, { opacity: 0 }, p.e);
    p.w.forEach((w, j) => {
      const id = "#p" + p.i + "w" + j;
      tl.set(id, { color: "#ffffff" }, p.s);
      tl.set(id, { color: DADOS.destaque }, Math.max(p.s, w[0]));
      const prox = p.w[j + 1];
      if (prox) tl.set(id, { color: "#ffffff" }, prox[0]);
    });
  });
  // Destaques
  DADOS.dest.forEach((d) => {
    const el = "#d" + d.i;
    tl.fromTo(el, { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" }, d.t);
    if (d.numero !== null && !isNaN(d.numero)) {
      const o = { v: 0 };
      const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: d.casas, maximumFractionDigits: d.casas });
      tl.fromTo(o, { v: 0 }, { v: d.numero, duration: 0.9, ease: "power3.out", onUpdate: () => {
        document.querySelector(el + "v").textContent = fmt(o.v);
      } }, d.t + 0.05);
    }
    tl.to(el, { opacity: 0, y: 20, duration: 0.25, ease: "power2.in" }, d.fim - 0.25);
  });
  // Fecho: véu, marca e chamada (a chamada fica junto da marca, nunca depois)
  const f = DADOS.fechoIni;
  if (!DADOS.semFecho) {
  tl.to("#veu", { opacity: 1, duration: 0.5, ease: "power2.out" }, f);
  tl.fromTo("#placa > *", { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", stagger: 0.12 }, f + 0.1);
  tl.to("#credito", { opacity: 1, duration: 0.3 }, f + 0.1);
  }
  window.__timelines["main"] = tl;
</script>
</body>
</html>
`;
}
