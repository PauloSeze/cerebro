# Exemplo FICTÍCIO: leitura de fatura e pré-dimensionamento

> **Dados inventados.** Cliente, UC, leituras e histórico não existem. Só servem para mostrar o formato que as skills
> `fv-ler-fatura` e `fv-pre-dimensionar` entregam. A geração por kWp é a resposta real do PVWatts para o centro de
> Cuiabá/MT (consulta de 11/11/2026), e as tarifas são ilustrativas: confira as vigentes na sua fatura.

---

## Arquivo 1: `clientes/casa-exemplo/leitura-fatura-2026-10.md`

```markdown
---
apelido: casa-exemplo
distribuidora: Energisa MT
classe: B1 RESIDENCIAL
ligacao: bifasico
cidade_uf: Cuiabá/MT
mes_referencia: 2026-10
consumo_mes_kwh: 470
historico_kwh: {"2026-10": 470, "2026-09": 420, "2026-08": 380, "2026-07": 350, "2026-06": 360, "2026-05": 390,
                "2026-04": 430, "2026-03": 470, "2026-02": 455, "2026-01": 480, "2025-12": 515, "2025-11": 500}
media_12m_kwh: 435
meses_no_historico: 12
compensacao_gd: false
---
```

# Leitura da fatura: outubro de 2026 (FICTÍCIO)

| Campo | Lido |
|---|---|
| Distribuidora | Energisa MT |
| Titular · UC | FULANO DE EXEMPLO · 0.000.000.000-00 |
| Classe · ligação | B1 residencial · bifásico |
| Leituras | 10.250 → 10.720, K = 1, 31 dias |
| Consumo do mês | 470 kWh |
| Preço com tributos · tarifa sem tributos | R$ 1,194080 · R$ 0,899420 por kWh |
| Consumo (R$) | 561,22 |
| Bandeira amarela | 11,75 |
| Iluminação pública (CIP) | 38,50 |
| Outros itens | nenhum |
| Total a pagar | R$ 611,47 |
| Compensação de geração | não tem |

**Histórico (12 meses, kWh):** nov/25 500 · dez/25 515 · jan 480 · fev 455 · mar 470 · abr 430 · mai 390 · jun 360 ·
jul 350 · ago 380 · set 420 · out 470. Soma 5.220; média 435; mínimo 350 (jul); máximo 515 (dez).

**Conferências**

| # | Conta | Resultado |
|---|---|---|
| 1 | 470 × 1,194080 = 561,22 | bate com a linha de consumo |
| 2 | (10.720 − 10.250) × 1 = 470 | bate com o consumo medido |
| 3 | 561,22 + 11,75 + 38,50 = 611,47 | bate com o total |
| 4 | outubro no histórico = 470 | bate |

**Pontos de atenção:** nenhum. Consumo cai no meio do ano (inverno mais seco, menos ar-condicionado).

---

## Arquivo 2: `clientes/casa-exemplo/pre-dimensionamento.md`

# Pré-dimensionamento (FICTÍCIO)

> Estimativa para conversa com o cliente. **Não é projeto**: sombreamento, estrutura, strings, padrão de entrada,
> potência disponibilizada, norma da distribuidora e Inmetro ficam para o projeto do responsável técnico.

**Premissas**

| Premissa | Valor |
|---|---|
| Consumo médio (12 meses) | 435 kWh/mês |
| Custo de disponibilidade (bifásico) | 50 kWh/mês |
| Alvo de geração | 385 kWh/mês |
| Local | Cuiabá/MT, lat −15,60, lon −56,10 (OpenStreetMap) |
| Fonte da geração | PVWatts v8 (NREL), `DEMO_KEY` |
| Telhado | norte, 15° |
| Perdas | 14% |
| Módulo | 600 W, 2,6 m² |
| Geração por kWp | 1.533 kWh/ano · 127,8 kWh/mês |

**Contas**

1. kWp necessário = 385 ÷ 127,8 = 3,01 kWp
2. Módulos = 3,01 × 1000 ÷ 600 = 5,02 → **6 módulos** (3,6 kWp)
3. 6 módulos geram 460 kWh/mês = 119% do alvo (passa de 110%), então a opção com um a menos também vai:
   **5 módulos** (3,0 kWp) geram 383 kWh/mês = 99,6% do alvo.

**Resultado**

| | Opção A: 5 módulos | Opção B: 6 módulos |
|---|---|---|
| Potência | 3,0 kWp | 3,6 kWp |
| Geração média | 383 kWh/mês (4.600/ano) | 460 kWh/mês (5.519/ano) |
| Cobertura do alvo | 99,6% | 119% (folga para carga nova) |
| Inversor sugerido | 3 kW monofásico 220 V (CC/CA 1,0) | 3 kW monofásico 220 V (CC/CA 1,2) |
| Área de telhado | ≈ 13 m² | ≈ 16 m² |

**Geração mês a mês (kWh) ao lado do consumo**

| Mês | Jan | Fev | Mar | Abr | Mai | Jun | Jul | Ago | Set | Out | Nov | Dez |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Consumo | 480 | 455 | 470 | 430 | 390 | 360 | 350 | 380 | 420 | 470 | 500 | 515 |
| Opção A | 373 | 350 | 403 | 367 | 379 | 369 | 400 | 426 | 374 | 388 | 384 | 387 |
| Opção B | 447 | 419 | 484 | 440 | 455 | 443 | 480 | 512 | 449 | 466 | 460 | 464 |

**Avisos:** pré-dimensionamento, não projeto; geração de ano típico (o ano real varia alguns por cento); a escolha
entre A e B é do engenheiro com o cliente (B cobre o consumo cheio e deixa folga).
