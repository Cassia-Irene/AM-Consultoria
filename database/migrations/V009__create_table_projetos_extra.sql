CREATE TABLE projetos_extra (
    id_extra SERIAL PRIMARY KEY,
    id_projeto INT NOT NULL UNIQUE REFERENCES projetos(id_projeto),
    solicitado_por INT NOT NULL REFERENCES contatos(id_contato),
    aprovado_por INT REFERENCES contatos(id_contato)
);