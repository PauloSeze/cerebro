---
name: verificar-ambiente
description: Confere o computador do usuário e instala, com permissão, o que o cérebro e as trilhas precisam (git, Node, ffmpeg, Chrome, acesso ao GitHub) no Windows ou no Mac. Use na primeira sessão, antes de começar uma trilha, ou quando um comando falhar por programa ausente ("not found", "não é reconhecido").
---

# Verificar o ambiente

Você confere o que falta, explica em português por que cada coisa é necessária e instala só depois de o usuário
aprovar. Pronto quando todos os itens da tabela estiverem ok ou com o motivo de não estarem.

## Itens

| Item | Para quê | Como conferir | Windows (winget) | Mac (Homebrew) |
|---|---|---|---|---|
| Git | guardar o histórico do cérebro e enviar ao GitHub | `git --version` | `winget install --id Git.Git -e` | `xcode-select --install` |
| Identidade no git | todo registro do cérebro leva seu nome | `git config --global user.name` e `user.email` | `git config --global user.name "Nome"` e `user.email "email"` | igual |
| Node.js LTS (22 ou mais) | roda as proteções do cérebro (`.claude/hooks/`) e as ferramentas de vídeo | `node --version` | `winget install --id OpenJS.NodeJS.LTS -e` | `brew install node` |
| ffmpeg | cortar, juntar e legendar vídeo e áudio | `ffmpeg -version` | `winget install --id Gyan.FFmpeg -e` | `brew install ffmpeg` |
| Google Chrome | as ferramentas de vídeo desenham os quadros num navegador | Windows: existe `%ProgramFiles%\Google\Chrome\Application\chrome.exe`; Mac: existe `/Applications/Google Chrome.app` | `winget install --id Google.Chrome -e` | `brew install --cask google-chrome` |
| whisper.cpp (só trilha de vídeo) | transcrever a fala para a legenda, no seu computador e sem custo | `whisper-cli --help` | baixar `whisper-bin-x64.zip` e extrair em `%USERPROFILE%\.cerebro\whisper\` (ver "whisper.cpp" abaixo) | `brew install whisper-cpp` |
| Excel para Windows (opcional, só Memorial GD) | a planilha oficial da Energisa é um aplicativo com macros que só roda no Excel para Windows | `powershell -NoProfile -Command "Test-Path Registry::HKEY_CLASSES_ROOT\Excel.Application"` devolve `True` | não instale: é programa pago. Sem ele, a `fv-memorial` entrega a folha para digitar no portal | igual (no Mac a planilha não roda) |
| Pacotes da trilha de vídeo | as ferramentas de `trilhas/video/` | existe `trilhas/video/node_modules` | `npm install` dentro de `trilhas/video` | igual |
| GitHub | o cérebro vai para um repositório seu, sozinho, a cada resposta | `git remote get-url origin` | ver "GitHub" abaixo | igual |

## Passos

1. **Sistema.** Descubra se é Windows ou Mac. No Windows, confira `winget --version`; sem ele, peça para instalar o
   "Instalador de Aplicativo" pela Microsoft Store. No Mac, confira `brew --version`; sem Homebrew, mostre o comando
   oficial de https://brew.sh e peça para o usuário rodar ele mesmo no Terminal, porque pede a senha do Mac.
2. **Conferir tudo** antes de instalar qualquer coisa. Mostre a tabela com ok / falta e, em cada falta, uma linha de
   por quê.
3. **Pedir uma permissão** para a lista do que falta, com o tempo estimado (uns 5 a 15 minutos no total). Instale um
   item por vez e confira de novo depois de cada um.
4. **GitHub.**
   - `origin` aponta para `github.com/PauloSeze/cerebro` ou não existe: o cérebro ainda não é um repositório dele.
     Guie: no site do GitHub, criar um repositório **privado** vazio (sem README), copiar o endereço; depois você roda
     `git remote set-url origin <endereço>` (ou `git remote add origin <endereço>`) e `git push -u origin main`.
   - Primeiro envio pede login. No Windows, o Git abre o navegador sozinho. No Mac, instale o GitHub CLI
     (`brew install gh`) e peça para o usuário rodar `! gh auth login` e depois `! gh auth setup-git`.
   - Pronto quando `git push` funciona sem erro.
5. **whisper.cpp no Windows** (só trilha de vídeo). A release marcada "Latest" no GitHub pode vir sem arquivos. Use a mais recente que
   tenha `whisper-bin-x64.zip` em "Assets" (hoje, a `b5454`:
   `https://github.com/ggml-org/whisper.cpp/releases/download/b5454/whisper-bin-x64.zip`). Baixe com
   `Invoke-WebRequest <link> -OutFile whisper.zip`, extraia com `Expand-Archive` e confira que `Release\whisper-cli.exe`
   existe dentro de `%USERPROFILE%\.cerebro\whisper\`.
6. **Fechar.** No Windows, programa recém-instalado só aparece num terminal novo: peça para fechar o terminal, abrir de
   novo na pasta do cérebro e rodar `claude`. Registre em `memoria/aprendizados.md` o que foi instalado e qualquer
   tropeço, com a data.

## Regras

- Instale só o que está na tabela ou o que uma trilha pedir explicitamente; nada além.
- Comando que pede senha de administrador ou interação: mostre o comando e peça para o usuário rodar ele mesmo,
  digitando `!` antes no Claude Code.
- Erro de instalação: diga o erro em uma linha e a alternativa (o instalador do site oficial do programa).
- Se o Claude Code mostrar "blocking because Git Bash wasn't found", o Git falta no Windows: instale o Git primeiro.
