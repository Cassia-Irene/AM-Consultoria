from sqlalchemy.orm import Session
from src.models import (
    Cliente, Contrato, Contato, ContratoPagamento, 
    HistoricoContrato, TipoPagamento, Projeto, Entrega,
    ProjetoParcela, ProjetoExtra
)
from seeds.utils import ensure_tipos_pagamento
from typing import Tuple, List

class Scenario:
    def __init__(self, db: Session):
        self.db = db
        self.tipos_pagamento = ensure_tipos_pagamento(db)

    def generate_structure(self) -> Tuple[Cliente, Contrato]:
        """Gera ou atualiza os dados estáticos estruturais."""
        raise NotImplementedError

    def simulate_timeline(self, cliente: Cliente, contrato: Contrato, mode: str = "realistic"):
        """Gera a linha do tempo (Visitas -> Pendências -> Faturamento -> Eventos) causalmente ancorada."""
        raise NotImplementedError

    def _add_and_commit(self, objects: List):
        """Persiste uma lista de objetos e faz refresh para obter IDs."""
        if not objects:
            return
        for obj in objects:
            self.db.add(obj)
        self.db.commit()
        for obj in objects:
            self.db.refresh(obj)

    def get_or_create_cliente(self, nome: str, **kwargs) -> Cliente:
        """Busca cliente pelo nome ou cria se não existir."""
        cliente = self.db.query(Cliente).filter(Cliente.nome == nome).first()
        if not cliente:
            cliente = Cliente(nome=nome, **kwargs)
            self.db.add(cliente)
            self.db.flush()
        return cliente

    def add_contato(self, cliente: Cliente, nome: str, cargo: str, papel: str):
        contato = Contato(id_cliente=cliente.id_cliente, nome=nome, cargo=cargo, papel=papel)
        self.db.add(contato)
        self.db.flush()
        return contato

    def add_contrato_pagamento(self, contrato: Contrato, tipo: str, valor: float):
        tp = self.tipos_pagamento.get(tipo.lower())
        if not tp:
            raise ValueError(f"Tipo de pagamento {tipo} não encontrado.")
        cp = ContratoPagamento(id_contrato=contrato.id_contrato, id_tipo=tp.id_tipo, valor=valor)
        self.db.add(cp)
        self.db.flush()
        return cp

    def registrar_historico(self, id_antigo: int, id_novo: int, motivo: str, data=None):
        from datetime import date
        historico = HistoricoContrato(
            id_contrato_encerrado=id_antigo,
            id_contrato_novo=id_novo,
            motivo_alteracao=motivo,
            data_alteracao=data or date.today()
        )
        self.db.add(historico)
        self.db.flush()
        return historico

    def add_projeto(self, contrato: Contrato, titulo: str, valor_total: float = 0.0, data_inicio=None, status: str = "em andamento"):
        from datetime import date
        projeto = Projeto(
            id_contrato=contrato.id_contrato, 
            titulo=titulo, 
            valor_total=valor_total,
            data_inicio=data_inicio or date.today(),
            status=status
        )
        self.db.add(projeto)
        self.db.flush()
        return projeto
