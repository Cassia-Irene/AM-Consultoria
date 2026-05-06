from sqlalchemy import Column, Integer, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class EventoCritico(Base):
    __tablename__ = "eventos_criticos"

    id_evento = Column(Integer, primary_key=True, index=True)
    # 🔗 FK apontando para visitas
    id_visita = Column(Integer, ForeignKey("visitas.id_visita"), nullable=False)
    
    data_evento = Column(Date, nullable=False)
    descricao = Column(Text, nullable=False)
    acao_tomada = Column(Text) # Pode ser nulo se a ação ainda não foi decidida

    # 🤝 Relacionamento
    visita = relationship("Visita", back_populates="eventos_criticos")
    