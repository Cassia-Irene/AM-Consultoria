from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.models.contato import Contato
from src.models.cliente import Cliente
from src.schemas.contato import ContatoCreate, ContatoRead

router = APIRouter(prefix="/contatos", tags=["Contatos"])

# 🟢 Rota para Criar Contato (POST)
@router.post("/", response_model=ContatoRead)
def criar_contato(contato: ContatoCreate, db: Session = Depends(get_db)):
    # 🔍 Validação de Segurança: Impede que se crie um contato para um cliente que não existe
    cliente_existe = db.query(Cliente).filter(Cliente.id_cliente == contato.id_cliente).first()
    if not cliente_existe:
        raise HTTPException(
            status_code=404, 
            detail="Cliente não encontrado. Não é possível criar um contato órfão."
        )
    
    novo_contato = Contato(**contato.model_dump())
    db.add(novo_contato)
    db.commit()
    db.refresh(novo_contato)
    return novo_contato

# 🔵 Rota para Listar Contatos (GET)
@router.get("/", response_model=List[ContatoRead])
def listar_contatos(db: Session = Depends(get_db)):
    return db.query(Contato).all()