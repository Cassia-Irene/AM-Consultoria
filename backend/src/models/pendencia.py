from sqlalchemy import Column, Integer, String, Date, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Pendencia(Base):
    __tablename__ = "pendencias"

    id_pendencia = Column(Integer, primary_key=True, index=True)
    # 🔗 FK apontando para visitas
    id_visita = Column(Integer, ForeignKey("visitas.id_visita"), nullable=False)
    
    status = Column(String(20), nullable=False)
    descricao = Column(Text, nullable=False)
    data_identificacao = Column(Date, nullable=False)
    data_resolucao = Column(Date) # Pode ser nulo se a pendência ainda estiver aberta
    resolvida = Column(Boolean, nullable=False, default=False)
    observacoes = Column(Text)

    # 🤝 Relacionamento
    visita = relationship("Visita", back_populates="pendencias")