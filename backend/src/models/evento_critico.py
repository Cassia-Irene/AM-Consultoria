from sqlalchemy import Column, Integer, Date, Text, ForeignKey, String, Boolean
from sqlalchemy.orm import relationship
from src.database import Base

class EventoCritico(Base):
    __tablename__ = "eventos_criticos"

    id_evento = Column(Integer, primary_key=True, index=True)
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    id_visita = Column(Integer, ForeignKey("visitas.id_visita"), nullable=True) # Pode ser nulo se for evento de contrato
    
    data_evento = Column(Date, nullable=False)
    descricao = Column(Text, nullable=False)
    tipo_evento = Column(String(50)) # Novo para simulação
    impacto_operacional = Column(String(50)) # Novo para simulação
    resolvido = Column(Boolean, default=True) # Novo para simulação
    acao_tomada = Column(Text)

    # 🤝 Relacionamentos
    contrato = relationship("Contrato", back_populates="eventos_criticos")
    visita = relationship("Visita", back_populates="eventos_criticos")

    