# Plano de Integração: Frontend ↔ Backend

Este plano define a estratégia para remover os mocks do frontend e conectar o sistema AM Consultoria ao banco de dados real de forma segura.

## 1. Fase de Estabilização do Banco (Semana 1)

Antes de conectar, o Backend deve ser ajustado para suportar os requisitos do Frontend.

### Ordem de Correção nos Models SQLAlchemy:
1. **Contrato**: Adicionar `valor_mensal` e `status`.
2. **Visita**: Tornar `id_projeto` nullable e mudar `data` para `data_hora` (DateTime).
3. **Pendência**: Adicionar `id_contrato` (nullable FK), `responsavel` (string) e `data_prazo`.
4. **Faturamento**: Implementar campos de `pago` e `valor_extra`.

## 2. Fase de Sincronização de Contratos (D-Day)

Mudar a variável `USE_MOCKS` para `false` por módulo.

### Sequência recomendada:
1. **Clientes & Contatos**: Módulo mais simples, serve de teste de conexão.
2. **Contratos**: Base para os outros módulos.
3. **Visitas**: Requer que Clientes e Contratos estejam funcionando.
4. **Pendências**: Requer Visitas e Contratos.
5. **Projetos & Financeiro**: Módulos finais de consolidação.

## 3. Quick Wins (Ganhos Imediatos)

- **Unificação de Nomenclatura**: Renomear campos no backend para baterem com o frontend (ex: `resultado` -> `resultados`). Isso evita refatorar 20+ telas de UI.
- **Mappers Resilientes**: Manter os mappers de frontend ativos mesmo com a API real, para garantir que o domínio permaneça limpo e as datas sejam tratadas centralizadamente.

## 4. Riscos de Regressão

- **Persistência de Status**: O backend pode tentar impor um status que o frontend já sabe calcular dinamicamente.
- **Filtros de Dashboard**: O dashboard hoje filtra dados em memória. Após a integração, alguns filtros (ex: por mês/ano) devem ser migrados para Query Params da API para escala.

## 5. Próximos Passos Imediatos

1. Executar as migrations de alteração de tabela no banco.
2. Atualizar os Schemas Pydantic no FastAPI.
3. Testar o `POST /visitas` com o Wizard do frontend (ponto de maior fricção).
