from sqlalchemy.orm import Session
from typing import List, Optional
from src.models.contrato import Contrato
from src.models.projeto import Projeto
from src.models.pendencia import Pendencia
from src.models.visita import Visita
from .priority_engine import get_top_priority_insight
from .health_engine import calculate_client_health_score
from .tension_engine import calculate_project_tension

class IntelligenceService:
    @staticmethod
    def get_operational_priority(db: Session, pendencias_abertas: List[Pendencia]):
        """Retorna o insight de prioridade máxima do sistema (Top 1)."""
        return get_top_priority_insight(db, pendencias_abertas)

    @staticmethod
    def get_client_health(db: Session, contrato: Contrato):
        """Calcula a saúde operacional de um contrato."""
        # Filtramos visitas e pendências vinculadas ao contrato
        visitas = contrato.visitas
        pendencias_abertas = [p for p in contrato.pendencias if not p.resolvida]
        return calculate_client_health_score(contrato, visitas, pendencias_abertas)

    @staticmethod
    def get_project_state(db: Session, projeto: Projeto):
        """Retorna o estado operacional detalhado de um projeto."""
        return calculate_project_tension(projeto)

    @staticmethod
    def get_system_caos_index(db: Session):
        """Calcula o índice de caos global da consultoria (métrica estratégica)."""
        # Exemplo: Média de desgaste de todos os contratos ativos
        contratos = db.query(Contrato).all()
        if not contratos:
            return 0
        
        total_desgaste = 0
        for c in contratos:
            health = calculate_client_health_score(c, c.visitas, [p for p in c.pendencias if not p.resolvida])
            total_desgaste += health["indice_desgaste"]
            
        return total_desgaste / len(contratos)
