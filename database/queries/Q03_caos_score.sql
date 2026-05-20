/*
  Q03: Score de Caos (Índice de Instabilidade Operacional)
  Objetivo: Calcular o nível de "caos" por contrato.
  Inclui: Visitas Urgentes, Pendências Atrasadas e Eventos Críticos Ativos.
*/

SELECT 
    c.nome as cliente,
    con.id_contrato,
    COUNT(DISTINCT v.id_visita) FILTER (WHERE v.tipo_visita = 'urgente') as visitas_urgentes,
    (SELECT COUNT(*) FROM pendencias p WHERE p.id_contrato = con.id_contrato AND p.resolvida = false AND p.data_prazo < CURRENT_DATE) as pendencias_atrasadas,
    (SELECT COUNT(*) FROM eventos_criticos ec WHERE ec.id_contrato = con.id_contrato AND ec.acao_tomada IS NULL) as eventos_ativos,
    -- Cálculo do Score (Densificado)
    ROUND(
        LEAST(100, 
            (COUNT(DISTINCT v.id_visita) FILTER (WHERE v.tipo_visita = 'urgente' AND v.data_hora >= CURRENT_DATE - INTERVAL '30 days') * 20) + 
            ((SELECT COUNT(*) FROM pendencias p WHERE p.id_contrato = con.id_contrato AND p.resolvida = false AND p.data_prazo < CURRENT_DATE) * 15) +
            ((SELECT COUNT(*) FROM eventos_criticos ec WHERE ec.id_contrato = con.id_contrato AND ec.acao_tomada IS NULL) * 30)
        )
    ) as caos_score
FROM contratos con
JOIN clientes c ON con.id_cliente = c.id_cliente
LEFT JOIN visitas v ON con.id_contrato = v.id_contrato
WHERE con.data_fim IS NULL OR con.data_fim >= CURRENT_DATE
GROUP BY c.nome, con.id_contrato
ORDER BY caos_score DESC;
