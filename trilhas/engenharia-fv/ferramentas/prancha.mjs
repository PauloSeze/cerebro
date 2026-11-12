#!/usr/bin/env node
// Prancha A1 pelo motor de engenharia, com a chave do usuário.
//
//   node prancha.mjs saldo
//   node prancha.mjs conferir <projeto.json> [--prancha <prancha.json>]
//   node prancha.mjs gerar    <projeto.json> --saida <pasta> [--prancha <prancha.json>]
//
// <projeto.json> é o mesmo do fv-memorial. Os dados que só o desenho usa (datasheet elétrico, strings por MPPT,
// proteções, responsável técnico, nº da TRT/ART) vêm do bloco "prancha" dentro dele, de --prancha <arquivo> ou de
// um prancha.json na mesma pasta. "conferir" valida no motor sem gastar prancha; "gerar" confere de novo e, se
// passar, baixa o PDF. Chave: MOTOR_URL, MOTOR_CLIENT_ID e MOTOR_CLIENT_SECRET (os três chegam juntos) no ambiente
// ou em trilhas/engenharia-fv/.env.
// Saída: 0 ok · 1 erro do motor ou do projeto · 2 configuração (sem chave, arquivo) · 3 rede.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TRILHA = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MONTHS = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const SEM_CHAVE = "Sem chave do motor: a prancha A1 pronta vem do motor de engenharia, que chega com o bônus do " +
  "Antecipa Black (3 pranchas) ou na mentoria Projeto FV com IA.";

function sair(codigo, msg) { if (msg) console.log(msg); process.exit(codigo); }

// .env da trilha, sem sobrescrever variável que já existe no ambiente. O valor nunca é impresso.
function carregarEnv() {
  const f = join(TRILHA, ".env");
  if (!existsSync(f)) return;
  for (const linha of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

// WGS84/SIRGAS 2000 -> UTM (a mesma conta do memorial.mjs)
function toUtm(lat, lon) {
  const a = 6378137, f = 1 / 298.257222101, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const zone = Math.floor((lon + 180) / 6) + 1;
  const lon0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
  const phi = lat * Math.PI / 180, lam = lon * Math.PI / 180;
  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2), T = Math.tan(phi) ** 2, C = ep2 * Math.cos(phi) ** 2;
  const A = Math.cos(phi) * (lam - lon0);
  const M = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * phi - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * phi)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * phi) - (35 * e2 ** 3 / 3072) * Math.sin(6 * phi));
  const x = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000;
  let y = k0 * (M + N * Math.tan(phi) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6 / 720));
  if (lat < 0) y += 10000000;
  return { zone, x: Math.round(x), y: Math.round(y) };
}

const SISTEMA = { 127: "127/220", 220: "127/220", 254: "127/254", 380: "220/380" };

