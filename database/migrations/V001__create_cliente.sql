CREATE TABLE cliente (
    id_cliente           SERIAL PRIMARY KEY,
    nome_instituicao     VARCHAR(200) NOT NULL,
    tipo_instituicao     VARCHAR(50)  NOT NULL,
    cidade               VARCHAR(100) NOT NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'ativo',
    nivel_complexidade   VARCHAR(50),
    modalidade_atendimento VARCHAR(100),
    observacoes_gerais   TEXT
);