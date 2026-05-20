from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.projeto_extra import ProjetoExtra
from src.models.projeto import Projeto
from src.schemas.projeto_extra import ProjetoExtraCreate, ProjetoExtraRead, ProjetoExtraUpdate

router = APIRouter(prefix="/projetos-extra", tags=["Projetos Extra"])

@router.post("/", response_model=ProjetoExtraRead)
def criar_projeto_extra(projeto_extra: ProjetoExtraCreate, db: Session = Depends(get_db)):
    # Valida se o projeto base existe
    projeto = db.query(Projeto).filter(Projeto.id_projeto == projeto_extra.id_projeto).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado. Não é possível cadastrar um escopo extra.")

    # Verifica se o projeto ja foi marcado como extra
    extra_existente = db.query(ProjetoExtra).filter(ProjetoExtra.id_projeto == projeto_extra.id_projeto).first()
    if extra_existente:
        raise HTTPException(status_code=409, detail="Este projeto já está marcado como extra. Não é possível cadastrar novamente.")
    
    novo_projeto_extra = ProjetoExtra(**projeto_extra.model_dump())
    
    try:
        db.add(novo_projeto_extra)
        db.commit()
        db.refresh(novo_projeto_extra)
        return novo_projeto_extra
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar projeto extra: {str(e)}")

@router.get("/", response_model=List[ProjetoExtraRead])
def listar_projetos_extra(db: Session = Depends(get_db)):
    return db.query(ProjetoExtra).all()

@router.patch("/{id_extra}", response_model=ProjetoExtraRead)
def atualizar_projeto_extra(
    id_extra: int, 
    extra_update: ProjetoExtraUpdate, 
    db: Session = Depends(get_db)
):
    db_extra = db.query(ProjetoExtra).filter(ProjetoExtra.id_extra == id_extra).first()
    if not db_extra:
        raise HTTPException(status_code=404, detail="Projeto Extra não encontrado")

    for key, value in extra_update.model_dump(exclude_unset=True).items():
        setattr(db_extra, key, value)

    db.commit()
    db.refresh(db_extra)
    return db_extra