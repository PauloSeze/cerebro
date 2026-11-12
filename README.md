# Cérebro: modelo para o Claude Code

Um repositório de instruções, direção e memória que o Claude Code lê toda vez que você abre a pasta. Você conversa em
português; ele te conhece, sabe para onde você está indo e anota tudo no lugar certo.

## Antes de começar: o que você precisa

- Computador com **Windows 10/11** ou **Mac** (macOS 13 ou mais novo).
- Assinatura **Claude Pro** (ou superior). O plano grátis não inclui o Claude Code.
- Conta no **GitHub** (grátis).
- Nenhuma outra conta paga.

## Em 7 dias

Um agente que te conhece, organiza a sua rotina e já entrega um trabalho seu. Uma tarefa curta por dia:

| Dia | Você sai com |
|---|---|
| 1 | um agente que sabe quem você é e para onde você vai: no "bom dia", ele te entrega as tarefas do dia |
| 2 | a cabeça leve: tudo que você precisava lembrar, anotado no lugar certo, sem abrir arquivo nenhum |
| 3 a 5 | uma entrega de verdade da sua trilha: um Reel pronto para postar, ou a conta de luz de um cliente lida, o sistema solar dimensionado e o memorial preenchido |
| 6 | o agente fazendo, do seu jeito, uma tarefa que você repete toda semana |
| 7 | a semana revisada e o próximo passo claro |

O desafio está em [`desafio.md`](desafio.md). Pergunte **"como estou no desafio?"** a qualquer hora: o agente confere o
que você já fez e mostra quanto falta. Nada se perde: tudo vai para o seu GitHub sozinho.

## Três passos

**1. Instalar o Git, o Node e o Claude Code** (uma vez só, uns 10 minutos)

No Windows, abra o **PowerShell** e rode, uma linha por vez:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
irm https://claude.ai/install.ps1 | iex
```

No Mac, abra o **Terminal**, rode `xcode-select --install` (instala o Git), baixe e instale o Node **LTS** em
<https://nodejs.org> e depois rode:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Se o `winget` perguntar sobre os termos das fontes, digite `Y` e Enter. Feche o terminal, abra de novo e confira com
`claude --version`. Se der erro, o guia oficial está em
<https://code.claude.com/docs/en/setup>.

**2. Baixar o seu cérebro**

No terminal, vá até a pasta onde quer guardar (por exemplo, `cd Documents`) e rode:

```bash
git clone https://github.com/PauloSeze/cerebro.git meu-cerebro
cd meu-cerebro
```

Na primeira sessão, o Claude te ajuda a criar um repositório **privado** seu no GitHub e passa a salvar lá. (Quem já
usa GitHub pode criar pelo botão **Use this template** e clonar o próprio repositório.)

**3. Abrir e dizer "me entrevista"**

Dentro da pasta, rode `claude`. Na primeira vez ele pede login no navegador (use a conta do Claude Pro) e pergunta se
você confia na pasta: responda que sim. Depois digite:

> me entrevista

Ele confere o seu computador (instala o que faltar, com a sua permissão), cria o seu repositório no GitHub e faz uma
entrevista de uns 15 minutos que preenche o seu perfil, o seu norte e o seu kit de marca. Esse é o dia 1 do desafio.

## Trilhas

Depois da base, escolha uma trilha. Cada uma tem o guia aula a aula na sua pasta.

- **[Engenharia fotovoltaica](trilhas/engenharia-fv/)**: ler a fatura de energia de um cliente e pré-dimensionar o
  sistema, só com o Claude e o PDF.
- **[Vídeo](trilhas/video/)**: editar um Reel da sua própria gravação, com legenda e o seu kit de marca, no seu
  computador.

## No dia a dia

Fale normalmente. Alguns exemplos:

| Você diz | O Claude faz |
|---|---|
| "preciso mandar o orçamento pra Ana até sexta" | anota em `rotina/tarefas.md` |
| "decidi não atender aos sábados" | registra em `memoria/decisoes.md`, com o porquê |
| "bom dia" | propõe até três tarefas para hoje, ligadas ao norte |
| "como estou no desafio?" | confere o que você já fez e mostra o dia em que você está |
| "revisão semanal" | revisa a semana com você e atualiza o norte |
| "me sabatina sobre esse plano" | faz perguntas até o plano ficar de pé |
| "estuda esse cérebro: <link>" | compara outro cérebro com o seu e propõe o que trazer |

Todas as skills e para que serve cada arquivo estão no [`ROUTER.md`](ROUTER.md).

## Como está organizado

```
CLAUDE.md        instruções do seu cérebro (carrega toda vez)
ROUTER.md        o que ler, e quando
norte.md         sua direção: objetivo, três focos, fila de ideias
desafio.md       o desafio de 7 dias e o seu progresso
perfil/          sobre você e o seu kit de marca
rotina/          caixa de entrada, tarefas, revisão semanal
memoria/         decisões e aprendizados
trilhas/         engenharia fotovoltaica e vídeo
.claude/         skills, proteções automáticas e estilo de resposta
```

## O seu estilo de resposta

O cérebro vem com o estilo **Direto** (`.claude/output-styles/direto.md`): resultado primeiro, passos numerados,
próxima ação no fim. Para fazer o seu, peça ao Claude: *"cria um estilo de resposta meu, a partir do Direto"*. Ele
copia o arquivo, ajusta com você (tamanho, tom, formato) e liga o novo em `.claude/settings.json` (campo
`outputStyle`). Para trocar na hora, use `/config` → Output style.

## Proteções automáticas

- **Guarda** (`.claude/hooks/guarda.js`): bloqueia comandos que apagam ou descartam trabalho (apagar a pasta inteira,
  `git reset --hard`, push forçado, `DROP TABLE`). Se você quiser mesmo rodar, digite `!` seguido do comando.
- **Sincronização** (`.claude/hooks/sincronizar.js`): ao abrir, traz o que mudou no GitHub; ao fim de cada resposta,
  salva e envia. Só funciona com um repositório seu; nunca envia para o modelo original.
- As duas rodam com o Node. Para desligar uma, peça ao Claude para tirar o bloco dela do `.claude/settings.json`.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| `claude` não é reconhecido | feche e abra o terminal; se continuar, veja o guia oficial do passo 1 |
| "blocking because Git Bash wasn't found" | falta o Git no Windows: rode a primeira linha do passo 1 e reabra |
| "hook error" ao rodar comandos | falta o Node: diga ao Claude "verifique meu ambiente" |
| aviso de conflito na sincronização | diga "resolve o conflito do git comigo"; nada se perde |

## Quer ir além

Versões novas deste modelo, o cérebro de engenharia completo e a trilha de vídeo avançada ficam na mentoria:
Saiba mais: <https://aulas.spx.ia.br>

## Licença e créditos

Textos sob CC BY-NC 4.0; código e skills de terceiros mantêm a licença original. Detalhes em
[`LICENSE.md`](LICENSE.md) e créditos em [`NOTICE.md`](NOTICE.md). Criado por Paulo Seze.
