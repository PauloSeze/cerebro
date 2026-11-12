# Roteador do cérebro

O que ler, e quando. `CLAUDE.md` já carrega o norte e o perfil em toda sessão; o resto só quando o assunto pedir.

| Preciso de | Vá para |
|---|---|
| direção, focos, fila de ideias | `norte.md` |
| desafio de 7 dias: dias, marcas, cartão | `desafio.md` |
| quem é o usuário, como ele trabalha | `perfil/sobre-mim.md` |
| kit de marca (cores, fontes, tom, logo) | `perfil/marca.md` |
| tarefas: hoje, agora, esperando, depois | `rotina/tarefas.md` |
| captura sem destino | `rotina/entrada.md` |
| roteiro e registro da revisão semanal | `rotina/revisao-semanal.md` |
| rotinas repetidas que viraram spec | `rotina/loops/` (nasce com a skill `loop-me`) |
| decisões já tomadas e o porquê | `memoria/decisoes.md` |
| erros resolvidos, jeitos que funcionam | `memoria/aprendizados.md` |
| trilha de engenharia fotovoltaica | `trilhas/engenharia-fv/` |
| trilha de vídeo | `trilhas/video/` |
| proteções automáticas (guarda e sincronização) | `.claude/settings.json` e `.claude/hooks/` |
| estilo das respostas | `.claude/output-styles/` |

## Skills da base

O usuário pede em português; você escolhe a skill.

| Skill | Quando |
|---|---|
| `verificar-ambiente` | primeira sessão, antes de uma trilha, ou quando algo "não está instalado" |
| `entrevista-perfil` | "me entrevista", ou cérebro com campos `___` |
| `desafio` | "como estou no desafio?", ou ao concluir a tarefa de um dia do desafio |
| `estudar-cerebro` | comparar outro cérebro ou repositório com este e trazer o que presta |
| `handoff` | fechar uma sessão de trabalho com o que foi feito e o próximo passo |
| `grilling` | "me sabatina", testar um plano ou decisão |
| `loop-me` | achar tarefas repetidas e transformá-las em spec de automação |
| `retro` | melhorar o próprio cérebro a partir do que aconteceu numa sessão |
| `writing-for-agents` | criar ou editar skill, `CLAUDE.md` ou estilo de resposta |

As skills das trilhas ficam na mesma pasta (`.claude/skills/`), com prefixo `fv-` e `video-`.
