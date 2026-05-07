from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from src.database import Base

class Projeto(Base):
    __tablename__ = "projetos"  # Plural conforme o diagrama

    id_projeto = Column(Integer, primary_key=True, index=True)
    
    # 🔗 Chave Estrangeira: Todo projeto pertence a um contrato
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    
    # Colunas mapeadas do Modelo Lógico e Migração V007
    titulo = Column(String(100), nullable=False)
    descricao = Column(Text)
    
    status = Column(String(20), nullable=False) # Renomeado de status_atual para status (bater com front)
    data_inicio = Column(Date, nullable=False)
    data_fim_prevista = Column(Date) # Sincronizado nome
    data_fim_real = Column(Date)
    
    valor_total = Column(Numeric(10, 2), nullable=False, default=0.0)
    
    observacoes_gerais = Column(Text)

    # 🤝 Relacionamentos (Vias de mão dupla)
    contrato = relationship("Contrato", back_populates="projetos")
    visitas = relationship("Visita", back_populates="projeto")
    parcelas = relationship("ProjetoParcela", back_populates="projeto")
    extras = relationship("ProjetoExtra", back_populates="projeto")
    entregas = relationship("Entrega", back_populates="projeto")
    