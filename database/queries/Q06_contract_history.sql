/* 
  Q06: Histórico de Alterações de Contratos 
  Consumo: Detalhes de Contrato / Auditoria
  Objetivo: Rastrear substituições de contratos (REPLACE) e motivos.
*/

SELECT 
    c.nome AS cliente,
    con_old.id_contrato as id_antigo,
    con_new.id_contrato as id_novo,
    h.data_alteracao,
    h.motivo_alteracao,
    con_new.servicos_contratados as novos_termos
FROM historico_contratos h
JOIN contratos con_old ON h.id_contrato_encerrado = con_old.id_contrato
JOIN contratos con_new ON h.id_contrato_novo = con_new.id_contrato
JOIN clientes c ON con_old.id_cliente = c.id_cliente
ORDER BY h.data_alteracao DESC;
