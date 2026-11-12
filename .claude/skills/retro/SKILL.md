---
name: retro
description: Retrospectiva de uma sessão do Claude Code que propõe mudanças no cérebro (instruções, checagens, ponteiros, skills), não no trabalho em si.
disable-model-invocation: true
argument-hint: "Qual sessão? (vazio = esta)"
metadata:
  origem: "mattpocock/skills (MIT), skill retro; traduzida e adaptada para o cérebro-modelo. Ver NOTICE.md."
---

O usuário pediu uma **retrospectiva**. Você propõe melhorias no **cérebro** para as próximas sessões saírem melhores.
O trabalho produzido na sessão fica fora.

## Passos

1. Chame a skill `writing-for-agents` para o guia de escrita.
2. Leia as fontes da sessão indicada; sem indicação, é a atual. Sessões antigas ficam em
   `~/.claude/projects/<pasta-do-projeto>/<id>.jsonl`; o `HANDOFF.md` da pasta também ajuda.
3. Procure candidatos de melhoria nestas categorias:
   - **Navegação**: o agente achou rápido o arquivo certo? Uma linha no `ROUTER.md` resolveria? *Use quando* a sessão
     demorou para achar uma informação.
   - **Checagens automáticas**: alguma checagem pegaria o erro que o agente cometeu? Leia antes o que já existe
     (`.claude/settings.json`, `.claude/hooks/`): checagem desligada ou quebrada é o achado. Erro mecânico (comando
     proibido, arquivo no lugar errado) vira hook; julgamento vira instrução.
   - **Instruções sempre carregadas**: há regra no `CLAUDE.md`, no `norte.md` ou no `perfil/sobre-mim.md` que deveria
     virar checagem automática ou nota apontada pelo `ROUTER.md`? *Use quando* esses arquivos crescem.
   - **Instrução inútil**: frase que não muda o comportamento do agente em relação ao padrão dele. Corta-se a frase
     inteira.
   - **Skill**: o usuário repetiu a mesma explicação em sessões diferentes? Vira skill (`writing-for-agents`).
   - **Acesso a informação**: faltou ao agente um dado crucial? Diga qual e onde deveria morar no cérebro.
4. Apresente os candidatos em ordem de gravidade, cada um com: o que aconteceu (com a evidência), a mudança proposta,
   o arquivo onde ela fica e o custo em minutos. Aplique só o que ele aprovar, e registre em `memoria/decisoes.md`.

## Onde cada coisa mora

- `CLAUDE.md` e os arquivos que ele importa: entram em toda sessão. Parcimônia; prefira ponteiros.
- `.claude/settings.json` e `.claude/hooks/`: regras mecânicas que valem sempre (guarda, sincronização).
- `.claude/skills/`: procedimento que se repete ou referência que só às vezes é necessária.
- `.claude/output-styles/`: forma das respostas.
- `memoria/`: fatos, decisões e aprendizados, apontados pelo `ROUTER.md`.
