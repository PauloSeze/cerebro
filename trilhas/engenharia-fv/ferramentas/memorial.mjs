#!/usr/bin/env node
// Memorial GD da Energisa: confere o projeto contra a planilha oficial do aluno e monta o que vai em cada célula.
//
//   node memorial.mjs listas  --planilha <arquivo.xlsm> [--uf MT] [--modulo "fabricante modelo"] [--inversor "..."] [--cidade "..."]
//   node memorial.mjs montar  <projeto.json> --planilha <arquivo.xlsm> --saida <pasta>
//
// "montar" grava na pasta: celulas.json (para o preencher-excel.ps1), memorial.md (folha campo a campo, serve para
// digitar na planilha ou nas telas do portal) e dados-trt.md. Sai com código 1 se houver erro de preenchimento.
// Nada é escrito na planilha: ela só é lida.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { openWorkbook, expandRange } from "./xlsx-leitura.mjs";

const DISTRIBUTOR_BY_STATE = { AC: "EAC", MG: "EMR", MS: "EMS", MT: "EMT", PB: "EPB", PR: "ESS", RJ: "EMR", RO: "ERO", SE: "ESE", SP: "ESS", TO: "ETO" };
const PHASES = { "MONOFÁSICO": 1, "BIFÁSICO": 2, "TRIFÁSICO": 3 };
const MONTHS = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const CHECKLIST_ROWS = { "1": 6, "1.1": 7, "1.2": 8, "1.3": 9, "1.4": 10, "1.5": 11, "1.6": 12, "1.7": 13, "1.8": 14, "1.9": 15,
  "2.1": 17, "2.2": 18, "2.3": 19, "2.4": 20, "2.5": 21, "2.6": 22, "2.7": 23, "2.8": 24, "2.9": 25, "2.10": 26, "2.11": 27 };

const fold = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
const key = (s) => fold(s).replace(/[^A-Z0-9]/g, "");
const labelName = (label) => (String(label).includes(" - ") ? String(label).split(" - ").slice(1).join(" - ") : String(label));
const digits = (s) => String(s ?? "").replace(/\D/g, "");
const br = (n, d = 2) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: d });

// ------------------------------------------------------------------ o que a planilha aceita (lido da cópia do aluno)
function loadSheetRules(path) {
  const wb = openWorkbook(path);
  const cfg = wb.cells("CONFIG");
  const range = (ref) => expandRange(ref).map((a) => cfg[a]?.value).filter((v) => v !== null && v !== undefined && v !== "");
  const lists = {};
  for (const sheet of ["SOLICITACAO", "FORMULARIO", "MD-SOLAR"]) {
    for (const v of wb.validations(sheet)) {
      if (v.type === "list" && v.formula1.startsWith('"')) {
        for (const ref of v.sqref.split(/\s+/)) lists[`${sheet}!${ref.split(":")[0]}`] = v.formula1.slice(1, -1).split(",").map((s) => s.trim());
      }
    }
  }
  const voltages = {};
  for (const [name, ref] of Object.entries(wb.names)) {
    if (Object.values(DISTRIBUTOR_BY_STATE).includes(name)) voltages[name] = range(ref.split("!")[1]);
  }
  // municípios: linha 290 da CONFIG tem a UF de cada coluna; os nomes vêm abaixo
  const cities = {};
  for (const [ref, cell] of Object.entries(cfg)) {
    const m = /^([A-Z]+)290$/.exec(ref);
    if (m && /^[A-Z]{2}$/.test(String(cell.value)) && wb.names[cell.value]) cities[cell.value] = range(wb.names[cell.value].split("!")[1]);
  }
  // catálogo de módulos e inversores por distribuidora (aba INVERSOR-MODULO, colunas A–H)
  const im = wb.cells("INVERSOR-MODULO");
  const catalog = {};
  for (const [ref, cell] of Object.entries(im)) {
    const m = /^([AE])(\d+)$/.exec(ref);
    const v = String(cell.value ?? "");
    const k = m && /^([A-Z]{3})_(MODULO|INVERSOR)\d+$/.exec(v);
    if (!k) continue;
    const [, dist, kind] = k;
    const fabLabel = im[(m[1] === "A" ? "B" : "F") + m[2]]?.value;
    if (fabLabel) (((catalog[dist] ??= { MODULO: {}, INVERSOR: {} })[kind])[fabLabel] ??= []);
  }
  for (const [ref, cell] of Object.entries(im)) {
    const m = /^([CG])(\d+)$/.exec(ref);
    const v = String(cell.value ?? "");
    const k = m && /^([A-Z]{3}) (.+?)(\d+)$/.exec(v);
    if (!k || !catalog[k[1]]) continue;
    const kind = m[1] === "C" ? "MODULO" : "INVERSOR";
    const list = catalog[k[1]][kind][k[2]];
    if (list) list[+k[3] - 1] = im[(m[1] === "C" ? "D" : "H") + m[2]]?.value;
  }
  const checklistText = Object.fromEntries(Object.entries(CHECKLIST_ROWS).map(([code, row]) => [code, String(wb.cells("FORMULARIO")["B" + row]?.value ?? "")]));
  return {
    lists, voltages, cities, catalog, checklistText,
    source: range("F8:F13"), generationType: range("E24:E27"), utmZones: range("F28:F35"),
    version: wb.cells("SAIDA")["DS2"]?.value,
  };
}

