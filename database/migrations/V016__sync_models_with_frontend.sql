-- V016: Sincronização Final de Modelos com Frontend

-- 1. Tabela Contratos: Adicionar campos financeiros e de estado
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS valor_mensal DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ativo';

-- 2. Tabela Visitas: Ajustar precisão de tempo (Timezone)
ALTER TABLE visitas ALTER COLUMN data_hora TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE visitas ALTER COLUMN status TYPE VARCHAR(20); -- Aumentando um pouco a margem

-- 3. Tabela Pendencias: Ajustar precisão de tempo e tamanho de campos
ALTER TABLE pendencias ALTER COLUMN data_origem TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE pendencias ALTER COLUMN data_prazo TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE pendencias ALTER COLUMN data_resolucao TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE pendencias ALTER COLUMN responsavel TYPE VARCHAR(100);

-- Garantir que id_visita seja opcional (já deve ser, mas para reforçar)
ALTER TABLE pendencias ALTER COLUMN id_visita DROP NOT NULL;

-- 4. Sincronização de nomes (se necessário por inconsistência legada)
-- Caso alguma coluna tenha sido criada com nome diferente em migrations passadas
-- ex: ALTER TABLE visitas RENAME COLUMN data TO data_hora; 
-- (V011 já usa data_hora, então estamos ok)
