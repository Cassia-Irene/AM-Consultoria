import sys
import os
from sqlalchemy import create_engine, inspect, text

# Adiciona o diretório atual ao path para encontrar o módulo src
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ""))

from src.config import DATABASE_URL

def inspect_db():
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    print("--- Inspecionando Tabela: visitas ---")
    columns = inspector.get_columns("visitas")
    for col in columns:
        print(f"Coluna: {col['name']} | Tipo: {col['type']}")
        
    print("\n--- Check Constraints: visitas ---")
    with engine.connect() as conn:
        # Consulta PostgreSQL para listar check constraints
        result = conn.execute(text("""
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE c.contype = 'c' AND conname LIKE '%tipo_visita%';
        """))
        for row in result:
            print(f"Constraint: {row[0]} | Definição: {row[1]}")

if __name__ == "__main__":
    inspect_db()