// ------------------------------------------------------------------ catálogo
function findEquipment(rules, dist, kind, manufacturer, model) {
  const cat = rules.catalog[dist]?.[kind] ?? {};
  const fabs = Object.keys(cat);
  const res = { manufacturer: "OUTROS", model: "OUTRO", status: "fora do catálogo", suggestions: [] };
  let cands = fabs.filter((f) => f === manufacturer);
  if (!cands.length) cands = fabs.filter((f) => key(labelName(f)) === key(labelName(manufacturer)));
  if (!cands.length) {
    cands = fabs.filter((f) => {
      const a = fold(labelName(f)), b = fold(labelName(manufacturer));
      return a.length >= 3 && (b.startsWith(a + " ") || a.startsWith(b + " "));
    });
  }
  if (!cands.length) return res;
  const want = key(labelName(model));
  for (const fab of cands) {
    const fabKey = key(labelName(fab));
    const hit = cat[fab].find((m) => m && (m === model || key(labelName(m)) === want || key(labelName(m)) === fabKey + want || fabKey + key(labelName(m)) === want));
    if (hit) return { manufacturer: fab, model: hit, status: "no catálogo", suggestions: [] };
  }
  const nums = String(model).match(/\d+/g) ?? [];
  res.suggestions = cands.flatMap((fab) => cat[fab].filter((m) => m && nums.length && nums.every((n) => labelName(m).includes(n))).map((m) => `${fab} | ${m}`)).slice(0, 5);
  res.manufacturerFound = cands[0];
  return res;
}

// ------------------------------------------------------------------ coordenadas (WGS84/SIRGAS 2000 -> UTM)
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

