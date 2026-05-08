from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.tipo_pagamento import TipoPagamento
from src.schemas.tipo_pagamento import TipoPagamentoCreate, TipoPagamentoRead

router = APIRouter(prefix="/tipos-pagamento", tags=["Tipos de Pagamento"])

@router.post("/", response_model=TipoPagamentoRead)
def criar_tipo_pagamento(tipo: TipoPagamentoCreate, db: Session = Depends(get_db)):
    # Validação extra: Evita cadastrar "Pix" duas vezes, por exemplo
    tipo_existente = db.query(TipoPagamento).filter(TipoPagamento.tipo == tipo.tipo).first()
    if tipo_existente:
        raise HTTPException(status_code=400, detail="Tipo de pagamento já cadastrado.")

    novo_tipo = TipoPagamento(**tipo.model_dump())
    
    try:
        db.add(novo_tipo)
        db.commit()
        db.refresh(novo_tipo)
        return novo_tipo
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar tipo de pagamento: {str(e)}")

@router.get("/", response_model=List[TipoPagamentoRead])
def listar_tipos_pagamento(db: Session = Depends(get_db)):
    return db.query(TipoPagamento).all()