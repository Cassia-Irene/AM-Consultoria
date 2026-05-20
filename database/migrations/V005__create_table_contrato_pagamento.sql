CREATE TABLE contrato_pagamento (
    id SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contratos(id_contrato),
    id_tipo_pagamento INT NOT NULL REFERENCES tipos_pagamento(id_tipo),
    valor DECIMAL(10, 2) NOT NULL
);