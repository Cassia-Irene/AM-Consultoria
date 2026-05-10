/* 
  Q08: Visitas Extras Por Mês (Potencial de Faturamento)
  Consumo: Dashboard Faturamento / Relatório Mensal
  Objetivo: Identificar trabalho além do contrato para gerar cobranças extras.
*/

SELECT 
    c.nome AS cliente,
    COUNT(ve.id_extra) AS qtd_extras,
    EXTRACT(MONTH FROM v.data_hora) as mes,
    EXTRACT(YEAR FROM v.data_hora) as ano
FROM visitas_extra ve
JOIN visitas v ON ve.id_visita = v.id_visita
JOIN contratos con ON v.id_contrato = con.id_contrato
JOIN clientes c ON con.id_cliente = c.id_cliente
WHERE v.data_hora IS NOT NULL -- Filtro genérico para garantir validade dos dados de visita
GROUP BY c.nome, mes, ano
ORDER BY ano DESC, mes DESC;
