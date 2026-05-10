from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.models.visita import Visita, MotivoAcionamento
from src.models.contrato import Contrato
from src.models.projeto import Projeto 
from src.schemas.visita import VisitaCreate, VisitaRead, VisitaUpdate, MotivoAcionamentoRead

router = APIRouter(prefix="/visitas", tags=["Visitas"])

@router.post("/", response_model=VisitaRead)
def registrar_visita(visita: VisitaCreate, db: Session = Depends(get_db)):
    contrato = db.query(Contrato).filter(Contrato.id_contrato == visita.id_contrato).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
        
    if visita.id_projeto:
        projeto = db.query(Projeto).filter(Projeto.id_projeto == visita.id_projeto).first()
        if not projeto:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")

    nova_visita = Visita(**visita.model_dump())
    
    try:
        db.add(nova_visita)
        db.commit()
        db.refresh(nova_visita)
        return nova_visita
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar visita: {str(e)}")

@router.get("/", response_model=List[VisitaRead])
def listar_visitas(db: Session = Depends(get_db)):
    return db.query(Visita).all()

# ✅ NOVO: Motivos de acionamento (Deve vir ANTES de /{id_visita})
@router.get("/motivos-acionamento", response_model=List[MotivoAcionamentoRead])
def listar_motivos(db: Session = Depends(get_db)):
    return db.query(MotivoAcionamento).all()

@router.get("/{id_visita}", response_model=VisitaRead)
def buscar_visita(id_visita: int, db: Session = Depends(get_db)):
    visita = db.query(Visita).filter(Visita.id_visita == id_visita).first()
    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    return visita

@router.patch("/{id_visita}", response_model=VisitaRead)
def atualizar_visita(
    id_visita: int, 
    visita_update: VisitaUpdate, 
    db: Session = Depends(get_db)
):
    db_visita = db.query(Visita).filter(Visita.id_visita == id_visita).first()
    if not db_visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    update_data = visita_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_visita, key, value)

    try:
        db.commit()
        db.refresh(db_visita)
        return db_visita
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar visita: {str(e)}")