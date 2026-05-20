from sqlalchemy import DECIMAL, Column, Integer, Date, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class ProjetoParcela(Base):
    __tablename__ = "projeto_parcelas"

    id_parcela = Column(Integer, primary_key=True, index=True)
    id_projeto = Column(Integer, ForeignKey("projetos.id_projeto"), nullable=False)
    
    numero_parcela = Column(Integer, nullable=False)
    valor_parcela = Column(Numeric(10, 2), nullable=False) 
    data_pagamento_prevista = Column(Date, nullable=False)
    data_pagamento = Column(Date)
    pago = Column(Boolean, nullable=False, default=False) 

    
    projeto = relationship("Projeto", back_populates="parcelas")