from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Entrega(Base):
    __tablename__ = "entregas"

    id_entrega = Column(Integer, primary_key=True, index=True)
    
    # 🔗 FK apontando para o Projeto
    id_projeto = Column(Integer, ForeignKey("projetos.id_projeto"), nullable=False)
    
    titulo = Column(String(100), nullable=False)
    descricao = Column(Text)
    data_prevista = Column(Date, nullable=False)
    data_entrega = Column(Date) # Pode ser nulo se ainda não foi entregue
    status = Column(String(50), nullable=False, default="Pendente")

    # 🤝 Relacionamento
    projeto = relationship("Projeto", back_populates="entregas")