from sqlalchemy import Column, Integer, String, Date, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from src.database import Base

class Pendencia(Base):
    __tablename__ = "pendencias"

    id_pendencia = Column(Integer, primary_key=True, index=True)
    # 🔗 FKs flexíveis: Pode vir de uma visita ou ser avulsa (ligada direto ao contrato)
    id_visita = Column(Integer, ForeignKey("visitas.id_visita"), nullable=True)
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    
    descricao = Column(Text, nullable=False)
    responsavel = Column(String(100), nullable=False) # Quem deve resolver
    
    data_origem = Column(DateTime(timezone=True), nullable=False) # Quando foi criada
    data_prazo = Column(DateTime(timezone=True)) # Até quando deve ser resolvida
    
    resolvida = Column(Boolean, nullable=False, default=False)
    data_resolucao = Column(DateTime(timezone=True)) # Pode ser nulo se a pendência ainda estiver aberta
    
    observacoes = Column(Text)

    # 🤝 Relacionamentos
    visita = relationship("Visita", back_populates="pendencias")
    contrato = relationship("Contrato", back_populates="pendencias")