import sys
import os

# Adiciona o diretório atual ao path para encontrar o módulo src
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ""))

from src.database import SessionLocal
from seeds.orchestrator import run_all

def seed():
    db = SessionLocal()
    mode = os.getenv("SEED_MODE", "realistic")
    try:
        run_all(db, mode=mode)
    except Exception as e:
        print(f"[SEED] Abortado devido a erro: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed()
