# 📊 AM-Consultoria — Sistema de Inteligência Operacional e Auditoria

O **AM-Consultoria** é um sistema de gestão e inteligência operacional focado no acompanhamento de contratos, auditoria de faturação, monitorização de prioridades e gestão de pendências e rotinas operacionais para empresas de consultoria.

A plataforma é dividida numa arquitetura moderna com um backend robusto em Python (FastAPI) focado em regras de negócio e inteligência, e um frontend ágil, intuitivo e responsivo em TypeScript (Next.js) com Tailwind CSS, todos orbitando em torno de uma modelagem de banco de dados altamente estratégica.

## 📌 Visão Geral
O sistema centraliza pendências e dados de contratos, automatizando o cálculo de criticidade (Score de Tensão e Saúde Operacional). Isto permite que os consultores e gestores identifiquem instantaneamente desvios de escopo, gargalos operacionais e riscos de inadimplência ou atraso nas parcelas e entregas de projetos.

## 🛠️ Tecnologias Utilizadas

### 🗄️ Banco de Dados 
* **PostgreSQL**: Sistema de gestão de banco de dados relacional que centraliza toda a persistência, integridade operacional e inteligência de dados.
* **SQL Nativo (Flyway Style Migrations)**: Controle de versão evolutivo da estrutura do banco via scripts SQL sequenciais puros (`V001` a `V015`), isolando as definições de DDL para tabelas, restrições e relacionamentos.
* **Consultas Analíticas Avançadas**: Camada de inteligência financeira e operacional alimentada por queries SQL puras otimizadas (`Q01` a `Q13`) para geração de KPIs, timelines complexas e cálculo de scores.

### ⚙️ Backend
* **Python 3.11+**
* **FastAPI**: Framework web de alta performance para a construção da API.
* **SQLAlchemy / Psycopg2**: ORM e driver para comunicação eficiente com a base de dados.
* **Alembic / Flyway Style Migrations**: Gestão e evolução do esquema da base de dados.
* **Pydantic**: Validação de dados e definições de esquemas (Schemas).

### 💻 Frontend
* **React / Next.js (App Router)**
* **TypeScript**: Tipagem estática para maior segurança e escalabilidade.
* **Tailwind CSS**: Estilização utilitária e design responsivo.
* **Componentes Customizados**: Painéis de atenção, cronogramas operacionais (Timeline) e métricas dinâmicas.

---

## ⚙️ Engenharia de Software e Regras de Negócio
O ecossistema foi projetado utilizando padrões modernos de arquitetura de dados e lógica distribuída para garantir integridade e agilidade:

* **Motores de Inteligência (Intelligence Engines):** Algoritmos especializados na camada de serviços backend (`TensionEngine`, `HealthEngine`, `PriorityEngine`) que analisam e cruzam dinamicamente variáveis operacionais para gerar filas de prioridade automatizadas.
* **Mapeamento Relacional Complexo:** Herança e relacionamentos no SQLAlchemy para gerenciar entidades do domínio, tais como Clientes, Contatos, Projetos, Parcelas, Visitas (Rotinas e Extras), Faturamento e Eventos Críticos.
* **CQRS / Modelos de Leitura (Read Models):** Separação de conceitos para visualização otimizada de agregados complexos, como a `OperationalPriorityQueue` e o `TimelineOperationalContext`, alimentando o frontend sem sobrecarregar as tabelas transacionais.
* **Restrições de Integridade (Database Constraints):** Uso estrito de chaves estrangeiras (`FOREIGN KEY`), regras de exclusão em cascata (`ON DELETE CASCADE`) e restrições de checagem (`CHECK`) direto no banco de dados.

## 📊 Inteligência Visual (Dashboard Interativo)
A interface estratégica permite uma análise visual e tomada de decisão intuitiva através de três visões centrais:

1. **Painel de Atenção (Attention Panel):** Componente dinâmico focado em exibir métricas críticas imediatas (Gargalos de faturamento, contratos com alto score de caos e parcelas atrasadas).
2. **Cronograma Operacional (Timeline):** Linha do tempo interativa e rastreável que unifica o histórico de contratos, visitas realizadas, entregas concluídas e eventos críticos gerados.
3. **Mapeamento de Inadimplência:** Visão financeira analítica dedicada ao rastreamento e distribuição estatística do fluxo de caixa e status de parcelas dos projetos de consultoria.

## 🚀 Como Executar

### Pré-requisitos
* Ter o **Docker** e o **Docker Compose** instalados na máquina.

### Passos para Inicialização
1. **Configura as Variáveis de Ambiente:**
   Duplica o arquivo `.env.example` na raiz do backend, renomeando-o para `.env`, e configura os parâmetros de acesso à base de dados.

