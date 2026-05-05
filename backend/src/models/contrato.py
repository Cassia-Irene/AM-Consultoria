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

class HistoricoContrato(Base):
    __tablename__ = "historico_contratos"

    id_historico = Column(Integer, primary_key=True, index=True)
    id_contrato_encerrado = Column(Integer, ForeignKey("contrato.id_contrato"), nullable=False)
    id_contrato_novo = Column(Integer, ForeignKey("contrato.id_contrato"), nullable=False)
    data_alteracao = Column(Date, nullable=False)
    motivo_alteracao = Column(Text, nullable=False)

    contrato_encerrado = relationship("Contrato", foreign_keys=[id_contrato_encerrado])
    contrato_novo = relationship("Contrato", foreign_keys=[id_contrato_novo])