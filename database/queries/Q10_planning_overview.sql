/* 
  Q10: Visão de Planejamento (Workload & Resources)
  Objetivo: Prover indicadores de carga semanal e distribuição de foco.
*/

WITH ContratosAtivos AS (
    SELECT c.id_contrato, cl.nome as cliente_nome
    FROM contratos c
    JOIN clientes cl ON c.id_cliente = cl.id_cliente
    WHERE c.data_fim IS NULL
),
VisitasSemana AS (
    SELECT id_contrato, COUNT(*) as qtd
    FROM visitas
    WHERE data_hora >= DATE_TRUNC('week', CURRENT_DATE)
    GROUP BY id_contrato
),
PendenciasPorNivel AS (
    SELECT 
        id_contrato,
        COUNT(*) FILTER (WHERE data_prazo < CURRENT_DATE) as atrasadas,
        COUNT(*) FILTER (WHERE data_prazo BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as atencao,
        COUNT(*) FILTER (WHERE data_prazo > CURRENT_DATE + INTERVAL '7 days' OR data_prazo IS NULL) as normais
    FROM pendencias
    WHERE resolvida = false
    GROUP BY id_contrato
)
SELECT 
    ca.cliente_nome as cliente,
    COALESCE(vs.qtd, 0) as visitas_semanais,
    COALESCE(pn.atrasadas, 0) as pendencias_atrasadas,
    COALESCE(pn.atencao, 0) as pendencias_atencao,
    COALESCE(pn.normais, 0) as pendencias_normais
FROM ContratosAtivos ca
LEFT JOIN VisitasSemana vs ON ca.id_contrato = vs.id_contrato
LEFT JOIN PendenciasPorNivel pn ON ca.id_contrato = pn.id_contrato
ORDER BY ca.cliente_nome;
