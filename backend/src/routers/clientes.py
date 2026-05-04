from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.models.cliente import Cliente
from src.schemas.cliente import ClienteCreate, ClienteRead

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# 🟢 Esta é a rota que sumiu! (Criar Cliente)
@router.post("/", response_model=ClienteRead)
def criar_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    novo_cliente = Cliente(**cliente.model_dump())
    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)
    return novo_cliente

# 🔵 Esta é a rota que você está a ver no Swagger (Listar Clientes)
@router.get("/", response_model=List[ClienteRead])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).all()

