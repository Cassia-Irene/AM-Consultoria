CREATE TABLE historico_contratos (
    id SERIAL PRIMARY KEY,
    id_contrato_encerrado INT NOT NULL REFERENCES contratos(id_contrato),
    id_contrato_novo INT NOT NULL REFERENCES contratos(id_contrato),
    data_alteracao DATE NOT NULL,
    motivo_alteracao TEXT NOT NULL,
    
    CONSTRAINT chk_hist_contratos_diferentes CHECK (id_contrato_encerrado <> id_contrato_novo)
);