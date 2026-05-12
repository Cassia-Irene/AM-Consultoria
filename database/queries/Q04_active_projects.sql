/* 
  Q04: Projetos Ativos e Entregas Pendentes
  Consumo: Dashboard Projetos / Detalhes Cliente / Financeiro
  Objetivo: Visão de progresso e valor dos projetos em andamento.
*/

SELECT 
    p.id_projeto as id,
    c.nome AS cliente,
    p.titulo AS projeto,
    p.status,
    p.valor_total,
    (SELECT COUNT(*) FROM entregas e WHERE e.id_projeto = p.id_projeto AND e.entregue = false) as entregas_pendentes,
    (SELECT COUNT(*) FROM projeto_parcelas pp WHERE pp.id_projeto = p.id_projeto AND pp.pago = false) as parcelas_pendentes
FROM projetos p
JOIN contratos con ON p.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
WHERE p.status = 'em andamento'
ORDER BY p.id_projeto DESC;
