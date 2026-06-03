/* 
  Q14: Pendências Abertas por Cliente e Responsável
  Consumo: Página de Pendências / Dashboard
  Objetivo: Listar todas as tarefas pendentes com foco em quem deve resolver.
  Renomeado de Q03_open_pendencies para Q14_open_pendencies (evitar conflito com Q03_caos_score).
*/

SELECT 
    p.id_pendencia as id,
    c.nome AS cliente,
    p.descricao,
    p.responsavel,
    p.data_origem,
    p.data_prazo,
    CASE 
        WHEN p.data_prazo < CURRENT_DATE THEN 'atrasado'
        WHEN p.data_prazo = CURRENT_DATE THEN 'hoje'
        WHEN p.data_prazo <= CURRENT_DATE + INTERVAL '3 days' THEN 'breve'
        ELSE 'planejado'
    END as status_prazo

FROM pendencias p
JOIN contratos con ON p.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
WHERE p.resolvida = FALSE
ORDER BY p.data_prazo ASC NULLS LAST;
