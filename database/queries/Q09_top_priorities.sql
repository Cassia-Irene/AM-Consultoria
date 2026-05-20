/* 
  Q09: Top Prioridades (Ações Imediatas)
  Objetivo: Identificar as tarefas mais críticas que exigem ação imediata.
*/

SELECT 
    p.id_pendencia as id,
    p.id_contrato,
    'pendencia' as tipo,
    p.descricao as titulo,
    c.nome as cliente,
    p.data_prazo,
    CASE 
        WHEN p.data_prazo < CURRENT_DATE THEN 'atrasado'
        WHEN p.data_prazo = CURRENT_DATE THEN 'hoje'
        ELSE 'urgente'
    END as status_prazo,
    CASE 
        WHEN p.data_prazo < CURRENT_DATE THEN 100
        WHEN p.data_prazo = CURRENT_DATE THEN 80
        ELSE 50
    END as score_prioridade
FROM pendencias p
JOIN contratos con ON p.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
WHERE p.resolvida = false
ORDER BY score_prioridade DESC, p.data_prazo ASC
LIMIT 5;
