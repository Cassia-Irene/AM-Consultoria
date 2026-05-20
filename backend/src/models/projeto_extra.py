from sqlalchemy import Boolean, Column, Date, Integer, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class ProjetoExtra(Base):
    __tablename__ = "projetos_extra"

    id_extra = Column(Integer, primary_key=True, index=True)
    id_projeto = Column(Integer, ForeignKey("projetos.id_projeto"), nullable=False, unique=True)
    solicitado_por = Column(Integer, ForeignKey("contatos.id_contato"), nullable=False) 
    aprovado_por = Column(Integer, ForeignKey("contatos.id_contato"))


    
    projeto = relationship("Projeto", back_populates="extras")
    solicitante = relationship("Contato", foreign_keys=[solicitado_por])
    aprovador = relationship("Contato", foreign_keys=[aprovado_por])
