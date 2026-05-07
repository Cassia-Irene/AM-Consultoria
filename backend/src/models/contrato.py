from sqlalchemy import Column, Integer, Boolean, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Contrato(Base):
    __tablename__ = "contratos"  # ✅ Ajustado para plural conforme V003

    id_contrato = Column(Integer, primary_key=True, index=True)
    # ✅ FK apontando para a tabela 'clientes' (plural) que corrigimos antes
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date) # Pode ser nulo
    
    # ✅ Campo obrigatório no SQL que estava faltando no seu backend
    servicos_contratados = Column(Text, nullable=False)
    
    visitas_previstas_mes = Column(Integer, nullable=False)
    inclui_relatorio = Column(Boolean, nullable=False, default=False)
    
    # ✅ Nome corrigido para 'observacoes_gerais' conforme o banco
    observacoes_gerais = Column(Text)

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
