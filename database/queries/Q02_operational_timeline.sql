/*
  Q02: Linha do Tempo Operacional (Timeline) - VERSÃO ANALÍTICA
  Objetivo: Consolidar eventos derivando inteligência operacional via SQL.
  NÃO utiliza campos de sensores físicos.
*/

-- CTE para calcular metadados de apoio
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

-- 1. Visitas (Derivando Severidade e Contexto)
SELECT 
    'visita' as tipo,
    v.id_visita as id_referencia,
    v.id_contrato,
    v.data_hora as data,
    'Visita: ' || v.tipo_visita as titulo,
    c.nome as cliente,
    -- Categoria Derivada (Normalização para o Frontend)
    CASE 
        WHEN v.tipo_visita = 'urgente' THEN 'Reativo (Urgência)'
        WHEN v.tipo_visita = 'estruturada' THEN 'Planejamento'
        WHEN v.tipo_visita = 'acompanhamento direcionado' THEN 'Monitoramento'
        WHEN v.tipo_visita = 'pontual' THEN 'Operacional'
        ELSE 'Rotina'
    END as categoria,
    -- Criticidade Derivada (Inteligência Analítica)
    CASE 
        WHEN v.tipo_visita = 'urgente' THEN 'critica'
        WHEN v.tipo_visita = 'acompanhamento direcionado' AND mc.pendencias_atrasadas > 0 THEN 'alta'
        WHEN v.tipo_visita = 'pontual' AND mc.pendencias_atrasadas > 2 THEN 'alta'
        ELSE 'normal'
    END as criticidade,

    mc.status_pagamento,
    mc.pendencias_contagem,
    v.resultados as ultima_visita_resultados,
    (SELECT json_agg(json_build_object('id', p.id_pendencia, 'descricao', p.descricao, 'data_prazo', p.data_prazo))
     FROM (SELECT id_pendencia, descricao, data_prazo FROM pendencias WHERE id_contrato = v.id_contrato AND resolvida = false ORDER BY data_prazo ASC LIMIT 3) p) as pendencias_lista
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
    NULL, 0, NULL, NULL
FROM pendencias p
JOIN contratos con ON p.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
WHERE p.resolvida = false

UNION ALL

-- 3. Faturamento
SELECT 
    'financeiro' as tipo,
    f.id_faturamento as id_referencia,
    f.id_contrato,
    f.mes_ano::timestamp as data,
    'Faturamento Mensal' as titulo,
    c.nome as cliente,
    CASE WHEN f.pago THEN 'pago' ELSE 'pendente' END as categoria,
    CASE WHEN NOT f.pago AND f.mes_ano < CURRENT_DATE THEN 'critica' ELSE 'normal' END as criticidade,
    NULL, 0, NULL, NULL
FROM faturamento_cliente f
JOIN contratos con ON f.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente

ORDER BY data DESC
LIMIT 100;
