Para ajudar a Cássia na integração do Front-end com o Back-end que acabamos de blindar, 
aqui está um resumo técnico do "estado da arte" da API. Você pode encaminhar este guia para 
ela para garantir que as comunicações entre Next.js e FastAPI funcionem sem erros. 

Guia Técnico para Integração (Cássia & Leonardo) 
1. Estratégia de Edição (O ponto mais importante) 
Diferente de um CRUD comum, dividimos a edição em duas categorias para proteger a 
integridade financeira: 
● PATCH Restrito (Cosmético): Usado para corrigir erros de digitação ou observações. 
○ Onde: /contratos/{id_contrato} 
○ O que permite: Apenas servicos_contratados, observacoes_gerais e 
inclui_relatorio. 
○ Regra: Se o contrato estiver encerrado (data_fim preenchida), o Back-end 
bloqueia qualquer alteração. 
● REPLACE (Estrutural/Negócio): Usado quando o valor do contrato ou as visitas 
mensais mudam. 
○ Rota: POST /contratos/{id_contrato}/replace 
○ Como funciona: Ele encerra o contrato atual (seta a data_fim) e cria um novo 
com os dados atualizados, mantendo o histórico de versões. 
2. Inteligência de Faturamento 
O Back-end agora é o "dono da verdade" nos cálculos. 
● Cálculo Automático: Ao enviar um PATCH em /faturamento-cliente/{id} alterando 
apenas o campo desconto, o Back-end recalcula automaticamente o valor_total usando 
a fórmula: valor_base + valor_extra - desconto. 
● Dica para o Front: Não é necessário enviar o valor_total calculado pelo Front; o 
sistema irá ignorar e salvar o cálculo correto feito no servidor. 
3. Sincronização de Nomes de Campos 
Para que as interfaces Raw da Cássia (ex: cliente.raw.ts) batam com os nossos modelos, os 
campos principais no banco são: 
● Clientes: id_cliente, nome, tipo_instituicao, cidade, status, nivel_complexidade, 
observacoes_gerais. 
● Contatos: id_contato, id_cliente, nome, cargo, papel, telefone, email, 
observacoes_gerais. 
● Visitas: id_visita, id_contrato, id_projeto, status, data_hora (DateTime), 
duracao_minutos, tipo_visita, modalidade, descricao, resultados. 
4. Pendências e Dashboard (Próximos Passos) 
A Melissa entregará 6 queries SQL que alimentarão o Dashboard. Assim que elas chegarem, o 
Back-end terá os seguintes endpoints novos: 
1. Pendências abertas por cliente. 
2. Visitas extras a cobrar. 
3. Contratos vencendo em 30 dias. 
4. Eventos críticos sem ação. 
5. Faturamento consolidado (Gráfico). 
6. Duração média de visitas. 


Dicas de Integração para a Cássia: 
1. Swagger é o seu melhor amigo: Acesse http://127.0.0.1:8000/docs. Lá você verá 
exatamente quais campos são opcionais (marcados como | None no Python). 
2. Tratamento de Strings: No campo status de Projetos, use sempre a palavra exata com 
acento ("concluído", "em andamento") para evitar erros de restrição (Check 
Constraint) no banco de dados. 
3. Flags de Configuração: No seu arquivo api.ts, lembre-se de mudar USE_MOCKS para 
false para começar a receber os dados reais que o Leonardo testou hoje.