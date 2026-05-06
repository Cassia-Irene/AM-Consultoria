from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.projeto_parcela import ProjetoParcela
from src.models.projeto import Projeto
from src.schemas.projeto_parcela import ProjetoParcelaCreate, ProjetoParcelaRead

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