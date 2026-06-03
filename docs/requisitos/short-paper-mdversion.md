# MODELAGEM DE BANCO DE DADOS APLICADA À ECONOMIA DO CUIDADO: Proposta de um sistema de gestão para a AM Consultoria

## DATABASE MODELING APPLIED TO THE CARE ECONOMY: Proposal for a management system for AM Consultoria

**Authors:**
*   Cássia Irene Serra Nascimento¹
*   Leonardo Ferreira Souza²
*   Melissa Mendes Wolff Ribeiro³
*   Felipe Gomes Barbosa⁴

**Affiliations:**
¹, ², ³ Graduanda(o) do 3º Período do Curso de Engenharia de Software do Centro Universitário Unidade de Ensino Superior Dom Bosco - UNDB.
*   E-mail (Nascimento): 002-029368@aluno.undb.edu.br
*   E-mail (Souza): 002-029373@aluno.undb.edu.br
*   E-mail (Ribeiro): 002-029377@aluno.undb.edu.br
⁴ Professor Mestre. Docente do Curso de Engenharia de Software do Centro Universitário Unidade de Ensino Superior Dom Bosco - UNDB.
*   E-mail (Barbosa): felipe.barbosa@undb.edu.br

---

### RESUMO

Propor um modelo de banco de dados relacional para a AM Consultoria, empresa fictícia especializada em gestão operacional de instituições da economia do cuidado, tomada como cenário simulado. Levantar os requisitos por meio de sessões estruturadas com um agente conversacional emulando o proprietário, cobrindo contratos com histórico de alterações, controle de visitas e projetos, acompanhamento de pendências e geração de faturamento. Construir um modelo com quinze entidades aplicando normalização, integridade referencial e versionamento por Slowly Changing Dimension Type 2, a partir de um processo iterativo que incluiu revisão do modelo lógico inicial. Implementar o esquema em PostgreSQL com migrations versionadas e validar os fluxos operacionais com quatorze consultas SQL e integração com backend em Python e interface frontend. Concluir que a estrutura proposta cobre os principais fluxos da consultoria, com destaque para o versionamento contratual e o indicador de saúde operacional por cliente, e que o modelo não contempla ainda cenários de múltiplos consultores nem foi validado com um usuário real.

**Palavras-chave:** Banco de dados relacional. Modelagem de dados. Sistema de gestão. Economia do cuidado.

---

### ABSTRACT

To propose a relational database model for AM Consultoria, a fictional consulting firm specializing in operational management for care economy institutions, treated as a simulated scenario. To elicit requirements through structured sessions with a conversational agent emulating the business owner, covering contract management with revision history, visit and project tracking, pending task management, and billing generation. To build a fifteen-entity model applying normalization, referential integrity, and Slowly Changing Dimension Type 2 versioning, through an iterative process that included revision of an initial logical model. To implement the schema in PostgreSQL with versioned migrations and validate operational flows using fourteen SQL queries and integration with a Python backend and web frontend. To conclude that the proposed structure covers the consultancy's core operational flows, highlighting contract versioning and the per-client operational health indicator, and that the model does not yet address multi-consultant scenarios or validation with an actual user.

**Keywords:** Relational database. Data modeling. Management system. Care economy.

---

### 1 INTRODUÇÃO

Segundo Sousa (2017), a economia do cuidado compreende o conjunto de atividades voltadas à satisfação de necessidades físicas ou psicológicas de terceiros, incluindo cuidado de crianças, jovens e pessoas dependentes, exercidas de forma remunerada ou não. Na prática, isso abrange clínicas de reabilitação, centros de apoio a pessoas com deficiência e organizações de assistência social, contextos que compartilham um desafio de gestão específico: a heterogeneidade dos serviços prestados dificulta a padronização dos registros e a produção de informações confiáveis a partir deles.

Instituições da economia do cuidado compartilham uma característica que complica a gestão operacional: a prestação de serviço é contínua, personalizada e sujeita a variações frequentes de escopo e condições contratuais. Diferente de setores com serviços padronizados, cada cliente tende a demandar combinações específicas de frequência, tipo de atendimento e forma de cobrança, o que dificulta a criação de registros uniformes e a consolidação de informações ao longo do tempo. Essa heterogeneidade torna os sistemas de informação especialmente relevantes nesse contexto: sem uma estrutura de dados capaz de acomodar variação sem perder rastreabilidade, qualquer tentativa de digitalização reproduz no sistema os mesmos problemas que existiam nos registros em papel.

