// Leitura somente-leitura de um .xlsx/.xlsm, sem dependência: zip pelo zlib do Node e XML por expressão regular.
// Serve para tirar da planilha oficial do aluno as listas de valores aceitos (validações e catálogo).
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

export function readZip(path) {
  const buf = readFileSync(path);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error(`${path} não é um arquivo do Excel (zip) válido`);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("diretório do zip corrompido");
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    entries.set(name, { method, csize, local });
    p += 46 + nameLen + extraLen + commLen;
  }
  return {
    has: (name) => entries.has(name),
    text(name) {
      const e = entries.get(name);
      if (!e) throw new Error(`parte ${name} não existe no arquivo`);
      const start = e.local + 30 + buf.readUInt16LE(e.local + 26) + buf.readUInt16LE(e.local + 28);
      const raw = buf.subarray(start, start + e.csize);
      return (e.method === 0 ? raw : inflateRawSync(raw)).toString("utf8");
    },
  };
}

export function unxml(s) {
  return s
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&amp;/g, "&");
}

const textOf = (xml) => unxml([...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(""));

export function openWorkbook(path) {
  const zip = readZip(path);
  const wbXml = zip.text("xl/workbook.xml");
  const rels = Object.fromEntries(
    [...zip.text("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\b[^>]*>/g)].map((m) => [
      /Id="([^"]+)"/.exec(m[0])[1], /Target="([^"]+)"/.exec(m[0])[1].replace(/^\/?xl\//, ""),
    ]),
  );
  const sheets = new Map();
  for (const m of wbXml.matchAll(/<sheet\b[^>]*>/g)) {
    const name = unxml(/name="([^"]*)"/.exec(m[0])[1]);
    sheets.set(name, "xl/" + rels[/r:id="([^"]+)"/.exec(m[0])[1]]);
  }
  const names = {};
  for (const m of wbXml.matchAll(/<definedName\b([^>]*)>([^<]*)<\/definedName>/g)) {
    if (!/localSheetId=/.test(m[1])) names[unxml(/name="([^"]*)"/.exec(m[1])[1])] = unxml(m[2]);
  }
  const shared = zip.has("xl/sharedStrings.xml")
    ? [...zip.text("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]))
    : [];
  const cache = new Map();

  function sheetXml(name) {
    if (!sheets.has(name)) throw new Error(`aba "${name}" não existe: esta não é a planilha do Memorial GD`);
    return zip.text(sheets.get(name));
  }

  // {"C7": {value, formula}} com os valores gravados no arquivo (o último cálculo do Excel).
  function cells(name) {
    if (cache.has(name)) return cache.get(name);
    const out = {};
    for (const m of sheetXml(name).matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const [, ref, attrs, inner = ""] = m;
      const t = /\bt="([^"]+)"/.exec(attrs)?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let value = null;
      if (t === "s" && v !== undefined) value = shared[+v];
      else if (t === "inlineStr") value = textOf(inner);
      else if (t === "str" || t === "e") value = v === undefined ? null : unxml(v);
      else if (t === "b") value = v === "1";
      else if (v !== undefined) value = Number(v);
      out[ref] = { value, formula: /<f[\s>]/.test(inner) };
    }
    cache.set(name, out);
    return out;
  }

  function validations(name) {
    return [...sheetXml(name).matchAll(/<dataValidation\b([^>]*?)(?:\/>|>([\s\S]*?)<\/dataValidation>)/g)].map((m) => ({
      sqref: /sqref="([^"]+)"/.exec(m[1])?.[1] ?? "",
      type: /\btype="([^"]+)"/.exec(m[1])?.[1] ?? "any",
      formula1: m[2] ? unxml(/<formula1>([\s\S]*?)<\/formula1>/.exec(m[2])?.[1] ?? "") : "",
      formula2: m[2] ? unxml(/<formula2>([\s\S]*?)<\/formula2>/.exec(m[2])?.[1] ?? "") : "",
    }));
  }

  return { sheets, names, cells, validations };
}

// "B2:D4" -> lista de endereços; "C7" -> ["C7"]
export function expandRange(ref) {
  const [a, b = a] = ref.replace(/\$/g, "").split(":");
  const [, c1, r1] = /([A-Z]+)(\d+)/.exec(a);
  const [, c2, r2] = /([A-Z]+)(\d+)/.exec(b);
  const out = [];
  for (let c = colNum(c1); c <= colNum(c2); c++) for (let r = +r1; r <= +r2; r++) out.push(colName(c) + r);
  return out;
}

export function colNum(s) { return [...s].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0); }
export function colName(n) { let s = ""; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; }

export function inSqref(sqref, ref) {
  const [, col, row] = /([A-Z]+)(\d+)/.exec(ref);
  return sqref.split(/\s+/).some((part) => {
    const [a, b = a] = part.split(":");
    const [, c1, r1] = /([A-Z]+)(\d+)/.exec(a);
    const [, c2, r2] = /([A-Z]+)(\d+)/.exec(b);
    return colNum(col) >= colNum(c1) && colNum(col) <= colNum(c2) && +row >= +r1 && +row <= +r2;
  });
}
