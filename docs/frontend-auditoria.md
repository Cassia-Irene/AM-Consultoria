# Auditoria Arquitetural Frontend - AM Consultoria

Este documento apresenta uma análise técnica profunda do estado atual do frontend, comparando-o com o Mapa Lógico do banco de dados e os requisitos operacionais do cliente (Adriano).

## 1. Visão Geral do Sistema

O sistema está estruturado como um Single Page Application (SPA) moderno usando Next.js 15+, com uma arquitetura de camadas bem definida.

### Módulos Existentes
- **Dashboard (Caos & Planejamento)**: Centralização de tomadas de decisão.
- **Clientes**: Gestão da base institucional.
- **Contratos**: Registro de acordos e serviços.
- **Visitas**: Operação de campo com gerador de pendências.
- **Pendências**: Gestão de obrigações e prazos.
- **Projetos**: Controle de entregas e parcelas financeiras.
- **Financeiro**: Faturamentos e pagamentos.

### Entidades Implementadas
- Cliente, Contato, Contrato, Visita, Pendência, Projeto, Entrega, Parcela, Faturamento, Pagamento.

---

## 2. Estado Arquitetural

### Pontos Fortes
- **Camada de Mapeamento (Strict Mappers)**: O uso de `validateShape` e mappers que falham explicitamente garante que dados corrompidos não cheguem à UI.
- **Derivação de Lógica**: Status e Severidade não são campos estáticos no banco, mas calculados em tempo real (ex: `getPendenciaStatus`). Isso reduz redundância e facilita mudanças de regra de negócio.
- **Adapters de Payload**: Separação clara entre o que o formulário manipula e o que a API recebe.

### Pontos Fracos
- **IDs Híbridos**: O uso de `string` no domínio e `number` no raw type exige casting constante nos mappers e adapters.
- **Mocks Descentralizados**: Embora úteis, os mocks estão espalhados e nem sempre refletem o estado mais recente do mapa lógico (ex: campos opcionais como `nullable` vs `undefined`).

### Riscos Técnicos
- **Desalinhamento Backend**: O frontend está mais maduro que o backend atual. Há entidades inteiras (Projetos, Faturamentos) que ainda não possuem models reais no Python.

---

## 3. Aderência ao Mapa Lógico

| Entidade | Status | Observações |
| :--- | :--- | :--- |
| **Cliente** | OK | Estrutura estável e alinhada. |
| **Contato** | OK | Implementado como sub-entidade de cliente. |
| **Contrato** | Parcial | `tipo_cobranca` removido do domínio em favor de `servicos_contratados`. |
| **Visita** | Divergente | Frontend possui `id_projeto`, modelo backend (`visita.py`) não. |
| **Pendência** | OK | Refatoração recente garantiu 100% de aderência. |
| **Projeto** | Fantasma | Implementado no frontend, mas inexistente no backend. |
| **Faturamento** | Fantasma | Lógica de cálculo no frontend, backend vazio. |

---

## 4. Aderência aos Requisitos do Adriano

| Requisito | Status | Implementação |
| :--- | :--- | :--- |
| **Flexibilidade** | ✅ | Helpers de derivação permitem mudanças rápidas na UI. |
| **Visual Simples** | ✅ | Design SaaS Dark Mode com KPIs claros. |
| **Uso no Celular** | ✅ | Componentes responsivos e Mobile-First no Wizard de Visitas. |
| **Notas Rápidas** | ✅ | Wizard de visita com NLP simples para sugerir pendências. |
| **Delegar Ações** | ⚠️ | Campo `responsavel` existe, mas não há um módulo de Equipe/Usuários. |

---

## 5. Checklist Pré-Integração Backend

- ✅ **Mappers de Leitura**: Todos os `raw.ts` estão prontos para receber o JSON da API.
- ✅ **Adapters de Escrita**: Payload de Visitas e Pendências já convertem IDs para `number`.
- ⚠️ **Sincronização de Enums**: Validar se os `status` (ex: 'agendada', 'realizada') no backend serão exatamente os mesmos do frontend para evitar erros de mapeamento.
- ❌ **Entidades Faltantes**: Backend precisa criar os modelos de `projeto`, `entrega`, `parcela` e `faturamento_cliente`.

---

## 6. Recomendações Arquiteturais

### Curto Prazo
- Padronizar tratamento de `null` vs `undefined` nos Adapters para evitar envio de `null` para campos que o banco espera `not null`.
- Migrar o casting de ID de `parseFloat` para `Number` ou `BigInt` onde for apropriado.

### Médio Prazo
- Implementar o módulo de **Equipe** para transformar o campo `responsavel` em uma chave estrangeira real, permitindo a funcionalidade de "Delegar" solicitada pelo Adriano.

### Pós-Integração Backend
- Implementar **Optimistic Updates** nas listagens de pendências para garantir a "velocidade de caderno" que o usuário deseja.
