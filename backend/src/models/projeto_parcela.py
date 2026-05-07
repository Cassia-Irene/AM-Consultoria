from sqlalchemy import Column, Integer, Date, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class ProjetoParcela(Base):
    __tablename__ = "projeto_parcelas"

    id_parcela = Column(Integer, primary_key=True, index=True)
    # 🔗 FK apontando para projetos
    id_projeto = Column(Integer, ForeignKey("projetos.id_projeto"), nullable=False)
    
    numero_parcela = Column(Integer, nullable=False)
    valor_parcela = Column(Numeric(10, 2), nullable=False)
    data_vencimento = Column(Date, nullable=False)
    data_pagamento = Column(Date) # Pode ser nulo se ainda não pagou
    pago = Column(Boolean, nullable=False, default=False)

    # 🤝 Relacionamento
    projeto = relationship("Projeto", back_populates="parcelas")