from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.src.services.faturamento_service import calcular_valor_base, calcular_valor_extra
from src.database import get_db
from src.models.faturamento_cliente import FaturamentoCliente
from src.models.contrato import Contrato
from src.schemas.faturamento_cliente import FaturamentoClienteCreate, FaturamentoClienteRead

router = APIRouter(prefix="/faturamento-cliente", tags=["Faturamento"])

@router.post("/", response_model=FaturamentoClienteRead)
def criar_faturamento(faturamento: FaturamentoClienteCreate, db: Session = Depends(get_db)):
    # 1. Valida contrato
    contrato = db.query(Contrato).filter(
        Contrato.id_contrato == faturamento.id_contrato
    ).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")

    # 2. Valida duplicata
    duplicado = db.query(FaturamentoCliente).filter(
        FaturamentoCliente.id_contrato == faturamento.id_contrato,
        FaturamentoCliente.mes_ano == faturamento.mes_ano
    ).first()
    if duplicado:
        raise HTTPException(status_code=409, detail="Já existe faturamento para este contrato neste mês.")

    # 3. Calcula tudo automaticamente
    valor_base, visitas_normais = calcular_valor_base(db, faturamento.id_contrato, faturamento.mes_ano)
    valor_extra, _ = calcular_valor_extra(db, faturamento.id_contrato, faturamento.mes_ano)

    dados = faturamento.model_dump()
    dados["valor_base"] = valor_base
    dados["valor_extra"] = valor_extra
    dados["visitas_realizadas"] = visitas_normais
    dados["valor_total"] = valor_base + valor_extra - dados["desconto"]

    novo_faturamento = FaturamentoCliente(**dados)

    try:
        db.add(novo_faturamento)
        db.commit()
        db.refresh(novo_faturamento)
        return novo_faturamento
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar faturamento: {str(e)}")

@router.get("/", response_model=List[FaturamentoClienteRead])
def listar_faturamentos(db: Session = Depends(get_db)):
    return db.query(FaturamentoCliente).all()