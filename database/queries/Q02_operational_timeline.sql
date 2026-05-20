/*
  Q02: Linha do Tempo Operacional (Timeline) - VERSÃO DE IMPACTO (Urgências e Crises)
  Regra de negócio: Não colocar entregas que passaram do prazo, isso não é urgência.
  Colocar apenas aquilo que é marcado como urgente ou gerou evento crítico,
  algo que afete negativamente a saúde do contrato.
*/

WITH MetadadosContrato AS (
    SELECT
        con.id_contrato,
        CASE
            WHEN f.pago THEN 'pago'
            WHEN f.mes_ano < CURRENT_DATE THEN 'atrasado'
            ELSE 'pendente'
        END as status_pagamento,
        COUNT(p.id_pendencia) FILTER (WHERE p.resolvida = false) as pendencias_contagem
    FROM contratos con
    LEFT JOIN faturamento_cliente f ON con.id_contrato = f.id_contrato
        AND f.mes_ano = DATE_TRUNC('month', CURRENT_DATE)::DATE
    LEFT JOIN pendencias p ON con.id_contrato = p.id_contrato
    GROUP BY con.id_contrato, f.pago, f.mes_ano
)

-- 1. Visitas de Urgência ou que geraram Evento Crítico
SELECT
    'visita' as tipo,
    v.id_visita as id_referencia,
    v.id_contrato,
    v.data_hora as data,
    initcap(COALESCE(v.tipo_visita, 'rotineira')) || ': ' || initcap(COALESCE(v.modalidade, 'presencial')) as titulo,
    c.nome as cliente,
    CASE
        WHEN v.tipo_visita = 'urgente' THEN 'Intervenção Crítica'
        ELSE 'Visita Geradora de Crise'
    END as categoria,
    'critica'::text as criticidade,
    mc.status_pagamento,
    mc.pendencias_contagem,
    v.resultados as ultima_visita_resultados,
    (SELECT json_agg(json_build_object('id', p.id_pendencia, 'descricao', p.descricao, 'data_prazo', p.data_prazo))
     FROM (SELECT id_pendencia, descricao, data_prazo FROM pendencias WHERE id_contrato = v.id_contrato AND resolvida = false ORDER BY data_origem DESC, id_pendencia DESC LIMIT 3) p) as pendencias_lista,
    NULL::INT as id_projeto
FROM visitas v
JOIN contratos con ON v.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
JOIN MetadadosContrato mc ON v.id_contrato = mc.id_contrato
WHERE v.tipo_visita = 'urgente'
   OR v.id_visita IN (SELECT id_visita FROM eventos_criticos WHERE id_visita IS NOT NULL)

UNION ALL

-- 2. Eventos Críticos (Rupturas e Crises)
SELECT
    'alerta' as tipo,
    ec.id_evento as id_referencia,
    ec.id_contrato,
    ec.data_evento::timestamp as data,
    ec.descricao as titulo,
    c.nome as cliente,
    CASE WHEN ec.acao_tomada IS NOT NULL THEN 'Crise Estabilizada' ELSE 'RUPTURA OPERACIONAL' END as categoria,
    'critica'::text as criticidade,
    NULL, 0, NULL, NULL, NULL
FROM eventos_criticos ec
JOIN contratos con ON ec.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente

ORDER BY data DESC
LIMIT 100;
