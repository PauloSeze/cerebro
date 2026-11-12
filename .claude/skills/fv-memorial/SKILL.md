---
name: fv-memorial
description: Monta o Memorial GD da Energisa (formulário de orçamento de conexão de geração distribuída) de um cliente a partir da leitura da fatura, do pré-dimensionamento e dos dados do projeto, confere tudo contra a planilha oficial e preenche a planilha no Excel; entrega também a folha com os dados da TRT ou ART. Use quando o usuário pedir "memorial", "memorial GD", "preenche a planilha da Energisa", "formulário de orçamento de conexão", "dados da TRT" ou "protocolar o projeto".
---

# Memorial GD da Energisa

Você junta os dados do projeto num `projeto.json`, a ferramenta confere cada campo contra a planilha oficial que o
usuário baixou (listas, catálogo de equipamentos, municípios, coerência de potências) e, no Windows com Excel, escreve
os valores na planilha aberta. O PDF e o XLSX que vão para a Energisa saem do **botão da própria planilha**: ela é um
aplicativo com macros e apaga tudo quando é aberta, então nada é gravado no arquivo antes.

Ferramentas em `trilhas/engenharia-fv/ferramentas/` (Node, já instalado; nenhum pacote extra). Exemplo completo e
fictício: `trilhas/engenharia-fv/exemplos/projeto-ficticio.json`.

## 0. Dados do cliente e planilha

- Tudo do cliente fica em `trilhas/engenharia-fv/clientes/<apelido>/memorial/` (fora do git; regra da `fv-ler-fatura`).
- **A planilha é da Energisa e não vem no cérebro.** Peça ao usuário para baixar o "Formulário de Orçamento de
  conexão de Geração Distribuída" (arquivo `.xlsm`) no site da Energisa, na área de normas técnicas ou de geração
  distribuída (o endereço exato muda; se ele não achar, procurem juntos pelo nome do formulário). Salve em
  `trilhas/engenharia-fv/planilha-oficial/` (também fora do git) e nunca a copie para outro lugar do repositório.
- Windows: o arquivo baixado vem com as macros bloqueadas. Rode `powershell -NoProfile -Command "Unblock-File -LiteralPath '<arquivo.xlsm>'"`
  (é o mesmo que Propriedades → Desbloquear).
- Confira que é a planilha certa: `node trilhas/engenharia-fv/ferramentas/memorial.mjs listas --planilha <arquivo.xlsm> --uf <UF>`
  tem que mostrar a versão e as listas. Erro "aba não existe": arquivo errado.

## 1. Juntar os dados (pergunte o que faltar; nunca invente)

| Bloco do `projeto.json` | De onde | Padrão |
|---|---|---|
| `holder` nome, CPF/CNPJ, e-mail, celular | nome da fatura; o resto o usuário informa. O e-mail é **do titular** (a Energisa exige) | — |
| `consumer_unit` UC e classe | fatura (UC no formato novo, com pontos e traço). Ligação nova: `UC NOVA` | — |
| `address` logradouro, número, bairro, cidade, UF, CEP | fatura | sem número: `S/N` |
| `location` `lat`, `lon` do **padrão de entrada** e `area` | link do Google Maps da obra (as coordenadas estão no link); a ferramenta converte para UTM | `URBANO` |
| `service_entrance` tensão de atendimento, conexão, ramal, disjuntor geral (A), bitolas fase/neutro/terra (mm²) | vistoria ou foto do padrão; tensão e conexão também na fatura | ramal `AÉREO`, FP 0,92, 1 haste, 1 cabo por fase, nível `BAIXA` |
| `load.items` relação de carga: quantidade, equipamento, potência (W) | o usuário (ou uma lista típica que ele aprova) | fator de demanda 1 |
| `modules` quantidade, fabricante, modelo, potência (W), área de **um** módulo (m²) | pré-dimensionamento + datasheet do kit escolhido | — |
| `inverters` quantidade, fabricante, modelo, potência (kW), tensão nominal (V) | datasheet do inversor | — |
| `protection` DPS CA (kA), disjuntor CA (A); DPS e disjuntor CC se houver | projeto do usuário | — |
| `beneficiaries` UC, titular, CPF/CNPJ, endereço, % | o usuário (só se houver) | nenhuma |
| `compensation_mode` | deduzida: sem beneficiária = Compensação local; mesmo titular = Autoconsumo remoto; outro titular = Geração compartilhada | — |
| `expected_connection` mês e ano | o usuário | mês que vem |
| `requester` quem assina a solicitação (nome, telefone, e-mail) | normalmente o responsável técnico, como procurador do cliente | — |
| `checklist.documents` itens marcados no formulário | os documentos que ele vai anexar | 1, 1.2 (1.1 se CNPJ), 1.3, 1.4, 2.1, 2.3, 2.4, 2.5; 3.1 = NÃO; 3.4 marcada |

