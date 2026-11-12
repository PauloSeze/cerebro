---
name: loop-me
description: Sabatina para achar as tarefas repetidas do usuário e transformá-las em specs de automação que um agente consegue construir.
disable-model-invocation: true
argument-hint: "Uma rotina para desenhar, ou nada para sair procurando"
metadata:
  origem: "mattpocock/skills (MIT), skill loop-me; traduzida e adaptada para o cérebro-modelo. Ver NOTICE.md."
---

Rode uma sabatina cuja única saída são specs de **workflow**. Chame a skill `grilling` e use a disciplina dela (uma
rodada de perguntas por vez, recomendação em cada pergunta), apontada para o vocabulário e o objetivo abaixo. Crie,
edite e apague specs conforme a sabatina resolve as coisas.

## A lente do loop

Um **loop** é um padrão que se repete na vida do usuário: a semana, a manhã, uma atividade (responder orçamento,
conferir pagamento, publicar conteúdo, fechar o mês). Ver a vida como loops dentro de loops mostra o que é previsível,
e o previsível é bom de **delegar**. O que depende de lembrar ou de força de vontade falha; o que roda sozinho
funciona. Use a lente para achar loops que valem spec e proponha os que ele ainda não notou.

Um **workflow** é a spec de um loop, tornada real.

## Vocabulário

Use só quando o workflow pede, nunca como checklist. Um workflow não precisa de IA, de checkpoint nem de agenda, a
não ser que a sabatina mostre que precisa.

- **Gatilho**: o que dispara cada execução. Um **evento** (e-mail novo, arquivo novo numa pasta) ou uma **agenda**
  (toda segunda às 8h). Gatilho por evento costuma ser melhor.
- **Checkpoint**: ponto em que o usuário confere ou decide. Alguns workflows não têm nenhum.
- **Empurrar para a direita**: adiar o checkpoint o máximo possível, para o usuário ser chamado uma vez, no fim, com
  tudo pronto.
- **Resumo**: o que o checkpoint mostra. Curto e pronto para decidir (o que foi feito, por quê, onde está o
  material), nunca o rascunho cru. Velocidade de revisão é tudo.

## Definição de pronto

A spec está pronta quando um agente (o Claude Code, numa sessão futura) consegue construí-la sem fazer uma única
pergunta. Sabatine até lá. Antes de especificar, confira `rotina/loops/`: workflow que já existe vira ajuste, não spec
nova.

## Onde fica

- `rotina/loops/<nome>.md`: uma spec por workflow; é a fonte da verdade. Crie a pasta na primeira spec.
- `rotina/loops/NOTAS.md`: notas cruas sobre o mundo do usuário, as ferramentas e os canais que ele usa e os termos
  dele para tudo isso. Vazio ou ralo: entreviste-o sobre esse mundo antes de especificar. Leia antes
  `perfil/sobre-mim.md` e o `norte.md` para não perguntar o que já está escrito.
