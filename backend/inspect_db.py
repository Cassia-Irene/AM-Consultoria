from src.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    res = db.execute(text("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'visitas'::regclass")).fetchall()
    for row in res:
        print(f"Constraint: {row[0]} -> {row[1]}")
except Exception as e:
    print(f"Erro: {e}")
finally:
    db.close()
