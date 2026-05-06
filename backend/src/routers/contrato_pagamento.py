from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.contrato_pagamento import ContratoPagamento
from src.models.contrato import Contrato
from src.models.tipo_pagamento import TipoPagamento
from src.schemas.contrato_pagamento import ContratoPagamentoCreate, ContratoPagamentoRead

router = APIRouter(prefix="/contrato-pagamento", tags=["Contrato Pagamento"])

@router.post("/", response_model=ContratoPagamentoRead)
def criar_contrato_pagamento(pagamento: ContratoPagamentoCreate, db: Session = Depends(get_db)):
    # 1. Valida se o contrato existe
    contrato = db.query(Contrato).filter(Contrato.id_contrato == pagamento.id_contrato).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")

    # 2. Valida se o tipo de pagamento existe
    tipo = db.query(TipoPagamento).filter(TipoPagamento.id_tipo == pagamento.id_tipo_pagamento).first()
    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de pagamento não encontrado.")

    novo_pagamento = ContratoPagamento(**pagamento.model_dump())
    
    try:
        db.add(novo_pagamento)
        db.commit()
        db.refresh(novo_pagamento)
        return novo_pagamento
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar pagamento do contrato: {str(e)}")

@router.get("/", response_model=List[ContratoPagamentoRead])
def listar_contratos_pagamento(db: Session = Depends(get_db)):
    return db.query(ContratoPagamento).all()