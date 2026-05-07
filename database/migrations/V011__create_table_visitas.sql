CREATE TABLE visitas (
    id_visita SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES clientes(id_cliente),
    id_contrato INT NOT NULL REFERENCES contratos(id_contrato),
    id_projeto INT REFERENCES projetos(id_projeto),
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    modalidade VARCHAR(20) NOT NULL,
    duracao_estimada_minutos INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    descricao TEXT,
    resultados TEXT
);