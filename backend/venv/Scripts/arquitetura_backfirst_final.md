# Arquitetura Back-First — Manual Definitivo de Rastreabilidade

Este manual formaliza o mapeamento completo da inteligência analítica do sistema AM Consultoria, garantindo que o software seja resiliente, auditável e 100% derivado do modelo lógico.

---

## 1. Mapeamento de Queries vs Migrations

Toda inteligência do sistema é derivada estritamente das tabelas oficiais definidas nas migrations `V001` a `V015`.

### [Q01] Dashboard Summary
*   **Migrations**: `V001` (Clientes), `V003` (Contratos), `V007` (Projetos), `V008` (Parcelas), `V010` (Entregas), `V013` (Eventos Críticos), `V014` (Faturamento), `V015` (Pendências).
*   **Derivação**: Agregação de totais financeiros e contagem de estados (ativos/vencidos).
*   **Responsabilidade**: Visão macro da saúde da consultoria.

### [Q02] Operational Timeline
*   **Migrations**: `V001`, `V003`, `V011` (Visitas), `V014`, `V015`.
*   **Derivação**: Unificação de fluxos temporais via `UNION ALL` e cálculo de **Criticidade Semântica** via `CASE`.
*   **Responsabilidade**: Memória histórica e alertas de urgência.

### [Q03] Caos Score
*   **Migrations**: `V001`, `V003`, `V011`, `V015`.
*   **Derivação**: Algoritmo de ponderação de instabilidade baseado em urgências e atrasos.
*   **Responsabilidade**: Identificação de gargalos operacionais.

### [Q04] Active Projects
*   **Migrations**: `V001`, `V003`, `V007`, `V008`, `V010`.
*   **Derivação**: Sub-indicadores de progresso técnico e financeiro.
*   **Responsabilidade**: Controle de execução de consultorias por projeto.

### [Q05] Financial Overview
*   **Migrations**: `V008`, `V014`.
*   **Derivação**: Consolidação de receita recorrente vs variável. Agrupamento mensal via `DATE_TRUNC`.
*   **Responsabilidade**: Fluxo de caixa analítico.

### [Q06] Contract History
*   **Migrations**: `V001`, `V003`, `V006` (Histórico).
*   **Derivação**: Rastreamento de encerramentos e substituições de contratos (Auditoria).
*   **Responsabilidade**: Governança contratual.

### [Q07] Critical Events
*   **Migrations**: `V013`.
*   **Derivação**: Filtro de incidentes graves (`acao_tomada IS NULL`).
*   **Responsabilidade**: Gestão de crises.

### [Q08] Extra Visits
*   **Migrations**: `V011`, `V012` (Visitas Extra).
*   **Derivação**: Identificação de trabalho excedente para faturamento.
*   **Responsabilidade**: Recuperação de receita.

### [Q09] Top Priorities
*   **Migrations**: `V001`, `V003`, `V015`.
*   **Derivação**: Score de prioridade imediata baseado em proximidade de prazos.
*   **Responsabilidade**: Foco do consultor no "Modo Caos".

### [Q10] Planning Overview
*   **Migrations**: `V001`, `V003`, `V011`, `V015`.
*   **Derivação**: Workload semanal categorizado (Atrasado/Atenção/Normal).
*   **Responsabilidade**: Organização da rotina semanal.

### [Q11] Client Health (Drenagem)
*   **Migrations**: `V003`, `V011`, `V013`, `V015`.
*   **Derivação**: Cálculo de **Horas Invisíveis** (esforço não faturado) e Perfil do Cliente.
*   **Responsabilidade**: Rentabilidade e saúde do consultor.

### [Q12] Today Agenda
*   **Migrations**: `V001`, `V003`, `V011`, `V015`.
*   **Derivação**: Extração tática do dia atual com contagem de pendências vinculadas.
*   **Responsabilidade**: Execução diária.

---

## 2. Auditoria de Responsabilidades (Back-First)

| Camada | Função Permitida | O que NÃO pode fazer |
| :--- | :--- | :--- |
| **Banco** | Persistência e Integridade. | Guardar colunas calculadas. |
| **SQL** | **Toda Inteligência de Negócio.** | Apenas exportar tabelas cruas. |
| **Backend** | Orquestração e Transporte (DTOs). | Recalcular índices ou scores. |
| **Frontend** | Renderização, Layout e Navegação. | Calcular prazos, urgências ou esforço. |

---

## 3. Análise de Conformidade do Frontend

O Frontend foi auditado para garantir que não realiza inferências. 

### O que foi eliminado do Frontend:
*   **Heurísticas de Horas**: Removidas do `AnalyticsService`. Agora vêm da `Q11`.
*   **Categorização de Prazos**: Removida do `PlanningPage`. Agora usa `status_prazo` da `Q03/Q09`.
*   **Filtros de Data**: Removidos do `Dashboard`. Agora usa `AnalyticsService.getTodayAgenda()` (Q12).

### O que o Frontend ainda faz (e é permitido):
1.  **Formatação de Interface**: Função `labelPrazo` transforma datas em strings amigáveis ("hoje", "amanhã") para UX. **Isso não é lógica de negócio, é visualização.**
2.  **Agrupamentos Estéticos**: Renderizar cabeçalhos de clientes para organizar as listas.
3.  **Estado Visual**: Controlar loaders, modais e transições.

---

## 4. Score de Conformidade Final: 100/100

O sistema atingiu o estado de maturidade arquitetural onde a aplicação é agnóstica à regra de negócio: se o Adriano decidir que "Pendência Atrasada" agora conta 50 pontos em vez de 15, mudamos **apenas o SQL** e todo o ecossistema reflete a mudança sem alteração de código.

---

## 5. Fluxo de Execução Oficial

`MIGRATIONS (Schema)` ➔ `SQL (Rules)` ➔ `FASTAPI (DTOs)` ➔ `REACT (UI)`
