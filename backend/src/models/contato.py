from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from src.database import Base

class Contato(Base):
    __tablename__ = "contatos"  

    id_contato = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    nome = Column(String(100), nullable=False)
    cargo = Column(String(50))
    papel = Column(String(30), nullable=False)
    telefone = Column(String(20))
    email = Column(String(50))
    observacoes_gerais = Column(Text)

    # Relacionamento com Cliente (muitos contatos para um cliente)
    cliente = relationship("Cliente", back_populates="contatos")
    