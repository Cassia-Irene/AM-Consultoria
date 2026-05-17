import json
import os
from datetime import datetime
from typing import Dict, Any, List

class AuditManager:
    """
    Gerencia a rastreabilidade de alterações na governança operacional.
    Garante que overrides e intervenções humanas sejam auditáveis.
    """
    
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
    AUDIT_FILE = os.path.join(BASE_DIR, "governance_audit.json")

    @classmethod
    def _ensure_dir(cls):
        if not os.path.exists(cls.BASE_DIR):
            os.makedirs(cls.BASE_DIR)
        if not os.path.exists(cls.AUDIT_FILE):
            with open(cls.AUDIT_FILE, "w", encoding="utf-8") as f:
                json.dump([], f)

    @classmethod
    def log_change(cls, entity_type: str, entity_id: int, changes: Dict[str, Any], user: str = "Adriano"):
        """
        Registra uma alteração na governança.
        """
        cls._ensure_dir()
        
        entry = {
            "timestamp": datetime.now().isoformat(),
            "entity_type": entity_type,
            "entity_id": entity_id,
            "user": user,
            "changes": changes,
            "audit_type": "governance_intervention" if "observacoes_gerais" in changes else "factual_update"
        }

        try:
            with open(cls.AUDIT_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except:
            history = []

        history.append(entry)
        
        # Mantemos apenas os últimos 1000 registros para não estourar o arquivo
        history = history[-1000:]

        with open(cls.AUDIT_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)

    @classmethod
    def get_history(cls, entity_type: str, entity_id: int) -> List[Dict[str, Any]]:
        cls._ensure_dir()
        try:
            with open(cls.AUDIT_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
            return [h for h in history if h["entity_type"] == entity_type and h["entity_id"] == entity_id]
        except:
            return []

    @classmethod
    def delete_log(cls, timestamp: str) -> bool:
        """
        Remove um registro de auditoria específico pelo timestamp.
        """
        cls._ensure_dir()
        try:
            with open(cls.AUDIT_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
            
            initial_len = len(history)
            history = [h for h in history if h["timestamp"] != timestamp]
            
            if len(history) < initial_len:
                with open(cls.AUDIT_FILE, "w", encoding="utf-8") as f:
                    json.dump(history, f, indent=2, ensure_ascii=False)
                return True
            return False
        except:
            return False
