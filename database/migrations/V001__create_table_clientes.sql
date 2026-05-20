CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo_instituicao VARCHAR(100) NOT NULL,
    cidade VARCHAR(50) NOT NULL,
    nivel_complexidade VARCHAR(15) NOT NULL CHECK (nivel_complexidade IN ('baixa', 'média', 'alta')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ativo', 'inativo')),
    observacoes_gerais TEXT
);