// projeto.json do fv-memorial -> ficha do motor. Campo que falta segue vazio: o motor diz o quê.
function paraFicha(p) {
  const h = p.holder ?? {}, cu = p.consumer_unit ?? {}, ad = p.address ?? cu.address ?? {}, se = p.service_entrance ?? {};
  const loc = p.location ?? {};
  let utm = loc.utm_zone ? { zone: loc.utm_zone, x: loc.utm_x, y: loc.utm_y } : null;
  if (!utm && loc.lat !== undefined && loc.lon !== undefined) {
    const u = toUtm(Number(loc.lat), Number(loc.lon));
    utm = { zone: String(u.zone), x: u.x, y: u.y };
  }
  const sv = se.supply_voltage_v;
  return {
    schema_version: 1,
    holder: { name: h.name, document: h.document },
    consumer_unit: {
      code: cu.code, consumer_class: cu.class ?? cu.consumer_class,
      address: { street: ad.street, number: ad.number, district: ad.district, city: ad.city, state: ad.state, zip_code: ad.zip ?? ad.zip_code },
      email: h.email ?? cu.email, phone: h.phone ?? cu.phone ?? null, mobile: h.mobile ?? cu.mobile,
    },
    service_entrance: {
      voltage_system: se.voltage_system ?? (String(sv).includes("/") ? String(sv) : SISTEMA[Number(sv)]),
      supply_voltage_v: sv, connection: se.connection, service_drop: se.service_drop ?? "AÉREO",
      main_breaker_a: se.main_breaker_a, power_factor: se.power_factor ?? 0.92, supply_level: se.supply_level ?? "BAIXA",
      cables_per_phase: se.cables_per_phase ?? 1, phase_mm2: se.phase_mm2, neutral_mm2: se.neutral_mm2,
      ground_mm2: se.ground_mm2, ground_rods: se.ground_rods ?? 1,
    },
    location: utm ? { utm_zone: utm.zone, utm_x: utm.x, utm_y: utm.y, area: loc.area ?? "URBANO" } : undefined,
    load_list: (p.load?.items ?? p.load_list ?? []).map((it) => ({
      quantity: it.quantity, description: it.description, power_w: it.power_w, demand_factor: it.demand_factor ?? 1 })),
    compensation_mode: p.compensation_mode,
    beneficiaries: p.beneficiaries ?? [],
    modules: (p.modules ?? []).map((m) => ({
      quantity: m.quantity, manufacturer: m.manufacturer, model: m.model, power_w: m.power_w,
      area_total_m2: m.area_total_m2 ?? Math.round(m.quantity * m.area_m2 * 100) / 100 })),
    inverters: (p.inverters ?? []).map((v) => ({
      quantity: v.quantity, manufacturer: v.manufacturer, model: v.model, power_kw: v.power_kw,
      nominal_voltage_v: v.nominal_voltage_v ?? v.voltage_v })),
    protection: p.protection,
    expected_connection: p.expected_connection,
    gd_already_installed: p.gd_already_installed ?? false,
  };
}

function blocoPrancha(p, arqProjeto, arqPrancha) {
  let pr = null;
  if (arqPrancha) pr = JSON.parse(readFileSync(arqPrancha, "utf8"));
  else if (p.prancha) pr = p.prancha;
  else if (existsSync(join(dirname(arqProjeto), "prancha.json"))) pr = JSON.parse(readFileSync(join(dirname(arqProjeto), "prancha.json"), "utf8"));
  if (!pr) sair(2, "Falta o bloco da prancha (datasheet elétrico, strings, proteções, RT, nº da TRT): ponha \"prancha\" no projeto.json ou um prancha.json na mesma pasta.");
  delete pr._aviso;
  pr.projeto = pr.projeto ?? {};
  if (!pr.projeto.data) { const d = new Date(); pr.projeto.data = `${MONTHS[d.getMonth()]}/${d.getFullYear()}`; }
  return pr;
}

// A prancha pode levar alguns minutos (o mapa da localização vem de serviços públicos): espera até 10 min.
async function chamar(base, metodo, rota, { token, corpo, minutos = 3 } = {}) {
  const headers = { "Content-Type": "application/json; charset=utf-8" };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(base + rota, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined, signal: AbortSignal.timeout(minutos * 60000) });
  } catch (e) {
    const extra = rota === "/api/v1/prancha" ? " O motor pode ter terminado depois: rode \"saldo\" antes de gerar de novo." : "";
    sair(3, `Sem resposta do motor (internet ou servidor fora): ${e.cause?.code ?? e.message}.${extra}`);
  }
}

async function erroDoMotor(r) {
  const txt = await r.text();
  let j = null;
  try { j = JSON.parse(txt); } catch { /* resposta sem JSON */ }
  sair(1, `HTTP ${r.status} ${j?.error_code ?? ""}: ${j?.message ?? txt.slice(0, 300)}`);
}

async function token(base) {
  const id = process.env.MOTOR_CLIENT_ID, segredo = process.env.MOTOR_CLIENT_SECRET;
  if (!id || !segredo) sair(2, SEM_CHAVE);
  const r = await chamar(base, "POST", "/api/token", { corpo: { client_id: id, client_secret: segredo } });
  if (!r.ok) await erroDoMotor(r);
  return (await r.json()).access_token;
}

