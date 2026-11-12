#!/usr/bin/env node
// Guarda do cérebro (PreToolUse em Bash e PowerShell): bloqueia comando destrutivo antes de rodar,
// mesmo em modo bypass. Lê o JSON do hook na entrada padrão; bloqueio = saída 2 com o motivo no stderr.
// Derivado da ideia de git-guardrails-claude-code (mattpocock/skills, MIT). Ver NOTICE.md.
// Escrito em Node porque a skill verificar-ambiente garante o Node; sem Node o hook falha sem travar a sessão.
'use strict';

const OPS = new Set([';', '&', '|', '\n']);
const GIT_OPTS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);
const SHELL_INLINE_FLAGS = new Set(['-c', '-command', '/c']);
const RM_NAMES = new Set(['rm', 'remove-item', 'rmdir', 'rd', 'del', 'ri']);
const DANGER_TARGETS = new Set([
  '/', '/*', '~', '~/', '~/*', '$home', '$home/', '$home\\', '${home}', '$env:userprofile',
  'c:', 'c:\\', 'c:/', 'c:\\*', 'c:/*', '.', './', './*', '.\\', '.\\*', '*', '..',
]);
const SQL_RULES = [
  [/\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i, 'DROP de tabela ou banco'],
  [/\bTRUNCATE\s+(TABLE\s+)?[\w"`.]+/i, 'TRUNCATE'],
];

// Divide em comandos simples (listas de palavras) por ; & | e quebra de linha fora de aspas.
// Aspas importam: a mensagem de commit em heredoc é uma palavra só e não vira comando.
function segments(command) {
  const segs = [];
  let cur = [], tok = '', has = false, quote = null;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) {
      if (c === quote) quote = null; else tok += c;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; has = true; continue; }
    if (c === ' ' || c === '\t' || c === '\r' || OPS.has(c)) {
      if (has) { cur.push(tok); tok = ''; has = false; }
      if (OPS.has(c) && cur.length) { segs.push(cur); cur = []; }
      continue;
    }
    tok += c; has = true;
  }
  if (quote) { // aspas desbalanceadas: corte simples
    return command.split(/&&|\|\||;|\||\r?\n/).map(s => s.trim().split(/\s+/)).filter(s => s[0]);
  }
  if (has) cur.push(tok);
  if (cur.length) segs.push(cur);
  return segs;
}

const baseName = t => t.replace(/\\/g, '/').split('/').pop().toLowerCase();
const isGit = t => ['git', 'git.exe'].includes(baseName(t));

function shortFlags(args) {
  const letters = new Set();
  for (const a of args) if (a.startsWith('-') && !a.startsWith('--') && a.length > 1) for (const l of a.slice(1)) letters.add(l);
  return letters;
}

function gitSubcommand(tokens, start) {
  let i = start + 1;
  while (i < tokens.length && tokens[i].startsWith('-')) i += GIT_OPTS_WITH_VALUE.has(tokens[i]) ? 2 : 1;
  return i < tokens.length ? [tokens[i], tokens.slice(i + 1)] : [null, []];
}

function checkGit(sub, args) {
  const f = shortFlags(args);
  const has = x => args.includes(x);
  if (has('--no-verify') || has('--no-gpg-sign') || (sub === 'commit' && f.has('n'))) return 'pula hook ou assinatura (--no-verify / --no-gpg-sign)';
  if (sub === 'push') {
    if (args.some(a => a.startsWith('--force') || a.startsWith('+')) || f.has('f')) return 'force push';
    if (has('--mirror') || has('--delete') || f.has('d')) return 'push que apaga ou espelha branch remota';
  }
  if (sub === 'reset' && has('--hard')) return 'git reset --hard';
  if (sub === 'clean' && (f.has('f') || has('--force'))) return 'git clean -f';
  if (sub === 'branch' && (f.has('D') || (has('--delete') && has('--force')))) return 'git branch -D';
  if (sub === 'checkout' && (has('--') || has('.'))) return 'git checkout -- / git checkout . (descarta alterações)';
  if (sub === 'restore' && (!has('--staged') || has('--worktree') || f.has('W'))) return 'git restore (descarta alterações)';
  if (sub === 'add' && (has('.') || has('-A') || has('--all') || f.has('A'))) return 'git add . / -A (adicione arquivo por nome)';
  if (sub === 'stash' && ['drop', 'clear'].includes(args[0])) return 'git stash drop/clear';
  return null;
}

function checkRemove(args) {
  const f = shortFlags(args);
  const recursive = f.has('r') || f.has('R') || args.some(a => /^--?recurse?/i.test(a) || a === '--recursive');
  if (recursive && args.some(a => DANGER_TARGETS.has(a.toLowerCase()))) return 'apagar recursivo na raiz, na home ou na pasta inteira';
  return null;
}

function checkSegment(tokens, depth) {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    let reason = null;
    if (isGit(t)) {
      const [sub, args] = gitSubcommand(tokens, i);
      if (sub) reason = checkGit(sub, args);
    } else if (RM_NAMES.has(baseName(t))) {
      reason = checkRemove(tokens.slice(i + 1));
    } else if (SHELL_INLINE_FLAGS.has(t.toLowerCase()) && i + 1 < tokens.length && depth < 2) {
      reason = checkCommand(tokens[i + 1], depth + 1);
    }
    if (reason) return reason;
  }
  return null;
}

function checkSql(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    if (isGit(tokens[i]) && ['commit', 'tag'].includes(gitSubcommand(tokens, i)[0])) return null; // texto de mensagem não executa
  }
  const text = tokens.join(' ');
  for (const [re, reason] of SQL_RULES) if (re.test(text)) return reason;
  const del = /\bDELETE\s+FROM\b/gi;
  let m;
  while ((m = del.exec(text))) {
    const stmt = text.slice(m.index + m[0].length).split(';')[0];
    if (!/\bWHERE\b/i.test(stmt)) return 'DELETE FROM sem WHERE';
  }
  return null;
}

function checkCommand(command, depth = 0) {
  for (const tokens of segments(command)) {
    const reason = checkSegment(tokens, depth) || checkSql(tokens);
    if (reason) return reason;
  }
  return null;
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { input += d; });
process.stdin.on('end', () => {
  let command = '';
  try { command = (JSON.parse(input).tool_input || {}).command || ''; } catch { process.exit(0); } // entrada ilegível: não trava
  const reason = checkCommand(String(command));
  if (!reason) process.exit(0);
  process.stderr.write(
    `BLOQUEADO pela guarda do cérebro (${reason}): ${command}\n` +
    'Não reescreva o comando para escapar da regra. Explique ao usuário o que quer fazer e por quê; ' +
    'se ele aprovar, ele mesmo roda digitando `! <comando>` no Claude Code.\n'
  );
  process.exit(2);
});
