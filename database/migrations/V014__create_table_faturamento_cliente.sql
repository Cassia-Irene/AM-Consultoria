CREATE TABLE faturamento_cliente (
    id_faturamento SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contratos(id_contrato),
    mes_ano DATE NOT NULL CHECK (EXTRACT(DAY FROM mes_ano) = 1),
    visitas_realizadas INT CHECK (visitas_realizadas >= 0),
    valor_base DECIMAL(10, 2) NOT NULL CHECK (valor_base >= 0),
    valor_extra DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (valor_extra >= 0),
    desconto DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
    valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total >= 0),
    pago BOOLEAN NOT NULL DEFAULT FALSE,
    data_pagamento DATE,

    CONSTRAINT uq_contrato_mes UNIQUE (id_contrato, mes_ano)
);