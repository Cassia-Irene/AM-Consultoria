from sqlalchemy import Column, Integer, Boolean, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from .historico_contrato import HistoricoContrato
from src.database import Base

class Contrato(Base):
    __tablename__ = "contratos"

    id_contrato = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date)
    servicos_contratados = Column(Text, nullable=False)
    visitas_previstas_mes = Column(Integer, nullable=False)
    inclui_relatorio = Column(Boolean, nullable=False, default=False)
    observacoes_gerais = Column(Text)    

    # Relacionamentos
    cliente = relationship("Cliente", back_populates="contratos")
    visitas = relationship("Visita", back_populates="contrato")
    faturamentos = relationship("FaturamentoCliente", back_populates="contrato")
    eventos_criticos = relationship("EventoCritico", back_populates="contrato")
    historicos = relationship("HistoricoContrato", back_populates="contrato", foreign_keys="[HistoricoContrato.id_contrato_encerrado]")
    projetos = relationship("Projeto", back_populates="contrato")
    pendencias = relationship("Pendencia", back_populates="contrato")
    pagamentos = relationship("ContratoPagamento", back_populates="contrato")