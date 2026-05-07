from sqlalchemy.orm import Session
from src.models import Cliente, Contrato, Visita, Pendencia, FaturamentoCliente, EventoCritico
from datetime import date
from typing import List, Tuple

class Scenario:
    def __init__(self, db: Session):
        self.db = db

    def generate_structure(self) -> Tuple[Cliente, Contrato]:
        """Gera ou atualiza os dados estáticos estruturais."""
        raise NotImplementedError

    def simulate_timeline(self, cliente: Cliente, contrato: Contrato, mode: str = "realistic"):
        """Gera a linha do tempo (Visitas -> Pendências -> Faturamento -> Eventos) causalmente ancorada."""
        raise NotImplementedError

    def _add_and_commit(self, objects: List):
        for obj in objects:
            self.db.add(obj)
        self.db.commit()
        for obj in objects:
            self.db.refresh(obj)
