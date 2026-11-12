#!/usr/bin/env node
// Sincroniza o cérebro com o GitHub: "entrada" (SessionStart) traz o que mudou no remoto;
// "saida" (Stop) commita o que a sessão escreveu, arquivo por arquivo, e envia.
// Só age se o repositório tiver remoto e esse remoto for do aluno (não o modelo original).
// Nunca derruba a sessão: qualquer erro termina com código 0. Nunca usa force push.
'use strict';
const { spawnSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
// Repositórios-modelo: quem clonou direto deles ainda não tem um repositório próprio.
const MODELOS = [/github\.com[/:]PauloSeze\/cerebro(-dev)?(\.git)?$/i, /\/cerebro-mentorados(\.git)?$/i];
// Nunca versionar, aconteça o que acontecer (o .gitignore já cobre; isto é o cinto de segurança).
const PROIBIDO = /(^|\/)(\.env(\..*)?|credenciais\/.*|.*\.(key|pem)|settings\.local\.json)$/i;

function git(args, timeout = 30000) {
  const r = spawnSync('git', ['-C', ROOT, ...args], {
    encoding: 'utf8', timeout, windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  return { ok: r.status === 0, out: ((r.stdout || '') + (r.stderr || '')).trim(), raw: r.stdout || '' };
}

function emit(obj) { process.stdout.write(JSON.stringify(obj)); }

// Devolve null se pode sincronizar, ou o motivo para não sincronizar.
function bloqueio() {
  if (!git(['rev-parse', '--is-inside-work-tree']).ok) return 'esta pasta não é um repositório git';
  const origin = git(['remote', 'get-url', 'origin']);
  if (!origin.ok) return 'o cérebro ainda não tem repositório no GitHub';
  if (MODELOS.some(re => re.test(origin.out))) return 'o cérebro ainda aponta para o repositório-modelo, não para um repositório seu';
  return null;
}

function entrada() {
  const motivo = bloqueio();
  if (motivo) {
    if (motivo.startsWith('esta pasta')) return;
    emit({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext:
      `Sincronização com o GitHub desligada: ${motivo}. Se o usuário ainda não fez, proponha a skill verificar-ambiente (item GitHub).` } });
    return;
  }
  if (!git(['fetch', '--quiet'], 30000).ok) return; // sem internet: segue sem avisar
  if (!git(['rev-parse', '--abbrev-ref', '@{u}']).ok) return;
  const antes = git(['rev-parse', 'HEAD']).out;
  const m = git(['merge', '--ff-only', '@{u}']);
  if (!m.ok) {
    emit({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext:
      'Sincronização: não deu para trazer as mudanças do GitHub (há alteração local no caminho ou o histórico divergiu). Avise o usuário e proponha resolver juntos, sem descartar nada.' } });
  } else if (git(['rev-parse', 'HEAD']).out !== antes) {
    emit({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext:
      'Sincronização: o cérebro recebeu mudanças do GitHub (feitas em outro computador ou no site).' } });
  }
}

function arquivosAlterados() {
  const st = git(['-c', 'core.quotepath=false', 'status', '--porcelain=v1', '-z', '-uall']);
  if (!st.ok) return [];
  const partes = st.raw.split('\0').filter(Boolean);
  const lista = [];
  for (let i = 0; i < partes.length; i++) {
    const xy = partes[i].slice(0, 2);
    lista.push(partes[i].slice(3));
    if (xy[0] === 'R' || xy[0] === 'C') i++; // pula o caminho de origem do renome
  }
  return lista.filter(p => p && !PROIBIDO.test(p.replace(/\\/g, '/')));
}

function saida() {
  if (bloqueio()) return;
  const avisos = [];
  const arquivos = arquivosAlterados();
  if (arquivos.length) {
    git(['add', '--', ...arquivos]);
    const n = arquivos.length;
    const c = git(['commit', '-q', '-m', `chore(cerebro): sessão do Claude Code (${n} arquivo${n > 1 ? 's' : ''})`]);
    if (!c.ok && /user\.(name|email)|identity/i.test(c.out)) {
      avisos.push('não consegui salvar no git: falta configurar nome e e-mail (peça "verifique meu ambiente")');
    }
  }
  const temUpstream = git(['rev-parse', '--abbrev-ref', '@{u}']).ok;
  const pendentes = temUpstream ? parseInt(git(['rev-list', '--count', '@{u}..HEAD']).out, 10) || 0 : 1;
  if (pendentes > 0) {
    let p = git(temUpstream ? ['push', '--quiet'] : ['push', '--quiet', '-u', 'origin', 'HEAD'], 60000);
    if (!p.ok && temUpstream) {
      // o remoto andou (outro computador, edição no site): junta e tenta de novo; conflito fica para humano
      git(['fetch', '--quiet']);
      if (git(['merge', '--no-edit', '@{u}']).ok) p = git(['push', '--quiet'], 60000);
      else { git(['merge', '--abort']); avisos.push('o GitHub tem mudanças que conflitam com as daqui; peça ao Claude para resolver junto com você'); }
    }
    if (!p.ok && !avisos.length) avisos.push('não consegui enviar ao GitHub (sem internet ou sem login); fica salvo no computador e vai na próxima vez');
  }
  if (avisos.length) emit({ systemMessage: 'Sincronização do cérebro: ' + avisos.join(' · ') });
}

try {
  if (process.argv[2] === 'entrada') entrada();
  else if (process.argv[2] === 'saida') saida();
} catch { /* nunca derruba a sessão */ }
process.exit(0);
