# Mapa de Domínio e Fluxo de Dados (Frontend)

Este documento mapeia a jornada do dado desde o Backend oficial até a renderização na UI, identificando pontos de tradução, normalização e dependências de mocks.

## 1. Estado de Realidade do Sistema (Real vs Híbrido)

| Vertical   | Estado | Fonte de Dados | Observação |
| :--- | :--- | :--- | :--- |
| **Visitas** | **REAL** | `API /visitas/` | Integração 100% via Service + Adapter. |
| **Pendências** | **REAL** | `API /pendencias/` | Fluxo de 2 etapas (E2E) funcional. |
| **Contratos** | **REAL** | `API /contratos/` | Status derivado dinamicamente; `valor_mensal` pendente. |
| **Clientes** | **REAL** | `API /clientes/` | Mapeamento estrito `nome` -> `nome_instituicao`. |
| **Projetos** | HÍBRIDO | Mocks / API | Próxima vertical a ser integrada. |
| **Faturamento** | HÍBRIDO | Mocks | Altamente dependente de mocks no Dashboard. |
| **Analytics** | HÍBRIDO | Agregação Mock | Timeline e gráficos usam dados simulados. |

## 2. Fluxo de Dados por Tela

| Tela | Service | Adapter/Mapper | Endpoint Real | Mock Dep? | Tradução Implícita |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/visitas/nova` | `VisitasService.criar` | `toVisitaPayload` | `POST /visitas/` | Não | UI -> API (Enum Mapping) |
| `/visitas/nova` | `VisitasService.criar` | `toPendenciasPayload` | `POST /pendencias/` | Não | 2-step (id_visita manual) |
| `Dashboard` | `DashboardService` | `mapVisita` | `GET /visitas/` | Não | API -> UI (remota -> online) |
| `Dashboard` | `DashboardService` | `mapCliente` | `GET /clientes/` | Não | Mapeamento `nome` -> `nome_instituicao` |
| `Dashboard` | `DashboardService` | `mapContrato` | `GET /contratos/` | Não | Status derivado da `data_fim` |
| `/contratos` | `ContratoService.getAll` | `mapContrato` | `GET /contratos/` | Não | Listagem 100% real |
| `/contratos/[id]` | `ContratoService.replace` | `toReplacePayload` | `POST /contratos/replace` | Não | Versionamento oficial |

## 3. Inventário de Tipos e Enums

| Tipo/Enum | Localização | Estado | Observação |
| :--- | :--- | :--- | :--- |
| `StatusVisita` | `domain/visita.ts` | **OFICIAL** | Fonte única para UI e Adapter |
| `ModalidadeVisita` | `domain/visita.ts` | **OFICIAL** | Fonte única para UI e Adapter |
| `VisitaRaw` | `types/visita.raw.ts` | **ALINHADO** | Reflete exatamente o Schema Pydantic |
| `PendenciaCreateDTO` | `adapter/pendencia.adapter.ts` | **CONSOLIDADO** | Fonte única para Visitas e Pendências Manuais |
| `ContratoRaw` | `types/contrato.raw.ts` | **ALINHADO** | Reflete exatamente o ContratoRead |
| `ClienteRaw` | `types/cliente.raw.ts` | **ALINHADO** | Reflete exatamente o ClienteRead |
| `Cliente` | `domain/cliente.ts` | **ESTÁVEL** | Mapeado via `mapCliente` |

## 4. "Buchas de Redução" (Normalizações Temporárias)

*   **Visita (Modalidade):** `remota` (API) <-> `online` (UI).
*   **Visita (Tipo):** Mapeia 5 tipos visuais para os 3 tipos persistidos no banco.
*   **Contrato (Status):** Não existe no banco; derivado no frontend: `hoje > data_fim ? 'inativo' : 'ativo'`.
*   **Contrato (Valor):** `valor_mensal` fixado em `0` (aguardando integração com Financeiro/ContratoPagamento).
*   **Cliente (Nome):** `nome` (API) -> `nome_instituicao` (UI).
