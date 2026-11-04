# Tráfego pago inicial — Endurance On

Rascunho para revisão, preparado em 3 de novembro de 2026. As campanhas abaixo ainda não foram criadas nem ativadas. O objetivo inicial é gerar pré-matrículas para a assessoria e acompanhar quantas viram alunos. As palavras são hipóteses de intenção; volume, CPC e concorrência precisam ser consultados na conta de anúncios. As páginas de destino desta etapa devem estar publicadas e verificadas antes da veiculação.

## Campanhas e palavras de partida

Configuração inicial: Rede de Pesquisa do Google, português, grupos por intenção e correspondências de frase/exata. Manter campanhas presenciais e online separadas. Começar pelas modalidades com vagas e capacidade de atendimento; se o orçamento não sustentar todas, concentrar o teste em uma modalidade antes de abrir novos grupos.

| Campanha | Geografia e destino final | Palavras iniciais |
| --- | --- | --- |
| `search_corrida_florianopolis` | Florianópolis, opção de localização por presença. `https://www.enduranceon.com.br/corrida` | `[assessoria de corrida florianópolis]`, `"assessoria de corrida florianópolis"`, `[treinador de corrida florianópolis]`, `"treino de corrida em grupo florianópolis"` |
| `search_triathlon_florianopolis` | Florianópolis, opção de localização por presença. `https://www.enduranceon.com.br/triathlon` | `[assessoria de triathlon florianópolis]`, `"treinador de triathlon florianópolis"`, `[assessoria de triatlo florianópolis]` |
| `search_assessoria_online` | Brasil; confirmar capacidade de atender outras regiões. `https://www.enduranceon.com.br/assessoria-online` | `[assessoria de corrida online]`, `"treinador de corrida online"`, `"planilha de corrida personalizada"`, `[assessoria de triathlon online]` |

Separar o grupo de corrida online do de triathlon online quando houver demanda suficiente, usando textos específicos. Para o início, a página online explica as duas modalidades. Incluir variações úteis encontradas nos termos de pesquisa; não abrir correspondência ampla só para aumentar tráfego.

Campanha de marca, se necessária, deve ter orçamento e relatório separados: `[endurance on]` e `"endurance on florianópolis"`, com destino à home. Ela atende demanda já existente e não deve mascarar o desempenho das campanhas de aquisição.

Negativas iniciais para revisar em cada campanha: `emprego`, `vaga de emprego`, `salário`, `faculdade`, `curso de treinador`, `grátis`, `gratuito`, `download`. Inspecionar termos de pesquisa duas vezes por semana no começo. Evitar negativas genéricas como `planilha`, `iniciante` ou `maratona`: elas podem descrever uma pessoa interessada em contratar. Excluir termos de marca das campanhas de aquisição se houver campanha de marca.

## Anúncios responsivos de pesquisa (RSA)

Um RSA por grupo é suficiente para iniciar a comparação entre intenções. Os títulos abaixo têm até 30 caracteres e as descrições até 90; contagens incluem espaços e acentos. Usar os três títulos comuns junto com os seis da modalidade. Evitar fixar todos os títulos em posições; qualquer combinação precisa continuar verdadeira.

Títulos comuns:

- Endurance On (12 caracteres)
- Conheça Nossos Treinadores (26 caracteres)
- Planos Para Sua Rotina (22 caracteres)

### Corrida em Florianópolis

Títulos:

- Assessoria de Corrida (21)
- Corrida em Florianópolis (24)
- Treino Com Seu Objetivo (23)
- Do Primeiro Km À Sua Prova (26)
- Treinos Com Acompanhamento (26)
- Treine Com A Endurance On (25)

Descrições:

- Planejamento individual e contato com o treinador. Conheça os planos de corrida da EON. (87)
- Corrida em Florianópolis. Treinos coletivos conforme a programação e o plano escolhido. (87)
- Comece, retome os treinos ou prepare sua próxima prova. Veja como funciona a assessoria. (88)

### Triathlon em Florianópolis

Títulos:

- Assessoria de Triathlon (23)
- Triathlon em Florianópolis (26)
- Natação, Bike e Corrida (23)
- Treinos Integrados (18)
- Seu Treinador Por Perto (23)
- Planeje Sua Próxima Prova (25)

Descrições:

- Natação, ciclismo e corrida em um planejamento integrado. Conheça os treinadores da EON. (88)
- Prepare sua próxima prova com acompanhamento. Consulte planos e treinos em Florianópolis. (89)
- Seu objetivo e sua rotina orientam o treinamento. Escolha seu coach e confira os planos. (88)

### Assessoria online

Títulos:

- Assessoria Esportiva Online (27)
- Treinador de Corrida Online (27)
- Seu Treino No Aplicativo (24)
- Acompanhamento À Distância (26)
- Corrida e Triathlon Online (26)
- Planejamento Individual (23)

