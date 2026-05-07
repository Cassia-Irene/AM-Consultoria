CREATE TABLE projetos (
    id_projeto SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contratos(id_contrato),
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    data_inicio DATE NOT NULL,
    data_fim_prevista DATE,
    data_fim_real DATE,
    valor_total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('em andamento', 'concluído', 'cancelado')),
    observacoes_gerais TEXT
);