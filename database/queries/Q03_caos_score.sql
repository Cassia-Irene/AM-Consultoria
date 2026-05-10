/*
  Q03: Score de Caos (Índice de Instabilidade Operacional)
  Objetivo: Calcular o nível de "caos" por contrato via SQL.
  Métrica: (Visitas Urgentes + Pendências Atrasadas) / Total de Interações
*/

SELECT 
    c.nome as cliente,
    con.id_contrato,
    COUNT(v.id_visita) FILTER (WHERE v.tipo_visita = 'urgente') as visitas_urgentes,
    (SELECT COUNT(*) FROM pendencias p WHERE p.id_contrato = con.id_contrato AND p.resolvida = false AND p.data_prazo < CURRENT_DATE) as pendencias_atrasadas,
    -- Cálculo do Score (0 a 100)
    ROUND(
        LEAST(100, 
            (COUNT(v.id_visita) FILTER (WHERE v.tipo_visita = 'urgente') * 20) + 
            ((SELECT COUNT(*) FROM pendencias p WHERE p.id_contrato = con.id_contrato AND p.resolvida = false AND p.data_prazo < CURRENT_DATE) * 15)
        )
    ) as caos_score
FROM contratos con
JOIN clientes c ON con.id_cliente = c.id_cliente
LEFT JOIN visitas v ON con.id_contrato = v.id_contrato AND v.data_hora >= CURRENT_DATE - INTERVAL '30 days'
WHERE con.data_fim IS NULL
GROUP BY c.nome, con.id_contrato
ORDER BY caos_score DESC;
