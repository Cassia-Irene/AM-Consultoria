from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from src.database import Base

class EventoCritico(Base):
    __tablename__ = "eventos_criticos"

    id_evento = Column(Integer, primary_key=True, index=True)
    
    # 🔗 AJUSTE: O banco exige id_contrato, não id_visita
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    
    id_visita = Column(Integer, ForeignKey("visitas.id_visita"), nullable=True) # Pode ser nulo, pois nem todo evento crítico está ligado a uma visita específica
    # 🆕 CAMPOS NOVOS (Conforme V013)
    descricao = Column(Text, nullable=False)
    data_evento = Column(Date, nullable=False)
    acao_tomada = Column(Text)

    # 🤝 AJUSTE: Relacionamento agora é com Contrato
    contrato = relationship("Contrato", back_populates="eventos_criticos")