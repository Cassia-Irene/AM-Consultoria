from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.faturamento_cliente import FaturamentoCliente
from src.models.contrato import Contrato
from src.schemas.faturamento_cliente import FaturamentoClienteCreate, FaturamentoClienteRead

router = APIRouter(prefix="/faturamento-cliente", tags=["Faturamento"])

@router.post("/", response_model=FaturamentoClienteRead)
def criar_faturamento(faturamento: FaturamentoClienteCreate, db: Session = Depends(get_db)):
    # 1. Valida se o contrato existe
    contrato = db.query(Contrato).filter(Contrato.id_contrato == faturamento.id_contrato).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")

    # 2. Converte os dados recebidos para um dicionário
    dados_faturamento = faturamento.model_dump()

    # 3. REGRA DE NEGÓCIO: Força o cálculo do valor total no backend
    # Assim evitamos que o Frontend mande um valor total errado acidentalmente
    dados_faturamento["valor_total"] = dados_faturamento["valor_base"] + dados_faturamento["valor_extra"]

    # 4. Prepara para salvar
    novo_faturamento = FaturamentoCliente(**dados_faturamento)
    
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