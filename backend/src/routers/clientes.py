from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.cliente import Cliente
from src.schemas.cliente import ClienteCreate, ClienteRead, ClienteUpdate

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# Endpoints para Clientes
@router.post("/", response_model=ClienteRead)
def criar_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    
    novo_cliente = Cliente(**cliente.model_dump())
    
    try:
        db.add(novo_cliente)
        db.commit()
        db.refresh(novo_cliente)
        return novo_cliente
    except Exception as e:
        db.rollback() # Desfaz a transação em caso de erro no banco
        raise HTTPException(status_code=500, detail=f"Erro ao salvar cliente: {str(e)}")


@router.get("/", response_model=List[ClienteRead])
def listar_clientes(db: Session = Depends(get_db)):
    
    return db.query(Cliente).all()

@router.get("/{id_cliente}", response_model=ClienteRead)
def buscar_cliente(id_cliente: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente

@router.patch("/{id_cliente}", response_model=ClienteRead)
def atualizar_cliente(
    id_cliente: int, 
    cliente_update: ClienteUpdate, 
    db: Session = Depends(get_db)
):
    db_cliente = db.query(Cliente).filter(Cliente.id_cliente == id_cliente).first()
    
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    update_data = cliente_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_cliente, key, value)

    try:
        db.commit()
        db.refresh(db_cliente)
        return db_cliente
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar cliente: {str(e)}")