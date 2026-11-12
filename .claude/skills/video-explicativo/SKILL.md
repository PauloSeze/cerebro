---
name: video-explicativo
description: Molde de explicativo curto em motion, sem rosto — o usuário grava só a voz e o vídeo sai com cenas animadas na marca dele (título, número, lista, comparação, frase, fecho), legenda karaokê e efeitos presos ao movimento. Use depois da video-producao para "explica X num vídeo", "quero um vídeo sem aparecer".
---

# Explicativo em motion

Comandos a partir de `trilhas/video/`. Molde em `moldes/explicativo/` (roteiro de exemplo em `roteiro.exemplo.json`).
A voz é a do usuário: voz sintética ou clonada não é nível 1 (está na mentoria).

## Passos

1. **Roteiro falado primeiro** (você escreve, ele aprova):
   - um conceito só, com o porquê, a consequência e **um exemplo que se acompanha passo a passo**. Lista de tópicos
     narrada não é explicação;
   - 30 a 50 s: 80 a 130 palavras; gancho com número ou contraste na 1ª frase; uma chamada no fim
     (`gosto.md` §1, §7 e §10);
   - frases curtas, do jeito que ele fala (tom em `perfil/marca.md`).
2. **Gravação:** peça que ele grave a voz no celular ou no computador, lugar silencioso, celular a um palmo da boca,
   falando natural (não precisa ler palavra por palavra), e mande o arquivo (m4a, mp3, wav ou vídeo).
3. **Transcrever:** `node ferramentas/transcrever.mjs "<audio>" projetos/<pasta>`.
4. **Limpar a voz:** `node ferramentas/limpar.mjs "<audio>" projetos/<pasta> --so-audio [--remover <ids>]`
   → `limpo.wav` em −14 LUFS e `palavras-limpo.json`. Corrija o `text` que a transcrição errou.
5. **Cenas** em `roteiro.json` (copie `moldes/explicativo/roteiro.exemplo.json`). Cada cena começa numa palavra dita
   (`em`: id em `palavras-limpo.json`); a primeira começa em 0.
   | tipo | campos | quando |
   |---|---|---|
   | `titulo` | `texto` (palavra-chave entre `*`), `apoio` | gancho e abertura de bloco |
   | `numero` | `valor`, `prefixo`, `sufixo`, `rotulo` | todo número dito (com `%`, a barra enche até ele) |
   | `lista` | `titulo`, `itens: [{texto, em}]` | passos ou partes; cada item acende na palavra dele |
   | `versus` | `a: {rotulo, texto}`, `b: {…}`, `em_b` | errado × certo, antes × depois; o A é riscado quando o B entra |
   | `frase` | `texto` | a ideia central, 1 a 4 palavras |
   | `fecho` | `cta` | marca, @, chamada e o botão "Seguir" (entra sozinho no fim se faltar) |
   - Texto na tela = fala resumida em 1 a 4 palavras, nunca a frase inteira (`gosto.md` §4.3).
   - Cena de no máximo ~6 s; mais longa, divida. Algo muda a cada 1 a 3 s.
   - `fundo`: `escuro` (padrão), `claro` ou `cor`; alterne por bloco, corte seco na troca.
6. **Montar e conferir:** `node ferramentas/montar.mjs projetos/<pasta>` (leia os avisos) → na pasta,
   `npx hyperframes check` → `npx hyperframes snapshot --at <meio de cada cena>` e olhe cada imagem: texto cortado,
   sobreposição, região grande vazia.
7. **Render e QA:** na pasta, `npx hyperframes render --output renders/explicativo.mp4`; depois
   `node ferramentas/qa.mjs projetos/<pasta>/renders/explicativo.mp4`. Portões e entrega: `video-producao` §6 e §7.

## O que o molde já faz sozinho

Fundo vivo (grade de pontos derivando, forma da cor primária respirando), HUD com o nome da marca e o progresso por
cena, câmera aproximando devagar em cada cena, palavras subindo de dentro da linha, contador com barra, legenda
karaokê sobre placa, efeito sonoro em cada entrada (gerado no computador) e aviso quando passa de 6 efeitos em 10 s.
