from src.database import SessionLocal
from src.models import Projeto, ProjetoExtra
db = SessionLocal()
extras = db.query(ProjetoExtra).all()
for ex in extras:
    p = db.query(Projeto).get(ex.id_projeto)
    if p:
        if not p.descricao or "PROJETO EXTRA" not in p.descricao.upper():
            p.descricao = f"PROJETO EXTRA solicitado pela diretoria/cliente. " + (p.descricao or "")
            print(f"Updated Project {p.id_projeto}")
db.commit()
db.close()
