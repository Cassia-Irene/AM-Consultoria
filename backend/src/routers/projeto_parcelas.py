from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from datetime import date
from src.database import get_db
from src.models.projeto_parcela import ProjetoParcela
from src.models.projeto import Projeto
from src.schemas.projeto_parcela import ProjetoParcelaCreate, ProjetoParcelaRead, ProjetoParcelaUpdate

router = APIRouter(prefix="/projeto-parcelas", tags=["Projeto Parcelas"])

@router.post("/", response_model=ProjetoParcelaRead)
def criar_parcela(parcela: ProjetoParcelaCreate, db: Session = Depends(get_db)):
    # Valida se o projeto base existe
    projeto = db.query(Projeto).filter(Projeto.id_projeto == parcela.id_projeto).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado. Não é possível cadastrar uma parcela.")

    nova_parcela = ProjetoParcela(**parcela.model_dump())
    
    try:
        db.add(nova_parcela)
        db.commit()
        db.refresh(nova_parcela)
        return nova_parcela
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar parcela do projeto: {str(e)}")

@router.get("/", response_model=List[ProjetoParcelaRead])
def listar_parcelas(db: Session = Depends(get_db)):
    return db.query(ProjetoParcela).all()

@router.patch("/{id_parcela}", response_model=ProjetoParcelaRead)
def atualizar_parcela_projeto(
    id_parcela: int, 
    parcela_update: ProjetoParcelaUpdate, 
    db: Session = Depends(get_db)
):
    db_parcela = db.query(ProjetoParcela).filter(ProjetoParcela.id_parcela == id_parcela).first()
    
    if not db_parcela:
        raise HTTPException(status_code=404, detail="Parcela não encontrada")

    update_data = parcela_update.model_dump(exclude_unset=True)

    # 🚀 Automação: Se pagou agora, registra a data de hoje caso esteja nula
    if update_data.get("pago") is True and not db_parcela.data_pagamento:
        db_parcela.data_pagamento = date.today()

    for key, value in update_data.items():
        setattr(db_parcela, key, value)

    db.commit()
    db.refresh(db_parcela)
    return db_parcela