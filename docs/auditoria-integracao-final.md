# Auditoria de Integração Final - AM Consultoria

Este documento consolida a revisão técnica completa após o merge das branches de frontend e backend. O objetivo é garantir que a integração real (com banco de dados persistente) não cause regressões na inteligência já construída no frontend.

## 1. Mapeamento de Gaps de Contrato (Front ↔ Back)

A análise detectou desalinhamentos críticos entre o que o frontend espera (Raw Types) e o que o backend oferece (SQLAlchemy Models).

### 🚨 Blocker: Entidade `Pendencia`
O backend atual inviabiliza o fluxo de pendências avulsas.
- **Frontend**: Permite pendências ligadas a `id_contrato` OU `id_visita`. Campo `responsavel` é essencial para delegar.
- **Backend Model**: Exige `id_visita` obrigatório. Não possui `id_contrato`. Não possui `responsavel`.
- **Risco**: Erro 400/422 ao tentar salvar pendências manuais ou avulsas.

### ⚠️ Atenção: Entidade `Visita`
Divergência na tipagem e obrigatoriedade de campos.
- **Frontend**: `id_projeto` é opcional (null para rotina). `data_hora` é string ISO (com tempo).
- **Backend Schema**: `id_projeto` é **Obrigatório** (int). Campo é `data` (Date puro).
- **Risco**: Impossibilidade de registrar visitas de rotina. Perda de informação de horário da visita (essencial para auditoria).

### ⚠️ Atenção: Entidade `Contrato`
Campos financeiros e de estado ausentes no banco.
- **Backend Model**: Não possui `valor_mensal` nem `status`.
- **Frontend**: Utiliza esses campos para KPIs do dashboard e cálculo de faturamento.

---

## 2. Entidades Fantasmas e Campos Divergentes

| Entidade | Backend Model | Frontend Domain | Status do Gap |
| :--- | :--- | :--- | :--- |
| **Projeto** | Existe | Existe | Backend falta `titulo`, `descricao` e `valor_total`. |
| **Faturamento** | Existe | Existe | Backend incompleto (falta `pago`, `mes_ano`, `data_pagamento`). |
| **Visita Extra** | Existe | Existe | Alinhado, mas depende da correção da Visita pai. |
| **Evento Crítico**| Existe | Existe | Alinhado. |

---

## 3. Riscos Arquiteturais Identificados

### 1. Inconsistência de Datas (Timezone)
O backend usa `Date` do SQLAlchemy. Isso armazena apenas `AAAA-MM-DD`. 
O Adriano precisa de precisão temporal para visitas e auditorias. 
**Recomendação**: Migrar para `DateTime(timezone=True)` em todos os campos de registro operacional.

### 2. Status Persistido vs Derivado
O backend possui colunas `status` em tabelas como `pendencias`. 
O frontend foi refatorado para derivar status de datas e flags (ex: `resolvida`).
**Risco**: Ter um campo `status` no banco que diverge da realidade temporal (ex: pendência marcada como "Aberta" mas com data de prazo vencida).

### 3. Cast de IDs (String vs Number)
O frontend converte todos os IDs para `string` no domínio. O backend espera `int`. 
Os mappers atuais estão fazendo o trabalho, mas os novos Adapters devem ser rigorosos com a tipagem no payload de saída.

---

## 4. Prontidão para Integração

- 🟢 **Clientes**: Pronto.
- 🟡 **Contratos**: Parcial (Aguardando campos financeiros no model).
- 🟡 **Visitas**: Parcial (Aguardando `id_projeto` opcional e tipo `DateTime`).
- 🔴 **Pendências**: Bloqueado (Falta `id_contrato` e `responsavel` no banco).
- 🔴 **Financeiro**: Bloqueado (Falta lógica de pagamento no banco).

---

## 5. Checklist de Correção Prioritária

1. [ ] Tornar `id_projeto` opcional no schema/model de `Visita`.
2. [ ] Adicionar `id_contrato` (FK) e `responsavel` (String) em `Pendencia`.
3. [ ] Alterar colunas `Date` operacionais para `DateTime` no backend.
4. [ ] Adicionar `valor_mensal` e `status` em `Contrato`.
5. [ ] Sincronizar nomes: `resultado` (back) para `resultados` (front/mapa).
