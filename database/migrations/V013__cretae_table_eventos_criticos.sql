CREATE TABLE eventos_criticos (
    id_evento SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contratos(id_contrato),
    id_visita INT REFERENCES visitas(id_visita),
    data_evento DATE NOT NULL,
    descricao TEXT NOT NULL,
    acao_tomada TEXT
);