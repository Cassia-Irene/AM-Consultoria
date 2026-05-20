from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class ContratoPagamento(Base):
    __tablename__ = "contrato_pagamento"

    id = Column(Integer, primary_key=True, index=True)
    
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    id_tipo_pagamento = Column(Integer, ForeignKey("tipos_pagamento.id_tipo"), nullable=False)
    
    valor = Column(Numeric(10, 2), nullable=False)

    
    contrato = relationship("Contrato", back_populates="pagamentos") 
    tipo_pagamento = relationship("TipoPagamento", back_populates="contratos_pagamento")