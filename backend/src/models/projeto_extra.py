from sqlalchemy import Boolean, Column, Integer, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class ProjetoExtra(Base):
    __tablename__ = "projetos_extra"

    id_extra = Column(Integer, primary_key=True, index=True)
    # 🔗 FK apontando para projetos
    id_projeto = Column(Integer, ForeignKey("projetos.id_projeto"), nullable=False)
    
    descricao_extra = Column(Text, nullable=False)
    valor_extra = Column(Numeric(10, 2), nullable=False)
    aprovado = Column(Boolean, nullable=False, default=False)

    # 🤝 Relacionamento
    projeto = relationship("Projeto", back_populates="extras")