// ------------------------------------------------------------------ projeto -> células
function build(p, rules) {
  const errors = [], warnings = [], cells = { SOLICITACAO: {}, "RELACAO DE CARGA": {}, FORMULARIO: {}, "MD-SOLAR": {}, "UC BENEFICIARIAS": {} };
  const sheet = []; // linhas da folha: [aba, campo, valor, célula]
  const need = (v, label) => { if (v === undefined || v === null || v === "") errors.push(`falta ${label}`); return v; };
  const put = (tab, cell, value, label) => {
    if (value === undefined || value === null || value === "") return;
    cells[tab][cell] = value;
    sheet.push([tab, label, value, cell]);
  };
  const choose = (listKey, value, label) => {
    const opts = rules.lists[listKey];
    if (value === undefined || value === null || value === "") { errors.push(`falta ${label}`); return undefined; }
    if (!opts) return value;
    const hit = opts.find((o) => fold(o) === fold(value));
    if (!hit) errors.push(`${label} "${value}" não está na lista da planilha: ${opts.join(" · ")}`);
    return hit;
  };

  const h = p.holder ?? {}, uc = p.consumer_unit ?? {}, ad = p.address ?? {}, se = p.service_entrance ?? {}, loc = p.location ?? {};
  const state = fold(need(ad.state, "UF da obra (address.state)"));
  const dist = DISTRIBUTOR_BY_STATE[state];
  if (state && !dist) errors.push(`UF ${state} não é atendida pela planilha (só ${Object.keys(DISTRIBUTOR_BY_STATE).join(", ")})`);

  // 1. SOLICITAÇÃO
  const T = "SOLICITACAO";
  let ucCode = need(uc.code, "número da UC (consumer_unit.code)");
  if (ucCode && /^\s*(uc\s*)?nova\s*$/i.test(ucCode)) ucCode = "UC NOVA";
  else if (ucCode && /^\d+$/.test(String(ucCode).trim())) ucCode = Number(ucCode);
  put(T, "C7", ucCode, "UC (código do cliente)");
  put(T, "I7", choose("SOLICITACAO!I7", uc.class, "classe da UC"), "Classe");
  put(T, "C8", h.name && fold(h.name), "Titular da UC");
  need(h.name, "nome do titular (holder.name)");
  put(T, "C9", need(ad.street, "logradouro (address.street)"), "Logradouro");
  const number = /^\s*s\/?n\s*$/i.test(String(ad.number ?? "")) ? 0 : ad.number;
  if (number !== undefined && number !== "" && !/^\d+$/.test(String(number))) errors.push(`número "${ad.number}" precisa ser só dígitos (sem número: 0 ou "S/N")`);
  put(T, "C10", number === undefined || number === "" ? need(undefined, "número (address.number; sem número use \"S/N\")") : Number(number), "Nº");
  put(T, "E10", need(ad.district, "bairro (address.district)"), "Bairro");
  put(T, "I10", state, "UF");
  const cep = digits(ad.zip);
  if (cep.length !== 8) errors.push(`CEP "${ad.zip ?? ""}" precisa ter 8 dígitos`);
  put(T, "K10", cep.startsWith("0") ? cep : Number(cep), "CEP");
  put(T, "C11", need(h.email, "e-mail do titular (holder.email): a Energisa exige o do titular"), "E-mail do titular");
  const cityList = rules.cities[state] ?? [];
  const city = cityList.find((c) => fold(c) === fold(ad.city));
  if (ad.city && !city) errors.push(`município "${ad.city}" não está na lista da planilha para ${state}`);
  put(T, "I11", city ?? need(ad.city, "município (address.city)"), "Cidade");
  if (h.phone) put(T, "C12", Number(digits(h.phone)), "Telefone");
  const mobile = digits(h.mobile);
  if (mobile.length < 10 || mobile.length > 11) errors.push(`celular "${h.mobile ?? ""}" precisa ter DDD + número (10 ou 11 dígitos)`);
  put(T, "I12", Number(mobile), "Celular");
  const doc = digits(h.document);
  if (![11, 14].includes(doc.length)) errors.push(`CPF/CNPJ "${h.document ?? ""}" precisa ter 11 ou 14 dígitos`);
  put(T, "C13", Number(doc), "CPF/CNPJ");

  const items = p.load?.items ?? [];
  if (!items.length) errors.push("falta a relação de carga (load.items): quantidade, equipamento, potência em W");
  const loadKw = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.power_w) || 0), 0) / 1000;
  put(T, "D15", Math.round(loadKw * 1e6) / 1e6, "Potência instalada (kW) = total da relação de carga");
  const voltList = rules.voltages[dist] ?? [];
  const volt = voltList.find((v) => String(v) === String(se.supply_voltage_v));
  if (se.supply_voltage_v !== undefined && !volt) errors.push(`tensão de atendimento ${se.supply_voltage_v} V fora da lista de ${dist}: ${voltList.join(" · ")}`);
  put(T, "J15", volt ?? need(se.supply_voltage_v, "tensão de atendimento (service_entrance.supply_voltage_v)"), "Tensão de atendimento (V)");
  const conn = choose("SOLICITACAO!D16", se.connection, "tipo de conexão");
  put(T, "D16", conn, "Tipo de conexão");
  put(T, "D17", choose("SOLICITACAO!D17", se.service_drop ?? "AÉREO", "tipo de ramal"), "Tipo de ramal");
  put(T, "D20", rules.source.find((s) => fold(s) === "SOLAR FOTOVOLTAICA"), "Fonte de geração");
  put(T, "H20", rules.generationType.find((s) => fold(s).startsWith("EMPREGANDO CONVERSOR")), "Tipo de geração");
  const rq = p.requester ?? {};
  put(T, "D26", rq.name, "Cliente/procurador legal (quem assina)");
  put(T, "C27", rq.phone, "Telefone de quem assina");
  put(T, "G27", rq.email, "E-mail de quem assina");
  if (!rq.name) warnings.push("sem 'Cliente/procurador legal' (requester.name): campo de quem assina a solicitação fica vazio");

  // 2. RELAÇÃO DE CARGA
  if (items.length > 20) errors.push("a relação de carga aceita no máximo 20 linhas");
  items.slice(0, 20).forEach((it, i) => {
    const r = 16 + i, R = "RELACAO DE CARGA";
    put(R, `B${r}`, Number(it.quantity), `Linha ${i + 1}: quantidade`);
    put(R, `C${r}`, it.description, `Linha ${i + 1}: equipamento`);
    put(R, `F${r}`, Number(it.power_w), `Linha ${i + 1}: potência unitária (W)`);
    put(R, `H${r}`, Number(it.demand_factor ?? 1), `Linha ${i + 1}: fator de demanda`);
    if (!(it.quantity > 0) || !(it.power_w > 0) || !it.description) errors.push(`relação de carga, linha ${i + 1}: quantidade, equipamento e potência (W) são obrigatórios`);
  });

  // 3. FORMULÁRIO
  const isCompany = doc.length === 14;
  const docs = p.checklist?.documents ?? [...(isCompany ? ["1", "1.1"] : ["1", "1.2"]), "1.3", "1.4", "2.1", "2.3", "2.4", "2.5"];
  for (const code of docs) {
    if (!CHECKLIST_ROWS[code]) { errors.push(`item de documentação "${code}" não existe no formulário`); continue; }
    put("FORMULARIO", `K${CHECKLIST_ROWS[code]}`, "X", `Documento ${code}: ${rules.checklistText[code].slice(0, 70)}…`);
  }
  put("FORMULARIO", "K29", p.checklist?.inspection_after_approval ? "SIM" : "NÃO", "3.1 Vistoria após a aprovação?");
  if (p.checklist?.waive_withdrawal) put("FORMULARIO", "K30", "X", "3.2 Renuncia ao direito de desistir");
  if (p.checklist?.authorize_contracts) put("FORMULARIO", "K31", "X", "3.3 Autoriza entregar contratos com o orçamento");
  if (p.checklist?.declaration !== false) put("FORMULARIO", "K32", "X", "3.4 Declaração de conformidade das instalações");

  // 4. MD-SOLAR
  const M = "MD-SOLAR";
  put(M, "B15", need(se.main_breaker_a, "disjuntor geral em A (service_entrance.main_breaker_a)"), "Disjuntor geral (A)");
  put(M, "D15", se.power_factor ?? 0.92, "Fator de potência");
  if (se.contracted_demand_kw) put(M, "G15", se.contracted_demand_kw, "Demanda contratada (kW)");
  const prot = p.protection ?? {};
  put(M, "I16", need(prot.dps_ac_ka, "DPS CA em kA (protection.dps_ac_ka)"), "DPS CA (kA)");
  put(M, "J16", need(prot.ac_breaker_a, "disjuntor CA em A (protection.ac_breaker_a)"), "Disjuntor CA (A)");
  if (prot.dps_dc_ka) put(M, "K16", prot.dps_dc_ka, "DPS CC (kA)");
  if (prot.dc_breaker_a) put(M, "L16", prot.dc_breaker_a, "Disjuntor CC (A)");

  const benefs = p.beneficiaries ?? [];
  let mode = p.compensation_mode;
  if (!mode) {
    mode = !benefs.length ? "Compensação local" : benefs.every((b) => digits(b.document) === doc) ? "Autoconsumo remoto" : "Geração compartilhada";
    warnings.push(`modalidade deduzida das beneficiárias: ${mode} (confirme)`);
  }
  mode = choose("MD-SOLAR!B17", mode, "modalidade de compensação");
  if (mode && fold(mode) === fold("Compensação local") && benefs.length) errors.push("há UCs beneficiárias, mas a modalidade é 'Compensação local'");
  if (mode && fold(mode) !== fold("Compensação local") && !benefs.length) errors.push(`modalidade '${mode}' sem UC beneficiária`);
  put(M, "B17", mode, "Modalidade de compensação");
  put(M, "E17", se.ground_rods ?? 1, "Número de hastes de aterramento");
  if (se.transformer_kva !== undefined) put(M, "D17", se.transformer_kva, "Potência do trafo que atende a UC (rural)");

  let utm = loc.utm_zone ? { zone: parseInt(loc.utm_zone, 10), x: loc.utm_x, y: loc.utm_y } : null;
  if (!utm && loc.lat !== undefined && loc.lon !== undefined) {
    utm = toUtm(Number(loc.lat), Number(loc.lon));
    warnings.push(`UTM calculada das coordenadas ${loc.lat}, ${loc.lon} (padrão de entrada): fuso ${utm.zone}, X ${utm.x}, Y ${utm.y}`);
  }
  if (!utm) errors.push("faltam as coordenadas do padrão de entrada (location.lat e location.lon, ou UTM)");
  else {
    const zoneLabel = rules.utmZones.find((z) => parseInt(z, 10) === utm.zone);
    if (!zoneLabel) errors.push(`fuso UTM ${utm.zone} fora da lista da planilha (${rules.utmZones.join(" · ")})`);
    if (String(utm.x).length !== 6) errors.push(`UTM X ${utm.x} precisa ter 6 dígitos`);
    if (String(utm.y).length !== 7) errors.push(`UTM Y ${utm.y} precisa ter 7 dígitos`);
    put(M, "F19", zoneLabel, "Fuso UTM");
    put(M, "H19", utm.x, "UTM X (leste)");
    put(M, "J19", utm.y, "UTM Y (norte)");
  }
  put(M, "B22", choose("MD-SOLAR!B22", se.supply_level ?? "BAIXA", "nível de tensão"), "Tipo de tensão");
  put(M, "C22", se.cables_per_phase ?? 1, "Cabos por fase");
  put(M, "E22", need(se.phase_mm2, "bitola do cabo fase em mm² (service_entrance.phase_mm2)"), "Bitola fase (mm²)");
  put(M, "F22", need(se.neutral_mm2, "bitola do neutro em mm² (service_entrance.neutral_mm2)"), "Bitola neutro (mm²)");
  put(M, "G22", need(se.ground_mm2, "bitola do terra em mm² (service_entrance.ground_mm2)"), "Bitola terra (mm²)");
  put(M, "H22", p.already_installed ? "SIM" : "NÃO", "Sistema GD já instalado?");
  const now = new Date();
  const ec = p.expected_connection ?? { month: MONTHS[(now.getMonth() + 1) % 12], year: now.getFullYear() + (now.getMonth() === 11 ? 1 : 0) };
  put(M, "I22", choose("MD-SOLAR!I22", ec.month, "mês da previsão de ligação"), "Previsão de ligação: mês");
  put(M, "J22", choose("MD-SOLAR!J22", String(ec.year), "ano da previsão de ligação") && Number(ec.year), "Previsão de ligação: ano");
  put(M, "K22", choose("MD-SOLAR!K22", loc.area ?? "URBANO", "zona (URBANO ou RURAL)"), "Zona");

  const modules = p.modules ?? [], inverters = p.inverters ?? [];
  if (!modules.length) errors.push("falta pelo menos um módulo (modules)");
  if (!inverters.length) errors.push("falta pelo menos um inversor (inverters)");
  const remarks = [...(p.remarks ?? [])];
  const outside = [];
  const equipment = [];
  modules.slice(0, 10).forEach((m, i) => {
    const r = 31 + i;
    const eq = findEquipment(rules, dist, "MODULO", m.manufacturer, m.model);
    equipment.push({ kind: "módulo", asked: `${m.manufacturer} ${m.model}`, ...eq });
    if (eq.status !== "no catálogo") outside.push(`FABRICANTE DO MÓDULO: ${m.manufacturer} MODELO: ${m.model}`);
    put(M, `C${r}`, Number(m.quantity), `Módulos ${i + 1}: quantidade`);
    put(M, `D${r}`, eq.manufacturer, `Módulos ${i + 1}: fabricante`);
    put(M, `G${r}`, eq.model, `Módulos ${i + 1}: modelo`);
    put(M, `J${r}`, Math.round(m.quantity * m.area_m2 * 100) / 100, `Módulos ${i + 1}: área total do arranjo (m²)`);
    put(M, `K${r}`, m.power_w / 1000, `Módulos ${i + 1}: potência de cada módulo (kW)`);
    if (!(m.quantity > 0) || !(m.power_w > 0) || !(m.area_m2 > 0)) errors.push(`módulos ${i + 1}: quantidade, potência (W) e área de um módulo (m², do datasheet) são obrigatórios`);
  });
  inverters.slice(0, 10).forEach((v, i) => {
    const r = 46 + i;
    const eq = findEquipment(rules, dist, "INVERSOR", v.manufacturer, v.model);
    equipment.push({ kind: "inversor", asked: `${v.manufacturer} ${v.model}`, ...eq });
    if (eq.status !== "no catálogo") outside.push(`FABRICANTE DO INVERSOR: ${v.manufacturer} MODELO: ${v.model}`);
    put(M, `C${r}`, Number(v.quantity), `Inversores ${i + 1}: quantidade`);
    put(M, `D${r}`, eq.manufacturer, `Inversores ${i + 1}: fabricante`);
    put(M, `G${r}`, eq.model, `Inversores ${i + 1}: modelo`);
    put(M, `J${r}`, Number(v.power_kw), `Inversores ${i + 1}: potência de cada inversor (kW)`);
    put(M, `L${r}`, Number(v.voltage_v), `Inversores ${i + 1}: tensão nominal (V)`);
    if (!(v.quantity > 0) || !(v.power_kw > 0) || !(v.voltage_v > 0)) errors.push(`inversores ${i + 1}: quantidade, potência (kW) e tensão nominal (V) são obrigatórios`);
  });
  if (modules.length > 10 || inverters.length > 10) errors.push("a planilha aceita no máximo 10 linhas de módulos e 10 de inversores");
  for (const e of equipment.filter((e) => e.status !== "no catálogo")) {
    warnings.push(`${e.kind} ${e.asked} não está no catálogo da planilha: vai como OUTROS/OUTRO e o modelo nas Observações` +
      (e.suggestions.length ? `. Parecidos no catálogo: ${e.suggestions.join("; ")}` : ""));
  }
  if (outside.length) {
    const text = outside.join(" ///// ");
    remarks[1] = remarks[1] ? `${remarks[1]} ///// ${text}` : text;
  }
  put(M, "C23", remarks[0], "Observações, linha 1");
  put(M, "C24", remarks[1], "Observações, linha 2");

  // 5. UC BENEFICIÁRIAS
  if (benefs.length > 10) errors.push("a planilha aceita no máximo 10 UCs beneficiárias");
  benefs.slice(0, 10).forEach((b, i) => {
    const r = 15 + i, B = "UC BENEFICIARIAS";
    if (/nova/i.test(String(b.code))) errors.push(`beneficiária ${i + 1}: precisa do número da UC (não pode ser UC NOVA)`);
    put(B, `B${r}`, /^\d+$/.test(String(b.code)) ? Number(b.code) : b.code, `Beneficiária ${i + 1}: UC`);
    put(B, `C${r}`, b.name && fold(b.name), `Beneficiária ${i + 1}: titular`);
    put(B, `F${r}`, Number(digits(b.document)), `Beneficiária ${i + 1}: CPF/CNPJ`);
    put(B, `H${r}`, b.address, `Beneficiária ${i + 1}: endereço`);
    put(B, `K${r}`, Number(b.percent), `Beneficiária ${i + 1}: percentual (%)`);
  });
  const pct = benefs.reduce((s, b) => s + (Number(b.percent) || 0), 0);
  if (benefs.length && Math.abs(pct - 100) > 0.01) warnings.push(`percentuais das beneficiárias somam ${br(pct)} % (o normal é 100 %)`);

  // coerência de engenharia
  const kwp = modules.reduce((s, m) => s + (m.quantity || 0) * (m.power_w || 0), 0) / 1000;
  const kwInv = inverters.reduce((s, v) => s + (v.quantity || 0) * (v.power_kw || 0), 0);
  const ratio = kwInv ? kwp / kwInv : 0;
  if (kwInv && (ratio < 0.5 || ratio > 2)) errors.push(`módulos ${br(kwp, 3)} kWp para ${br(kwInv, 3)} kW de inversor (CC/CA ${br(ratio)}): confira quantidades e potências`);
  else if (kwInv && (ratio < 1 || ratio > 1.35)) warnings.push(`relação CC/CA ${br(ratio)} (${br(kwp, 3)} kWp / ${br(kwInv, 3)} kW): fora de 1,0–1,35; confira o limite de sobrecarga no datasheet do inversor`);
  // tensão fase-neutro: "220/380" -> 220; na lista da EMT (127, 220, 254, 380) só o 380 é de rede 220/380
  const sv = String(se.supply_voltage_v ?? "");
  const vfn = sv.includes("/") ? parseInt(sv, 10) : sv === "380" ? 220 : 127;
  const pdisp = conn && se.main_breaker_a ? (se.main_breaker_a * vfn * PHASES[conn]) / 1000 : null;
  const genKw = Math.min(kwp || Infinity, kwInv || Infinity);
  if (pdisp && genKw > pdisp) errors.push(`geração ${br(genKw, 3)} kW acima da potência disponibilizada estimada ${br(pdisp)} kVA (${se.main_breaker_a} A × ${vfn} V × ${PHASES[conn]} fase(s)): aumente o padrão (adequação) ou reduza o sistema`);
  for (const v of inverters) {
    if (conn === "MONOFÁSICO" && Number(v.voltage_v) > 127 && Number(se.supply_voltage_v) <= 220) warnings.push(`inversor de ${v.voltage_v} V em ligação monofásica: confira a tensão de saída contra a do padrão`);
  }
  return { cells, sheet, errors, warnings, equipment, totals: { kwp, kwInv, ratio, loadKw, pdisp, genKw }, dist, mode };
}

