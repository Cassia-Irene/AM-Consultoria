/*
  Q02: Linha do Tempo Operacional (Timeline)
  Objetivo: Consolidar eventos de visitas, pendências, faturamento e alertas.
  Inclui metadados detalhados para o Modo Caos.
*/

-- 1. Visitas
SELECT 
    'visita' as tipo,
    v.id_visita as id_referencia,
    v.id_contrato,
    v.data_hora as data,
    'Visita: ' || v.tipo_visita as titulo,
    c.nome as cliente,
    v.status as categoria,
    CASE WHEN v.tipo_visita = 'urgente' THEN 'alta' ELSE 'normal' END as criticidade,
    -- Campos extras para o Modo Caos
    (SELECT CASE WHEN f.pago THEN 'pago' ELSE 'pendente' END 
     FROM faturamento_cliente f 
     WHERE f.id_contrato = v.id_contrato 
     ORDER BY f.mes_ano DESC LIMIT 1) as status_pagamento,
    (SELECT COUNT(*) FROM pendencias p WHERE p.id_contrato = v.id_contrato AND p.resolvida = false) as pendencias_contagem,
    -- O que foi feito na última visita
    (SELECT resultados FROM visitas v2 
     WHERE v2.id_contrato = v.id_contrato 
       AND v2.data_hora < v.data_hora 
       AND v2.resultados IS NOT NULL 
       AND v2.resultados <> ''
     ORDER BY v2.data_hora DESC LIMIT 1) as ultima_visita_resultados,
    -- NOVO: Lista de pendências em aberto formatada como JSON
    (SELECT json_agg(json_build_object(
        'id', p.id_pendencia,
        'descricao', p.descricao,
        'data_prazo', p.data_prazo
    ))
     FROM (
        SELECT id_pendencia, descricao, data_prazo 
        FROM pendencias 
        WHERE id_contrato = v.id_contrato AND resolvida = false
        ORDER BY data_prazo ASC NULLS LAST
        LIMIT 3
     ) p) as pendencias_lista
FROM visitas v
JOIN contratos con ON v.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente

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
    NULL as status_pagamento,
    0 as pendencias_contagem,
    NULL as ultima_visita_resultados,
    NULL as pendencias_lista
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
    NULL as status_pagamento,
    0 as pendencias_contagem,
    NULL as ultima_visita_resultados,
    NULL as pendencias_lista
FROM faturamento_cliente f
JOIN contratos con ON f.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente

UNION ALL

-- 4. Eventos Críticos
SELECT 
    'alerta' as tipo,
    ec.id_evento as id_referencia,
    ec.id_contrato,
    ec.data_evento::timestamp as data,
    ec.descricao as titulo,
    c.nome as cliente,
    'Crítico' as categoria,
    'critica' as criticidade,
    NULL as status_pagamento,
    0 as pendencias_contagem,
    NULL as ultima_visita_resultados,
    NULL as pendencias_lista
FROM eventos_criticos ec
JOIN contratos con ON ec.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
WHERE ec.acao_tomada IS NULL OR ec.acao_tomada = ''

UNION ALL

-- 5. Entregas de Projeto
SELECT 
    'projeto' as tipo,
    e.id_entrega as id_referencia,
    p.id_contrato,
    e.data_entrega_prevista::timestamp as data,
    'Entrega: ' || e.descricao as titulo,
    c.nome as cliente,
    p.titulo as categoria,
    CASE WHEN NOT e.entregue AND e.data_entrega_prevista < CURRENT_DATE THEN 'alta' ELSE 'normal' END as criticidade,
    NULL as status_pagamento,
    0 as pendencias_contagem,
    NULL as ultima_visita_resultados,
    NULL as pendencias_lista
FROM entregas e
JOIN projetos p ON e.id_projeto = p.id_projeto
JOIN contratos con ON p.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente

ORDER BY data DESC
LIMIT 100;
