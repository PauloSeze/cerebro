---
name: fv-ler-fatura
description: Lê a conta de luz (PDF ou foto) de um cliente de energia solar e devolve consumo, histórico de 12 meses, tarifa, bandeira, iluminação pública e itens da fatura, com conferência das contas. Feita e testada no layout da Energisa (DANF3E), grupo B; grupo A em versão resumida. Use quando o usuário mandar uma fatura de energia ou disser "lê essa conta", "analisa a fatura", "quanto esse cliente consome".
---

# Ler a fatura de energia

Você lê a fatura com a sua própria leitura de PDF e imagem (ferramenta Read). Não precisa instalar nada.
O resultado alimenta a skill `fv-pre-dimensionar`.

## 0. Antes de ler: onde fica o dado do cliente

Fatura tem nome, CPF, endereço e UC de outra pessoa (LGPD). Tudo do cliente fica em
`trilhas/engenharia-fv/clientes/<apelido>/`, pasta que o `.gitignore` da trilha tira do GitHub.

1. Peça um apelido curto para o cliente (`casa-joao`, `mercado-centro`), sem CPF nem UC no nome.
2. Confira que a pasta está fora do git: `git check-ignore trilhas/engenharia-fv/clientes/x` precisa devolver o
   caminho. Se não devolver (ou a pasta não for repositório git), avise e trabalhe só na conversa, sem salvar.
3. Se a fatura veio solta em outra pasta do cérebro, mova para a pasta do cliente.
4. Nunca escreva dado do cliente fora dessa pasta: nem em `memoria/`, `rotina/`, exemplos ou mensagens de commit.

## 1. Ler

- Leia o arquivo inteiro com Read, **sem** o parâmetro `pages` (a fatura é curta; `pages` exige um programa extra
  que o computador pode não ter). A da Energisa tem 2 páginas.
- Ilegível (foto cortada, borrada, escura) ou print do aplicativo em vez da fatura: diga o que faltou e peça o PDF.
  O PDF baixado no app ou no site da distribuidora é sempre o melhor.
- Outra distribuidora que não a Energisa: leia do mesmo jeito e avise que o layout não foi testado.
- **Nunca invente número.** Campo que não dá para ler fica "não lido", e você diz qual.

## 2. O que extrair (grupo B: residencial, rural, comercial em baixa tensão)

| Campo | Onde está na Energisa |
|---|---|
| Distribuidora e UF | cabeçalho |
| Titular, UC, endereço | quadro do cliente ("Número da UC") |
| Classe e subclasse | "Classificação" (ex.: B1 RESIDENCIAL, B2 RURAL, B3 COMERCIAL) |
| Ligação | "LIGAÇÃO": monofásico, bifásico ou trifásico |
| Mês de referência, vencimento, total a pagar | quadro "REF: MÊS / ANO" |
| Leituras e dias | "Datas de Leituras" e o quadro do medidor (leitura anterior, atual, constante K, consumo kWh) |
| Consumo do mês (kWh) | linha "Consumo em kWh" (some as faixas, se a fatura dividir) |
| Preço com tributos e tarifa sem tributos (R$/kWh) | colunas "Preço unit com tributos" e "Tarifa Unit" da linha de consumo |
| Bandeira (R$) | "Adic. B. Amarela" ou "Vermelha"; sem linha = verde |
| Iluminação pública, CIP (R$) | "Contrib de Ilum Pub" |
| Compensação de geração | linhas "Energia Atv Injetada" (kWh e R$, negativas), "Ajuste GDII", "Saldo Acumulado" na página 2 |
| Outros itens (R$, com sinal) | multa, juros, atualização monetária, parcelamento, bônus, créditos, serviços |
| Histórico (kWh) | tabela "CONSUMO DOS ÚLTIMOS 13 MESES", página 2 |
| Avisos | quadro "ATENÇÃO" (débito anterior, aviso de corte, "faturamento pela média") |

### Histórico: leia a tabela, não o texto

