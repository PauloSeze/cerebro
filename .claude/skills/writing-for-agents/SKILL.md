---
name: writing-for-agents
description: Como escrever documentos que um agente lê. Use ao criar ou editar skills, CLAUDE.md, ROUTER.md, norte, estilos de resposta ou qualquer instrução do cérebro.
metadata:
  origem: "mattpocock/skills (MIT), skill writing-for-agents; traduzida e condensada para o cérebro-modelo. Ver NOTICE.md."
---

Referência para escrever qualquer documento que um agente consome: uma skill, o `CLAUDE.md`, uma nota apontada pelo
`ROUTER.md`. A embalagem muda; a escrita não. As mesmas alavancas tornam cada um previsível: o agente segue o mesmo
_processo_ a cada execução.

Se o documento é uma skill, leia também [`SKILL-MECHANICS.md`](SKILL-MECHANICS.md) (frontmatter e invocação).

## Ponteiros

Um **ponteiro** é uma referência que fica no contexto do agente, nomeia um material fora dele e diz quando buscá-lo.
A descrição de uma skill é um ponteiro; uma linha do `ROUTER.md` também. A _redação_ do ponteiro decide quando e com
que confiança o agente busca o material. Material essencial atrás de ponteiro fraco é defeito: afie a redação antes de
colar o material inteiro no arquivo sempre carregado.

Um ponteiro diz o que é o material e lista os **ramos** (casos distintos) que devem acioná-lo. Cada palavra de um
ponteiro sempre carregado custa em todo turno:

- **A palavra-chave vem primeiro.**
- **Um gatilho por ramo.** Sinônimos do mesmo caso são um ramo escrito duas vezes; fique com um.
- **Corte o que o corpo já diz.**

## As duas cargas

- **Carga de contexto**: o custo do que está sempre carregado (`CLAUDE.md`, descrições de skill) na janela do agente.
- **Carga cognitiva**: o custo para a pessoa de lembrar o que existe e quando usar. Gaste onde o julgamento humano
  importa; tire onde não importa.

Material só alcançado por ponteiro escapa da carga de contexto, ao preço da linha do ponteiro.

## Hierarquia da informação

Um documento tem **passos** (o que o agente faz, em ordem) e **referência** (regras, definições, fatos consultados
quando preciso). A decisão central é em que degrau cada pedaço fica:

1. **Passo no arquivo**: o que o agente faz, em ordem.
2. **Referência no arquivo**: consultada quando preciso.
3. **Referência fora do arquivo**: em outro arquivo, alcançada por ponteiro.

Empurre de menos e o topo incha; empurre demais e esconde o que o agente precisa. Teste: o que todo caso usa fica no
arquivo; o que só alguns casos usam vai para trás de um ponteiro. Junte definição, regras e exceções de um mesmo
conceito sob o mesmo título. Documento longo demais dilui a atenção, mesmo com toda linha útil: divida por caso ou por
sequência.

## Passos e critério de pronto

Todo passo termina num **critério de pronto**: a condição que diz ao agente que acabou.

- **Clareza**: dá para distinguir pronto de não pronto? Critério vago ("entendimento alcançado") convida a terminar
  cedo. Afie o critério antes de qualquer outra coisa.
- **Exigência**: "toda tarefa do arquivo conferida" força mais trabalho que "produza uma lista".

Os melhores critérios são verificáveis e exaustivos.

## Palavras-chave

Uma **palavra-chave** é um conceito compacto que o modelo já conhece (_fronteira_, _rascunho_, _checkpoint_). Repetida
como palavra, não como frase, ela ancora um comportamento inteiro com poucos tokens. Procure trechos que repetem a
mesma ideia com frases diferentes e troque por uma palavra.

**Negação** atrapalha: proibir traz o comportamento proibido para o contexto. Escreva o **positivo** ("responda em
uma linha"). Proibição só como trava dura que não dá para dizer de outro jeito, e mesmo assim junto com o que fazer.

## Poda

- **Uma fonte da verdade** por significado: mudar o comportamento é editar um lugar só.
- O **ambiente** também é fonte (arquivos de configuração, pastas, `--help`). Documento que repete o ambiente é cópia
  que envelhece. Escreva o que o agente não acha olhando: a convenção não escrita, o porquê de uma escolha, a pegadinha.
- **Relevância**: cada linha ainda tem a ver com o que o documento faz? Sem poda, camadas velhas se acumulam.
- **Instrução inútil**: frase que o modelo já obedece por padrão só ocupa espaço. Teste: muda o comportamento em
  relação ao padrão? Se não, apague a frase inteira.