A AM Consultoria é uma empresa fictícia que presta serviços de diagnóstico e melhoria organizacional a instituições desse setor. Suas operações envolvem visitas periódicas, projetos estruturados, contratos com variações ao longo da vigência e acompanhamento de pendências operacionais. No cenário simulado, todas essas atividades eram controladas de forma dispersa, em cadernos, mensagens de aplicativos e planilhas avulsas. O efeito prático era direto: cobranças sem registro formal, pendências acumuladas sem responsável definido e histórico de clientes impossível de reconstruir sem busca manual em múltiplas fontes. Resolver esse problema exige mais do que digitalizar registros: é necessário estruturá-los de forma que possam ser cruzados de maneira confiável.

A modelagem de banco de dados é a representação formal das entidades, atributos e relacionamentos de um domínio em estruturas persistentes e organizadas. Segundo Heuser (2022), esse processo se desdobra em três etapas: a modelagem conceitual, que captura requisitos independentemente de tecnologia; o modelo lógico, que os traduz para estruturas do paradigma relacional; e o modelo físico, que define como os dados serão armazenados em um SGBD específico. Para a AM Consultoria, esse processo partiu de um requisito central: fazer com que contratos, visitas e cobranças pudessem ser cruzados de forma confiável. A consistência desse cruzamento depende de dois mecanismos: normalização, que elimina dependências funcionais indevidas, e integridade referencial, que impede vínculos inconsistentes entre tabelas (HEUSER, 2022). Sem esses dois mecanismos funcionando juntos, seria impossível rastrear o que foi cobrado em cada período de um contrato que teve o valor alterado no meio da vigência.

O objetivo deste trabalho é propor um modelo de banco de dados que sirva como estrutura central para a gestão da AM Consultoria, permitindo que os fluxos operacionais identificados possam ser executados com consistência e rastreabilidade. O problema concreto que o modelo deve resolver é direto: sem um esquema de dados formal, é impossível gerar faturamento confiável ou reconstruir o histórico de um cliente sem esforço manual.

**Como objetivos específicos, busca-se:**
*   a) Levantar os requisitos do negócio por meio de sessões estruturadas com um agente conversacional simulando o proprietário;
*   b) Construir os modelos conceitual, lógico e físico;
*   c) Implementar o modelo em PostgreSQL com migrations versionadas;
*   d) Validar a solução por integração com camadas de backend e interface.

O trabalho está organizado em quatro seções: a próxima descreve o processo metodológico adotado; a seção 3 apresenta e discute as decisões de modelagem; e a seção 4 reúne as considerações finais e limitações.

---

### 2 METODOLOGIA

O processo foi conduzido em quatro etapas sequenciais, com revisões iterativas entre elas.

**Etapa 1: Levantamento de Requisitos por Simulação Operacional**
*   Realizaram-se sessões com um agente conversacional (ChatGPT) emulando o proprietário da AM Consultoria.
*   A equipe elaborou perguntas sobre gestão de contratos, formas de cobrança, controle de visitas e projetos, acompanhamento de pendências e faturamento.
*   As sessões foram organizadas em três blocos temáticos:
    1.  Estrutura de clientes e contratos (variações de escopo, formas de pagamento).
    2.  Controle operacional (visitas, projetos, pendências).
    3.  Faturamento e histórico.
*   Respostas ambíguas foram reformuladas até que as regras de negócio ficassem claras para a modelagem.
*   Gerou-se aproximadamente trinta requisitos funcionais, revisados antes da modelagem conceitual.
*   **Observação:** O agente simulado substituiu, mas não eliminou, a necessidade de validação com um usuário real.

**Etapa 2: Modelagem Conceitual, Lógica e Física**
*   **Modelo Conceitual:** Organização das informações levantadas em entidades, atributos e relacionamentos em linguagem natural.
*   **Modelo Lógico:** Tradução para o paradigma relacional, resultando em um Diagrama de Entidade-Relacionamento (DER) inicial.
*   **Iterações e Correções:**
    *   Identificação de problemas durante a implementação física (ex: cálculo dinâmico de `valor_total` em `faturamento_mensal` inviabilizando auditoria histórica; `mes` e `ano` como colunas separadas dificultando agrupamentos).
    *   Soluções: Armazenar `valor_total` no momento da geração do faturamento; unificar `mes` e `ano` em um único campo `mes_ano`.
    *   Ciclo de modelar, implementar, identificar problemas e corrigir ocorreu mais de uma vez.

