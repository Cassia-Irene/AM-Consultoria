from sqlalchemy import Boolean, Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Entrega(Base):
    __tablename__ = "entregas"

    id_entrega = Column(Integer, primary_key=True, index=True)
    
    # 🔗 FK apontando para o Projeto
    id_projeto = Column(Integer, ForeignKey("projetos.id_projeto"), nullable=False)
    
    descricao = Column(Text, nullable=False)
    data_entrega_prevista = Column(Date, nullable=False)
    data_entrega_real = Column(Date) # Pode ser nulo se ainda não foi entregue
    entregue = Column(Boolean, default=False)
    referencia_doc = Column(String(255))

    # 🤝 Relacionamento
    projeto = relationship("Projeto", back_populates="entregas")