from sqlalchemy import Column, Integer, Boolean, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class FaturamentoCliente(Base):
    __tablename__ = "faturamento_cliente" # Nome exato conforme o diagrama

    id_faturamento = Column(Integer, primary_key=True, index=True)
    
    # 🔗 FK apenas para contrato (Respeitando a 3NF do Backlog)
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    
    mes_ano = Column(Date, nullable=False)
    
    # Valores financeiros
    valor_base = Column(Numeric(10, 2), nullable=False)
    valor_extra = Column(Numeric(10, 2), nullable=False, default=0.00)
    valor_total = Column(Numeric(10, 2), nullable=False)
    
    # Controle de pagamento
    pago = Column(Boolean, nullable=False, default=False)
    data_pagamento = Column(Date) # Pode ser nulo se não estiver pago

    visitas_realizadas = Column(Integer, default=0)
    desconto = Column(Numeric(10,2), default=0)


    # 🤝 Relacionamento
    contrato = relationship("Contrato", back_populates="faturamentos")
    