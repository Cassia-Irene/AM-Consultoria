import json
import os
from datetime import date
from typing import Dict, Any, Optional

class SnapshotManager:
    """
    Gerencia a persistência de snapshots interpretativos para memória longitudinal imutável.
    Evita que o passado seja reescrito retroativamente por novos eventos.
    """
    
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
    SNAPSHOT_FILE = os.path.join(BASE_DIR, "narrative_snapshots.json")

    @classmethod
    def _ensure_dir(cls):
        if not os.path.exists(cls.BASE_DIR):
            os.makedirs(cls.BASE_DIR)
        if not os.path.exists(cls.SNAPSHOT_FILE):
            with open(cls.SNAPSHOT_FILE, "w", encoding="utf-8") as f:
                json.dump({}, f)

    @classmethod
    def save_snapshot(cls, entity_type: str, entity_id: int, data: Dict[str, Any]):
        cls._ensure_dir()
        with open(cls.SNAPSHOT_FILE, "r", encoding="utf-8") as f:
            snapshots = json.load(f)
        
        key = f"{entity_type}_{entity_id}"
        today = date.today().isoformat()
        
        if key not in snapshots:
            snapshots[key] = {}
        
        # Salva apenas se for um novo dia para evitar inflação
        if today not in snapshots[key]:
            snapshots[key][today] = data
            with open(cls.SNAPSHOT_FILE, "w", encoding="utf-8") as f:
                json.dump(snapshots, f, indent=2, ensure_ascii=False)

    @classmethod
    def get_historical_snapshot(cls, entity_type: str, entity_id: int, target_date: str) -> Optional[Dict[str, Any]]:
        cls._ensure_dir()
        with open(cls.SNAPSHOT_FILE, "r", encoding="utf-8") as f:
            snapshots = json.load(f)
        
        key = f"{entity_type}_{entity_id}"
        return snapshots.get(key, {}).get(target_date)

    @classmethod
    def get_last_snapshot(cls, entity_type: str, entity_id: int) -> Optional[Dict[str, Any]]:
        cls._ensure_dir()
        with open(cls.SNAPSHOT_FILE, "r", encoding="utf-8") as f:
            snapshots = json.load(f)
        
        key = f"{entity_type}_{entity_id}"
        history = snapshots.get(key, {})
        if not history:
            return None
        
        # Retorna o snapshot mais recente baseado na data
        last_date = sorted(history.keys())[-1]
        data = history[last_date]
        data["data_snapshot"] = last_date
        return data
