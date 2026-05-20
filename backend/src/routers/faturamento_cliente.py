from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from src.services.faturamento_service import calcular_valor_base, calcular_valor_extra
from src.database import get_db
from src.models.faturamento_cliente import FaturamentoCliente
from src.models.contrato import Contrato
from src.schemas.faturamento_cliente import FaturamentoClienteCreate, FaturamentoClienteRead, FaturamentoUpdate

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

    # 3. Calcula tudo 
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
def listar_faturamentos(id_contrato: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(FaturamentoCliente)
    if id_contrato is not None:
        query = query.filter(FaturamentoCliente.id_contrato == id_contrato)
    return query.all()

@router.patch("/{id_faturamento}", response_model=FaturamentoClienteRead)
def atualizar_faturamento(
    id_faturamento: int, 
    faturamento_update: FaturamentoUpdate, 
    db: Session = Depends(get_db)
):
    # 1. Busca o registro
    db_faturamento = db.query(FaturamentoCliente).filter(
        FaturamentoCliente.id_faturamento == id_faturamento
    ).first()
    
    if not db_faturamento:
        raise HTTPException(status_code=404, detail="Faturamento não encontrado")
    
    # 2. Converte o schema em dicionário, ignorando o que não foi enviado
    update_data = faturamento_update.model_dump(exclude_unset=True)

    # 3. Atualização 
    for key, value in update_data.items():
        setattr(db_faturamento, key, value)

   
    # Se qualquer campo que compõe o cálculo foi alterado, recalcula o total
    campos_calculo = ["valor_base", "valor_extra", "desconto"]
    if any(campo in update_data for campo in campos_calculo):
        
        db_faturamento.valor_total = (
            db_faturamento.valor_base + 
            db_faturamento.valor_extra - 
            db_faturamento.desconto
        )

    db.commit()
    db.refresh(db_faturamento)
    return db_faturamento