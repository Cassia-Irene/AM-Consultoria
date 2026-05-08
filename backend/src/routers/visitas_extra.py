from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.visita_extra import VisitaExtra
from src.models.visita import Visita
from src.schemas.visita_extra import VisitaExtraCreate, VisitaExtraRead

router = APIRouter(prefix="/visitas-extra", tags=["Visitas Extras [DEPRECATED]"])

# ⚠️ [DEPRECATED] Este router será removido. 
# Utilize o endpoint POST /visitas informando o contexto_agendamento.
@router.post("/", response_model=VisitaExtraRead)
def criar_visita_extra(visita_extra: VisitaExtraCreate, db: Session = Depends(get_db)):
    # Valida se a visita base existe
    visita = db.query(Visita).filter(Visita.id_visita == visita_extra.id_visita).first()
    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada.")

    nova_visita_extra = VisitaExtra(**visita_extra.model_dump())
    
    try:
        db.add(nova_visita_extra)
        db.commit()
        db.refresh(nova_visita_extra)
        return nova_visita_extra
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar visita extra: {str(e)}")

@router.get("/", response_model=List[VisitaExtraRead])
def listar_visitas_extra(db: Session = Depends(get_db)):
    return db.query(VisitaExtra).all()