**Etapa 3: Validação com Consultas SQL**
*   Desenvolvimento de quatorze consultas SQL representando os fluxos operacionais principais:
    *   Agenda diária.
    *   Histórico de contratos.
    *   Faturamento mensal consolidado.
    *   Indicador de saúde operacional por cliente.
    *   Rastreamento de pendências.
*   As consultas serviram como validação do modelo e prototipagem dos fluxos esperados.

**Etapa 4: Integração e Validação com Dados Simulados**
*   Integração do modelo com uma aplicação com backend em Python e interface frontend.
*   Hidratação do banco com dados simulando seis meses de operação da consultoria, mais trinta dias de registros futuros.
*   Teste da integridade estrutural do esquema e do comportamento das consultas diante de um histórico operacional representativo.

---

### 3 RESULTADOS E DISCUSSÃO

#### 3.1 MAPEAMENTO DE REQUISITOS E REGRAS DE NEGÓCIO

As operações da AM Consultoria são centradas nos seus clientes. O levantamento de requisitos focou nas instituições atendidas, identificando as seguintes características e necessidades:

*   **Clientes:** Sete clientes fictícios, cada um com especificidades como tipo de instituição, contatos internos, nível de complexidade, contratos, serviços, visitas, projetos, formas de pagamento, pendências, faturamento e histórico operacional.
*   **Contatos:** Cada cliente pode ter múltiplos contatos, com registro obrigatório de nome, papel (decisor operacional, financeiro, emergência) e meios de contato.
*   **Contratos:** Definem o escopo do atendimento. Compartilham uma estrutura base (serviços, frequência, formas de pagamento). Necessário controle de histórico contratual, onde alterações geram um novo registro ativo e encerram o anterior.
*   **Serviços:**
    *   **Visitas:** Principal meio de acompanhamento. Necessário registrar data, hora, `tipo_visita` (rotineira, urgente, pontual, estruturada, acompanhamento direcionado), descrição das atividades e pendências geradas. Para visitas extras, registrar o solicitante.
    *   **Projetos:** Iniciativas estruturadas com início, meio e fim. Devem conter título, descrição, datas, valor total e possibilidade de pagamento parcelado. Projetos extras devem registrar solicitante e aprovador.
*   **Eventos Críticos:** Eventos não formalizados, mas relevantes para análise operacional. Devem conter descrição, data e ação tomada.
*   **Problemas Identificados:** A falta de uma estrutura central capaz de relacionar contratos, visitas, projetos e faturamento de forma consistente ao longo do tempo. Isso torna a rastreabilidade histórica um requisito central, especialmente em cenários de alteração contratual, cobranças extraordinárias e acompanhamento de pendências.

#### 3.2 MODELO CONCEITUAL

Identificou-se a necessidade de quinze entidades para compor o banco de dados: `clientes`, `contatos`, `contratos`, `tipo_pagamento`, `contrato_pagamento`, `historico_contrato`, `projetos`, `projetos_parcela`, `projetos_extra`, `entregas`, `visitas`, `visitas_extra`, `pendencias`, `eventos_criticos` e `faturamento_cliente`.

**Principais Decisões de Modelagem:**
*   **Centralidade da Entidade `contratos`:** Reflete a lógica operacional, pois visitas, projetos, pendências e cobranças só fazem sentido vinculados a um contrato vigente. A integridade referencial garante que não existam registros sem uma âncora válida.
*   **Versionamento Contratual:** Implementado pela entidade `historico_contratos`, seguindo o padrão Slowly Changing Dimension Type 2 (SCD Type 2). Cada alteração gera uma nova versão ativa, preservando o registro anterior. Permite reconstruir o estado exato de qualquer contrato em qualquer período passado.
*   **Estrutura de Faturamento:** Dividido em `faturamento_cliente` (cobranças mensais recorrentes) e `projeto_parcelas` (parcelas de projetos com valor e datas próprias). Misturá-los em uma única tabela complicaria consultas de receita mensal.
*   **Entidades Complementares:** Separação de entidades principais (visitas, projetos) de complementares (visitas_extra, projetos_extra) para evitar campos nulos em atributos exclusivos de situações excepcionais (ex: `solicitante`).
*   **Vinculação de Pendências e Eventos Críticos:** Obrigatório a contratos e opcional a visitas, garantindo rastreabilidade mínima por cliente.
*   **Desafio:** Decidir o que pertencia à entidade principal e o que devia ir para uma entidade satélite. A tendência inicial de colocar campos opcionais diretamente nas entidades principais criaria registros com muitos campos nulos. A separação resolveu o problema, exigindo cuidado para não fragmentar demais o modelo.

