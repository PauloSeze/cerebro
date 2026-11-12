---
name: desafio
description: Confere o desafio de 7 dias pelas provas nos arquivos do cérebro, marca os dias concluídos em desafio.md, mostra "N de 7" com a tarefa de hoje e, no fim, gera o cartão do desafio. Use quando o usuário perguntar "como estou no desafio?", disser "terminei o dia", "confere meu dia", ou logo depois de ele concluir a tarefa de um dia (entrevista, fatura lida, Reel pronto, skill criada, revisão semanal).
---

# Desafio de 7 dias

`desafio.md`, na raiz do cérebro, guarda o estado: os sete dias, as marcas, a trilha, a pergunta para o encontro e o
cartão. Esta skill confere as **provas**. Um dia vale quando a prova existe nos arquivos; "já fiz" sem prova é
pendência, e você diz o que falta.

## Passos

1. **Ler** `desafio.md`. "Começou em" com `___`: ponha a data de hoje. Trilha com `___` e prova de alguma trilha nos
   arquivos: anote `vídeo`, `engenharia` ou `as duas`.
2. **Conferir** cada dia ainda com `[ ]` pela tabela "Provas", na ordem. Dia com todas as provas: troque `[ ]` por
   `[x]` e acrescente ` Feito em AAAA-MM-DD.` no fim do item. Dia já marcado não se confere de novo. Pronto quando todo
   dia sem marca foi conferido.
3. **Mostrar** o progresso em uma linha, com o primeiro dia sem marca e o tempo dele:
   `Desafio: ▰▰▰▱▱▱▱ 3 de 7 · hoje: Dia 4, a primeira entrega (20 a 40 min)`
   Se o usuário disse que fez um dia que ficou sem marca, acrescente uma linha com a prova que falta e como chegar
   nela ("falta a conferência do Reel: peça 'confere o Reel'").
4. **Sete de sete:** monte o cartão (seção "Cartão").

## Provas

Ao ler os arquivos, ignore o que está dentro de `<!-- -->`: são exemplos fictícios do modelo. Campo com `___` é
campo vazio. Arquivo copiado de `exemplos/` ou marcado como FICTÍCIO não é prova: diga ao usuário que o dia vale com o
trabalho dele.

| Dia | Prova (todas precisam existir) |
|---|---|
| 1 | `perfil/sobre-mim.md` com Nome preenchido; `norte.md` com Objetivo e os três focos preenchidos; `git remote get-url origin` aponta para um repositório que não é `PauloSeze/cerebro`, e `git rev-parse '@{u}'` responde (já houve um envio) |
| 2 | `rotina/tarefas.md` com pelo menos 5 itens, somando todas as seções; `memoria/decisoes.md` com pelo menos uma entrada `## ` |
| 3 | **Vídeo:** `perfil/marca.md` com Primária, Destaque e Títulos preenchidos; `ffmpeg -version` responde; o transcritor responde (`whisper-cli --help` ou o executável em `~/.cerebro/whisper/`); existe `trilhas/video/node_modules/`. **Engenharia:** existe `trilhas/engenharia-fv/clientes/*/leitura-fatura-*.md` |
| 4 | **Vídeo:** existe `trilhas/video/projetos/*/renders/*.mp4` com `renders/qa/relatorio.txt` ao lado, sem linha começando com `FALHA`. **Engenharia:** existe `trilhas/engenharia-fv/clientes/*/pre-dimensionamento.md` |
| 5 | **Vídeo:** MP4 em `renders/` de pelo menos dois projetos diferentes de `trilhas/video/projetos/`, e uma entrada sobre vídeo em `memoria/aprendizados.md`. **Engenharia:** um arquivo com `memorial` no nome na pasta de um cliente (a skill `fv-memorial` gera) |
| 6 | uma especificação em `rotina/loops/` (o `NOTAS.md` não conta) e uma pasta em `.claude/skills/` fora da lista "Skills do modelo" |
| 7 | um registro `### AAAA-MM-DD` em `rotina/revisao-semanal.md` e a seção "Pergunta para o encontro ao vivo" do `desafio.md` preenchida |

- Dias 3 a 5 valem pela prova de qualquer uma das trilhas.
- Dia 7 com a revisão feita e sem pergunta: pergunte o que ele mais quer destravar a partir daqui, grave a resposta na
  seção e marque o dia.
- No PowerShell, `@{u}` vai entre aspas simples, como na tabela.

**Skills do modelo:** `entrevista-perfil`, `verificar-ambiente`, `estudar-cerebro`, `handoff`, `grilling`, `loop-me`,
`retro`, `writing-for-agents`, `desafio`, `fv-ler-fatura`, `fv-pre-dimensionar`, `fv-memorial`, `video-producao`,
`video-legenda`, `video-reel-gravacao`, `video-explicativo`, `video-corte-longo`.

## Cartão

Escreva na seção "Cartão do desafio" do `desafio.md`, no lugar do comentário, até seis linhas tiradas do cérebro:

1. A trilha e o que o agente faz por ele hoje (da rotina e das skills que ele usou).
2. A entrega da trilha, sem nome, cidade ou dado de cliente ("a conta de luz de um cliente lida, o sistema dimensionado
   e o memorial preenchido"; "dois vídeos prontos: um Reel e um explicativo").
3. A skill que ele criou: o nome e o que ela faz, em uma linha.
4. O que mudou na semana, nas palavras dele (do registro da revisão).
5. A pergunta para o encontro ao vivo.

Mostre o cartão e diga que é para levar ao encontro ao vivo. Mostre também o link do formulário que está na seção da
pergunta, para ele enviar a pergunta.

`desafio.md` vai para o GitHub: nele e no cartão, só o que ele mostraria a um colega (nada de documento, endereço,
telefone, família ou dado de cliente).
