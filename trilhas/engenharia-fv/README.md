# Trilha de engenharia FV

**A promessa:** da conta de luz ao Memorial GD da Energisa pronto para protocolar. Seu agente lê e confere a fatura,
pré-dimensiona o sistema com as premissas à mostra, preenche a planilha oficial do Memorial GD e entrega os dados da
TRT (ou ART) prontos para copiar.

Você precisa de: o cérebro instalado (README da raiz), Claude Pro e uma conta de luz em PDF. O PDF baixado no
aplicativo ou no site da distribuidora é o melhor; foto serve se estiver inteira e nítida. Para o memorial: a planilha
oficial, que você baixa grátis no site da Energisa. Nenhuma conta paga além do Claude, nenhum programa a mais.

## Passo a passo

1. **Separe uma fatura.** Pode ser a sua ou a de um cliente que autorizou. Vale qualquer distribuidora; o layout
   testado é o da Energisa.
2. **Abra o Claude Code na pasta do cérebro** e escreva: *"lê essa fatura"*, arrastando o PDF para a conversa (ou
   dizendo onde ele está).
3. **Dê um apelido ao cliente** quando o agente pedir (`casa-joao`). Ele cria `trilhas/engenharia-fv/clientes/casa-joao/`
   e guarda a fatura e as análises ali. Essa pasta **não vai para o GitHub**: dado de cliente fica só no seu
   computador.
4. **Confira a leitura.** O agente mostra consumo, histórico de 12 meses, tarifa, bandeira, iluminação pública e as
   contas de conferência (o consumo × preço bate? a soma dos itens bate com o total?). Se algo não bateu, ele diz o
   quê e por quê.
5. **Peça o pré-dimensionamento:** *"dimensiona"*. O agente busca a geração solar da cidade (PVWatts ou PVGIS,
   gratuitos), calcula kWp, módulos, geração mês a mês e o inversor sugerido. Se quiser trocar uma premissa (módulo de
   outra potência, telhado leste/oeste, folga para um ar-condicionado novo), é só dizer.
6. **Peça o memorial:** *"monta o memorial"*. O agente pede o que a fatura não tem (CPF e e-mail do titular, padrão de
   entrada, localização do padrão, relação de carga, o kit escolhido) e confere tudo contra a planilha oficial: listas,
   catálogo de equipamentos da Energisa, município, potências. No Windows com Excel, ele preenche a planilha aberta e
   você só confere tela a tela e clica no botão da própria planilha que gera o PDF e o XLSX do protocolo. No Mac ou
   sem Excel, você recebe a folha campo a campo para digitar nas telas do portal da Energisa.
7. **Copie a TRT.** Junto com o memorial vem `dados-trt.md`: contratante, endereço da obra, coordenadas, atividades e
   potência, na ordem do SINCETI (ou do CREA, para ART).
8. **Leia os avisos.** O agente prepara; quem assina responde pelo projeto (sombreamento, strings, proteções, padrão
   de entrada, norma da distribuidora, Inmetro).

Para ver o formato antes de usar: `exemplos/exemplo-ficticio.md` (leitura e pré-dimensionamento) e
`exemplos/projeto-ficticio.json` (os dados de um memorial). Tudo inventado.

Tempo: a primeira vez, uns 40 minutos do zero (baixar a planilha, juntar os dados do padrão e do kit). Depois, uns
15 minutos por cliente, quase todo o tempo conferindo as telas.

## Skills desta trilha

| Skill | O que faz |
|---|---|
| `fv-ler-fatura` | lê a fatura (PDF ou foto) e confere as contas; grupo B completo, grupo A resumido |
| `fv-pre-dimensionar` | do histórico ao kWp, módulos, geração e inversor, com premissas e avisos |
| `fv-memorial` | confere o projeto contra a planilha oficial do Memorial GD da Energisa, preenche no Excel e entrega a folha da TRT |
| `fv-prancha` | gera a prancha A1 em PDF pelo motor de engenharia (precisa da chave do motor: bônus do Antecipa Black ou mentoria) |

Opcional: o PVWatts funciona com a chave pública de demonstração, que tem poucas consultas por hora. Se for usar
muito, crie a sua chave grátis em developer.nlr.gov/signup e peça ao agente para guardá-la como variável de ambiente
`PVWATTS_API_KEY` (nunca dentro do cérebro).

## Na mentoria

O que está aqui você monta e roda no seu computador. Na mentoria **Projeto FV com IA**, o seu agente ganha o motor
que já roda num escritório de engenharia de verdade:

- **prancha A1** em PDF vetorial, com os seus dados de responsável técnico no carimbo;
- **memorial em PDF e XLSX sem abrir o Excel**, gerado direto do seu agente, em qualquer computador;
- **TRT ou ART preenchida** com o seu login: você confere e confirma;
- **pasta do protocolo** e a lista de conferência antes de assinar.

Saiba mais: <https://aulas.spx.ia.br>