#### 3.3 MODELO LÓGICO

O modelo lógico traduz as entidades e relacionamentos conceituais para o paradigma relacional, organizado em torno da rastreabilidade contratual.

**Estrutura das Quinze Tabelas:**
*   Projetadas para reduzir redundâncias e preservar a integridade referencial.
*   **`historico_contratos`:** Utiliza pares de chaves estrangeiras para apontar para o contrato encerrado e o novo contrato correspondente, permitindo reconstruir a sequência de alterações contratuais sem sobrescrever informações. Essencial para auditoria e análise financeira.
*   **Atributos `valor_total` e `visitas_realizadas` em `faturamento_cliente`:** Armazenados intencionalmente, embora deriváveis. A decisão de armazenar `valor_total` no momento da geração da fatura é uma desnormalização controlada (violação da Terceira Forma Normal) justificada pela necessidade de um histórico financeiro imutável após emissão.
*   **Relacionamentos Opcionais:** Implementados com chaves estrangeiras `nullable` diretamente nas tabelas dependentes (ex: vínculo entre visitas e projetos, pendências e visitas), evitando tabelas associativas intermediárias desnecessárias.
*   **Decisões de Tipo de Dado:**
    *   `tipo_visita` em `visitas`: Definido como tipo enumerado (`rotineira`, `urgente`, `pontual`, `estruturada`, `acompanhamento direcionado`) para restringir valores.
    *   `mes_ano` em `faturamento_cliente`: Definido como `DATE` em vez de colunas separadas ou `VARCHAR`, simplificando agrupamentos em consultas de receita mensal.

#### 3.4 MODELO FÍSICO E IMPLEMENTAÇÃO

*   **SGBD Escolhido:** PostgreSQL.
*   **Justificativa:** Suporte consistente a constraints declarativas, transações e migrations versionadas.
*   **Estrutura Física:** Organizada em quinze arquivos de migration, cada um responsável pela criação de uma tabela. Garante reprodutibilidade, respeito às dependências de chaves estrangeiras e rastreabilidade da evolução do esquema.
*   **Versionamento:** Implementado por convenção de nomenclatura nos nomes dos arquivos de migration.
*   **Consistência e Integridade:** Reforçada diretamente na camada de banco de dados por meio de restrições declarativas no DDL:
    *   `CHECK (EXTRACT ( DAY FROM mes_ano) = 1)` em `faturamento_cliente`: Padroniza o registro mensal de faturamento para o primeiro dia do mês.
    *   `UNIQUE (id_contrato, mes_ano)` em `faturamento_cliente`: Impede duplicidade de faturamento para o mesmo contrato no mesmo período.
    *   `CHECK (id_contrato_encerrado <> id_contrato_novo)` em `historico_contratos`: Impede auto-associação de contratos.
*   **Validação com Consultas SQL (14 consultas):**
    *   Executadas sobre um banco hidratado com dados simulando seis meses de operação e trinta dias futuros.
    *   **Consultas de Destaque:**
        *   **Q06 (Histórico de Alterações Contratuais):** Une `historico_contratos` e `contratos` para exibir termos anteriores e posteriores a cada transição, comprovando o funcionamento do versionamento SCD Type 2.
        *   **Q05 (Consolidação Financeira Mensal):** Une receitas de `faturamento_cliente` e `projeto_parcelas` via `UNION ALL` para produzir uma linha por mês com a receita total, resolvendo a dificuldade de apurar o faturamento mensal.
        *   **Q11 (Indicador de Saúde Operacional por Cliente):** Combina cinco sinais (visitas de emergência, pendências vencidas, eventos críticos sem ação, proporção de entregas, tempo de inatividade) para classificar contratos em "normal", "atenção" ou "emergência". Confirmou a capacidade da consulta de distinguir estados operacionais distintos.
    *   **Outras Consultas Relevantes:**
        *   **Q12 (Agenda Diária):** Filtra visitas e vencimentos por data. Revelou problemas de cardinalidade em joins iniciais.
        *   **Q14 (Rastreamento de Pendências):** Cruza responsável (cliente/consultor) e prazo (dentro/fora) para gerar uma visão consolidada.
    *   **Resultados da Validação:**
        *   As quatorze consultas funcionaram como um teste de cobertura informal, exigindo cruzar pelo menos duas tabelas.
        *   Nenhuma consulta exigiu alteração no esquema após a primeira versão estável.
        *   Problemas de join foram resolvidos sem reestruturar entidades ou relacionamentos, confirmando a suficiência da arquitetura central.
        *   O escopo validado não inclui múltiplos consultores, notificações automáticas ou carga concorrente.

