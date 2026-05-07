from sqlalchemy import Column, Integer, Date, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Recebimento(Base):
    __tablename__ = "recebimentos"

    id_recebimento = Column(Integer, primary_key=True, index=True)
    
    # 🔗 FK apontando para a regra de pagamento do contrato
    id_contrato_pagamento = Column(Integer, ForeignKey("contrato_pagamento.id"), nullable=False)
    
    data_recebimento = Column(Date, nullable=False)
    valor_recebido = Column(Numeric(10, 2), nullable=False)
    observacoes = Column(Text) # Campo útil para anotar multas, juros ou detalhes do repasse

    # 🤝 Relacionamento
    contrato_pagamento = relationship("ContratoPagamento", back_populates="recebimentos")