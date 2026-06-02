# 📊 AM-Consultoria

Sistema web para gerenciamento operacional de consultorias, desenvolvido com arquitetura Full Stack utilizando FastAPI, PostgreSQL e Next.js.

O projeto centraliza informações de clientes, contratos, projetos, visitas técnicas, faturamento, eventos críticos e pendências operacionais em uma única plataforma, permitindo o acompanhamento estruturado das atividades e o apoio à tomada de decisão.

Além da gestão operacional, o sistema incorpora mecanismos de análise e priorização de demandas através de motores de inteligência responsáveis pelo cálculo de indicadores de criticidade, saúde operacional e priorização de atendimento.

---

## 📌 Objetivo do Projeto

O AM-Consultoria foi desenvolvido para apoiar empresas de consultoria no controle e acompanhamento de suas operações, fornecendo uma visão integrada dos processos administrativos, financeiros e operacionais.

A plataforma busca reduzir a dispersão de informações, facilitar o monitoramento de contratos e permitir uma gestão mais eficiente das atividades realizadas pelos consultores.

---

## 🚀 Principais Funcionalidades

### 👥 Gestão de Clientes e Contatos

* Cadastro de clientes e instituições.
* Gerenciamento de contatos vinculados.
* Histórico de relacionamento.

### 📋 Gestão de Contratos e Projetos

* Controle de contratos ativos.
* Acompanhamento de projetos.
* Monitoramento de entregas e cronogramas.

### 💰 Gestão Financeira

* Controle de faturamento.
* Gerenciamento de parcelas.
* Acompanhamento de inadimplência.
* Indicadores financeiros operacionais.

### 🗓️ Gestão de Visitas

* Registro de visitas regulares.
* Controle de visitas extras.
* Histórico completo de atendimentos.

### ⚠️ Gestão de Pendências e Eventos Críticos

* Registro de pendências operacionais.
* Acompanhamento de resolução.
* Controle de eventos críticos relacionados aos contratos.

### 📊 Inteligência Operacional

* Cálculo de Score de Tensão.
* Cálculo de Saúde Operacional.
* Priorização automática de demandas.
* Geração de indicadores estratégicos para acompanhamento gerencial.

---

## 🛠️ Tecnologias Utilizadas

### Backend

* Python 3.11+
* FastAPI
* SQLAlchemy 2.x
* Alembic
* PostgreSQL
* Pydantic 2
* Uvicorn
* Psycopg2

### Frontend

* Next.js 16
* React 19
* TypeScript 5
* Tailwind CSS 4
* date-fns
* Lucide React

### Banco de Dados

* PostgreSQL
* Migrations SQL versionadas
* Constraints de integridade referencial
* Scripts de população e simulação de dados

---

## ⚙️ Arquitetura da Aplicação

O projeto segue uma arquitetura em camadas composta por:

```text
AM-Consultoria
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   │   └── intelligence/
│   │   └── read_models/
│   └── requirements.txt
│
├── database/
│   ├── migrations/
│   ├── queries/
│   └── seeds/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   ├── adapters/
│   │   ├── domain/
│   │   └── utils/
│   └── package.json
│
├── docs/
├── docker-compose.yml
└── run_backend.py
```

**Backend:** API REST, regras de negócio e motores de inteligência operacional.

**Frontend:** Interface web construída com Next.js, responsável pela visualização dos indicadores, contratos, clientes e operações.

**Database:** Scripts de migração, consultas analíticas e população inicial dos dados.

**Docs:** Diagramas, requisitos e documentação técnica do projeto.

---

## 📈 Motores de Inteligência

O sistema possui uma camada dedicada de inteligência operacional composta por:

* Tension Engine
* Health Engine
* Priority Engine
* Intelligence Service

Esses componentes processam informações operacionais e financeiras para gerar indicadores de criticidade e auxiliar na priorização das atividades da consultoria.

---

## 🚀 Execução do Projeto

### Pré-requisitos

* Docker
* Docker Compose

### Configuração

1. Configure os arquivos `.env`.
2. Execute os containers:

```bash
docker-compose up --build
```

### Acesso

Frontend:

```text
http://localhost:3000
```

Swagger da API:

```text
http://localhost:8000/docs
```

---

### 👩‍💻 Devs
* **Cássia Irene | [GitHub](https://github.com/Cassia-Irene)**
* **Leonardo Ferreira | [GitHub](https://github.com/leonardoferrza)**
* **Melissa Wolff | [GitHub](https://github.com/melwolff13)**

---


Projeto desenvolvido na disciplina de *Banco de Dados* da **UNDB**, integrando conceitos de modelagem relacional, desenvolvimento Full Stack, APIs REST, integridade de dados e inteligência operacional aplicada.
