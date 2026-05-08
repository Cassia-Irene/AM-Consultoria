from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.evento_critico import EventoCritico
from src.models.contrato import Contrato # Importar Contrato em vez de Visita
from src.schemas.evento_critico import EventoCriticoCreate, EventoCriticoRead

router = APIRouter(prefix="/eventos-criticos", tags=["Eventos Críticos"])

@router.post("/", response_model=EventoCriticoRead)
def criar_evento_critico(evento: EventoCriticoCreate, db: Session = Depends(get_db)):
    # AJUSTE: Valida se o CONTRATO existe (conforme Migration V013)
    contrato = db.query(Contrato).filter(Contrato.id_contrato == evento.id_contrato).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")

    novo_evento = EventoCritico(**evento.model_dump())
    
    try:
        db.add(novo_evento)
        db.commit()
        db.refresh(novo_evento)
        return novo_evento
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar evento crítico: {str(e)}")

@router.get("/", response_model=List[EventoCriticoRead])
def listar_eventos_criticos(db: Session = Depends(get_db)):
    return db.query(EventoCritico).all()