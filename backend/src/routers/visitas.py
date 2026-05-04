from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.models.visita import Visita
from src.models.contrato import Contrato
from src.schemas.visita import VisitaCreate, VisitaRead

router = APIRouter(prefix="/visitas", tags=["Visitas"])

@router.post("/", response_model=VisitaRead)
def registrar_visita(visita: VisitaCreate, db: Session = Depends(get_db)):
    # Valida se o contrato informado existe e está ativo
    contrato = db.query(Contrato).filter(Contrato.id_contrato == visita.id_contrato).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    if contrato.status != "ativo":
        raise HTTPException(status_code=400, detail="Não é possível registar visitas para um contrato inativo")

    nova_visita = Visita(**visita.model_dump())
    db.add(nova_visita)
    db.commit()
    db.refresh(nova_visita)
    return nova_visita

@router.get("/", response_model=List[VisitaRead])
def listar_visitas(db: Session = Depends(get_db)):
    return db.query(Visita).all()