O texto escondido do PDF da Energisa às vezes embaralha a ordem do histórico: num teste, 3 de 13 meses saíram
trocados. Por isso:

1. Leia o histórico na **imagem** da tabela "CONSUMO DOS ÚLTIMOS 13 MESES" (página 2), linha a linha, mês ao lado
   do valor.
2. Confira: o mês de referência na tabela tem o mesmo kWh do consumo do mês; o maior e o menor valor batem com a
   maior e a menor barra do gráfico "CONSUMO FATURADO" da página 1.
3. Use os **12 meses mais recentes**, incluindo o mês de referência. Valor com `*` foi faturado pela média ou pelo
   mínimo: marque.
4. Menos de 12 meses (UC nova, imóvel recém-ocupado): diga quantos há. Isso vira aviso no pré-dimensionamento.

## 3. Conferência (faça as contas no terminal, não de cabeça)

Use o terminal para cada conta (PowerShell no Windows, `awk` no Mac) e mostre a conta feita.

| # | Conferência | Passa se |
|---|---|---|
| 1 | kWh do mês × preço com tributos = valor da linha de consumo | diferença ≤ R$ 1,00 |
| 2 | (leitura atual − leitura anterior) × constante K = consumo medido | igual (diferença: perda de ramal ou faturamento pela média, diga qual) |
| 3 | soma de todos os itens, com sinal = total a pagar | diferença ≤ R$ 1,00 |
| 4 | mês de referência no histórico = consumo do mês | igual |
| 5 | com compensação: kWh injetado × preço = valor da linha injetada | diferença ≤ R$ 1,00 |

Conferência que não passa não trava a leitura: diga qual, de quanto, e o provável motivo (item não lido, faixa
de consumo, desconto social, tarifa branca). Se for a 1 ou a 3, releia a fatura antes de concluir.

**Pontos que mudam o projeto, aponte sempre:**
- já tem compensação de geração (a UC já recebe crédito de usina; o histórico continua sendo o consumo medido);
- tarifa social, desconto social ou tarifa branca;
- mês muito fora da média (menos da metade ou mais de 1,5 vez): pergunte o motivo (férias, obra, ar-condicionado novo);
- débito anterior ou aviso de corte.

## 4. Grupo A (média tensão: A4, A3a, verde ou azul), versão resumida

Extraia: modalidade (verde/azul), demanda contratada e medida (ponta e fora de ponta, kW), consumo ponta e fora de
ponta (kWh), ultrapassagem, energia reativa excedente, CIP, total e o histórico da página 2 (ponta e fora de ponta
separados). Conferência: quantidade × preço = valor em cada linha, e a soma = total.
Avise: o pré-dimensionamento usa a soma de ponta e fora de ponta, mas projeto em grupo A (demanda, posto horário,
minigeração) é estudo de engenheiro, não sai desta trilha.

## 5. Entregar

Salve `trilhas/engenharia-fv/clientes/<apelido>/leitura-fatura-<AAAA-MM>.md` neste formato (modelo preenchido
com dados fictícios em `trilhas/engenharia-fv/exemplos/exemplo-ficticio.md`):

```markdown
---
apelido: casa-joao
distribuidora: Energisa MT
classe: B1 RESIDENCIAL
ligacao: bifasico
cidade_uf: Cidade/UF
mes_referencia: 2026-10
consumo_mes_kwh: 0
historico_kwh: {"2026-10": 0, "2026-09": 0}
media_12m_kwh: 0
meses_no_historico: 12
compensacao_gd: false
---
# Leitura da fatura (mês/ano)
(tabela dos campos lidos · histórico mês a mês · as conferências com a conta e o resultado · pontos de atenção · o que não foi lido)
```

Na conversa, responda curto: consumo do mês, média de 12 meses (mínimo e máximo), total da fatura, as conferências
(passou ou não) e os pontos de atenção. Termine oferecendo o próximo passo: "Quer o pré-dimensionamento?"
