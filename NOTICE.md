# Créditos

Este cérebro usa e adapta trabalho de terceiros. Cada item mantém a licença original; os avisos exigidos estão abaixo.

## Base

| O quê | Origem | Licença | O que foi feito |
|---|---|---|---|
| skills `grilling`, `loop-me`, `retro`, `writing-for-agents` | [mattpocock/skills](https://github.com/mattpocock/skills) | MIT | traduzidas para o português e adaptadas ao cérebro-modelo |
| guarda contra comando destrutivo (`.claude/hooks/guarda.js`) | ideia do `git-guardrails-claude-code`, em [mattpocock/skills](https://github.com/mattpocock/skills) | MIT | reescrita em Node, com regras em português |
| estilo de resposta `Direto` (`.claude/output-styles/direto.md`) | [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) | MIT | adaptado e traduzido |

<!-- As trilhas acrescentam aqui os créditos delas (seções "Trilha de engenharia" e "Trilha de vídeo"). -->

## Trilha de engenharia

| O quê | Origem | Licença | O que foi feito |
|---|---|---|---|
| planilha do Memorial GD ("Formulário de Orçamento de conexão de Geração Distribuída") | Energisa, publicada no site da distribuidora (Normas técnicas) | da Energisa | **não está neste repositório**: cada usuário baixa a sua no site. A skill `fv-memorial` só lê as listas da cópia do usuário e escreve nas células de entrada; o PDF e o XLSX saem da macro da própria planilha |
| ferramentas `trilhas/engenharia-fv/ferramentas/` | escritas para este cérebro | a do cérebro | sem biblioteca de terceiros: leitura do arquivo com o `zlib` do Node e Excel pelo PowerShell do Windows |

## Avisos de licença MIT

### mattpocock/skills

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### ayghri/i-have-adhd

```
MIT License

Copyright (c) 2026 Ayoub Ghriss

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```


## Trilha de vídeo

Nenhum código destes projetos foi copiado para este repositório; eles são instalados à parte ou serviram de inspiração.

- HyperFrames — HeyGen — Apache License 2.0 — https://github.com/heygen-com/hyperframes (instalado pelo npm)
- GSAP — Webflow — Standard No Charge License — https://gsap.com/standard-license (carregado no render)
- whisper.cpp — ggml-org — MIT — https://github.com/ggml-org/whisper.cpp (baixado pela `verificar-ambiente`)
- Modelos Whisper — OpenAI — MIT — https://github.com/openai/whisper (convertidos pelo projeto whisper.cpp)
- FFmpeg — LGPL/GPL — https://ffmpeg.org (instalado à parte)
- Inspiração de ofício: cinetic — Leonxlnx — MIT — https://github.com/Leonxlnx/cinetic
