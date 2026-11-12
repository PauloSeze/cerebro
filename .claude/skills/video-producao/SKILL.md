---
name: video-producao
description: Ponto de partida de todo pedido de vídeo — Reel, corte, legenda, explicativo, "edita esse vídeo", "faz um Reel disso". Carregar ANTES de qualquer outra skill de vídeo. Decide o tipo de peça e o molde, lê a marca do usuário, diz o tempo antes de começar e passa os portões de qualidade antes de mostrar.
---

# Produção de vídeo — o maestro

Promessa da trilha: **numa sessão, um Reel da gravação do usuário, editado, com legenda e a marca dele**, tudo no
computador dele, sem conta paga. Esta skill decide o caminho; as skills de molde executam. Regras de gosto em
`trilhas/video/gosto.md`: leia antes de decidir gancho, ritmo, legenda ou fecho.

## 1. Ambiente (uma vez por computador)

1. Confira `node -v` (22 ou mais), `ffmpeg -version` e `whisper-cli --help` (ou o executável em `~/.cerebro/whisper/`).
   Faltou algo: pare e use a skill `verificar-ambiente`. Nunca instale programa por conta própria.
2. Em `trilhas/video/`, se não existe `node_modules/`, rode `npm install` (instala o HyperFrames na versão travada).
3. Todo comando abaixo roda a partir de `trilhas/video/`. No Windows, os mesmos comandos funcionam no PowerShell;
   ponha caminho com espaço entre aspas.

## 2. Marca

Leia `perfil/marca.md`. O montador (`ferramentas/montar.mjs`) lê os rótulos sozinho; você só confere.
- Campos com `___` em cores ou fontes: diga em uma linha que o vídeo sai com cores neutras e ofereça preencher agora
  (são 5 perguntas: nome, @, cor principal, cor de destaque, fonte). Grave as respostas em `perfil/marca.md`.
- Fonte fora do Google Fonts não roda no render: proponha a mais parecida do Google Fonts.
- Chamada "comenta PALAVRA" no `marca.md`: avise uma vez (`gosto.md` §7) e proponha trocar por pedido de envio.
- Portão: o plano escrito traz "Marca: <nome>, cores <primária>/<destaque>, fonte <título>".

## 3. Tipo de peça → molde

| O usuário tem | Molde (skill) | Duração |
|---|---|---|
| Gravação dele falando (celular, webcam), até ~5 min | `video-reel-gravacao` | 30–60 s |
| Um vídeo longo dele (live, aula, palestra, podcast) | `video-corte-longo` | 60–90 s |
| Um assunto para explicar sem aparecer: grava só a voz | `video-explicativo` | 30–50 s |
| Um vídeo já editado que só precisa de legenda | `video-legenda` | o do vídeo |

Pedido fora disso (voz clonada, avatar, cena gerada por IA, render na nuvem, vinheta de marca): diga com franqueza
que não é o nível 1 e que isso está na mentoria (`trilhas/video/README.md`, fim). Não improvise com ferramenta paga.

## 4. Antes de produzir (uma mensagem só)

1. **Tema:** "quem assiste já sabia disso?" Se sim, proponha o ângulo que surpreende (`gosto.md` §10).
2. **Proposta curta:** molde, gancho (até 8 palavras), o que fica e o que sai, 2 a 4 destaques, duração final e
   **o tempo previsto no computador dele** (transcrição de 1 min de fala com o modelo `small` leva de 1 a 4 min num
   notebook comum; o render de 60 s, de 3 a 10 min).
3. Efeito que custa tempo de máquina ou sai do molde: proponha antes, com o tempo junto. Nunca por conta própria.
4. "Me surpreende" ou "pode fazer" dispensa a pergunta, não a proposta: escreva-a e siga.

## 5. Produzir

Pasta do projeto: `trilhas/video/projetos/AAAA-MM-DD-<nome-curto>/`. Mídia nunca vai para o GitHub (o
`.gitignore` da trilha cuida; não mexa nele). Siga a skill do molde escolhido.

## 6. Portões antes de mostrar (todos)

1. `npx hyperframes check` sem erro, rodado na pasta do projeto. O aviso "HyperFrames skills out of date" no fim da
   saída não é erro: ignore e **não** rode `skills update`.
2. Antes do render, `npx hyperframes snapshot --at <gancho>,<cada destaque>,<fecho>` e **olhe cada imagem**:
   texto cortado na borda, legenda sobre a boca, destaque sobre o rosto, tela vazia.
3. Depois do render, `node ferramentas/qa.mjs <video.mp4>`: sem FALHA no relatório.
4. **Olhe** `qa/folha.jpg` e os quadros em tamanho cheio (não só a folha). Nada fora da caixa vermelha, nada na amarela.
5. Releia `gosto.md` §1, §2 e §7 contra o vídeo: gancho legível no 1º quadro, nada parado mais de ~3 s, uma chamada
   só, sem "comenta PALAVRA".
6. Se ainda parece "texto e animação simples", não entregue como pronto: diga o que falta.

## 7. Entregar e registrar

- Responda com: caminho do MP4, o que tem em cada trecho (gancho, destaques, fecho), as escolhas feitas sem
  perguntar e o resultado do QA. Sugira a legenda do post (sem hashtag, sem "comenta PALAVRA").
- Música: o vídeo sai sem trilha de propósito; a música se escolhe no próprio Instagram, baixa, na hora de postar.
- Comentário do usuário sobre o vídeo é aprendizado: anote em `memoria/aprendizados.md` ("vídeo: <o que ele
  gostou ou não>") e aplique no próximo. Refaça só se ele pedir. "Tá bom" de quem cansou não é aprovação.
- Molde que funcionou com ajuste (cor, posição, tamanho): o ajuste vai para o `roteiro.json` do projeto e, se valer
  sempre, para `perfil/marca.md`.
