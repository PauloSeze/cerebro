---
name: video-corte-longo
description: Molde de corte — acha os melhores trechos de um vídeo longo do próprio usuário (live, aula, palestra, podcast) e transforma um deles em Reel 9:16 com gancho, legenda e marca. Use depois da video-producao para "tira um corte dessa live", "faz Reels da minha aula".
---

# Corte de vídeo longo

Comandos a partir de `trilhas/video/`. Usa o mesmo molde do Reel (`moldes/reel/`). Só vídeo do próprio usuário ou com
licença que permita (cite a licença no `credito`); corte de vídeo de terceiros fica fora.

## Passos

1. **Busca rápida** (modelo leve, o vídeo inteiro):
   `node ferramentas/transcrever.mjs "<video>" projetos/<pasta>/busca --modelo base`
   Avise o tempo antes: num notebook comum, ~1 min de máquina para cada 10 a 15 min de vídeo.
2. **Ler `busca/texto.txt` inteiro** e propor de 2 a 3 cortes numa tabela (início–fim, gancho, por que segura):
   - a favor: história com desfecho, conflito ou virada, número, frase que dá para repetir, ensinamento completo;
   - contra: inspiração genérica ("acredite em você"), trecho que só faz sentido com o que veio antes, piada interna;
   - começa e termina em fim de frase; 60 a 90 s; pode abrir no momento mais forte e voltar ao contexto (dois
     trechos na ordem certa). Nunca emende meias frases nem tire fala do contexto.
   O usuário escolhe. "Escolhe você": fique com o de história com desfecho.
3. **Transcrição boa só do trecho** (os tempos continuam no relógio do vídeo original):
   `node ferramentas/transcrever.mjs "<video>" projetos/<pasta> --inicio <a - 2> --fim <b + 2>`
4. **Enquadramento:** tire 4 quadros espalhados pelo trecho
   (`ffmpeg -ss <t> -i "<video>" -frames:v 1 projetos/<pasta>/q<n>.jpg`) e olhe. Pessoa parada no mesmo lugar:
   `--centro` (0 a 1, onde está o rosto). Pessoa andando, duas pessoas, tela ou slide importante:
   `--enquadrar encaixe` (vídeo inteiro no meio, fundo desfocado). Palestra filmada com várias câmeras (plano aberto e
   fechado se alternando): encaixe.
5. **Limpar:** `node ferramentas/limpar.mjs "<video>" projetos/<pasta> --trechos <a-b[,c-d]> [--remover <ids>] [--centro …|--enquadrar encaixe]`.
   Palavra que não cabe inteira no trecho fica de fora: termine o trecho perto do começo da palavra seguinte, não
   no meio da última. Confira a última palavra de `palavras-limpo.json`.
   Corrija em `palavras-limpo.json` o `text` que a transcrição errou (nome próprio sempre). Frase truncada ou que a
   transcrição não entendeu: remova pelos ids, não adivinhe.
6. **Roteiro, montar, conferir, render e QA:** iguais à `video-reel-gravacao` passos 7 a 10. No encaixe, o gancho e
   os destaques ficam bem em `posicao: "topo"` e a legenda já cai abaixo do vídeo.
7. Os outros cortes propostos: anote em `rotina/entrada.md` ("cortes possíveis de <vídeo>: …") para a próxima sessão.
