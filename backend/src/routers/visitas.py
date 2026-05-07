from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.visita import Visita
from src.models.cliente import Cliente

from src.models.projeto import Projeto 
from src.schemas.visita import VisitaCreate, VisitaRead

router = APIRouter(prefix="/visitas", tags=["Visitas"])

@router.post("/", response_model=VisitaRead)
def registrar_visita(visita: VisitaCreate, db: Session = Depends(get_db)):
    # 1. Valida se o cliente informado existe no banco
    cliente = db.query(Cliente).filter(Cliente.id_cliente == visita.id_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
        
    # 2. Valida se o projeto informado existe (Conforme seu Modelo Lógico)
   
    projeto = db.query(Projeto).filter(Projeto.id_projeto == visita.id_projeto).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    # O model_dump() vai mapear 'id_projeto' e 'data' corretamente agora
    nova_visita = Visita(**visita.model_dump())
    
    try:
        db.add(nova_visita)
        db.commit()
        db.refresh(nova_visita)
        return nova_visita
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar visita: {str(e)}")

@router.get("/", response_model=List[VisitaRead])
def listar_visitas(db: Session = Depends(get_db)):
    # Busca todas as visitas na tabela "visitas"
    return db.query(Visita).all()