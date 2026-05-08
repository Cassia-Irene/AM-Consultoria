from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship # 👈 Importante: Ferramenta de relacionamento
from src.database import Base

class Cliente(Base):
    __tablename__ = "clientes" # Nome da tabela no plural conforme o DBeaver

    # Colunas
    id_cliente = Column(Integer, primary_key=True, index=True) 
    nome = Column(String(100), nullable=False) # Era nome_instituicao
    tipo_instituicao = Column(String(100), nullable=False)
    cidade = Column(String(50), nullable=False)
    nivel_complexidade = Column(String(15), nullable=False)
    status = Column(String(20), nullable=False)
    observacoes_gerais = Column(Text)

    # 🤝 As "mãos" para segurar as outras tabelas (Via de mão dupla)
    contatos = relationship("Contato", back_populates="cliente")
    contratos = relationship("Contrato", back_populates="cliente")
    # visitas = relationship("Visita", back_populates="cliente")