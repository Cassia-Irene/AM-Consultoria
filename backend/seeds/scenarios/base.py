from sqlalchemy.orm import Session
from src.models import Cliente, Contrato
from typing import Tuple, List

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
            self.db.flush() # Para pegar o id_cliente sem fechar a transação
        return cliente
