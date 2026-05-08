from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.entrega import Entrega
from src.models.projeto import Projeto
from src.schemas.entrega import EntregaCreate, EntregaRead, EntregaUpdate

router = APIRouter(prefix="/entregas", tags=["Entregas"])

@router.post("/", response_model=EntregaRead)
def criar_entrega(entrega: EntregaCreate, db: Session = Depends(get_db)):
    # 1. Valida se o projeto base existe
    projeto = db.query(Projeto).filter(Projeto.id_projeto == entrega.id_projeto).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado. Não é possível cadastrar a entrega.")

    nova_entrega = Entrega(**entrega.model_dump())
    
    try:
        db.add(nova_entrega)
        db.commit()
        db.refresh(nova_entrega)
        return nova_entrega
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar entrega: {str(e)}")

@router.get("/", response_model=List[EntregaRead])
def listar_entregas(db: Session = Depends(get_db)):
    return db.query(Entrega).all()

@router.patch("/{id_entrega}", response_model=EntregaRead)
def atualizar_entrega(
    id_entrega: int, 
    entrega_update: EntregaUpdate, # <-- Tem que ser o Update aqui!
    db: Session = Depends(get_db)
):
    # 1. Busca a entrega no banco
    db_entrega = db.query(Entrega).filter(Entrega.id_entrega == id_entrega).first()
    
    if not db_entrega:
        raise HTTPException(status_code=404, detail="Entrega não encontrada")

    # 2. Converte o schema em dicionário filtrando o que não foi enviado
    update_data = entrega_update.model_dump(exclude_unset=True)

    # 3. Aplica as mudanças dinamicamente
    for key, value in update_data.items():
        setattr(db_entrega, key, value)

    try:
        db.commit()
        db.refresh(db_entrega)
        return db_entrega
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar entrega: {str(e)}")