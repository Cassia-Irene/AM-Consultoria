from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Visita(Base):
    __tablename__ = "visita"

    id_visita = Column(Integer, primary_key=True, index=True)
    
    # Chaves Estrangeiras obrigatórias [v]
    id_cliente = Column(Integer, ForeignKey("cliente.id_cliente"), nullable=False)
    id_contrato = Column(Integer, ForeignKey("contrato.id_contrato"), nullable=False)
    
    data_visita = Column(Date, nullable=False)
    tipo_visita = Column(String(50), nullable=False)
    modalidade = Column(String(20), nullable=False)
    duracao_estimada_minutos = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="Agendada")
    
    # Campos opcionais para registo técnico
    descricao = Column(Text)
    resultado = Column(Text)

    # Relacionamentos para o SQLAlchemy conseguir "navegar" entre as tabelas
    cliente = relationship("Cliente", back_populates="visitas")
    contrato = relationship("Contrato", back_populates="visitas")
    # pendencias = relationship("Pendencia", back_populates="visita") # 👈 Comentado temporariamente