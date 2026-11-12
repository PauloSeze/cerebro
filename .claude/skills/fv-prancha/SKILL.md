---
name: fv-prancha
description: Gera a prancha A1 (projeto elétrico em PDF vetorial, com unifilar, localização e carimbo) de um cliente pelo motor de engenharia, a partir do projeto.json do fv-memorial e do datasheet do kit; confere no motor antes de gastar prancha. Use quando o usuário pedir "prancha", "prancha A1", "projeto elétrico", "diagrama unifilar" ou "desenho do projeto".
---

# Prancha A1 pelo motor

A prancha sai do motor de engenharia, com a chave do usuário. Você junta os dados, a ferramenta confere no motor (de
graça) e, quando passa, gera o PDF. Cada geração gasta uma prancha da chave quando ela tem limite (a do bônus tem 3):
confira tudo antes de gerar.

Ferramenta: `node trilhas/engenharia-fv/ferramentas/prancha.mjs` (Node, igual no Windows e no Mac; nada a instalar).
Exemplo fictício: `exemplos/projeto-ficticio.json` + `exemplos/prancha-ficticia.json`.

## 0. A chave

Rode `prancha.mjs saldo`.

- **Saída 2 com "Sem chave do motor"**: diga ao usuário, em uma frase, que a prancha pronta sai do motor, que vem no
  bônus do Antecipa Black ou na mentoria (<https://aulas.spx.ia.br>). Sem insistir: siga com o que funciona sem o motor
  (o memorial, pela `fv-memorial`).
- **Chave recebida e ainda não guardada**: crie `trilhas/engenharia-fv/.env` com `MOTOR_URL=`, `MOTOR_CLIENT_ID=` e
  `MOTOR_CLIENT_SECRET=` (os três chegam juntos) e peça ao usuário para colar os valores **no arquivo**, não na
  conversa. O `.env` não vai
  para o GitHub (`.gitignore` da raiz). Se ele colar na conversa, grave no `.env`, avise que passou pelo chat e siga.
- **"Restam N de M pranchas · vale até ..."**: diga em uma linha e siga.

## 1. Juntar os dados (pergunte o que faltar; nunca invente)

O cliente e o kit vêm do `clientes/<apelido>/memorial/projeto.json` da `fv-memorial`; se ainda não existe, monte-o
primeiro (a prancha usa os mesmos dados). O que só o desenho usa vai em `clientes/<apelido>/memorial/prancha.json`,
no formato de `exemplos/prancha-ficticia.json`:

| Bloco | O que é | De onde |
|---|---|---|
| `modulo` | Voc, Isc, Vmp, Imp (STC) e coeficiente de Voc (%/°C) | datasheet do módulo. Dois modelos: `modulos` (lista, na ordem de `modules`) |
| `inversores` (um item por inversor) | corrente máx. de saída CA, tensão máx. CC, faixa MPPT, corrente e Isc máx. por MPPT, AFCI, DPS CC/CA integrados (`"TIPO II"`, `"TIPO III"` ou `null`), chave CC integrada | datasheet do inversor |
| `inversores[].mppts` | módulos em série de cada string, por MPPT: `[{"strings": [6]}, {"strings": [6]}]`. A soma tem de dar o total de módulos | o projeto do usuário |
| `protecoes` | DPS CA/CC externos, chave CC, string box, bitolas dos cabos CC, CA e terra | o projeto do usuário |
| `projeto.rt` | nome, título e registro do responsável técnico, como no conselho | o usuário |
| `projeto.trt_art` | número da TRT ou ART já emitida | o usuário. Sem número, a prancha sai com o campo errado e gasta uma geração: emita antes |
| `projeto.temperatura_min_c` | mínima do local, para o Voc máximo | padrão 5 °C |

A data do carimbo sai do mês corrente. Rede 220/380 V: ponha `"voltage_system": "220/380"` em `service_entrance` do
`projeto.json` (o padrão é 127/220).

## 2. Conferir (não gasta prancha)

```
node trilhas/engenharia-fv/ferramentas/prancha.mjs conferir trilhas/engenharia-fv/clientes/<apelido>/memorial/projeto.json
```

- **ERRO**: corrija o `projeto.json` ou o `prancha.json` com o usuário e confira de novo. Os do desenho são de
  engenharia (Voc da string acima da tensão máxima, Isc acima do MPPT, disjuntor CA menor que a corrente do inversor,
  sem DPS, sem AFCI): explique e deixe o usuário decidir a correção.
- **avisos**: leia os que importam em uma linha cada. Os de catálogo e de "Cliente/Procurador" são do memorial.

## 3. Gerar

Antes, diga ao usuário que vai gastar uma prancha da chave (quando ela tem limite) e confirme o número da TRT/ART.

```
node trilhas/engenharia-fv/ferramentas/prancha.mjs gerar trilhas/engenharia-fv/clientes/<apelido>/memorial/projeto.json --saida trilhas/engenharia-fv/clientes/<apelido>/prancha
```

- A ferramenta confere de novo, baixa o PDF e diz quantas pranchas restam. Nunca sobrescreve um PDF anterior.
- Leva de 1 a 5 minutos (o mapa da localização vem da internet): rode com tempo limite de 10 minutos e não
  interrompa. Saída 3 durante a geração: rode `saldo` antes de tentar de novo.
- `403 COTA_ESGOTADA` ou `CHAVE_VENCIDA`: repita a mensagem do motor em uma linha e não tente de novo.
- `FORA_DO_BONUS`: a chave do bônus só faz a prancha; o resto do motor é da mentoria.
- Erro corrigido depois de gerar: nova geração, nova prancha gasta. Por isso a conferência vem antes.

## 4. Entregar

Em até 5 linhas: onde está o PDF, kWp e kW, pranchas restantes, e que ela sai **sem assinatura e sem logo**: o
responsável técnico confere (strings, proteções, aterramento, padrão de entrada) e assina, e responde pelo projeto.
Próximo passo: juntar com o memorial e protocolar no portal da distribuidora.
