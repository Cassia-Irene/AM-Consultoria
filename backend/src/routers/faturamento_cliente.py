from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.faturamento_cliente import FaturamentoCliente
from src.models.contrato import Contrato
from src.schemas.faturamento_cliente import FaturamentoClienteCreate, FaturamentoClienteRead, FaturamentoUpdate

router = APIRouter(prefix="/faturamento-cliente", tags=["Faturamento"])

@router.post("/", response_model=FaturamentoClienteRead)
def criar_faturamento(faturamento: FaturamentoClienteCreate, db: Session = Depends(get_db)):
    # 1. Valida se o contrato existe
    contrato = db.query(Contrato).filter(Contrato.id_contrato == faturamento.id_contrato).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")

    # 2. Converte os dados recebidos para um dicionário
    dados_faturamento = faturamento.model_dump()

    # 3. # REGRA DE NEGÓCIO: Incluir o desconto no cálculo
    dados_faturamento["valor_total"] = (
    dados_faturamento["valor_base"] + 
    dados_faturamento["valor_extra"] - 
    dados_faturamento.get("desconto", 0)
)
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

    # 3. Atualização Dinâmica
    for key, value in update_data.items():
        setattr(db_faturamento, key, value)

   # 🚨 DICA SÊNIOR: Recálculo de Integridade
    # Se qualquer campo que compõe o cálculo foi alterado, recalculamos o total
    campos_calculo = ["valor_base", "valor_extra", "desconto"]
    if any(campo in update_data for campo in campos_calculo):
        # Usamos os valores já atualizados no objeto db_faturamento
        db_faturamento.valor_total = (
            db_faturamento.valor_base + 
            db_faturamento.valor_extra - 
            db_faturamento.desconto
        )

    db.commit()
    db.refresh(db_faturamento)
    return db_faturamento