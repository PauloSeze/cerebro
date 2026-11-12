---
name: video-legenda
description: Transcreve fala no computador do usuário (grátis, sem conta) e queima legenda palavra a palavra na marca dele. Use para "põe legenda nesse vídeo", "legenda pra esse Reel", e como passo de transcrição dos outros moldes de vídeo. Passe antes pela video-producao.
---

# Legenda sem custo

Transcrição local com whisper.cpp (modelo `small`, português), tempo por palavra, legenda queimada pelo molde
`reel` com `fecho: false`. Nada sai do computador, nada é pago. Comandos a partir de `trilhas/video/`.

## Passos

1. Pasta: `projetos/AAAA-MM-DD-<nome>/`. Não copie o vídeo para lá se ele for grande: use o caminho dele.
2. Transcrever:
   `node ferramentas/transcrever.mjs "<video>" projetos/<pasta>`
   - Gera `palavras.json` e `texto.txt`. Na 1ª vez baixa o modelo (~470 MB) para `~/.cerebro/whisper/`.
   - Outro idioma: `--idioma en`. Áudio ruim ou com música: `--modelo medium` (mais lento).
3. Nível do som e 9:16, sem cortar nada:
   `node ferramentas/limpar.mjs "<video>" projetos/<pasta> --inteiro`
   (vídeo deitado: acrescente `--enquadrar encaixe`, ou `--centro 0.4` depois de olhar onde está o rosto).
4. **Revise o texto antes de queimar.** Leia `texto.txt` inteiro. Em `palavras-limpo.json`, corrija só o campo
   `text` do que a transcrição errou: nome próprio, marca, número ("1.000", não "mil" se ele disse o número),
   termo técnico. Nunca troque o que foi dito. Dúvida real sobre uma palavra: pergunte.
5. `roteiro.json` na pasta:
   ```json
   { "molde": "reel", "fecho": false, "zoom": 1, "titulo": "<nome>" }
   ```
   Se o usuário quiser gancho escrito no começo, acrescente `"gancho": { "texto": "até 8 palavras com *destaque*" }`.
6. `node ferramentas/montar.mjs projetos/<pasta>` → na pasta: `npx hyperframes check`, depois
   `npx hyperframes render --output renders/legendado.mp4` → `node ferramentas/qa.mjs projetos/<pasta>/renders/legendado.mp4`.
7. Portões e entrega: os da `video-producao` §6 e §7.

## Estilo (vem de `gosto.md` §3 e de `perfil/marca.md`)

2 a 3 palavras por vez, fonte de título da marca a 88 px, branca com contorno, a palavra dita na cor de destaque,
acima da faixa de botões do Instagram. "Caixa alta" no estilo de legenda do `marca.md` liga maiúsculas. Para mudar
o máximo de palavras: `"legenda": { "palavras": 2 }` no roteiro.

## Se travar

- `whisper-cli não encontrado`: skill `verificar-ambiente`.
- Transcrição muito lenta (mais de 5× a duração do vídeo): use `--modelo base` e revise o texto com mais cuidado.
- Legenda adiantada ou atrasada em tudo: confira se o vídeo tem som desde o começo; reporte o caso em
  `memoria/aprendizados.md`.
