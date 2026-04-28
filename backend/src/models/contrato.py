from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Contrato(Base):
    __tablename__ = "contrato" # Nome singular conforme o DBeaver

    id_contrato = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("cliente.id_cliente"), nullable=False)
    
    tipo_cobranca = Column(String(50), nullable=False)
    valor_mensal = Column(Numeric(10, 2), nullable=False)
    visitas_previstas_mes = Column(Integer, nullable=False)
    valor_visita_extra = Column(Numeric(10, 2)) # Pode ser nulo
    
    inclui_relatorio = Column(Boolean, nullable=False, default=False)
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date) # Pode ser nulo se o contrato for indeterminado
    
    status = Column(String(20), nullable=False, default="ativo")
    motivo_alteracao = Column(Text)
    observacoes = Column(Text)

    # Relacionamentos
    cliente = relationship("Cliente", back_populates="contratos")
    visitas = relationship("Visita", back_populates="contrato")