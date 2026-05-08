-- ========================================================
-- MIGRATION: v2_visitas_evolution.sql
-- OBJETIVO: Evoluir a semântica de visitas para inteligência operacional
-- ========================================================

-- 1. Tabela de Motivos de Acionamento (Lookup)
CREATE TABLE IF NOT EXISTS motivos_acionamento (
    id_motivo SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT
);

-- 2. População Inicial de Motivos
INSERT INTO motivos_acionamento (nome, slug) VALUES 
('Conflito de Equipe', 'conflito_equipe'),
('Falta de Cuidador/Profissional', 'falta_cuidador'),
('Erro de Faturamento', 'erro_faturamento'),
('Crise Operacional', 'crise_operacional'),
('Suporte Técnico', 'suporte_tecnico'),
('Alinhamento com Gestão', 'alinhamento_gestao'),
('Outro', 'outro')
ON CONFLICT (slug) DO NOTHING;

-- 3. Evolução da Tabela Visitas (Adição de Dimensões)
-- Nota: Usamos DEFAULT para não quebrar registros existentes
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS tipo_visita VARCHAR(50) DEFAULT 'rotineira' NOT NULL;
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS contexto_agendamento VARCHAR(30) DEFAULT 'planejado' NOT NULL;
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS origem_solicitacao VARCHAR(30);
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS id_contato_solicitante INTEGER REFERENCES contatos(id_contato);
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS motivo_acionamento_id INTEGER REFERENCES motivos_acionamento(id_motivo);
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS descricao_trigger TEXT;
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS severidade_operacional VARCHAR(20);
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS tempo_resposta_minutos INTEGER;
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS impacto_operacional VARCHAR(100);

-- 4. Constraints de Integridade Semântica
ALTER TABLE visitas DROP CONSTRAINT IF EXISTS check_tipo_visita;
ALTER TABLE visitas ADD CONSTRAINT check_tipo_visita CHECK (tipo_visita IN ('rotineira', 'urgente', 'pontual', 'estruturada', 'acompanhamento_direcionado'));

ALTER TABLE visitas DROP CONSTRAINT IF EXISTS check_contexto_agendamento;
ALTER TABLE visitas ADD CONSTRAINT check_contexto_agendamento CHECK (contexto_agendamento IN ('planejado', 'extra_proativo', 'extra_reativo'));

ALTER TABLE visitas DROP CONSTRAINT IF EXISTS check_severidade;
ALTER TABLE visitas ADD CONSTRAINT check_severidade CHECK (severidade_operacional IN ('baixa', 'moderada', 'alta', 'crítica'));

-- 5. Migração de Dados (Incorporando Visitas Extra)
-- Registros que estavam na tabela separada são migrados para o novo modelo unificado
UPDATE visitas 
SET contexto_agendamento = 'extra_reativo',
    descricao_trigger = ve.motivo_extra
FROM visitas_extra ve
WHERE visitas.id_visita = ve.id_visita;

-- 6. Índices Analíticos para Performance de Relatórios
CREATE INDEX IF NOT EXISTS idx_visita_contexto ON visitas(contexto_agendamento);
CREATE INDEX IF NOT EXISTS idx_visita_tipo ON visitas(tipo_visita);
CREATE INDEX IF NOT EXISTS idx_visita_cliente_contexto ON visitas(id_cliente, contexto_agendamento);

-- Nota: A tabela visitas_extra NÃO é removida neste script por segurança (Estratégia Deprecate-first).