async function conferir(base, tok, corpo) {
  const r = await chamar(base, "POST", "/api/v1/ficha/validar", { token: tok, corpo });
  if (!r.ok) await erroDoMotor(r);
  const v = await r.json();
  const linha = (e) => `${e.campo ? e.campo + ": " : ""}${e.mensagem}`;
  for (const e of v.erros ?? []) if (["ficha", "prancha"].includes(e.escopo ?? "ficha")) console.log(`  ERRO  ${linha(e)}`);
  for (const a of v.avisos ?? []) console.log(`  aviso ${linha(a)}`);
  return v.pode_gerar?.prancha === true;
}

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) out[argv[i].slice(2)] = argv[i + 1] === undefined || argv[i + 1].startsWith("--") ? true : argv[++i];
    else out._.push(argv[i]);
  }
  return out;
}

async function main() {
  carregarEnv();
  const a = args(process.argv.slice(2));
  const cmd = a._[0];
  if (!["saldo", "conferir", "gerar"].includes(cmd)) {
    sair(2, "uso: node prancha.mjs saldo | conferir <projeto.json> [--prancha <arquivo>] | gerar <projeto.json> --saida <pasta> [--prancha <arquivo>]");
  }
  if (!process.env.MOTOR_CLIENT_ID && !process.env.MOTOR_CLIENT_SECRET) sair(2, SEM_CHAVE);
  if (!process.env.MOTOR_URL) sair(2, "Falta MOTOR_URL no trilhas/engenharia-fv/.env: o endereço do motor vem junto com a chave.");
  const base = process.env.MOTOR_URL.replace(/\/+$/, "");
  const tok = await token(base);
  if (cmd === "saldo") {
    const r = await chamar(base, "GET", "/api/v1/cota", { token: tok });
    if (!r.ok) await erroDoMotor(r);
    const s = await r.json();
    const ate = s.valido_ate ? ` · vale até ${s.valido_ate.split("-").reverse().join("/")}` : "";
    sair(0, s.cota_pranchas === null ? `Chave sem limite de pranchas${ate}.` : `Restam ${s.pranchas_restantes} de ${s.cota_pranchas} pranchas${ate}.`);
  }
  const arq = a._[1];
  if (!arq || !existsSync(arq)) sair(2, `Projeto não encontrado: ${arq ?? "(informe o projeto.json)"}`);
  if (a.prancha && !existsSync(a.prancha)) sair(2, `Arquivo da prancha não encontrado: ${a.prancha}`);
  const p = JSON.parse(readFileSync(arq, "utf8"));
  const corpo = { ficha: paraFicha(p), prancha: blocoPrancha(p, arq, a.prancha) };
  const ok = await conferir(base, tok, corpo);
  if (!ok) sair(1, "A prancha ainda não pode ser gerada: corrija os ERROS acima no projeto e confira de novo. Nenhuma prancha foi gasta.");
  if (cmd === "conferir") sair(0, "OK: o motor aceita a prancha deste projeto. Se a sua chave tem limite (veja saldo), gerar gasta uma prancha.");
  if (!a.saida || a.saida === true) sair(2, "gerar precisa de --saida <pasta>");
  console.log("Gerando a prancha no motor (de 1 a 5 minutos; não interrompa)...");
  const r = await chamar(base, "POST", "/api/v1/prancha", { token: tok, corpo, minutos: 10 });
  if (!r.ok) await erroDoMotor(r);
  const disp = r.headers.get("content-disposition") ?? "";
  const nome = decodeURIComponent(disp.match(/filename\*=UTF-8''([^;]+)/)?.[1] ?? "PRANCHA.pdf");
  mkdirSync(a.saida, { recursive: true });
  let destino = join(a.saida, nome);
  if (existsSync(destino)) destino = destino.replace(/\.pdf$/i, `_${Date.now()}.pdf`);   // nunca sobrescreve
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
  console.log(`Prancha gerada: ${destino}`);
  const resta = r.headers.get("x-pranchas-restantes");
  if (resta !== null) console.log(resta === "1" ? "Resta 1 prancha na sua chave." : `Restam ${resta} pranchas na sua chave.`);
}

main();
