from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date # 👈 Importante para o histórico

from src.database import get_db
from src.models.contrato import Contrato
from src.models.cliente import Cliente
from src.schemas.contrato import ContratoCreate, ContratoRead, ContratoReplaceRequest, ContratoUpdateRestrito
from src.services.contrato_service import encerrar_e_criar_novo_contrato

# ✅ Tag corrigida para "Contratos"
router = APIRouter(prefix="/contratos", tags=["Contratos"]) 

@router.post("/", response_model=ContratoRead)
def criar_contrato(contrato: ContratoCreate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == contrato.id_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    novo_contrato = Contrato(**contrato.model_dump())
    
    try:
        db.add(novo_contrato)
        db.commit()
        db.refresh(novo_contrato)
        return novo_contrato
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar contrato: {str(e)}")

@router.get("/", response_model=List[ContratoRead])
def listar_contratos(db: Session = Depends(get_db)):
    return db.query(Contrato).all()

@router.post("/replace", response_model=ContratoRead)
def replace_contrato(data: ContratoReplaceRequest, db: Session = Depends(get_db)):
    """
    Substitui um contrato existente por uma nova versão.
    A auditoria é feita automaticamente via SQLAlchemy Events.
    """
    return encerrar_e_criar_novo_contrato(db, data)

@router.patch("/{id_contrato}", response_model=ContratoRead)
def atualizar_contrato_cosmetico(
    id_contrato: int, 
    contrato_update: ContratoUpdateRestrito, # <-- Usando o schema restrito
    db: Session = Depends(get_db)
):
    db_contrato = db.query(Contrato).filter(Contrato.id_contrato == id_contrato).first()
    
    if not db_contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")

    # REGRA DE OURO: Se o contrato já estiver encerrado, nem o PATCH restrito passa!
    if db_contrato.data_fim is not None:
        raise HTTPException(
            status_code=400, 
            detail="Não é possível alterar um contrato encerrado. Use o fluxo de substituição."
        )

    update_data = contrato_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_contrato, key, value)

    db.commit()
    db.refresh(db_contrato)
    return db_contrato