Descrições:

- Receba treinos no aplicativo e mantenha contato com seu treinador, de onde você estiver. (88)
- Corrida e triathlon com planejamento individual. Conheça o acompanhamento online da EON. (88)
- Organize os treinos na sua rotina. Consulte planos, treinadores e condições atuais. (83)

Ativos adicionais sugeridos: links para a página da modalidade, perfis dos treinadores, treinos coletivos e contato. Cada destino deve acrescentar informação. Não anunciar desconto, vaga garantida, resposta imediata ou resultado esportivo prometido; os valores e disponibilidade vêm do catálogo vigente.

## Conversões e origem do contato

| Sinal | Uso na conta |
| --- | --- |
| `submit_lead_form` com `form_name=onboarding_assessoria` | Conversão principal inicial de pré-matrícula, após resposta de sucesso do servidor. Importar apenas esse filtro; não duplicar com uma segunda conversão pela página de agradecimento. |
| `submit_lead_form` com `form_name=contato_site` | Conversão secundária inicialmente. Separar do cadastro e acompanhar qualificação na operação antes de mudar seu papel nos lances. |
| `whatsapp_click` | Conversão secundária: abrir o WhatsApp não comprova conversa nem matrícula. |
| `form_start`, quando habilitado e validado no GA4 | Diagnóstico de abandono, sem tratá-lo como venda ou lead confirmado. Não depende do novo helper de atribuição. |
| Matrícula confirmada no EON Store | Indicador final para avaliar custo de aquisição. A integração/importação offline ainda deve ser implementada e validada; não está concluída por salvar UTMs no navegador. |

No GA4, conferir os eventos em tempo real/DebugView e configurar os eventos principais específicos. Vincular GA4 e Google Ads e verificar a importação na conta. Definir contagem como uma conversão por interação para o objetivo de lead. O evento no código, sozinho, não configura a conversão de anúncios. Testar a jornada com dados fictícios e um processo acordado de limpeza, sem registrar pessoas reais como teste.

Usar sufixo de URL final por campanha, com nome estável:

```text
utm_source=google&utm_medium=cpc&utm_campaign=search_corrida_florianopolis&utm_content={adgroupid}_{creative}&utm_term={keyword}
```

Trocar somente `utm_campaign` nas demais campanhas. Manter identificação automática do Google Ads habilitada. Conferir se parâmetros chegam à página, sobrevivem à navegação interna e aparecem no registro do formulário no EON Store. O armazenamento de identificadores como `gclid` e a importação offline exigem validação própria. Não colocar nome, telefone, e-mail ou CPF em UTMs ou eventos.

## Orçamento e critérios de decisão

Definir um teto mensal e um custo máximo aceitável por aluno antes de ativar. Não há base disponível para estimar CPC, CPL ou retorno. Usar a margem de contribuição e o prazo de retorno desejado:

- `CAC máximo` = parcela da margem esperada por aluno que a operação aceita investir na aquisição, dentro do prazo de retorno escolhido.
- `CPL máximo` = `CAC máximo × taxa de pré-matrícula para aluno`.
- Comparar investimento e novas matrículas da mesma origem/coorte, respeitando o tempo de decisão do aluno. Não contar renovação como novo aluno adquirido.

Começar com um limite de CPC e orçamento controlados enquanto se valida volume e qualidade; revisar estratégia de lances após observar conversões consistentes. A escolha final depende dos dados e opções disponíveis na conta. Não estabelecer uma meta de CPA com número inventado.

Na primeira semana, verificar diariamente destino, gasto, consultas acionadas e erros de conversão. Depois, comparar semanalmente pré-matrículas, contatos qualificados, custo por lead e matrículas por campanha. Só ampliar orçamento com origem preservada, capacidade de atendimento e evidência de qualidade. Planejar 4–6 semanas de teste, ajustando o tempo à amostra e ao ciclo de decisão; prazo decorrido sozinho não valida resultado.

## Verificações antes da ativação

1. Publicar e testar as três páginas e seus CTAs no celular; conferir catálogo, vagas, endereço final e redirecionamentos.
2. Validar UTMs, conversão de sucesso e ausência de conversões em erro; conferir configurações de privacidade/consentimento existentes e medição no GA4/Google Ads.
3. Definir modalidade prioritária, região presencial atendida, teto de gasto e responsável por responder leads.
4. Confirmar faturamento e acesso à conta, revisar anúncios e criar campanhas inicialmente pausadas; ativação e verba dependem da decisão do responsável pela operação.

Meta/Instagram fica para a etapa seguinte: vídeos curtos dos treinadores, rotina dos treinos e depoimentos autorizados direcionados à modalidade. Retargeting só após verificar público elegível e mensuração. A primeira rodada de Search ajuda a identificar quais intenções e páginas geram contatos úteis.
