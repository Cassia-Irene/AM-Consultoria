from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.models.contrato import Contrato 
from src.database import get_db
from src.models.pendencia import Pendencia
from src.models.visita import Visita
from src.schemas.pendencia import PendenciaCreate, PendenciaUpdate, PendenciaRead
from datetime import date

router = APIRouter(prefix="/pendencias", tags=["Pendências"])

@router.post("/", response_model=PendenciaRead)
def criar_pendencia(pendencia: PendenciaCreate, db: Session = Depends(get_db)):
    # 1. Valida se a visita existe
    visita = db.query(Visita).filter(Visita.id_visita == pendencia.id_visita).first()
    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada.")

    # 2. AJUSTE: Valida o contrato se ele for informado (conforme Migration V015)
    if pendencia.id_contrato:
        contrato = db.query(Contrato).filter(Contrato.id_contrato == pendencia.id_contrato).first()
        if not contrato:
            raise HTTPException(status_code=404, detail="Contrato não encontrado.")

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

@router.patch("/{id_pendencia}", response_model=PendenciaRead)
def atualizar_pendencia(id_pendencia: int, pendencia_update: PendenciaUpdate, db: Session = Depends(get_db)):
    db_pendencia = db.query(Pendencia).filter(Pendencia.id_pendencia == id_pendencia).first()
    
    if not db_pendencia:
        raise HTTPException(status_code=404, detail="Pendência não encontrada")

    update_data = pendencia_update.model_dump(exclude_unset=True)

    # 🚀 Lógica Inteligente:
    # Se 'resolvida' for True e não enviaram uma data, coloca a data de hoje automaticamente
    if update_data.get("resolvida") is True and not update_data.get("data_resolucao"):
        db_pendencia.data_resolucao = date.today()

    for key, value in update_data.items():
        setattr(db_pendencia, key, value)

    db.commit()
    db.refresh(db_pendencia)
    return db_pendencia