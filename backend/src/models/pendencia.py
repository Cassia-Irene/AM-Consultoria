from sqlalchemy import Column, Integer, String, Date, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Pendencia(Base):
    __tablename__ = "pendencias"

    id_pendencia = Column(Integer, primary_key=True, index=True)
    # 🔗 FK apontando para visitas
    id_visita = Column(Integer, ForeignKey("visitas.id_visita"), nullable=False)
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato")) # Vínculo opcional para facilitar consultas por contrato
    
    descricao = Column(Text, nullable=False)
    data_origem = Column(Date, nullable=False)
    data_prazo = Column(Date, nullable=False)
    data_resolucao = Column(Date) # Pode ser nulo se a pendência ainda estiver aberta
    resolvida = Column(Boolean, nullable=False, default=False)
    responsavel = Column(String(100))
  

    # 🤝 Relacionamento
    visita = relationship("Visita", back_populates="pendencias")
    contrato = relationship("Contrato", back_populates="pendencias")
    