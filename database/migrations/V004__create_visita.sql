CREATE TABLE visita (
    id_visita                 SERIAL PRIMARY KEY,
    id_cliente                INTEGER NOT NULL REFERENCES cliente(id_cliente),
    id_contrato               INTEGER NOT NULL REFERENCES contrato(id_contrato),
    data_visita               DATE NOT NULL,
    tipo_visita               VARCHAR(50) NOT NULL,
    modalidade                VARCHAR(20) NOT NULL,
    duracao_estimada_minutos  INTEGER NOT NULL,
    status                    VARCHAR(20) NOT NULL 
    CHECK (status IN ('agendada', 'realizada', 'cancelada')),
    descricao                 TEXT,
    resultado                 TEXT
);