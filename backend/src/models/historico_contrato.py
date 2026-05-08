from sqlalchemy import Column, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class HistoricoContrato(Base):
    __tablename__ = "historico_contratos"

    id = Column(Integer, primary_key=True, index=True)
    id_contrato_encerrado = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    id_contrato_novo = Column(Integer, nullable=True)  
    data_alteracao = Column(DateTime, nullable=False)
    motivo_alteracao = Column(Text, nullable=False)

    # 🤝 Relacionamento
    contrato = relationship("Contrato", back_populates="historicos")