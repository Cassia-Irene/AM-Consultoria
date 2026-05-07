from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base

class Visita(Base):
    __tablename__ = "visitas" # Plural conforme o diagrama e padrão das outras tabelas

    id_visita = Column(Integer, primary_key=True, index=True)
    
    # 🔗 Chaves Estrangeiras Corrigidas
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False) # ✅ Apontando para o plural
    # ⚠️ No seu diagrama lógico, Visita se liga a Projeto (id_projeto), não a Contrato.
    id_projeto = Column(Integer, ForeignKey("projetos.id_projeto"), nullable=False) 

    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    
    # Nomes de colunas ajustados para espelhar o Modelo Lógico
    data = Column(Date, nullable=False) # Era data_visita
    modalidade = Column(String(20), nullable=False)
    duracao_estimada_minutos = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)
    
    # Campos de registro técnico
    descricao = Column(Text)
    resultado = Column(Text)

    # Relacionamentos
    cliente = relationship("Cliente", back_populates="visitas")
    # Ajustado para Projeto conforme o diagrama
    projeto = relationship("Projeto", back_populates="visitas")
    contrato = relationship("Contrato", back_populates="visitas")
    pendencias = relationship("Pendencia", back_populates="visita")
    eventos_criticos = relationship("EventoCritico", back_populates="visita")
    visita_extra = relationship("VisitaExtra", back_populates="visita")