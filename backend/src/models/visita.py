from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from src.database import Base

class Visita(Base):
    __tablename__ = "visitas"

    id_visita = Column(Integer, primary_key=True, index=True)
    
    # 🔗 Chaves Estrangeiras
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    id_projeto = Column(Integer, ForeignKey("projetos.id_projeto"), nullable=True) 
    id_contrato = Column(Integer, ForeignKey("contratos.id_contrato"), nullable=False)
    
    # 🧠 Dimensões Operacionais (A inteligência do sistema)
    tipo_visita = Column(String(50), nullable=False, server_default='rotineira')
    contexto_agendamento = Column(String(30), nullable=False, server_default='planejado')
    
    # 🚦 Contexto de Extra/Caos
    origem_solicitacao = Column(String(30), nullable=True)
    id_contato_solicitante = Column(Integer, ForeignKey("contatos.id_contato"), nullable=True)
    motivo_acionamento_id = Column(Integer, ForeignKey("motivos_acionamento.id_motivo"), nullable=True)
    descricao_trigger = Column(Text, nullable=True)
    
    # 🔥 Métricas de Desgaste e Impacto
    severidade_operacional = Column(String(20), nullable=True)
    tempo_resposta_minutos = Column(Integer, nullable=True)
    impacto_operacional = Column(String(100), nullable=True)
    
    # Dados de Execução
    data_hora = Column(DateTime(timezone=True), nullable=False) 
    modalidade = Column(String(20), nullable=False)
    duracao_estimada_minutos = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="Realizada")
    
    # Registros Técnicos
    descricao = Column(Text)
    resultados = Column(Text)

    # Constraints de Domínio
    __table_args__ = (
        CheckConstraint("tipo_visita IN ('rotineira', 'urgente', 'pontual', 'estruturada', 'acompanhamento_direcionado')"),
        CheckConstraint("contexto_agendamento IN ('planejado', 'extra_proativo', 'extra_reativo')"),
        CheckConstraint("severidade_operacional IN ('baixa', 'moderada', 'alta', 'crítica')"),
    )

    # Relacionamentos
    cliente = relationship("Cliente", back_populates="visitas")
    projeto = relationship("Projeto", back_populates="visitas")
    contrato = relationship("Contrato", back_populates="visitas")
    pendencias = relationship("Pendencia", back_populates="visita")
    eventos_criticos = relationship("EventoCritico", back_populates="visita")
    
    # Relacionamentos de Inteligência
    motivo_acionamento = relationship("MotivoAcionamento", back_populates="visitas")
    contato_solicitante = relationship("Contato")

    # [DEPRECATED] Mantido para migração segura
    visita_extra = relationship("VisitaExtra", back_populates="visita")