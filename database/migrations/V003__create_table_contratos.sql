CREATE TABLE contratos (
    id_contrato SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES clientes(id_cliente),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    servicos_contratados TEXT NOT NULL,
    visitas_previstas_mes INT NOT NULL CHECK (visitas_previstas_mes >= 0),
    inclui_relatorio BOOLEAN NOT NULL,
    observacoes_gerais TEXT
);