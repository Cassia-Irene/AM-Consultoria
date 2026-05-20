from sqlalchemy import DECIMAL, Column, Integer, Numeric, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Projeto(Base):
    __tablename__ = "projetos"  # Plural conforme o diagrama

    id_projeto = Column(Integer, primary_key=True, index=True)
    
    
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    
    # Colunas mapeadas exatamente do seu Modelo Lógico
    titulo = Column(String(100), nullable=False)  
    descricao = Column(Text)  
    valor_total = Column(Numeric(10, 2), nullable=False)  # Adicionado valor_total para controle financeiro do projeto
    status = Column(String(20), nullable=False)
    data_inicio = Column(Date, nullable=False)
    data_fim_prevista = Column(Date) 
    data_fim_real = Column(Date)     
    observacoes_gerais = Column(Text)


    
    contrato = relationship("Contrato", back_populates="projetos")
    visitas = relationship("Visita", back_populates="projeto")
    parcelas = relationship("ProjetoParcela", back_populates="projeto")
    extras = relationship("ProjetoExtra", back_populates="projeto")
    entregas = relationship("Entrega", back_populates="projeto")
    