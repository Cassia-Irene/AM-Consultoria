CREATE TABLE contrato (
    id_contrato           SERIAL PRIMARY KEY,
    id_cliente            INTEGER NOT NULL REFERENCES cliente(id_cliente),
    tipo_cobranca         VARCHAR(50) NOT NULL,
    valor_mensal          DECIMAL(10, 2) NOT NULL,
    visitas_previstas_mes INTEGER NOT NULL,
    valor_visita_extra    DECIMAL(10, 2),
    inclui_relatorio      BOOLEAN NOT NULL DEFAULT false,
    data_inicio           DATE NOT NULL,
    data_fim              DATE,
    status                VARCHAR(20) NOT NULL DEFAULT 'ativo',
    motivo_alteracao      TEXT,
    observacoes           TEXT
);