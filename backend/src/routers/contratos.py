from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.models.contrato import Contrato
from src.models.cliente import Cliente
from src.schemas.contrato import ContratoCreate, ContratoRead

router = APIRouter(prefix="/contratos", tags=["Contratos"])

@router.post("/", response_model=ContratoRead)
def criar_contrato(contrato: ContratoCreate, db: Session = Depends(get_db)):
    # Valida se o cliente existe antes de criar o contrato
    cliente = db.query(Cliente).filter(Cliente.id_cliente == contrato.id_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    novo_contrato = Contrato(**contrato.model_dump())
    db.add(novo_contrato)
    db.commit()
    db.refresh(novo_contrato)
    return novo_contrato

@router.get("/", response_model=List[ContratoRead])
def listar_contratos(db: Session = Depends(get_db)):
    return db.query(Contrato).all()