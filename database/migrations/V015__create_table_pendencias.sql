CREATE TABLE pendencias (
    id_pendencia SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contratos(id_contrato),
    id_visita INT REFERENCES visitas(id_visita),
    descricao TEXT NOT NULL,
    responsavel VARCHAR(100) NOT NULL,
    data_origem TIMESTAMP WITH TIME ZONE NOT NULL,
    data_prazo TIMESTAMP WITH TIME ZONE,
    resolvida BOOLEAN NOT NULL DEFAULT FALSE,
    data_resolucao TIMESTAMP WITH TIME ZONE,
    observacoes TEXT
);