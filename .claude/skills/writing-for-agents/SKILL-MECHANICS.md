# Mecânica de skills

O ramo de [`writing-for-agents`](SKILL.md) específico de skills: frontmatter, escolha de invocação e skills
roteadoras. O resto da escrita está no `SKILL.md`.

## Arquivo

`.claude/skills/<nome>/SKILL.md`, com frontmatter `name` (igual ao nome da pasta, sem acento) e `description`.
Material que só alguns casos usam vai em arquivos ao lado, apontados pelo `SKILL.md`. Skill de terceiros mantém o
crédito em `metadata.origem` e no `NOTICE.md`.

## Invocação

Duas escolhas, trocando as duas cargas:

- **Invocada pelo modelo**: tem `description`, então o agente aciona sozinho e outras skills alcançam. A pessoa
  continua podendo chamar pelo nome. A descrição fica sempre carregada: carga de contexto permanente em troca de ser
  encontrada. Escreva a descrição para o modelo, com os gatilhos de cada ramo.
- **Invocada pelo usuário**: `disable-model-invocation: true`. Só a pessoa digitando `/nome` aciona. Carga de contexto
  zero, mas a pessoa precisa lembrar que ela existe. A `description` vira resumo de uma linha para humanos.

Escolha invocação pelo modelo só quando o agente precisa achar a skill sozinho, ou outra skill precisa dela.

## Skills roteadoras

Quando as skills invocadas pelo usuário passam do que dá para lembrar, uma **skill roteadora** (invocada pelo usuário)
lista as outras e quando usar cada uma. Ela só sugere; não aciona as outras.