// ------------------------------------------------------------------ saídas
const TAB_TITLE = { SOLICITACAO: "Tela 1: Solicitação", "RELACAO DE CARGA": "Tela 2: Relação de carga", FORMULARIO: "Tela 3: Formulário (documentos e declarações)", "MD-SOLAR": "Tela 4: Memorial descritivo (MD-SOLAR)", "UC BENEFICIARIAS": "Tela 5: UCs beneficiárias" };

function folha(p, r, rules) {
  const out = [`# Memorial GD: ${fold(p.holder?.name)} (UC ${p.consumer_unit?.code})`, "",
    `> Gerado pelo agente em ${new Date().toLocaleDateString("pt-BR")} a partir de \`projeto.json\`, conferido contra a planilha oficial (versão ${rules.version ?? "?"}).`,
    "> Cada valor está na grafia exata que a planilha aceita. Serve para conferir o preenchimento automático ou para digitar à mão, na planilha ou nas telas do portal.", ""];
  out.push(`**Situação:** ${r.errors.length ? `${r.errors.length} erro(s): corrija antes de preencher` : "pronto para preencher"}.`, "");
  out.push("| Conta | Valor |", "|---|---|",
    `| Módulos | ${br(r.totals.kwp, 3)} kWp |`, `| Inversores | ${br(r.totals.kwInv, 3)} kW |`, `| Relação CC/CA | ${br(r.totals.ratio)} |`,
    `| Carga instalada (relação de carga) | ${br(r.totals.loadKw, 3)} kW |`,
    `| Potência disponibilizada estimada (disjuntor × tensão fase-neutro × fases) | ${r.totals.pdisp ? br(r.totals.pdisp) + " kVA" : "?"} |`, "");
  if (r.errors.length) out.push("## Erros", "", ...r.errors.map((e) => `- ${e}`), "");
  if (r.warnings.length) out.push("## Avisos", "", ...r.warnings.map((w) => `- ${w}`), "");
  for (const tab of Object.keys(TAB_TITLE)) {
    const rows = r.sheet.filter((s) => s[0] === tab);
    if (!rows.length) continue;
    out.push(`## ${TAB_TITLE[tab]}`, "", "| Campo | Valor | Célula |", "|---|---|---|", ...rows.map(([, l, v, c]) => `| ${l} | ${typeof v === "number" && !Number.isInteger(v) ? br(v, 6) : String(v).replace(/\|/g, "/")} | ${c} |`), "");
  }
  out.push("## Fica com você", "",
    "- Assinaturas (titular ou procurador e responsável técnico) nas páginas que a planilha imprime.",
    "- Ampliação de sistema existente (aba GD EXISTENTE) e transformador de acoplamento ou exclusivo: preencha à mão, se for o caso.",
    "- Documentos que a planilha lista no fim (TRT/ART, diagrama unifilar, datasheets, certificado Inmetro do inversor, planta de localização…).", "");
  return out.join("\n");
}

