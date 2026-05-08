from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from src.database import Base

class MotivoAcionamento(Base):
    __tablename__ = "motivos_acionamento"

    id_motivo = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    slug = Column(String(50), unique=True, nullable=False)
    descricao = Column(Text, nullable=True)

    # Relacionamento com Visitas
    visitas = relationship("Visita", back_populates="motivo_acionamento")
