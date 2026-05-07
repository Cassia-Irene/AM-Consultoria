# Importa o Base para o Alembic conseguir ler os metadados de todas as tabelas
from src.database import Base

# Importa todos os modelos para que eles sejam registrados no Base.metadata
from src.models.cliente import Cliente
from src.models.contato import Contato
from src.models.contrato import Contrato
from src.models.historico_contrato import HistoricoContrato
from src.models.projeto import Projeto
from src.models.projeto_parcela import ProjetoParcela
from src.models.projeto_extra import ProjetoExtra
from src.models.entrega import Entrega
from src.models.visita import Visita
from src.models.visita_extra import VisitaExtra
from src.models.pendencia import Pendencia
from src.models.evento_critico import EventoCritico
from src.models.tipo_pagamento import TipoPagamento
from src.models.contrato_pagamento import ContratoPagamento
from src.models.recebimento import Recebimento
from src.models.faturamento_cliente import FaturamentoCliente