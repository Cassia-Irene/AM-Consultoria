/* 
  Q12: Agenda de Hoje (Visitas Programadas)
  Objetivo: Filtrar exclusivamente as visitas do dia atual com contexto operacional completo.
*/

WITH MetadadosContrato AS (
    SELECT 
        con.id_contrato,
        (SELECT CASE WHEN f.pago THEN 'pago' ELSE 'pendente' END 
         FROM faturamento_cliente f 
         WHERE f.id_contrato = con.id_contrato 
         ORDER BY f.mes_ano DESC LIMIT 1) as status_pagamento,
        (SELECT COUNT(*) FROM pendencias p WHERE p.id_contrato = con.id_contrato AND p.resolvida = false) as pendencias_contagem
    FROM contratos con
)
SELECT 
    v.id_visita,
    v.id_contrato,
    v.data_hora,
    v.tipo_visita,
    v.modalidade,
    v.status,
    c.nome as cliente,
    mc.status_pagamento,
    mc.pendencias_contagem,
    (SELECT resultados FROM visitas v2 WHERE v2.id_contrato = v.id_contrato AND v2.data_hora < v.data_hora AND v2.resultados IS NOT NULL AND v2.resultados != '' ORDER BY v2.data_hora DESC LIMIT 1) as ultima_visita_resultados,
    (SELECT json_agg(json_build_object('id', p.id_pendencia, 'descricao', p.descricao, 'data_prazo', p.data_prazo))
     FROM (SELECT id_pendencia, descricao, data_prazo FROM pendencias WHERE id_contrato = v.id_contrato AND resolvida = false ORDER BY data_prazo ASC LIMIT 3) p) as pendencias_lista
FROM visitas v
JOIN contratos con ON v.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
JOIN MetadadosContrato mc ON v.id_contrato = mc.id_contrato
WHERE v.data_hora::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
ORDER BY v.data_hora ASC;
