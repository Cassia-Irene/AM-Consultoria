/* 
  Q11: Saúde Operacional do Cliente (Avanço vs Desgaste)
  Objetivo: Consolidar o equilíbrio entre progresso (Entregas) e ruído (Eventos/Atrasos).
*/

WITH DadosVisitas AS (
    SELECT 
        id_contrato,
        SUM(CASE 
            WHEN tipo_visita = 'urgente' THEN 60 
            ELSE 30 
        END) as minutos_visitas,
        COUNT(*) FILTER (WHERE tipo_visita = 'urgente') as visitas_urgentes
    FROM visitas
    WHERE data_hora >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY id_contrato
),
DadosPendencias AS (
    SELECT 
        id_contrato,
        COUNT(*) FILTER (WHERE resolvida = false AND data_prazo < CURRENT_DATE) as pendencias_atrasadas
    FROM pendencias
    GROUP BY id_contrato
),
DadosEventos AS (
    SELECT 
        id_contrato,
        COUNT(*) FILTER (WHERE acao_tomada IS NULL) as eventos_ativos,
        COUNT(*) * 45 as minutos_eventos
    FROM eventos_criticos
    WHERE data_evento >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY id_contrato
),
DadosEntregas AS (
    SELECT 
        proj.id_contrato,
        COUNT(*) as total_entregas,
        COUNT(*) FILTER (WHERE e.entregue = true) as entregas_concluidas,
        COUNT(*) FILTER (WHERE e.entregue = false AND e.data_entrega_prevista < CURRENT_DATE) as entregas_atrasadas,
        MAX(e.data_entrega_real) as ultima_entrega
    FROM entregas e
    JOIN projetos proj ON e.id_projeto = proj.id_projeto
    GROUP BY proj.id_contrato
)

SELECT 
    c.nome as cliente,
    con.id_contrato,
    COALESCE(dv.visitas_urgentes, 0) as visitas_urgentes,
    COALESCE(dp.pendencias_atrasadas, 0) as pendencias_atrasadas,
    COALESCE(de.eventos_ativos, 0) as eventos_ativos,
    COALESCE(dent.entregas_atrasadas, 0) as entregas_atrasadas,
    -- Progresso Médio (%)
    CASE 
        WHEN COALESCE(dent.total_entregas, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(dent.entregas_concluidas, 0)::float / dent.total_entregas) * 100)
    END as progresso_medio,
    dent.ultima_entrega as ultima_entrega_data,
    -- Horas Invisíveis (em minutos)
    COALESCE(dv.minutos_visitas, 0) + COALESCE(de.minutos_eventos, 0) as total_minutos_invisiveis,
    -- Status Operacional (Derivado de Fatos: Estagnação e Ruptura)
    CASE 
        -- EMERGÊNCIA: Crise ativa OU mais de 45 dias sem avanço real (estagnação crítica)
        WHEN COALESCE(de.eventos_ativos, 0) > 0 
             OR (dent.ultima_entrega < CURRENT_DATE - INTERVAL '45 days') 
             OR (dent.ultima_entrega IS NULL AND con.data_inicio < CURRENT_DATE - INTERVAL '60 days')
             THEN 'emergência'
        
        -- ATENÇÃO: Muitas pendências atrasadas OU mais de 21 dias sem avanço real (estagnação inicial)
        WHEN COALESCE(dp.pendencias_atrasadas, 0) > 3 
             OR (dent.ultima_entrega < CURRENT_DATE - INTERVAL '21 days')
             OR (dent.ultima_entrega IS NULL AND con.data_inicio < CURRENT_DATE - INTERVAL '30 days')
             THEN 'atenção'
             
        ELSE 'normal'
    END as status_operacional
FROM contratos con
JOIN clientes c ON con.id_cliente = c.id_cliente
LEFT JOIN DadosVisitas dv ON con.id_contrato = dv.id_contrato
LEFT JOIN DadosPendencias dp ON con.id_contrato = dp.id_contrato
LEFT JOIN DadosEventos de ON con.id_contrato = de.id_contrato
LEFT JOIN DadosEntregas dent ON con.id_contrato = dent.id_contrato
WHERE con.data_fim IS NULL
ORDER BY eventos_ativos DESC, visitas_urgentes DESC;
