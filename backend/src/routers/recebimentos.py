from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.recebimento import Recebimento
from src.models.contrato_pagamento import ContratoPagamento
from src.schemas.recebimento import RecebimentoCreate, RecebimentoRead

router = APIRouter(prefix="/recebimentos", tags=["Recebimentos"])

@router.post("/", response_model=RecebimentoRead)
def registrar_recebimento(recebimento: RecebimentoCreate, db: Session = Depends(get_db)):
    # 1. Validação de Segurança: Garante que a regra de pagamento existe
    pagamento_vinculado = db.query(ContratoPagamento).filter(ContratoPagamento.id == recebimento.id_contrato_pagamento).first()
    
    if not pagamento_vinculado:
        raise HTTPException(
            status_code=404, 
            detail="Registro de pagamento do contrato não encontrado. Não é possível registrar o recebimento."
        )

    novo_recebimento = Recebimento(**recebimento.model_dump())
    
    try:
        db.add(novo_recebimento)
        db.commit()
        db.refresh(novo_recebimento)
        return novo_recebimento
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar recebimento: {str(e)}")

@router.get("/", response_model=List[RecebimentoRead])
def listar_recebimentos(db: Session = Depends(get_db)):
    return db.query(Recebimento).all()