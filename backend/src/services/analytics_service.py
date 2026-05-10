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
    def get_open_pendencies(cls, db: Session):
        return cls.execute_query(db, "Q03_open_pendencies.sql")

    @classmethod
    def get_active_projects(cls, db: Session):
        return cls.execute_query(db, "Q04_active_projects.sql")

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
        return cls.execute_query(db, "Q09_top_priorities.sql")

    @classmethod
    def get_planning_overview(cls, db: Session):
        return cls.execute_query(db, "Q10_planning_overview.sql")
