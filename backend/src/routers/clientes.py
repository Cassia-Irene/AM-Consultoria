from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.cliente import Cliente
from src.schemas.cliente import ClienteCreate, ClienteRead

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# Endpoints para Clientes
@router.post("/", response_model=ClienteRead)
def criar_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    # Desempacota os dados validados pelo Pydantic direto para o modelo SQLAlchemy
    novo_cliente = Cliente(**cliente.model_dump())
    
    try:
        db.add(novo_cliente)
        db.commit()
        db.refresh(novo_cliente)
        return novo_cliente
    except Exception as e:
        db.rollback() # Desfaz a transação em caso de erro no banco
        raise HTTPException(status_code=500, detail=f"Erro ao salvar cliente: {str(e)}")

# O endpoint GET para listar clientes vai buscar na tabela "clientes" (plural) porque já arrumamos o Model
@router.get("/", response_model=List[ClienteRead])
def listar_clientes(db: Session = Depends(get_db)):
    # O SQLAlchemy vai buscar na tabela "clientes" (plural) porque já arrumamos o Model
    return db.query(Cliente).all()

