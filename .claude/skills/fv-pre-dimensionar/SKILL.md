---
name: fv-pre-dimensionar
description: Pré-dimensiona um sistema fotovoltaico on-grid a partir do histórico de consumo (normalmente lido pela fv-ler-fatura) e da cidade: kWp, quantidade de módulos, geração estimada mês a mês e inversor sugerido, com todas as premissas à mostra. É estimativa para conversa com o cliente, não projeto. Use quando o usuário pedir "dimensiona", "quantas placas", "quantos kWp", "pré-dimensionamento" ou "quanto esse sistema gera".
---

# Pré-dimensionar um sistema fotovoltaico

Do consumo ao tamanho do sistema, sem instalar nada: você busca a geração solar do local na internet (PVWatts ou
PVGIS, gratuitos) e faz as contas no terminal. Toda premissa aparece no resultado, para o engenheiro conferir.

## 1. Entradas

| Entrada | De onde | Padrão se o usuário não disser |
|---|---|---|
| Histórico de consumo (kWh/mês) | `leitura-fatura-*.md` do cliente em `trilhas/engenharia-fv/clientes/<apelido>/`; sem leitura, peça os 12 valores | — |
| Ligação (mono, bi, tri) | a leitura da fatura | pergunte |
| Cidade e UF | a leitura da fatura | pergunte |
| Potência do módulo | datasheet que o usuário usa | 600 W |
| Telhado: orientação e inclinação | o usuário | norte, 15° |
| Perdas do sistema | — | 14% (padrão do PVWatts: sujeira, cabos, temperatura, inversor, sombra leve) |
| Energia a compensar | — | média de 12 meses − custo de disponibilidade |

**Custo de disponibilidade:** o mínimo que a distribuidora cobra mesmo com geração: 30 kWh (mono), 50 (bi), 100 (tri).
Por isso o padrão é dimensionar para a média menos esse valor. Se o usuário preferir cobrir o consumo cheio ou deixar
folga para carga nova (ar-condicionado, carro elétrico), use o alvo dele e registre como premissa.

Com menos de 12 meses de histórico, use o que há e avise que a média pode não representar o ano (sazonalidade).

## 2. Coordenadas

Busque a cidade no OpenStreetMap (gratuito, sem cadastro):

- Windows (PowerShell): `curl.exe -s -A "cerebro-fv" "https://nominatim.openstreetmap.org/search?city=<cidade>&state=<UF>&country=Brasil&format=json&limit=1"`
- Mac: o mesmo comando com `curl`.

Use `lat` e `lon` com 2 casas. Se falhar, peça ao usuário o link do Google Maps da obra (as coordenadas estão nele).

## 3. Geração por kWp no local (tente nesta ordem)

Os comandos abaixo são do Windows (`curl.exe`); no Mac, use `curl`.

**A. PVWatts v8 (NREL).** Chave: a variável de ambiente `PVWATTS_API_KEY` do usuário, se existir (é grátis em
developer.nlr.gov/signup); senão `DEMO_KEY`, que tem poucas chamadas por hora. Azimute: norte = 0, leste = 90,
oeste = 270.

```
curl.exe -s "https://developer.nlr.gov/api/pvwatts/v8.json?api_key=DEMO_KEY&lat=<lat>&lon=<lon>&system_capacity=1&module_type=0&losses=14&array_type=1&tilt=15&azimuth=0&timeframe=monthly"
```

Use `outputs.ac_monthly` (12 valores, jan a dez, kWh por kWp instalado) e anote `station_info.solar_resource_file`.

**B. PVGIS (Comissão Europeia), sem chave.** Se o PVWatts der erro ou limite. Atenção: no PVGIS o azimute (`aspect`)
é norte = 180, leste = −90, oeste = 90.

```
curl.exe -s "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=<lat>&lon=<lon>&peakpower=1&loss=14&angle=15&aspect=180&outputformat=json"
```

Use `outputs.monthly.fixed[].E_m` (kWh por kWp, jan a dez).

**C. Sem internet:** peça a irradiação média (HSP, kWh/m²/dia) do local no CRESESB SunData e use
`geração por kWp no mês = HSP × dias do mês × 0,75` (0,75 = rendimento global). Diga que é a estimativa mais grosseira.

Telhado em duas águas (leste e oeste, por exemplo): busque as duas orientações e use a média dos dois vetores,
ponderada pela parte dos módulos em cada água.

## 4. Contas (no terminal, mostrando cada uma)

1. `média` = soma dos meses ÷ número de meses; `alvo` = média − disponibilidade.
2. `kWh/kWp·mês` = soma dos 12 valores de geração por kWp ÷ 12.
3. `kWp necessário` = alvo ÷ kWh/kWp·mês.
4. `módulos` = kWp necessário × 1000 ÷ potência do módulo, **arredondado para cima**; `kWp` = módulos × potência ÷ 1000.
   Se o arredondamento passar o alvo em mais de 10%, mostre também a opção com um módulo a menos e quanto ela cobre.
5. Geração mês a mês = kWp × geração por kWp de cada mês; média e total anual.
6. Cobertura = geração média ÷ alvo (e ÷ média de consumo).
7. Área de telhado ≈ módulos × área do módulo (padrão 2,6 m² para módulo de cerca de 600 W; use o datasheet se houver).

## 5. Inversor sugerido

- Potência CA: a menor potência comercial em que a relação CC/CA (kWp ÷ kW do inversor) fique **entre 1,0 e 1,3**.
  Potências comuns: 3; 3,6; 4; 5; 6; 8; 10; 12; 15; 20; 25; 30; 50; 75 kW. Relação acima de 1,3 só dentro do limite
  de sobrecarga do datasheet do fabricante; diga isso.
- Ligação monofásica pede inversor monofásico; bifásica, monofásico 220 V; trifásica, inversor trifásico ou
  monofásicos repartidos entre as fases (o desequilíbrio aceito é da norma da distribuidora: o projeto confere).
- Sistema pequeno ou telhado com sombra parcial: cite o microinversor como alternativa.
- Não indique marca nem preço: só potência e tipo. O equipamento real sai do kit que o engenheiro escolher.

## 6. Avisos que vão sempre no resultado

- **É pré-dimensionamento, não projeto.** O projeto confere sombreamento, estrutura do telhado, strings e faixa de MPPT,
  padrão de entrada, potência disponibilizada da UC, limites da norma da distribuidora (na Energisa, NDU 013),
  proteções e o registro Inmetro dos equipamentos. Quem assina é o responsável técnico.
- A geração é média de anos típicos; um ano real varia alguns por cento.
- Se a UC já tem compensação de geração, a leitura da fatura avisou: confirme com o cliente antes de somar sistema novo.

## 7. Entregar

Salve `trilhas/engenharia-fv/clientes/<apelido>/pre-dimensionamento.md` (modelo em
`trilhas/engenharia-fv/exemplos/exemplo-ficticio.md`) com: premissas (tabela, com a fonte da geração e as
coordenadas), contas, resultado (módulos, kWp, inversor, área), geração mês a mês ao lado do consumo do mesmo mês, e
os avisos. Na conversa, entregue em 5 linhas: kWp e módulos, inversor, geração média contra o alvo, a fonte usada e
o aviso de que é estimativa.
