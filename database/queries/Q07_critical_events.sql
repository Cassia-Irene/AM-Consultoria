/* 
  Q07: Eventos Críticos Sem Resposta
  Consumo: Dashboard Alertas / Dashboard Operacional
  Objetivo: Listar ocorrências graves que ainda não foram tratadas pelo consultor.
*/

SELECT 
    c.nome AS cliente,
    ec.descricao,
    ec.data_evento,
    ec.id_visita,
    'pendente' as status_operacional
FROM eventos_criticos ec
JOIN contratos con ON ec.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
WHERE ec.acao_tomada IS NULL OR ec.acao_tomada = ''
ORDER BY ec.data_evento DESC;
