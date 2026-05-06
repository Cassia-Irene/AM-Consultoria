CREATE TABLE pendencias (
    id_pendencia SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contratos(id_contrato),
    id_visita INT REFERENCES visitas(id_visita),
    descricao TEXT NOT NULL,
    responsavel VARCHAR(20) NOT NULL,
    data_origem DATE NOT NULL,
    data_prazo DATE,
    resolvida BOOLEAN NOT NULL DEFAULT FALSE,
    data_resolucao DATE
);