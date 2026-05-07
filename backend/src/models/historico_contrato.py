from sqlalchemy import Column, Integer, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class HistoricoContrato(Base):
    __tablename__ = "historico_contratos"

    id_historico = Column(Integer, primary_key=True, index=True) # Adaptado para seguir o padrão id_tabela
    
    # 🔗 FK apontando para o contrato
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    
    # Campos do mapa lógico
    data_alteracao = Column(Date, nullable=False)
    motivo_alteracao = Column(Text, nullable=False)

    # 🤝 Relacionamento
    contrato = relationship("Contrato", back_populates="historicos")