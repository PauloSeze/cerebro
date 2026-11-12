# Trilha de vídeo — nível 1

**A promessa:** numa sessão, um Reel da sua gravação, editado, com legenda e a sua marca. Tudo no seu computador
(Windows 10/11 ou Mac), com o Claude Pro e nada mais: sem conta paga, sem mandar seu vídeo para lugar nenhum.

## O que você precisa

- O cérebro instalado e a skill `verificar-ambiente` rodada uma vez (ela instala Node, ffmpeg e o transcritor).
- `perfil/marca.md` preenchido: nome, @, duas cores, uma fonte do Google Fonts e, se tiver, o logo em PNG. A
  entrevista (`entrevista-perfil`) preenche com você em 5 minutos.
- Uma gravação sua falando, de 30 s a 5 min. Celular em pé, rosto na altura dos olhos, luz de frente, lugar
  silencioso. Não precisa sair perfeito: as pausas e os "é…" saem na edição.

## Passo a passo

1. Abra o Claude Code na pasta do cérebro e diga: **"faz um Reel desse vídeo: <caminho do arquivo>"** (ou arraste
   o arquivo para a conversa).
2. O agente transcreve no seu computador, lê tudo e te mostra **uma proposta**: o gancho, o que fica e o que sai,
   os destaques, a duração e quanto tempo de máquina vai levar. Responda "vai" ou o que mudar.
3. Ele corta as pausas, enquadra em 9:16, põe legenda palavra a palavra, os destaques e o fecho com a sua marca,
   confere quadro a quadro e renderiza.
4. Você recebe o caminho do MP4 e uma sugestão de legenda para o post. Assista no celular antes de postar.
5. Diga o que achou. O agente anota e o próximo sai mais com a sua cara.

Na primeira vez, conte uns 20 a 40 minutos (instalação, download do modelo de transcrição, um render). Depois,
de 10 a 20 minutos por Reel, quase tudo tempo de máquina.

## Os três moldes

| Você tem | Diga | O que sai |
|---|---|---|
| Uma gravação sua falando | "faz um Reel desse vídeo" | Reel de 30 a 60 s com gancho, legenda, destaques e marca |
| Um vídeo longo seu (live, aula, palestra) | "tira um corte dessa live" | 2 ou 3 cortes propostos; o escolhido vira Reel de 60 a 90 s |
| Um assunto para explicar sem aparecer | "quero explicar X em vídeo" | roteiro para você gravar só a voz; o vídeo sai em motion, na sua marca |

E o básico: **"põe legenda nesse vídeo"** num vídeo que você já editou.

## O que há aqui

- `gosto.md` — as regras de gosto que o agente segue: gancho, ritmo, legenda, zona segura, fecho, o que nunca fazer.
- `moldes/` — `reel/` (gravação e corte) e `explicativo/`, com um roteiro de exemplo cada.
- `ferramentas/` — os passos que o agente roda: `transcrever.mjs`, `limpar.mjs`, `montar.mjs`, `qa.mjs`.
- `projetos/` — onde cada vídeo seu ganha uma pasta. Vídeos e áudios **não** vão para o GitHub.
- As skills ficam em `.claude/skills/video-*`; a porta de entrada é a `video-producao`.

## Por que sai sem música

Música de terceiros derruba alcance e dá problema de direito autoral. Escolha o áudio no próprio Instagram, baixo,
na hora de postar.

## O que a mentoria acrescenta (nível 2)

O nível 1 garante o Reel da sua gravação. Na mentoria, o mesmo cérebro ganha:

- **render e transcrição na nuvem**, disparados do seu computador: vídeo longo e lote de cortes sem travar o PC;
- **voz** (narrador profissional ou a sua voz clonada, com o rótulo de IA que a Meta exige);
- **avatar** falando por você;
- **cenas geradas por IA** e filmes de marca sem fala, no padrão de anúncio;
- moldes novos a cada mês e revisão dos seus vídeos.

Saiba mais: <https://aulas.spx.ia.br>
