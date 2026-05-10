/* 
  Q05: Visão Financeira Consolidada (Recorrente + Projetos)
  Consumo: Analytics Financeiro / Dashboard
  Objetivo: Soma de toda a receita prevista e realizada por mês.
*/

SELECT
    mes,
    SUM(receita_recorrente) AS receita_recorrente,
    SUM(receita_projetos) AS receita_projetos,
    SUM(receita_recorrente) + SUM(receita_projetos) AS receita_total
FROM (
    -- Faturamento de Contratos (Recorrente)
    SELECT 
        DATE_TRUNC('month', mes_ano) AS mes,
        valor_total AS receita_recorrente,
        0 AS receita_projetos
    FROM faturamento_cliente

    UNION ALL

    -- Parcelas de Projetos (Variável)
    SELECT 
        DATE_TRUNC('month', data_pagamento_prevista) AS mes,
        0 AS receita_recorrente,
        valor AS receita_projetos
    FROM projeto_parcelas
) fontes
GROUP BY mes
ORDER BY mes DESC;
