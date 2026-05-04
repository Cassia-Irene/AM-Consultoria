from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship # 👈 Importante: Ferramenta de relacionamento
from src.database import Base

class Cliente(Base):
    __tablename__ = "cliente"

    # Colunas
    id_cliente = Column(Integer, primary_key=True, index=True) 
    nome_instituicao = Column(String(200), nullable=False)
    tipo_instituicao = Column(String(50), nullable=False)
    cidade = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default="ativo")
    nivel_complexidade = Column(String(50))
    modalidade_atendimento = Column(String(100))
    observacoes_gerais = Column(Text)

    # 🤝 As "mãos" para segurar as outras tabelas (Via de mão dupla)
    contatos = relationship("Contato", back_populates="cliente")
    contratos = relationship("Contrato", back_populates="cliente")
    visitas = relationship("Visita", back_populates="cliente")