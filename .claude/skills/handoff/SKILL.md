---
name: handoff
description: Fecha uma sessão de trabalho registrando o que foi feito, como foi verificado, as decisões e o próximo passo, para a próxima sessão continuar sem perder contexto. Use quando o usuário disser "handoff", "fecha a sessão", "registra o que rolou", "vou parar por hoje", ou ao encerrar um trabalho longo.
---

# Handoff

A próxima sessão (ou o usuário amanhã) precisa continuar sem perguntar nada. Regra-mãe: "existe" não é "funciona";
o bloco **Verificado** é obrigatório e honesto.

## Passos

1. **Situar.** Qual é o trabalho desta sessão e em que pasta. Leia o topo do `HANDOFF.md` dessa pasta, se existir,
   para não repetir. Sem `HANDOFF.md`, crie.
2. **Verificar de verdade.** Rode o que der para provar o resultado: abrir o arquivo gerado, rodar o script, tocar o
   vídeo, rodar os testes. Anote o resultado real. Sem como verificar, escreva "não verificado" e o motivo.
3. **Escrever** um bloco novo no **topo** do `HANDOFF.md` (nunca reescreva blocos antigos):

   ```
   ## AAAA-MM-DD — <título do que foi feito>

   **Feito:** <narrativa curta; arquivos criados ou mudados>
   **Verificado:** <evidência concreta, ou "não verificado: motivo">
   **Decisões:** <o que foi decidido e por quê; o que ficou de fora de propósito>
   **Atenção:** <tropeços, riscos, pendências>
   **Próximo passo:** <o que a próxima sessão pega primeiro>
   ```

4. **O que dura mais que a tarefa** vai para o cérebro: decisão em `memoria/decisoes.md`, erro resolvido em
   `memoria/aprendizados.md`, tarefa nova ou "esperando" em `rotina/tarefas.md`. Teste: isso importa daqui a três
   meses?
5. **Fechar** com duas linhas: onde o handoff foi gravado e o próximo passo.

## Regras

- Curto: a próxima sessão quer sinal, não redação.
- Correção de algo antigo vira bloco novo que aponta o antigo.
