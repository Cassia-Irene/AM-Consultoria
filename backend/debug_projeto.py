import sys
import os
sys.path.append(os.getcwd() + "/backend")

from src.database import SessionLocal
from src.models.projeto import Projeto
from src.schemas.projeto import ProjetoRead
from sqlalchemy.orm import joinedload
from src.models.contrato import Contrato

db = SessionLocal()
try:
    id_projeto = 974 # Exemplo doAdriano
    projeto = db.query(Projeto).options(
        joinedload(Projeto.entregas),
        joinedload(Projeto.visitas),
        joinedload(Projeto.parcelas),
        joinedload(Projeto.extras),
        joinedload(Projeto.contrato).joinedload(Contrato.eventos_criticos),
        joinedload(Projeto.contrato).joinedload(Contrato.pendencias)
    ).filter(Projeto.id_projeto == id_projeto).first()
    
    if projeto:
        read = ProjetoRead.model_validate(projeto)
        print("Success mapping")
        print(read.model_dump_json(indent=2))
    else:
        print("Project not found")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