function trt(p, r) {
  const P = r.totals.genKw;
  const pTxt = P.toFixed(3).replace(".", ",");
  const ad = p.address ?? {}, h = p.holder ?? {};
  const doc = digits(h.document);
  const docFmt = doc.length === 11 ? doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  const lat = p.location?.lat, lon = p.location?.lon;
  return [`# Dados para a TRT (SINCETI) ou ART (CREA): ${fold(h.name)}`, "",
    "> Copie campo a campo no portal do seu conselho. Os valores marcados **(você confere)** dependem do seu contrato e do",
    "> seu conselho: o agente sugere, quem assina decide.", "",
    "| Campo | Valor |", "|---|---|",
    `| Contratante (nome) | ${fold(h.name)} |`,
    `| CPF/CNPJ do contratante | ${docFmt} |`,
    `| Proprietário | o mesmo contratante |`,
    `| Endereço da obra | ${ad.street ?? ""}, ${ad.number ?? "S/N"}, ${ad.district ?? ""}, ${ad.city ?? ""}/${fold(ad.state)} |`,
    `| CEP | ${digits(ad.zip).replace(/(\d{5})(\d{3})/, "$1-$2")} |`,
    `| Coordenadas (grau decimal) | ${lat !== undefined ? `${lat}, ${lon}` : "use as do padrão de entrada (memorial)"} |`,
    `| Modelo / forma de registro | Obra ou serviço / inicial |`,
    `| Participação técnica | individual **(você confere)** |`,
    `| Finalidade | ${p.consumer_unit?.class ? fold(p.consumer_unit.class).toLowerCase() : "?"} **(você confere)** |`,
    `| Atividade 1 | Projeto · sistema solar fotovoltaico |`,
    `| Atividade 2 | Execução · sistema solar fotovoltaico |`,
    `| Unidade e quantidade | quilowatt (kW) · ${pTxt} |`,
    `| Observação | PE FV ${br(P, 3).replace(/\./g, "")}KW |`,
    `| Valor do contrato | **(você confere)**: o valor real do seu serviço |`,
    `| Datas | contrato e início: hoje; fim: previsão de conclusão **(você confere)** |`, "",
    `**Como saiu a quantidade:** a potência da usina é a menor entre módulos (${br(r.totals.kwp, 3)} kWp) e inversores (${br(r.totals.kwInv, 3)} kW) = **${br(P, 3)} kW**.`,
    "É o critério mais usado; se o seu conselho pedir outro (só kWp, por exemplo), troque.", "",
    "Técnico (CFT/CRT): portal SINCETI. Engenheiro (CREA): os mesmos dados servem para a ART, mas os nomes das atividades mudam com o CREA do seu estado.", "",
  ].join("\n");
}