Salve em `clientes/<apelido>/memorial/projeto.json`, no formato do exemplo.

## 2. Montar e conferir

```
node trilhas/engenharia-fv/ferramentas/memorial.mjs montar trilhas/engenharia-fv/clientes/<apelido>/memorial/projeto.json --planilha <arquivo.xlsm> --saida trilhas/engenharia-fv/clientes/<apelido>/memorial
```

Grava `celulas.json`, `memorial.md` (a folha, campo a campo, na grafia que a planilha aceita) e `dados-trt.md`.

- **ERRO**: corrija com o usuário e rode de novo. Não siga com erro.
- **Equipamento fora do catálogo** (comum: o catálogo da Energisa é antigo): ele vai como `OUTROS`/`OUTRO` e o modelo
  entra nas Observações, que é o caminho que a própria planilha oferece. Se a ferramenta listar modelos parecidos,
  pergunte se é um deles; se for, ponha no `projeto.json` o rótulo exato (`"254 - JINKO"`, `"1015 - JKM535M-72HL4-V"`).
  Para procurar: `memorial.mjs listas --planilha <arquivo> --uf MT --modulo "jinko 535"` (ou `--inversor`).
- **Avisos**: leia cada um para o usuário em uma linha. CC/CA fora de 1,0–1,35 e potência acima da disponibilizada
  são decisões de engenharia dele.

## 3. Preencher a planilha

**Windows com Excel instalado (o caminho que entrega PDF e XLSX oficiais):**

1. Conferência sem abrir nada na tela (a planilha não é alterada):
   `powershell -NoProfile -ExecutionPolicy Bypass -File trilhas/engenharia-fv/ferramentas/preencher-excel.ps1 -Celulas <pasta>/celulas.json -Arquivo <arquivo.xlsm>`
   Tem que sair "faltando (SAIDA!B17): 0", zero erro de fórmula e nenhum PROBLEMA. Se não, corrija o `projeto.json`.
2. Peça ao usuário: fechar outros arquivos do Excel, abrir a planilha com dois cliques, clicar em **Habilitar
   Conteúdo** (macros) e dar OK nas mensagens até a tela inicial. Ela começa vazia: é normal.
3. Com a planilha aberta: o mesmo comando **sem** `-Arquivo`. A ferramenta acha o Excel aberto, escreve tudo e abre a
   Solicitação preenchida.
4. O usuário confere tela a tela clicando em **Avançar/Validar**. Respostas às perguntas da planilha: "já possui GD
   ativo?" → Não (ampliação é outro caso, ver Limites); "incluir UCs para compartilhar?" → Sim só se houver
   beneficiárias. Na última tela (diagrama unifilar), o botão de **imprimir o memorial** pede onde salvar o XLSX:
   indique `clientes/<apelido>/memorial/`. O PDF abre sozinho e a planilha fecha o Excel no fim.
5. Ache o PDF `<TITULAR>_UC_<UC>.pdf` (na pasta escolhida ou em Documentos) e mova para a pasta do cliente.
   **Não renomeie** os dois arquivos: a Energisa pede o nome original.

**Mac, ou sem Excel:** a planilha só funciona no Excel para Windows (macros). Entregue a folha `memorial.md`: ela serve
para digitar na planilha num PC com Excel ou para preencher as telas do projeto GD no portal da Energisa, que a norma
aceita no lugar do PDF + XLSX (confira na NDU 013 vigente).

## 4. TRT ou ART

`dados-trt.md` tem os campos na ordem do portal (contratante, endereço da obra, coordenadas, atividades Projeto e
Execução de sistema fotovoltaico, quantidade em kW, observação). Valor do contrato, finalidade e datas ficam marcados
"você confere": pergunte, não suponha. Técnico: SINCETI (CFT/CRT). Engenheiro: ART no CREA do estado, com os mesmos
dados.

## 5. Limites (diga quando o caso cair aqui)

- Ampliação de sistema existente (aba GD EXISTENTE) e transformador de acoplamento ou exclusivo: o usuário preenche
  à mão na planilha.
- Assinaturas são dele (titular ou procurador e responsável técnico).
- O campo "Potência Máxima Disponibilizada" sai vazio na Energisa MT: é da planilha, não erro de preenchimento.
- O memorial não substitui o projeto: diagrama, proteções, strings, aterramento e Inmetro são do responsável técnico.

## 6. Entregar

Na conversa, em até 6 linhas: situação (pronto ou o que falta), kWp e kW, equipamentos fora do catálogo, onde estão o
PDF e o XLSX (ou a folha), o `dados-trt.md` e o próximo passo (protocolar no portal da Energisa com os documentos que a
planilha lista no fim).
