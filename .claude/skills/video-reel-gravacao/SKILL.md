---
name: video-reel-gravacao
description: Molde de Reel a partir da gravação do usuário falando (celular ou webcam) — corta pausas e hesitações, enquadra em 9:16, gancho escrito, legenda palavra a palavra, 2 a 4 destaques e fecho com a marca dele. Use depois da video-producao quando o pedido for "faz um Reel dessa gravação", "edita esse vídeo meu".
---

# Reel de gravação própria

Comandos a partir de `trilhas/video/`. Molde em `moldes/reel/` (roteiro de exemplo em `roteiro.exemplo.json`).

## Passos

1. **Pasta** `projetos/AAAA-MM-DD-<nome>/`. Use o caminho do vídeo do usuário, sem copiar.
2. **Transcrever:** `node ferramentas/transcrever.mjs "<video>" projetos/<pasta>`.
3. **Ler tudo** (`texto.txt`) e decidir, por escrito, na proposta da `video-producao` §4:
   - o gancho: a frase mais forte com número, nome ou contraste. Se ela não está no começo, abra com ela (use
     `--trechos` na ordem: primeiro o gancho, depois o resto);
   - o que sai: hesitação ("é…", "tipo"), frase repetida (fica a tomada mais limpa), começo antes de engrenar,
     despedida longa. Liste os ids (`w12-w15`);
   - se passar de ~60 s e o conteúdo não sustentar, o que mais sai. Se sustentar, pergunte antes de espremer.
4. **Enquadramento:** gravação em pé (9:16) não precisa de nada. Deitada: tire um quadro
   (`ffmpeg -ss 3 -i "<video>" -frames:v 1 projetos/<pasta>/bruto.jpg`), olhe onde está o rosto e escolha
   `--centro` (0 a 1) ou `--enquadrar encaixe` se houver mais de uma pessoa ou tela importante.
5. **Limpar:** `node ferramentas/limpar.mjs "<video>" projetos/<pasta> --remover <ids> [--trechos …] [--centro …]`.
   Gera `limpo.mp4` (voz em −14 LUFS), `palavras-limpo.json` e `cortes.json`.
6. **Revisar a legenda:** corrija em `palavras-limpo.json` só o `text` errado (nome, número, termo). Nunca o sentido.
7. **Roteiro** `roteiro.json` (copie `moldes/reel/roteiro.exemplo.json`):
   - `gancho.texto` até 8 palavras, a palavra-chave entre `*asteriscos*`; `ate` = segundos na tela (~2,5–3);
     `posicao: "baixo"` se o rosto ocupa o topo do quadro;
   - `destaques`: 2 a 4, só número, comparação ou palavra-chave **dita** naquele momento; `em` = id da palavra em
     `palavras-limpo.json` onde ele acende; `tipo` `numero` (`valor`, `prefixo`, `sufixo`, `rotulo`) ou `frase`
     (`texto`, 1 a 4 palavras); pelo menos 8 s entre eles;
   - `fecho.cta`: uma chamada (envio, pergunta aberta ou "link no perfil"); sem ela, vale a do `marca.md`.
8. **Montar e conferir:** `node ferramentas/montar.mjs projetos/<pasta>` (leia os avisos) → na pasta do projeto,
   `npx hyperframes check` → `npx hyperframes snapshot --at <0.5>,<cada destaque + 0.6>,<fecho + 1.5>` e olhe as
   imagens (a folha fica em `.hyperframes/artifacts/snapshots/<id>/contact-sheet.jpg`). Ajuste roteiro e monte de
   novo até passar.
   - O 1º quadro vira miniatura: rosto de frente, olhando para a câmera. Se ele está olhando para baixo ou se mexendo,
     comece o vídeo em outra frase.
   - Gancho sobre os olhos: `posicao: "baixo"`.
   - Avisos `line_unread` nas páginas da legenda são esperados (a legenda acompanha a fala). Erro, não.
9. **Render:** `npx hyperframes render --output renders/reel.mp4` (rascunho rápido: `--quality draft`).
10. **QA:** `node ferramentas/qa.mjs projetos/<pasta>/renders/reel.mp4 --quadros <gancho>,<destaque>,<fecho>` e os
    portões da `video-producao` §6. Entregue pela §7.

## O que o molde já faz sozinho

Aproximação seca e alternada (1× / 1,1×) em cada corte e em trechos de mais de 3,2 s sem evento; legenda some
durante gancho, destaque e fecho; efeito sonoro só nesses eventos (gerado no computador, sem licença de terceiros);
último quadro segurado 2,4 s sob a marca.
