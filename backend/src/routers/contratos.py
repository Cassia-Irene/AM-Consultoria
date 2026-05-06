from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date # 👈 Importante para o histórico

from src.database import get_db
from src.models.contrato import Contrato
from src.models.cliente import Cliente
from src.models.historico_contrato import HistoricoContrato # 👈 Importando o modelo de histórico
from src.schemas.contrato import ContratoCreate, ContratoRead

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

# NOVA ROTA: ATUALIZAÇÃO COM HISTÓRICO AUTOMÁTICO 
@router.put("/{id_contrato}", response_model=ContratoRead)
def atualizar_contrato(
    id_contrato: int, 
    contrato_atualizado: ContratoCreate, 
    motivo_alteracao: str, # Isso aparecerá como parâmetro de query no Swagger para o Frontend enviar
    db: Session = Depends(get_db)
):
    # 1. Busca o contrato existente
    contrato_existente = db.query(Contrato).filter(Contrato.id_contrato == id_contrato).first()
    if not contrato_existente:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")

    try:
        # 2. Atualiza os dados do contrato com os novos valores
        for key, value in contrato_atualizado.model_dump().items():
            setattr(contrato_existente, key, value)
            
        # 3. GERA O HISTÓRICO AUTOMATICAMENTE ANTES DE SALVAR
        novo_historico = HistoricoContrato(
            id_contrato=id_contrato,
            data_alteracao=date.today(),
            motivo_alteracao=motivo_alteracao
        )
        db.add(novo_historico)

        # 4. Salva tudo junto (Contrato alterado + Histórico novo)
        db.commit()
        db.refresh(contrato_existente)
        return contrato_existente
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar contrato: {str(e)}")