from src.database import SessionLocal
from src.models import Projeto
db = SessionLocal()
p = db.query(Projeto).filter_by(id_projeto=949).first()
if p:
    print(f"ID: {p.id_projeto}")
    print(f"DESC: [{p.descricao}]")
else:
    print("Projeto 949 not found")
db.close()
