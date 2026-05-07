CREATE TABLE visitas (
    id_visita SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contratos(id_contrato),
    id_projeto INT REFERENCES projetos(id_projeto),
    status VARCHAR(15) NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    duracao_minutos INT,
    tipo_visita VARCHAR(30) NOT NULL,
    modalidade VARCHAR(20) NOT NULL CHECK (modalidade IN ('presencial', 'remota')),
    descricao TEXT,
    resultados TEXT
);