/* 
  Q03: Pendências Abertas por Cliente e Responsável
  Consumo: Página de Pendências / Dashboard
  Objetivo: Listar tarefas pendentes com foco em quem deve resolver.
*/

SELECT 
    c.nome AS cliente,
    p.descricao,
    p.responsavel,
    p.data_origem,
    p.data_prazo,
    CASE 
        WHEN p.data_prazo < CURRENT_DATE THEN 'atrasado'
        ELSE 'no prazo'
    END as status_prazo
FROM pendencias p
JOIN contratos con ON p.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
WHERE p.resolvida = FALSE
ORDER BY p.data_prazo ASC NULLS LAST;
