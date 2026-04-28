from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Contato(Base):
    __tablename__ = "contato" # Ajustado para o singular conforme o banco

    # Definindo as colunas com base no DBeaver
    id_contato = Column(Integer, primary_key=True, index=True)
    
    # FK apontando para a tabela cliente
    id_cliente = Column(Integer, ForeignKey("cliente.id_cliente"), nullable=False)
    
    nome = Column(String(100), nullable=False)
    cargo = Column(String(100))
    papel = Column(String(50), nullable=False) # Marcado como [v] não nulo no banco
    telefone_whatsapp = Column(String(20))
    email = Column(String(100))
    
    # Campos booleanos corrigidos
    contato_emergencia = Column(Boolean, default=False, nullable=False)
    contato_financeiro = Column(Boolean, default=False, nullable=False)

    # Relacionamento para facilitar buscas no Backend
    cliente = relationship("Cliente", back_populates="contatos")
