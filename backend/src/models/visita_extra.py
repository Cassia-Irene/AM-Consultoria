from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

# ⚠️ [DEPRECATED] Esta tabela está sendo descontinuada.
# Novas visitas (mesmo as extras) devem ser registradas na tabela 'visitas'
# usando o campo 'contexto_agendamento'.
class VisitaExtra(Base):
    __tablename__ = "visitas_extra"

    id_extra = Column(Integer, primary_key=True, index=True)
    # 🔗 FK apontando para visitas
    id_visita = Column(Integer, ForeignKey("visitas.id_visita"), nullable=False)
    
    motivo_extra = Column(Text, nullable=False)

    # 🤝 Relacionamento
    visita = relationship("Visita", back_populates="visita_extra")