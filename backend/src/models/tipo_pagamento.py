from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base

class TipoPagamento(Base):
    __tablename__ = "tipos_pagamento"

    id_tipo = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(50), nullable=False, unique=True)

    
    contratos_pagamento = relationship("ContratoPagamento", back_populates="tipo_pagamento")