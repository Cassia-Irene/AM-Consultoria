from sqlalchemy import DECIMAL, Column, Integer, Numeric, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Projeto(Base):
    __tablename__ = "projetos"  # Plural conforme o diagrama

    id_projeto = Column(Integer, primary_key=True, index=True)
    
    # 🔗 Chave Estrangeira: Todo projeto pertence a um contrato
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    
    # Colunas mapeadas exatamente do seu Modelo Lógico
    titulo = Column(String(100), nullable=False)  # Adicionado título para melhor identificação do projeto
    descricao = Column(Text)  # Adicionado descrição para detalhamento do projeto
    valor_total = Column(Numeric(10, 2), nullable=False)  # Adicionado valor_total para controle financeiro do projeto
    status = Column(String(20), nullable=False)
    data_inicio = Column(Date, nullable=False)
    data_fim_prevista = Column(Date) # Pode ser nulo
    data_fim_real = Column(Date)     # Pode ser nulo
    observacoes_gerais = Column(Text)


    # 🤝 Relacionamentos (Vias de mão dupla)
    contrato = relationship("Contrato", back_populates="projetos")
    visitas = relationship("Visita", back_populates="projeto")
    parcelas = relationship("ProjetoParcela", back_populates="projeto")
    extras = relationship("ProjetoExtra", back_populates="projeto")
    entregas = relationship("Entrega", back_populates="projeto")
    