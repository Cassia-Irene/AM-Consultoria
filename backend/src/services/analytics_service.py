import os
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any

class AnalyticsService:
    @staticmethod
    def _load_query(filename: str) -> str:
        # Resolve o caminho absoluto para a pasta de queries na raiz do projeto
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../database/queries"))
        file_path = os.path.join(base_path, filename)
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Arquivo de query não encontrado: {file_path}")
            
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    @classmethod
    def execute_query(cls, db: Session, query_file: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        print(f"[BACKEND] Executando query: {query_file}")
        sql = cls._load_query(query_file)
        result = db.execute(text(sql), params or {})
        data = [dict(row._mapping) for row in result]
        print(f"[BACKEND] Query {query_file} concluída: {len(data)} linhas")
        return data

    @classmethod
    def get_dashboard_summary(cls, db: Session):
        rows = cls.execute_query(db, "Q01_dashboard_summary.sql")
        return rows[0] if rows else None

    @classmethod
    def get_operational_timeline(cls, db: Session):
        return cls.execute_query(db, "Q02_operational_timeline.sql")

    @classmethod
    def get_caos_score(cls, db: Session):
        return cls.execute_query(db, "Q03_caos_score.sql")

    @classmethod
    def get_open_pendencies(cls, db: Session):
        return cls.execute_query(db, "Q03_open_pendencies.sql")

    @classmethod
    def get_active_projects(cls, db: Session):
        from src.models.projeto import Projeto
        from src.read_models.project_operational_state import ProjectOperationalState
        
        rows = cls.execute_query(db, "Q04_active_projects.sql")
        for row in rows:
            projeto_orm = db.query(Projeto).filter(Projeto.id_projeto == row['id']).first()
            if projeto_orm:
                state = ProjectOperationalState(projeto_orm).to_dict()
                row.update({
                    "nivel_tensao": state["nivel_tensao"],
                    "motivo_tensao": state["motivo_tensao"],
                    "is_estagnado": state["is_estagnado"],
                    "motivo_estagnacao": state["motivo_estagnacao"]
                })
        return rows

    @classmethod
    def get_financial_overview(cls, db: Session):
        return cls.execute_query(db, "Q05_financial_overview.sql")

    @classmethod
    def get_contract_history(cls, db: Session):
        return cls.execute_query(db, "Q06_contract_history.sql")

    @classmethod
    def get_critical_events(cls, db: Session):
        return cls.execute_query(db, "Q07_critical_events.sql")

    @classmethod
    def get_extra_visits(cls, db: Session):
        return cls.execute_query(db, "Q08_extra_visits.sql")

    @classmethod
    def get_top_priorities(cls, db: Session):
        from src.models.pendencia import Pendencia
        from src.read_models.operational_priority_queue import OperationalPriorityQueue
        
        rows = cls.execute_query(db, "Q09_top_priorities.sql")
        for row in rows:
            pendencia_orm = db.query(Pendencia).filter(Pendencia.id_pendencia == row['id']).first()
            if pendencia_orm:
                queue = OperationalPriorityQueue([pendencia_orm])
                item = queue.to_list()[0]
                row.update({
                    "score_prioridade": item["score"],
                    "motivo_prioridade": item["motivo"]
                })
        return rows

    @classmethod
    def get_planning_overview(cls, db: Session):
        return cls.execute_query(db, "Q10_planning_overview.sql")

    @classmethod
    def get_client_health(cls, db: Session):
        from src.models.contrato import Contrato
        from src.read_models.contract_operational_health import ContractOperationalHealth
        
        rows = cls.execute_query(db, "Q11_client_health.sql")
        for row in rows:
            contrato_orm = db.query(Contrato).filter(Contrato.id_contrato == row['id_contrato']).first()
            if contrato_orm:
                health = ContractOperationalHealth(contrato_orm).to_dict()
                row.update({
                    "status_operacional": f"{health['perfil']} ({health['motivo_saude']})"
                })
        return rows

    @classmethod
    def get_today_agenda(cls, db: Session):
        return cls.execute_query(db, "Q12_today_agenda.sql")

    @classmethod
    def get_weekly_agenda(cls, db: Session):
        return cls.execute_query(db, "Q13_weekly_agenda.sql")


