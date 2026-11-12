// Molde "explicativo": narração gravada pelo aluno + cenas em motion na marca dele (sem rosto).
// Cenas: titulo, numero, lista, versus, frase, fecho. Cada cena começa numa palavra da fala ("em": "w12").
// Quem chama é ferramentas/montar.mjs; o roteiro de exemplo está em roteiro.exemplo.json.
import { join } from "node:path";

export function montar({ pasta, roteiro, marca, palavras, util }) {
  const { esc, tempo, paginas, fontesLink, probe, avisos } = util;
  const c = marca.cores;
  const audio = roteiro.fonte || "limpo.wav";
  const da = probe(join(pasta, audio)).duracao;
  const ultimaFala = palavras[palavras.length - 1]?.end ?? da;

  // Cenas com início e fim
  let cenas = (roteiro.cenas || []).map((x, i) => ({
    ...x, i,
    t: i === 0 ? 0 : x.tipo === "fecho" && x.em === undefined && x.t === undefined ? ultimaFala + 0.2 : tempo(x.em ?? x.t),
  }));
  if (!cenas.some((x) => x.tipo === "fecho")) cenas.push({ tipo: "fecho", i: cenas.length, t: ultimaFala + 0.2 });
  cenas.sort((a, b) => a.t - b.t);
  const fecho = cenas.find((x) => x.tipo === "fecho");
  const D = +Math.max(da, fecho.t + 2.8).toFixed(2);
  cenas.forEach((x, i) => { x.i = i; x.fim = i + 1 < cenas.length ? cenas[i + 1].t : D; });
  cenas.forEach((x) => { if (x.tipo !== "fecho" && x.fim - x.t > 6) avisos.push(`cena ${x.i} (${x.tipo}) com ${(x.fim - x.t).toFixed(1)} s: divida ou acrescente um evento (gosto.md §2.1)`); });
  const conteudo = cenas.filter((x) => x.tipo !== "fecho");

  const fundoDe = (x) => x.fundo === "claro" ? "#F3F4F6" : x.fundo === "cor" ? c.primaria : c.fundo;
  const tintaDe = (x) => x.fundo === "claro" ? c.fundo : c.texto;
  const realce = (x) => x.fundo === "cor" ? c.destaque : x.fundo === "claro" ? c.primaria : c.destaque;
  const marcado = (s, x) => util.destacar(s).map(({ p, d }) => d
    ? `<span class="m"><span class="mw" style="color:${realce(x)}">${esc(p)}</span></span>`
    : `<span class="m"><span class="mw">${esc(p)}</span></span>`).join(" ");

  const sons = [];
  const extras = []; // animações presas a palavras dentro da cena
  const html = cenas.map((x) => {
    const tinta = tintaDe(x);
    let corpo = "";
    if (x.tipo === "titulo" || x.tipo === "frase") {
      corpo = `<div class="${x.tipo}" style="color:${tinta}">${marcado(x.texto, x)}</div>`;
      if (x.apoio) corpo += `<div class="apoio" style="color:${tinta}">${esc(x.apoio)}</div>`;
      sons.push(["pop", x.t + 0.05]);
    } else if (x.tipo === "numero") {
      const alvo = +String(x.valor).replace(/\./g, "").replace(",", ".");
      const casas = String(x.valor).includes(",") ? String(x.valor).split(",")[1].length : 0;
      corpo = `<div class="num" style="color:${realce(x)}"><span>${esc(x.prefixo || "")}</span><span id="c${x.i}v">0</span><span>${esc(x.sufixo || "")}</span></div>
        <div class="trilho"><div class="barra" id="c${x.i}b" style="background:${realce(x)}"></div></div>
        ${x.rotulo ? `<div class="rot" style="color:${tinta}">${esc(x.rotulo)}</div>` : ""}`;
      const pct = x.sufixo === "%" ? Math.min(1, alvo / 100) : 1;
      extras.push({ tipo: "num", i: x.i, t: x.t + 0.15, alvo, casas, pct });
      sons.push(["pop", x.t + 0.05], ["tick", x.t + 1.1]);
    } else if (x.tipo === "lista") {
      corpo = `${x.titulo ? `<div class="ltit" style="color:${tinta}">${esc(x.titulo)}</div>` : ""}<div class="lista">${(x.itens || []).map((it, j) =>
        `<div class="item" id="c${x.i}i${j}"><span class="bola" style="background:${c.primaria};color:${c.texto}">${j + 1}</span><span style="color:${tinta}">${esc(it.texto)}</span></div>`).join("")}</div>`;
      (x.itens || []).forEach((it, j) => {
        const t = Math.max(x.t + 0.1, tempo(it.em ?? it.t, x.t + 0.3 + j * 0.8));
        extras.push({ tipo: "item", i: x.i, j, t });
        sons.push(["pop", t]);
      });
    } else if (x.tipo === "versus") {
      const tb = Math.max(x.t + 0.6, tempo(x.em_b ?? x.t_b, x.t + 1.5));
      corpo = `<div class="vs">
        <div class="card a" id="c${x.i}a"><div class="crot">${esc(x.a?.rotulo || "")}</div><div class="ctx">${esc(x.a?.texto || "")}</div><div class="risco" id="c${x.i}r"></div></div>
        <div class="xis" style="color:${tinta}">×</div>
        <div class="card b" id="c${x.i}bb" style="border-color:${c.destaque}"><div class="crot" style="color:${c.destaque}">${esc(x.b?.rotulo || "")}</div><div class="ctx">${esc(x.b?.texto || "")}</div></div>
      </div>`;
      extras.push({ tipo: "vs", i: x.i, t: tb });
      sons.push(["pop", x.t + 0.05], ["pop", tb]);
    } else if (x.tipo === "fecho") {
      const logo = marca.logo_escuro || marca.logo;
      const cta = x.cta ?? roteiro.fecho?.cta ?? marca.cta;
      corpo = `<div class="fecho">
        ${logo ? `<img class="fi" src="${esc(logo)}" alt="">` : ""}
        ${marca.nome ? `<div class="fi fnome">${esc(marca.nome)}</div>` : ""}
        ${marca.arroba ? `<div class="fi farroba">${esc(marca.arroba)}</div>` : ""}
        ${cta ? `<div class="fi fcta">${esc(cta)}</div>` : ""}
        <div class="fi seguir" id="seguir">Seguir</div>
        ${roteiro.credito ? `<div class="fi credito">${esc(roteiro.credito)}</div>` : ""}
      </div>`;
    }
    if (x.i > 0) sons.push(["whoosh", x.t - 0.12]);
    return `<section class="cena" id="c${x.i}">${corpo}</section>`;
  }).join("\n");

  sons.sort((a, b) => a[1] - b[1]);
  for (let i = 0; i < sons.length; i++) {
    const n = sons.filter((s) => s[1] >= sons[i][1] && s[1] < sons[i][1] + 10).length;
    if (n > 6) { avisos.push(`mais de 6 efeitos sonoros em 10 s a partir de ${sons[i][1].toFixed(1)} s: corte os menos importantes`); break; }
  }
  const sonsHtml = sons.map(([n, t], i) => `<audio id="sfx${i}" class="clip" src="sons/${n}.wav" data-start="${Math.max(0, t).toFixed(2)}" data-duration="0.6" data-track-index="${3 + (i % 3)}" data-volume="0.28"></audio>`).join("\n");

  // Legenda: some no fecho
  const pags = paginas(palavras.filter((w) => w.start < fecho.t), 3, 15).map((p) => ({ ...p, end: Math.min(p.end, fecho.t) }));
  const legHtml = pags.map((p, i) => `<div class="pag caption-group" id="p${i}">${p.palavras.map((w, j) => `<span id="p${i}w${j}">${esc(w.text)}</span>`).join(" ")}</div>`).join("\n");
  const pontos = conteudo.map((_, i) => `<span class="pt" id="pt${i}"></span>`).join("");

  const dados = {
    D, destaque: c.destaque, texto: c.texto,
    cenas: cenas.map((x) => ({ i: x.i, t: x.t, fim: x.fim, tipo: x.tipo, fundo: fundoDe(x), claro: x.fundo === "claro", ponto: conteudo.indexOf(x) })),
    extras,
    pags: pags.map((p, i) => ({ i, s: +p.start.toFixed(3), e: +p.end.toFixed(3), w: p.palavras.map((w) => +w.start.toFixed(3)) })),
  };

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080, height=1920">
<title>${esc(roteiro.titulo || "Explicativo")}</title>
${fontesLink(marca)}
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
  body { margin: 0; background: ${c.fundo}; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${c.fundo};
    font-family: "${marca.fonte_texto}", sans-serif; font-weight: ${marca.peso_texto}; color: ${c.texto}; }
  #fundo { position: absolute; inset: 0; background: ${c.fundo}; }
  #pontos { position: absolute; inset: -80px; opacity: .16;
    background-image: radial-gradient(currentColor 2.2px, transparent 2.6px); background-size: 46px 46px; color: ${c.texto}; }
  #bola { position: absolute; width: 760px; height: 760px; border-radius: 50%; right: -300px; top: -260px; background: ${c.primaria}; opacity: .9; }
  #faixa { position: absolute; width: 1400px; height: 150px; left: -200px; bottom: 170px; background: ${c.secundaria}; transform: rotate(-8deg); opacity: .85; }
  #hud { position: absolute; left: 110px; right: 140px; top: 250px; height: 60px; display: flex; align-items: center; justify-content: space-between;
    font-family: "${marca.fonte_titulo}", sans-serif; font-weight: ${marca.peso_titulo}; font-size: 34px; letter-spacing: .02em; }
  #hud .marca { background: ${c.fundo}; color: ${c.texto}; padding: 8px 18px 10px; border-radius: 10px; }
  #hud .pts { display: flex; gap: 12px; }
  .pt { width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,.35); box-shadow: 0 0 0 2px ${c.fundo}; }
  #palco { position: absolute; left: 0; right: 0; top: 380px; height: 900px; transform-origin: 50% 50%; }
  .cena { position: absolute; inset: 0 110px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; opacity: 0; }
  .t, .titulo, .frase, .num, .ltit, .crot, .fnome, .fcta, .seguir { font-family: "${marca.fonte_titulo}", sans-serif; font-weight: ${marca.peso_titulo}; }
  .titulo { font-size: 116px; line-height: 1.02; letter-spacing: -0.015em; }
  .frase { font-size: 138px; line-height: 1; letter-spacing: -0.02em; }
  .apoio { margin-top: 34px; font-size: 52px; line-height: 1.2; opacity: .85; }
  .m { display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: .08em; }
  .mw { display: inline-block; }
  .num { font-size: 250px; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.03em; }
  .trilho { width: 760px; height: 26px; border-radius: 13px; background: rgba(127,127,127,.28); margin-top: 36px; overflow: hidden; }
  .barra { height: 100%; width: 100%; transform-origin: 0 50%; transform: scaleX(0); border-radius: 13px; }
  .rot { margin-top: 34px; font-size: 58px; line-height: 1.15; }
  .ltit { font-size: 72px; margin-bottom: 40px; }
  .lista { display: flex; flex-direction: column; gap: 30px; align-items: stretch; width: 100%; }
  .item { display: flex; align-items: center; gap: 28px; font-size: 62px; line-height: 1.1; text-align: left; opacity: 0;
    background: rgba(127,127,127,.14); border-radius: 18px; padding: 22px 26px; }
  .bola { flex: none; width: 82px; height: 82px; border-radius: 50%; display: grid; place-items: center; font-size: 46px; font-weight: 800; }
  .vs { display: flex; flex-direction: column; align-items: center; gap: 22px; width: 100%; }
  .card { position: relative; width: 100%; box-sizing: border-box; border-radius: 22px; padding: 30px 36px 36px; background: ${c.secundaria};
    border: 6px solid transparent; text-align: left; box-shadow: 0 24px 60px rgba(0,0,0,.3); }
  .card.b { opacity: 0; background: ${c.fundo}; }
  .crot { font-size: 40px; text-transform: uppercase; letter-spacing: .06em; opacity: .85; color: ${c.texto}; }
  .ctx { margin-top: 10px; font-size: 64px; line-height: 1.1; color: ${c.texto}; }
  .risco { position: absolute; left: 30px; right: 30px; top: 50%; height: 10px; border-radius: 5px; background: #E5484D; transform: scaleX(0); transform-origin: 0 50%; }
  .xis { font-size: 90px; font-weight: 800; line-height: .8; }
  .fecho { display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .fi { opacity: 0; }
  img.fi { max-height: 170px; max-width: 560px; object-fit: contain; }
  .fnome { font-size: 96px; line-height: 1.02; }
  .farroba { font-size: 54px; font-weight: 700; color: ${c.destaque}; }
  .fcta { margin-top: 24px; font-size: 56px; line-height: 1.12; background: ${c.primaria}; color: ${c.texto}; border-radius: 16px; padding: 18px 30px 22px; max-width: 860px; }
  .credito { margin-top: 40px; font-size: 28px; opacity: .75; }
  .seguir { margin-top: 18px; font-size: 48px; background: ${c.destaque}; color: ${c.fundo}; border-radius: 999px; padding: 14px 54px 18px; }
  #leg { position: absolute; left: 110px; right: 110px; top: 1300px; height: 150px; }
  .pag { position: absolute; left: 0; right: 0; top: 0; display: flex; justify-content: center; opacity: 0; }
  .pag { font-family: "${marca.fonte_titulo}", sans-serif; font-weight: ${marca.peso_titulo}; font-size: 80px; line-height: 1.1; color: ${c.texto}; }
  .pag > span { margin: 0 .14em; }
  .pag::before { content: ""; position: absolute; inset: -14px 0 -18px; margin: 0 auto; width: 100%; max-width: 860px; }
  #legfundo { position: absolute; left: 0; right: 0; top: -14px; height: 122px; border-radius: 18px; background: ${c.fundo}; opacity: 0; box-shadow: 0 18px 50px rgba(0,0,0,.3); }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="${D}">
  <div id="fundo"><div id="pontos"></div><div id="bola"></div><div id="faixa"></div></div>
  <div id="hud"><span class="marca">${esc(marca.nome || marca.arroba || "")}</span><span class="pts">${pontos}</span></div>
  <div id="palco">
${html}
  </div>
  <div id="leg" class="captions"><div id="legfundo"></div>
${legHtml}
  </div>
  <audio id="voz" class="clip" src="${esc(audio)}" data-start="0" data-duration="${da.toFixed(3)}" data-track-index="1" data-volume="1"></audio>
${sonsHtml}
</div>
<script>
  const DADOS = ${JSON.stringify(dados)};
  const tl = gsap.timeline({ paused: true });
  // Vida contínua no fundo: pontos derivando, bola e faixa respirando (determinístico, preso ao tempo)
  tl.fromTo("#pontos", { x: 0, y: 0 }, { x: -46 * 3, y: -46 * 6, duration: DADOS.D, ease: "none" }, 0);
  tl.fromTo("#bola", { x: 0, y: 0, scale: 1 }, { x: -60, y: 90, scale: 1.12, duration: DADOS.D, ease: "sine.inOut" }, 0);
  tl.fromTo("#faixa", { x: 0 }, { x: 160, duration: DADOS.D, ease: "none" }, 0);
  DADOS.cenas.forEach((x) => {
    const el = "#c" + x.i;
    // Corte seco de fundo na troca de cena
    tl.set("#fundo", { backgroundColor: x.fundo }, x.t);
    tl.set("#pontos", { color: x.claro ? "#0B1220" : "#FFFFFF" }, x.t);
    tl.set("#bola", { opacity: x.fundo === DADOS.cenas[0].fundo && !x.claro ? 0.9 : 0.25 }, x.t);
    tl.set(el, { opacity: 1 }, x.t);
    tl.fromTo("#palco", { scale: 1 }, { scale: 1.04, duration: Math.max(0.5, x.fim - x.t), ease: "none", immediateRender: false }, x.t);
    if (x.ponto >= 0) tl.set("#pt" + x.ponto, { backgroundColor: DADOS.destaque, scale: 1.25 }, x.t);
    const mws = el + " .mw";
    if (document.querySelector(mws)) tl.fromTo(mws, { yPercent: 118 }, { yPercent: 0, duration: 0.55, ease: "expo.out", stagger: 0.07 }, x.t + 0.02);
    if (document.querySelector(el + " .apoio")) tl.fromTo(el + " .apoio", { opacity: 0, y: 24 }, { opacity: 0.85, y: 0, duration: 0.45, ease: "expo.out" }, x.t + 0.45);
    if (x.tipo === "numero") {
      tl.fromTo(el + " .num", { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "expo.out" }, x.t);
      tl.fromTo(el + " .rot", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }, x.t + 0.35);
    }
    if (x.tipo === "versus") tl.fromTo(el + " .card.a", { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, x.t + 0.02);
    if (x.tipo === "fecho") {
      tl.fromTo(el + " .fi", { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", stagger: 0.12 }, x.t + 0.05);
      tl.to("#seguir", { scale: 0.92, duration: 0.12, ease: "power2.in" }, x.t + 1.5);
      tl.to("#seguir", { scale: 1, duration: 0.3, ease: "back.out(3)" }, x.t + 1.62);
      tl.to("#hud", { opacity: 0, duration: 0.3 }, x.t);
      tl.to("#bola", { opacity: 0.15, duration: 0.4 }, x.t);
    }
    if (x.fim < DADOS.D) tl.to(el, { opacity: 0, duration: 0.2, ease: "power2.in" }, x.fim - 0.2);
  });
  DADOS.extras.forEach((e) => {
    const el = "#c" + e.i;
    if (e.tipo === "num") {
      const o = { v: 0 };
      const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: e.casas, maximumFractionDigits: e.casas });
      tl.fromTo(o, { v: 0 }, { v: e.alvo, duration: 1, ease: "power3.out", onUpdate: () => { document.querySelector(el + "v").textContent = fmt(o.v); } }, e.t);
      tl.fromTo(el + "b", { scaleX: 0 }, { scaleX: e.pct, duration: 1, ease: "power3.out" }, e.t);
    }
    if (e.tipo === "item") {
      tl.fromTo(el + "i" + e.j, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.45, ease: "expo.out" }, e.t);
      for (let k = 0; k < e.j; k++) tl.to(el + "i" + k, { opacity: 0.5, duration: 0.25 }, e.t);
    }
    if (e.tipo === "vs") {
      tl.fromTo(el + "bb", { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, e.t);
      tl.fromTo(el + "r", { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power3.out" }, e.t + 0.1);
      tl.to(el + "a", { opacity: 0.55, duration: 0.3 }, e.t + 0.1);
    }
  });
  // Legenda karaokê sobre placa
  DADOS.pags.forEach((p) => {
    tl.set("#p" + p.i, { opacity: 1 }, p.s);
    tl.set("#p" + p.i, { opacity: 0 }, p.e);
    p.w.forEach((t, j) => {
      const id = "#p" + p.i + "w" + j;
      tl.set(id, { color: DADOS.texto }, p.s);
      tl.set(id, { color: DADOS.destaque }, Math.max(p.s, t));
      if (j + 1 < p.w.length) tl.set(id, { color: DADOS.texto }, p.w[j + 1]);
    });
  });
  if (DADOS.pags.length) {
    tl.set("#legfundo", { opacity: 0.92 }, DADOS.pags[0].s);
    tl.set("#legfundo", { opacity: 0 }, DADOS.pags[DADOS.pags.length - 1].e);
  }
  window.__timelines["main"] = tl;
</script>
</body>
</html>
`;
}
