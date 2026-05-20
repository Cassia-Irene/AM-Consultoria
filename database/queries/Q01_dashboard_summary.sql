/* 
  Q01: Resumo do Dashboard (Analytics Snapshot)
*/

WITH KPIs AS (
    SELECT 
        (SELECT COUNT(*) FROM contratos WHERE data_fim IS NULL OR data_fim >= CURRENT_DATE) as contratos_ativos,
        (SELECT COUNT(*) FROM pendencias WHERE resolvida = false) as pendencias_abertas,
        (SELECT COUNT(*) FROM eventos_criticos WHERE acao_tomada IS NULL OR acao_tomada = '') as eventos_criticos,
        (SELECT COALESCE(SUM(valor_total), 0) FROM faturamento_cliente WHERE mes_ano >= DATE_TRUNC('month', CURRENT_DATE)::DATE) as faturamento_mes,
        (
            SELECT COUNT(DISTINCT con.id_cliente)
            FROM contratos con
            WHERE con.id_contrato IN (
                SELECT id_contrato FROM faturamento_cliente WHERE NOT pago AND mes_ano < CURRENT_DATE
                UNION
                SELECT id_contrato FROM projetos p JOIN projeto_parcelas pp ON p.id_projeto = pp.id_projeto WHERE NOT pp.pago AND pp.data_pagamento_prevista < CURRENT_DATE
            )
        ) as inadimplencia_count,
        (SELECT COUNT(*) FROM entregas WHERE NOT entregue AND data_entrega_prevista < CURRENT_DATE) as entregas_atraso
)
SELECT * FROM KPIs;
