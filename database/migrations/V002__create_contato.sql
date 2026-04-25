CREATE TABLE contato (
    id_contato          SERIAL PRIMARY KEY,
    id_cliente          INTEGER NOT NULL REFERENCES cliente(id_cliente),
    nome                VARCHAR(100) NOT NULL,
    cargo               VARCHAR(100),
    papel               VARCHAR(50) NOT NULL 
    CHECK (papel IN ('decisor operacional','decisor financeiro','contato de emergencia')),
    telefone_whatsapp   VARCHAR(20),
    email               VARCHAR(100),
    contato_emergencia  boolean NOT NULL DEFAULT false,
    contato_financeiro  boolean NOT NULL DEFAULT false
);