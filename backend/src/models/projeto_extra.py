from sqlalchemy import Boolean, Column, Date, Integer, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class ProjetoExtra(Base):
    __tablename__ = "projetos_extra"

    id_extra = Column(Integer, primary_key=True, index=True)
    id_projeto = Column(Integer, ForeignKey("projetos.id_projeto"), nullable=False)
    solicitado_por = Column(Integer, ForeignKey("contatos.id_contato"), nullable=False) # ID do usuário que solicitou o extra
    aprovado_por = Column(Integer, ForeignKey("contatos.id_contato")) # ID do usuário que aprovou o extra (pode ser nulo se ainda não aprovado)


    # 🤝 Relacionamento
    projeto = relationship("Projeto", back_populates="extras")