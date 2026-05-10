from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Visita(Base):
    __tablename__ = "visitas"

    id_visita = Column(Integer, primary_key=True, index=True)
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    
    # ✅ CORRIGIDO: Era "projects", agora é "projetos" para bater com o seu SQL
    id_projeto = Column(Integer, ForeignKey("projetos.id_projeto")) 
    
    status = Column(String(15), nullable=False)
    data_hora = Column(DateTime, nullable=False)
    duracao_minutos = Column(Integer)
    tipo_visita = Column(String(30), nullable=False)
    modalidade = Column(String(20), nullable=False)
    descricao = Column(Text)
    resultados = Column(Text)

    # Relacionamentos
    contrato = relationship("Contrato", back_populates="visitas")
    projeto = relationship("Projeto", back_populates="visitas")
    visita_extra = relationship("VisitaExtra", back_populates="visita", uselist=False) 
    pendencias = relationship("Pendencia", back_populates="visita")

class MotivoAcionamento(Base):
    __tablename__ = "motivos_acionamento"

    id_motivo = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    slug = Column(String(50), nullable=False, unique=True)
    descricao = Column(Text)