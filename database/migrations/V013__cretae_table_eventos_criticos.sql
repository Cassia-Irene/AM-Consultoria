CREATE TABLE eventos_criticos (
    id_evento SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contratos(id_contrato),
    id_visita INT REFERENCES visitas(id_visita),
    data_evento DATE NOT NULL,
    descricao TEXT NOT NULL,
    tipo_evento VARCHAR(50),
    impacto_operacional VARCHAR(50),
    resolvido BOOLEAN DEFAULT TRUE,
    acao_tomada TEXT
);