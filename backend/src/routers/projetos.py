from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.projeto import Projeto
from src.models.contrato import Contrato
from src.schemas.projeto import ProjetoCreate, ProjetoRead

router = APIRouter(prefix="/projetos", tags=["Projetos"])

@router.post("/", response_model=ProjetoRead)
def criar_projeto(projeto: ProjetoCreate, db: Session = Depends(get_db)):
    # 1. Validação de Segurança: Garante que o contrato existe
    # Todo projeto PRECISA estar amarrado a um contrato (conforme o Modelo Lógico)
    contrato_existe = db.query(Contrato).filter(Contrato.id_contrato == projeto.id_contrato).first()
    
    if not contrato_existe:
        raise HTTPException(
            status_code=404, 
            detail="Contrato não encontrado. Não é possível criar um projeto sem um contrato válido."
        )

    # 2. Desempacota os dados e prepara para salvar no banco
    novo_projeto = Projeto(**projeto.model_dump())
    
    try:
        db.add(novo_projeto)
        db.commit()
        db.refresh(novo_projeto)
        return novo_projeto
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar projeto: {str(e)}")

@router.get("/", response_model=List[ProjetoRead])
def listar_projetos(db: Session = Depends(get_db)):
    # Busca todos os projetos cadastrados
    return db.query(Projeto).all()

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.projeto import Projeto # Ajuste o import
from src.schemas.projeto import ProjetoRead, ProjetoUpdate # Ajuste o import

# ... suas rotas POST e GET ...

@router.patch("/{id_projeto}", response_model=ProjetoRead)
def atualizar_projeto(
    id_projeto: int, 
    projeto_update: ProjetoUpdate, 
    db: Session = Depends(get_db)
):
    db_projeto = db.query(Projeto).filter(Projeto.id_projeto == id_projeto).first()
    
    if not db_projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    update_data = projeto_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_projeto, key, value)

    try:
        db.commit()
        db.refresh(db_projeto)
        return db_projeto
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar projeto: {str(e)}")