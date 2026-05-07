CREATE TABLE entregas (
    id_entrega SERIAL PRIMARY KEY,
    id_projeto INT NOT NULL REFERENCES projetos(id_projeto),
    descricao TEXT NOT NULL,
    data_entrega_prevista DATE NOT NULL,
    data_entrega_real DATE,
    entregue BOOLEAN NOT NULL DEFAULT FALSE,
    referencia_doc TEXT
);