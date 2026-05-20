from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class VisitaExtra(Base):
    __tablename__ = "visitas_extra"

    id_extra = Column(Integer, primary_key=True, index=True)
    id_visita = Column(Integer, ForeignKey("visitas.id_visita"), nullable=False)
    solicitado_por = Column(Integer, ForeignKey("contatos.id_contato"), nullable=False) 

    
    visita = relationship("Visita", back_populates="visita_extra")
