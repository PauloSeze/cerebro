---
name: grilling
description: Sabatina implacável sobre um plano, decisão ou ideia, em rodadas de perguntas com resposta recomendada. Use quando o usuário quiser testar o próprio raciocínio ou disser "me sabatina", "fura esse plano", "me entrevista sobre isso", ou quando outra skill pedir a sabatina.
metadata:
  origem: "mattpocock/skills (MIT), skill grilling; traduzida e adaptada para o cérebro-modelo. Ver NOTICE.md."
---

Entreviste o usuário até chegarem a um **entendimento comum**. Trate o assunto como uma **árvore de decisões**: cada
decisão abre as que dependem dela.

## Rodadas

Trabalhe a árvore em **rodadas**. A **fronteira** é toda decisão cujos pré-requisitos já estão resolvidos: as
perguntas que dá para fazer *agora* sem adivinhar resposta que ainda não veio. Faça a fronteira numa rodada, numere
as perguntas e dê a sua recomendação em cada uma. Depois espere as respostas.

```
**P1. <título>**: <a pergunta em até 3 linhas, com opções a), b), c) quando houver>
➡️ <recomendação em uma linha, com o porquê em meia linha>

**P2. <título>**: ...
➡️ ...

Responda pelo número: "1 sim, 2b, 3 não porque…"
```

- Redija cada pergunta para que **"sim" aceite a sua recomendação**.
- Curto: precisa de contexto? Uma frase e o caminho do arquivo, não o conteúdo inteiro.
- No máximo 5 perguntas por rodada, as que destravam mais decisões primeiro.

Cada resposta empurra a fronteira para fora. Recalcule e faça a próxima rodada. Pergunta que depende de outra ainda
aberta vai para uma rodada *depois*.

## Fato é do agente, decisão é do usuário

Buscar **fatos** é trabalho seu: quando uma pergunta depende de algo que está num arquivo, na internet ou numa
ferramenta, vá buscar (ou mande um subagente), sem perguntar ao usuário. Só esperam a busca as perguntas que
dependem dela.

As **decisões** são dele: ponha cada uma e espere. Nunca responda as próprias perguntas.

## Fim

A sabatina acaba quando a fronteira está vazia: todos os ramos visitados, nada assumido em silêncio. Feche com a lista
das decisões tomadas, uma linha cada, e grave em `memoria/decisoes.md` depois que ele confirmar. Não aja sobre elas até
ele confirmar que o entendimento é comum.
