from src.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    res = db.execute(text("SELECT modalidade, COUNT(*) FROM visitas GROUP BY modalidade")).fetchall()
    print(res)
finally:
    db.close()
