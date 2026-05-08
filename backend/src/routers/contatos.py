from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.contato import Contato
from src.models.cliente import Cliente
from src.schemas.contato import ContatoCreate, ContatoRead

router = APIRouter(prefix="/contatos", tags=["Contatos"])

# Endpoints para Contatos
@router.post("/", response_model=ContatoRead)
def criar_contato(contato: ContatoCreate, db: Session = Depends(get_db)):
    # Validação de Segurança: Garante que o cliente existe antes de criar o contato
    # Usamos id_cliente que é a PK da tabela clientes
    cliente_existe = db.query(Cliente).filter(Cliente.id_cliente == contato.id_cliente).first()
    
    if not cliente_existe:
        raise HTTPException(
            status_code=404, 
            detail="Cliente não encontrado. Não é possível criar um contato para um cliente inexistente."
        )

    # O model_dump() vai mapear automaticamente o campo 'telefone' e 'observacoes_gerais'
    novo_contato = Contato(**contato.model_dump())
    
    try:
        db.add(novo_contato)
        db.commit()
        db.refresh(novo_contato)
        return novo_contato
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar contato: {str(e)}")

# O endpoint GET para listar contatos vai buscar na tabela "contatos" (plural) porque já arrumamos o Model
@router.get("/", response_model=List[ContatoRead])
def listar_contatos(db: Session = Depends(get_db)):
    # Busca todos os registros na tabela "contatos"
    return db.query(Contato).all()

@router.get("/{id_contato}", response_model=ContatoRead)
def buscar_contato(id_contato: int, db: Session = Depends(get_db)):
    contato = db.query(Contato).filter(Contato.id_contato == id_contato).first()
    if not contato:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    return contato