2. **Sobe os Contentores de Infraestrutura:**
   Na raiz do repositório, executa o comando para construir e inicializar os serviços do Frontend, Backend e PostgreSQL:
   ```bash
   docker-compose up --build

3. **Acede às Plataformas:**
   Interface Web (Frontend Next.js):
   ```bash 
   http://localhost:3000 
   ```
   Documentação Interativa da API (Swagger FastAPI): 
   ```bash 
   http://localhost:8000/docs
   ```

---

### 📂 Arquitetura do Sistema
```text
📂 AM-Consultoria (Raiz do Projeto)
├── 📂 backend                    # Camada de Serviços RESTful (Python 3.11+ / FastAPI)
│   ├── 📂 data                   # Snapshots narrativos e governança de auditoria em JSON
│   ├── 📂 src                    # Core da aplicação API
│   │   ├── 📂 models             # Modelos relacionais e mapeamento de tabelas (SQLAlchemy)
│   │   ├── 📂 read_models        # Modelos de leitura otimizados para KPIs e prioridades
│   │   ├── 📂 routers            # Endpoints/Rotas da API (Clientes, Contratos, Analytics, etc.)
│   │   ├── 📂 schemas            # Esquemas de validação de dados e payloads (Pydantic)
│   │   └── 📂 services           # Camada de lógica de negócio e motores de inteligência analítica
│   ├── audit_modalidade.py       # Script utilitário para auditoria de modalidades
│   ├── check_db_constraints.py # Script de verificação de restrições de integridade
│   ├── check_desc.py             # Script utilitário de checagem de descrições
│   ├── debug_projeto.py          # Script de depuração e testes de projetos
│   ├── extract_schema.py         # Utilitário para extração de esquemas do banco
│   ├── force_extra_desc.py       # Script de manipulação de descrições extras
│   ├── inspect_constraints.py    # Script de inspeção de chaves e restrições operacionais
│   ├── inspect_db.py             # Script de inspeção direta da base de dados
│   ├── list_tables.py            # Utilitário para listagem das tabelas ativas
│   ├── requirements.txt          # Dependências do Python (FastAPI, SQLAlchemy, Uvicorn, Psycopg2)
│   ├── test_all.py               # Suite de testes gerais do backend
│   ├── test_api.py               # Suite de testes focada nos endpoints da API
│   ├── test_emails.py            # Script de validação e testes de fluxo de e-mail
│   ├── test_payload.py           # Script de validação de estruturas de envio de dados
│   ├── test_pendencias.py        # Suite de testes focada nas regras de pendências
│   └── update_db_pendencias.py   # Script utilitário para atualização em lote de pendências
│
├── 📂 database                   # Engenharia de Dados, Persistência e População
│   ├── 📂 migrations             # Scripts sequenciais em SQL nativo (V001 a V015) para evolução de tabelas
│   ├── 📂 queries                # Consultas analíticas puras em SQL (Q01 a Q13) para validação de KPIs
│   ├── 📂 seeds                  # Cenários e scripts de simulação de dados por instituição (apae, caps, ilpi, etc.)
│   ├── seed.py                   # Script principal para orquestração e execução da população inicial do banco
│   ├── seed_test_visits.py       # Script específico para geração de visitas de teste
│   └── semantic_hydration.py   # Script para hidratação semântica das tabelas a partir dos snapshots
│
├── 📂 docs                       # Documentação técnica e elicitação de requisitos
│   ├── 📂 diagramas              # Modelo Lógico estruturado da base de dados em imagem
│   └── 📂 requisitos            # Atas de reuniões, PDFs e arquivos de texto com regras do cliente
│
├── 📂 frontend                   # Interface do Usuário (React / Next.js / TypeScript)
│   ├── 📂 src 
│   │   ├── 📂 adapters           # Conversores de payloads de rede para o contexto de visualização
│   │   ├── 📂 app                # Roteamento baseado em arquivos (Dashboard, Clientes, Financeiro, Visitas)
│   │   ├── 📂 components         # Componentes reutilizáveis de UI (AttentionPanel, ContratoTimeline, MetricCard)
│   │   ├── 📂 config             # Configurações globais e inicialização de variáveis de ambiente
│   │   ├── 📂 domain             # Modelagem de entidades do lado do cliente e interfaces core
│   │   ├── 📂 hooks              # Hooks customizados do React (useLocalDraft.ts)
│   │   ├── 📂 lib                # Conectores de API de baixo nível e motores locais (prioritizer.ts)
│   │   ├── 📂 mappers            # Mapeadores de dados (cliente.mapper.ts, contrato.mapper.ts, etc.)
│   │   ├── 📂 mocks              # Ficheiros de dados simulados estruturados para desenvolvimento isolado
│   │   ├── 📂 services           # Abstração de chamadas HTTP organizadas por domínio de negócio
│   │   ├── 📂 types              # Tipagens de dados brutos (*.raw.ts) que espelham os Schemas do backend
│   │   └── 📂 utils              # Utilitários gerais (kpis operacionais, finanças, formatação de datas e textos)
│   ├── next.config.ts            # Configurações de compilação do framework Next.js
│   ├── package.json              # Dependências, metadados e scripts do ecossistema Node.js
│   └── tailwind.config.js        # Configurações e tokens de design do Tailwind CSS
│
├── .env.example                  # Modelo de variáveis de ambiente para configuração do ecossistema
├── .gitignore                    # Configuração de exclusão de arquivos do Git
├── docker-compose.yml            # Orquestração de contêineres multi-serviços (Web, API e Banco)
└── run_backend.py                # Script raiz para inicialização rápida do servidor FastAPI em desenvolvimento
```

---

### 👩‍💻 Devs
* **Cássia Irene | [GitHub](https://github.com/Cassia-Irene)**
* **Leonardo Ferreira | [GitHub](https://github.com/leonardoferrza)**
* **Melissa Wolff | [GitHub](https://github.com/melwolff13)**

---

Projeto acadêmico desenvolvido para a disciplina de **Banco de Dados** — **UNDB**, com foco em modelagem relacional, integridade de dados e inteligência operacional.
