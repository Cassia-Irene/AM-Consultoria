CREATE TABLE contatos (
    id_contato SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES clientes(id_cliente),
    nome VARCHAR(100) NOT NULL,
    cargo VARCHAR(50),
    papel VARCHAR(30) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(50),
    observacoes_gerais TEXT
);