---

### 4 CONSIDERAÇÕES FINAIS

O projeto abordou um problema real da AM Consultoria: a dificuldade em fechar o faturamento mensal e reconstruir o histórico de clientes devido a fontes de dados fragmentadas. A modelagem resolveu esses problemas na camada de dados, e a integração com o frontend confirmou que o esquema sustenta os fluxos operacionais.

*   **Variabilidade Contratual:** A heterogeneidade entre contratos (frequência de visitas, formas de pagamento, escopo de projetos) foi o principal obstáculo à padronização e orientou a arquitetura do modelo, priorizando flexibilidade com rastreabilidade.
*   **Entidade `historico_contratos`:** Concentra decisões de projeto, resolvendo o versionamento, mas aumenta a complexidade de consultas que precisam do estado atual de um contrato (exige filtro pelo registro mais recente). Este trade-off foi considerado aceitável para auditabilidade, mas seria um ponto a revisar em caso de problemas de desempenho.
*   **Desnormalização em `faturamento_cliente`:** Emergiu durante a implementação, mostrando que decisões de modelagem podem ser tomadas a partir do que a implementação revela. A justificativa operacional (histórico financeiro imutável) é clara.
*   **Implementação em PostgreSQL:** Utilizou constraints `CHECK` e `UNIQUE` para garantir integridade no nível do esquema, independentemente da camada de aplicação.
*   **Testes de Consultas:**
    *   As consultas analíticas complexas (ex: Q11) foram mais trabalhosas de escrever, mas encontraram o modelo como esperado.
    *   As consultas operacionais cotidianas (ex: agenda diária, listagem de pendências) foram mais sensíveis a problemas de join e exigiram mais iterações para estabilizar, sugerindo que fluxos diários são um teste mais rigoroso para modelos de dados.
*   **Validação:** Cobriu o ciclo operacional esperado para uso inicial, mas não é um teste de carga.
*   **Próximos Passos:**
    *   Validação dos requisitos com o proprietário real para revelar entidades faltantes ou fluxos não mapeados.
    *   Extensão do modelo para múltiplos consultores.
    *   Implementação de mecanismos de notificação automática para pendências atrasadas e contratos próximos do vencimento.

---

### REFERÊNCIAS

*   CAYRES, Paulo Henrique. **Modelagem de banco de dados**. 1. ed. Rio de Janeiro: Escola Superior de Redes, 2015. Disponível em: [https://www.kufunda.net/publicdocs/Modelagem%20de%20banco%20de%20dados%20(Paulo%20Henrique%20Cayres).pdf](https://www.kufunda.net/publicdocs/Modelagem%20de%20banco%20de%20dados%20(Paulo%20Henrique%20Cayres).pdf). Acesso em: 19 maio 2026.
*   ELMASRI, Ramez; NAVATHE, Shamkant B. **Sistemas de banco de dados**. 7. ed. São Paulo: Pearson Education do Brasil, 2018.
*   HEUSER, Carlos Alberto. **Projeto de banco de dados**. 7. ed. [S.l.]: Clube de Autores, 2022. ISBN 978-65-01-22210-3. Disponível em: [https://projbd.heuser.pro.br](https://projbd.heuser.pro.br). Acesso em: 20 maio 2026.
*   IBM. **Propriedades de operador de dimensão de mudança lenta (SCD)**. In: IBM Documentation, [s.d.]. Disponível em: [https://www.ibm.com/docs/pt-br/db2/11.1.0?topic=operators-slowly-changing-dimension-scd-targetoperator-properties](https://www.ibm.com/docs/pt-br/db2/11.1.0?topic=operators-slowly-changing-dimension-scd-targetoperator-properties). Acesso em: 20 maio 2026.
*   SILBERSCHATZ, Abraham; KORTH, Henry F.; SUDARSHAN, S. **Sistema de banco de dados**. 7. ed. Rio de Janeiro: GEN LTC, 2020.
*   SOUSA, Iuri Gregório de. **Economia do cuidado**. Brasília: Câmara dos Deputados, Consultoria Legislativa, 2017. Disponível em: [https://www2.camara.leg.br/atividade-legislativa/estudos-e-notas-tecnicas/fiquePorDentro/temas/economia-do-cuidado-set-2017.html](https://www2.camara.leg.br/atividade-legislativa/estudos-e-notas-tecnicas/fiquePorDentro/temas/economia-do-cuidado-set-2017.html). Acesso em: 20 maio 2026.