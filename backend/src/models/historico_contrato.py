from sqlalchemy import Column, Integer, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class HistoricoContrato(Base):
    __tablename__ = "historico_contratos"

    id_historico = Column(Integer, primary_key=True, index=True)
    id_contrato_encerrado = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    id_contrato_novo = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    data_alteracao = Column(Date, nullable=False)
    motivo_alteracao = Column(Text, nullable=False)

    contrato_encerrado = relationship("Contrato", foreign_keys=[id_contrato_encerrado])
    contrato_novo = relationship("Contrato", foreign_keys=[id_contrato_novo])