from sqlalchemy import Column, Integer, Boolean, Date, Text, ForeignKey, Numeric, String
from sqlalchemy.orm import relationship
from src.database import Base

class Contrato(Base):
    __tablename__ = "contratos"  # ✅ Ajustado para plural conforme V003

    id_contrato = Column(Integer, primary_key=True, index=True)
    # ✅ FK apontando para a tabela 'clientes' (plural) que corrigimos antes
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date) # Pode ser nulo
    
    # ✅ Campo obrigatório no SQL que estava faltando no seu backend
    servicos_contratados = Column(Text, nullable=False)
    
    visitas_previstas_mes = Column(Integer, nullable=False)
    inclui_relatorio = Column(Boolean, nullable=False, default=False)
    
    valor_mensal = Column(Numeric(10, 2), nullable=False, default=0.0)
    status = Column(String(20), nullable=False, default="ativo")
    
    # ✅ Nome corrigido para 'observacoes_gerais' conforme o banco
    observacoes_gerais = Column(Text)

    # Relacionamentos
    cliente = relationship("Cliente", back_populates="contratos")
    visitas = relationship("Visita", back_populates="contrato")
    pendencias = relationship("Pendencia", back_populates="contrato")
    projetos = relationship("Projeto", back_populates="contrato")
    faturamentos = relationship("FaturamentoCliente", back_populates="contrato")
    pagamentos = relationship("ContratoPagamento", back_populates="contrato")
    eventos_criticos = relationship("EventoCritico", back_populates="contrato")

