from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.pendencia import Pendencia
from src.models.visita import Visita
from src.models.contrato import Contrato
from src.schemas.pendencia import PendenciaCreate, PendenciaRead

router = APIRouter(prefix="/pendencias", tags=["Pendências"])

@router.post("/", response_model=PendenciaRead)
def criar_pendencia(pendencia: PendenciaCreate, db: Session = Depends(get_db)):
    # 1. Valida se o contrato existe (Obrigatório)
    contrato = db.query(Contrato).filter(Contrato.id_contrato == pendencia.id_contrato).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")

    # 2. Valida se a visita existe (se informada)
    if pendencia.id_visita:
        visita = db.query(Visita).filter(Visita.id_visita == pendencia.id_visita).first()
        if not visita:
            raise HTTPException(status_code=404, detail="Visita não encontrada.")

    nova_pendencia = Pendencia(**pendencia.model_dump())
    
    try:
        db.add(nova_pendencia)
        db.commit()
        db.refresh(nova_pendencia)
        return nova_pendencia
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar pendência: {str(e)}")

@router.get("/", response_model=List[PendenciaRead])
def listar_pendencias(db: Session = Depends(get_db)):
    return db.query(Pendencia).all()