// ------------------------------------------------------------------ CLI
function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) out[argv[i].slice(2)] = argv[i + 1]?.startsWith("--") || argv[i + 1] === undefined ? true : argv[++i];
    else out._.push(argv[i]);
  }
  return out;
}

function main() {
  const a = args(process.argv.slice(2));
  const cmd = a._[0];
  const uso = () => {
    console.log("uso: node memorial.mjs listas --planilha <xlsm> [--uf MT] [--modulo \"fab modelo\"] [--inversor \"fab modelo\"] [--cidade nome]\n" +
      "     node memorial.mjs montar <projeto.json> --planilha <xlsm> --saida <pasta>");
    process.exit(2);
  };
  if (!["listas", "montar"].includes(cmd)) uso();
  if (!a.planilha || a.planilha === true) {
    console.log("Falta a planilha oficial da Energisa (o arquivo .xlsm do Formulário de Orçamento de conexão de Geração Distribuída).\n" +
      "Baixe no site da Energisa, salve em trilhas/engenharia-fv/planilha-oficial/ e rode de novo com --planilha <caminho do arquivo>.\n" +
      "Dúvida? Peça ao Claude: \"monta o memorial\" (a skill fv-memorial guia o download).");
    process.exit(2);
  }
  if (!existsSync(a.planilha)) {
    console.log(`Não achei a planilha em: ${a.planilha}\n` +
      "Confira o caminho (arquivo .xlsm; se tiver espaço no nome, ponha entre aspas) e rode de novo.");
    process.exit(2);
  }
  let rules;
  try { rules = loadSheetRules(a.planilha); } catch (e) {
    console.log(`Não consegui ler a planilha ${a.planilha}.\n` +
      "Confira se é o arquivo .xlsm oficial da Energisa (não um PDF nem uma cópia aberta no Excel) e rode de novo.\n" +
      `Detalhe técnico: ${e.message}`);
    process.exit(2);
  }
  if (cmd === "listas") {
    const uf = fold(a.uf ?? "MT"), dist = DISTRIBUTOR_BY_STATE[uf];
    console.log(`Planilha versão ${rules.version} · UF ${uf} → distribuidora ${dist}`);
    console.log(`Tensões de atendimento: ${(rules.voltages[dist] ?? []).join(" · ")}`);
    for (const [k, v] of Object.entries(rules.lists)) console.log(`${k}: ${v.join(" · ")}`);
    console.log(`Fusos UTM: ${rules.utmZones.join(" · ")}`);
    if (a.cidade) console.log(`Municípios parecidos: ${(rules.cities[uf] ?? []).filter((c) => fold(c).includes(fold(a.cidade))).join(" · ") || "nenhum"}`);
    for (const kind of ["modulo", "inversor"]) {
      if (!a[kind]) continue;
      const words = fold(a[kind]).split(" ");
      const cat = rules.catalog[dist]?.[kind === "modulo" ? "MODULO" : "INVERSOR"] ?? {};
      const hits = Object.entries(cat).flatMap(([fab, ms]) => ms.filter(Boolean).map((m) => `${fab} | ${m}`)).filter((s) => words.every((w) => fold(s).includes(w)));
      console.log(`Catálogo de ${kind} (${hits.length}): ${hits.slice(0, 30).join("\n  ") || "nada: vai como OUTROS/OUTRO"}`);
    }
    return;
  }
  if (!a._[1] || !a.saida) { console.log("montar precisa do projeto.json e de --saida <pasta>"); process.exit(2); }
  if (!existsSync(a._[1])) { console.log(`Não achei o projeto.json em: ${a._[1]}\nCrie-o com a skill fv-memorial (ela monta com você) e rode de novo.`); process.exit(2); }
  let p;
  try { p = JSON.parse(readFileSync(a._[1], "utf8")); } catch (e) {
    console.log(`O projeto.json não é um JSON válido (${e.message}). Peça ao Claude para corrigir.`); process.exit(2);
  }
  const r = build(p, rules);
  mkdirSync(a.saida, { recursive: true });
  writeFileSync(join(a.saida, "celulas.json"), JSON.stringify({ planilha_versao: rules.version, celulas: r.cells }, null, 1), "utf8");
  writeFileSync(join(a.saida, "memorial.md"), folha(p, r, rules), "utf8");
  writeFileSync(join(a.saida, "dados-trt.md"), trt(p, r), "utf8");
  console.log(`${r.errors.length ? "ERROS" : "OK"}: ${br(r.totals.kwp, 3)} kWp · ${br(r.totals.kwInv, 3)} kW de inversor · modalidade ${r.mode ?? "?"} · ${r.sheet.length} campos`);
  for (const e of r.errors) console.log(`  ERRO  ${e}`);
  for (const w of r.warnings) console.log(`  aviso ${w}`);
  console.log(`  gravado em ${a.saida}: celulas.json, memorial.md, dados-trt.md`);
  process.exit(r.errors.length ? 1 : 0);
}

main();
