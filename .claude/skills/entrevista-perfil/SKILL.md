---
name: entrevista-perfil
description: Entrevista curta que preenche o cérebro do usuário (perfil, norte, marca e CLAUDE.md). Use quando ele disser "me entrevista", "preencher meu perfil", "configurar meu cérebro", ou quando perfil/sobre-mim.md ou norte.md ainda tiverem campos ___.
---

# Entrevista de perfil

Você preenche o cérebro conversando. O usuário responde; você escreve. Meta: em uns 15 minutos, `perfil/sobre-mim.md`,
`norte.md`, `perfil/marca.md` e a seção "Regras do usuário" do `CLAUDE.md` sem nenhum `___` que ele saiba responder.

## Passos

1. **Situar.** Leia os quatro arquivos. Pule o que já está preenchido; a entrevista também serve para atualizar um
   pedaço só ("muda meu norte").
2. **Rodadas.** Até cinco perguntas por rodada, numeradas, cada uma com um exemplo curto de resposta. Ele pode
   responder tudo numa mensagem só, ou por áudio transcrito. Depois de cada rodada, grave na hora o que veio e
   confirme em uma linha.
   - **Rodada 1, você:** nome e como prefere ser chamado; cidade; o que faz e para quem; ferramentas do dia a dia;
     como prefere as respostas e o que o agente nunca deve fazer.
   - **Rodada 2, norte:** até quando (data de 1 a 6 meses); o que precisa ser verdade nessa data; como medir (1 a 3
     números); os três focos; o que fica de fora; o que costuma derrubar o plano.
   - **Rodada 3, marca** (só se ele vai fazer vídeo, post ou peça visual; pergunte antes): nome da marca e perfis;
     cores (aceite "azul-escuro" e converta para hexadecimal, mostrando o código); fontes (sugira duas do Google
     Fonts se ele não souber); tom em três palavras; onde está o logo. Logo existente: peça para ele copiar o arquivo
     para `perfil/arquivos/` e anote o caminho.
3. **Fechar lacunas.** Resposta vaga ("crescer", "melhorar") no objetivo ou nos focos: faça uma pergunta de volta até
   virar algo verificável ("crescer quanto, até quando?"). Campo que ele não sabe ainda: deixe `___` e diga que dá
   para voltar depois.
4. **Escrever o resto.** Troque o `___` do título do `CLAUDE.md` pelo nome dele. Em "Regras do usuário", ponha as
   preferências e proibições que ele citou, uma por linha, em forma de instrução positiva ("respostas curtas, com a
   próxima ação primeiro"). Em "Revisado em" do norte, ponha a data de hoje. Pergunte em que dia da semana ele quer a
   revisão semanal e anote em `rotina/revisao-semanal.md`.
5. **Mostrar.** Resuma em até oito linhas o que ficou escrito, arquivo por arquivo, e pergunte se algo está errado.

## Regras

- Uma conversa, não um formulário: aproveite o que ele já disse para não perguntar duas vezes.
- Nada de documento pessoal (CPF, endereço, telefone), senha ou dado de cliente nos arquivos.
- Escreva com a ferramenta de edição de arquivo, em UTF-8, com acentuação completa.
- Ao terminar, se `verificar-ambiente` ainda não rodou nesta pasta, ofereça rodar.
