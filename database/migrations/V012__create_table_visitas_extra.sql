CREATE TABLE visitas_extra (
    id_extra SERIAL PRIMARY KEY,
    id_visita INT NOT NULL UNIQUE REFERENCES visitas(id_visita),
    solicitado_por INT NOT NULL REFERENCES contatos(id_contato)
);