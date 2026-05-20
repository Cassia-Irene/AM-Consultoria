from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.contato import Contato
from src.models.cliente import Cliente
from src.schemas.contato import ContatoCreate, ContatoRead, ContatoUpdate

router = APIRouter(prefix="/contatos", tags=["Contatos"])

# Endpoints para Contatos
@router.post("/", response_model=ContatoRead)
def criar_contato(contato: ContatoCreate, db: Session = Depends(get_db)):
    # Validação de Segurança: Garante que o cliente existe antes de criar o contato
    
    cliente_existe = db.query(Cliente).filter(Cliente.id_cliente == contato.id_cliente).first()
    
    if not cliente_existe:
        raise HTTPException(
            status_code=404, 
            detail="Cliente não encontrado. Não é possível criar um contato para um cliente inexistente."
        )

    # Mapeia automaticamente o campo 'telefone' e 'observacoes_gerais'
    novo_contato = Contato(**contato.model_dump())
    
    try:
        db.add(novo_contato)
        db.commit()
        db.refresh(novo_contato)
        return novo_contato
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar contato: {str(e)}")


@router.get("/", response_model=List[ContatoRead])
def listar_contatos(db: Session = Depends(get_db)):
    # Busca todos os registros na tabela "contatos"
    return db.query(Contato).all()

@router.patch("/{id_contato}", response_model=ContatoRead)
def atualizar_contato(
    id_contato: int, 
    contato_update: ContatoUpdate, 
    db: Session = Depends(get_db)
):
    db_contato = db.query(Contato).filter(Contato.id_contato == id_contato).first()
    
    if not db_contato:
        raise HTTPException(status_code=404, detail="Contato não encontrado")

    update_data = contato_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_contato, key, value)

    try:
        db.commit()
        db.refresh(db_contato)
        return db_contato
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar contato: {str(e)}")