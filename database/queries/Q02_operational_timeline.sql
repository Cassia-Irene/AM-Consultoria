/*
  Q02: Linha do Tempo Operacional (Timeline) - VERSÃO ANALÍTICA (Densificada)
  Objetivo: Consolidar eventos derivando inteligência operacional via SQL.
  Inclui: Visitas, Pendências, Faturamento, Entregas e Eventos Críticos.
*/

WITH MetadadosContrato AS (
    SELECT 
        con.id_contrato,
        (SELECT CASE WHEN f.pago THEN 'pago' ELSE 'pendente' END 
         FROM faturamento_cliente f 
         WHERE f.id_contrato = con.id_contrato 
         ORDER BY f.mes_ano DESC LIMIT 1) as status_pagamento,
        (SELECT COUNT(*) FROM pendencias p WHERE p.id_contrato = con.id_contrato AND p.resolvida = false) as pendencias_contagem,
        (SELECT COUNT(*) FROM pendencias p WHERE p.id_contrato = con.id_contrato AND p.resolvida = false AND p.data_prazo < CURRENT_DATE) as pendencias_atrasadas
    FROM contratos con
)

-- 1. Visitas
SELECT 
    'visita' as tipo,
    v.id_visita as id_referencia,
    v.id_contrato,
    v.data_hora as data,
    'Visita: ' || v.tipo_visita as titulo,
    c.nome as cliente,
    CASE 
        WHEN v.tipo_visita = 'urgente' THEN 'Intervenção Crítica'
        WHEN v.tipo_visita = 'estruturada' THEN 'Planejamento Estratégico'
        WHEN v.tipo_visita = 'acompanhamento direcionado' THEN 'Monitoramento Técnico'
        ELSE 'Visita de Rotina'
    END as categoria,
    CASE 
        WHEN v.tipo_visita = 'urgente' THEN 'critica'
        WHEN v.tipo_visita = 'acompanhamento direcionado' AND mc.pendencias_atrasadas > 0 THEN 'alta'
        ELSE 'normal'
    END as criticidade,
    mc.status_pagamento,
    mc.pendencias_contagem,
    v.resultados as ultima_visita_resultados,
    (SELECT json_agg(json_build_object('id', p.id_pendencia, 'descricao', p.descricao, 'data_prazo', p.data_prazo))
     FROM (SELECT id_pendencia, descricao, data_prazo FROM pendencias WHERE id_contrato = v.id_contrato AND resolvida = false ORDER BY data_prazo ASC LIMIT 3) p) as pendencias_lista,
    NULL::INT as id_projeto
FROM visitas v
JOIN contratos con ON v.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
JOIN MetadadosContrato mc ON v.id_contrato = mc.id_contrato

UNION ALL

-- 2. Pendências
SELECT 
    'pendencia' as tipo,
    p.id_pendencia as id_referencia,
    p.id_contrato,
    p.data_origem::timestamp as data,
    p.descricao as titulo,
    c.nome as cliente,
    p.responsavel as categoria,
    CASE WHEN p.data_prazo < CURRENT_DATE THEN 'critica' ELSE 'alta' END as criticidade,
    NULL, 0, NULL, NULL, NULL
FROM pendencias p
JOIN contratos con ON p.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
WHERE p.resolvida = false

UNION ALL

-- 3. Entregas (Avanço de Projeto)
SELECT 
    'entrega' as tipo,
    e.id_entrega as id_referencia,
    proj.id_contrato,
    COALESCE(e.data_entrega_real, e.data_entrega_prevista)::timestamp as data,
    'Entrega: ' || e.descricao as titulo,
    c.nome as cliente,
    'Marco de Entrega: ' || proj.titulo as categoria,
    CASE 
        WHEN e.entregue THEN 'normal'
        WHEN e.data_entrega_prevista < CURRENT_DATE THEN 'critica'
        ELSE 'alta'
    END as criticidade,
    NULL, 0, NULL, NULL,
    proj.id_projeto as id_projeto
FROM entregas e
JOIN projetos proj ON e.id_projeto = proj.id_projeto
JOIN contratos con ON proj.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente

UNION ALL

-- 4. Eventos Críticos (Rupturas e Crises)
SELECT 
    'alerta' as tipo,
    ec.id_evento as id_referencia,
    ec.id_contrato,
    ec.data_evento::timestamp as data,
    ec.descricao as titulo,
    c.nome as cliente,
    CASE WHEN ec.acao_tomada IS NOT NULL THEN 'Crise Estabilizada' ELSE 'RUPTURA OPERACIONAL' END as categoria,
    'critica' as criticidade,
    NULL, 0, NULL, NULL, NULL
FROM eventos_criticos ec
JOIN contratos con ON ec.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente

UNION ALL

-- 5. Faturamento
SELECT 
    'financeiro' as tipo,
    f.id_faturamento as id_referencia,
    f.id_contrato,
    f.mes_ano::timestamp as data,
    'Faturamento Mensal' as titulo,
    c.nome as cliente,
    CASE WHEN f.pago THEN 'pago' ELSE 'pendente' END as categoria,
    CASE WHEN NOT f.pago AND f.mes_ano < CURRENT_DATE THEN 'critica' ELSE 'normal' END as criticidade,
    NULL, 0, NULL, NULL, NULL
FROM faturamento_cliente f
JOIN contratos con ON f.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente

ORDER BY data DESC
LIMIT 100;
