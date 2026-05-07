CREATE TABLE projeto_parcelas (
    id_parcela SERIAL PRIMARY KEY,
    id_projeto INT NOT NULL REFERENCES projetos(id_projeto),
    numero_parcela INT NOT NULL CHECK (numero_parcela > 0),
    valor_parcela DECIMAL(10, 2) NOT NULL CHECK (valor_parcela >= 0),
    data_pagamento_prevista DATE NOT NULL,
    data_pagamento DATE,
    pago BOOLEAN NOT NULL DEFAULT FALSE
);