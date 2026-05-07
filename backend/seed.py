import sys
import os

# Adiciona o diretório 'backend' ao path para encontrar o módulo src
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ""))

from src.database import SessionLocal
from seeds.orchestrator import run_all

def seed():
    db = SessionLocal()
    try:
        print("[SEED] Inicializando Motor de Simulação Operacional...")
        run_all(db)
    finally:
        db.close()

if __name__ == "__main__":
    seed()
