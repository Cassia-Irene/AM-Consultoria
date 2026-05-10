/* 
  Q11: Saúde Operacional do Cliente (Drenagem e Horas Invisíveis)
  Objetivo: Centralizar a inteligência de "esforço não faturado" e "desgaste do consultor" no SQL.
  
  Fórmulas de Cálculo:
  - Horas Invisíveis: (Visitas Críticas * 60) + (Visitas Normais * 20) + (Eventos Críticos * 30)
  - Índice de Desgaste: Ponderação entre Urgências (20 pts) e Pendências Atrasadas (15 pts)
*/

WITH DadosVisitas AS (
    SELECT 
        id_contrato,
        SUM(CASE 
            WHEN tipo_visita = 'urgente' THEN 60 
            WHEN tipo_visita = 'acompanhamento direcionado' THEN 45
            WHEN tipo_visita = 'pontual' THEN 30
            ELSE 20 
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
        COUNT(*) * 30 as minutos_eventos
    FROM eventos_criticos
    WHERE data_evento >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY id_contrato
)
SELECT 
    c.nome as cliente,
    con.id_contrato,
    COALESCE(dv.visitas_urgentes, 0) as visitas_urgentes,
    COALESCE(dp.pendencias_atrasadas, 0) as pendencias_atrasadas,
    -- Horas Invisíveis (em minutos)
    COALESCE(dv.minutos_visitas, 0) + COALESCE(de.minutos_eventos, 0) as total_minutos_invisiveis,
    -- Score de Desgaste (0-100)
    ROUND(
        LEAST(100, 
            (COALESCE(dv.visitas_urgentes, 0) * 20) + 
            (COALESCE(dp.pendencias_atrasadas, 0) * 15)
        )
    ) as indice_desgaste,
    -- Perfil do Cliente (Derivado)
    CASE 
        WHEN (COALESCE(dv.visitas_urgentes, 0) * 20) + (COALESCE(dp.pendencias_atrasadas, 0) * 15) > 70 THEN 'drenante'
        WHEN (COALESCE(dv.visitas_urgentes, 0) * 20) + (COALESCE(dp.pendencias_atrasadas, 0) * 15) > 40 THEN 'urgente'
        ELSE 'equilibrado'
    END as perfil
FROM contratos con
JOIN clientes c ON con.id_cliente = c.id_cliente
LEFT JOIN DadosVisitas dv ON con.id_contrato = dv.id_contrato
LEFT JOIN DadosPendencias dp ON con.id_contrato = dp.id_contrato
LEFT JOIN DadosEventos de ON con.id_contrato = de.id_contrato
WHERE con.data_fim IS NULL
ORDER BY indice_desgaste DESC;
