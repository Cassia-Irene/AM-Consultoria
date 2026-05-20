from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from src.database import get_db
from src.models.projeto import Projeto
from src.models.contrato import Contrato
from src.models.projeto_extra import ProjetoExtra
from src.schemas.projeto import ProjetoCreate, ProjetoRead, ProjetoUpdate
from src.services.intelligence.audit_manager import AuditManager


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
    # Busca todos os projetos cadastrados com relações para inteligência
    return db.query(Projeto).options(
        joinedload(Projeto.entregas),
        joinedload(Projeto.extras).joinedload(ProjetoExtra.solicitante),
        joinedload(Projeto.extras).joinedload(ProjetoExtra.aprovador),
        joinedload(Projeto.contrato).joinedload(Contrato.eventos_criticos)
    ).all()

@router.get("/{id_projeto}", response_model=ProjetoRead)
def buscar_projeto(id_projeto: int, db: Session = Depends(get_db)):
    """Busca os detalhes de um projeto específico por ID."""
    projeto = db.query(Projeto).options(
        joinedload(Projeto.entregas),
        joinedload(Projeto.visitas),
        joinedload(Projeto.parcelas),
        joinedload(Projeto.extras).joinedload(ProjetoExtra.solicitante),
        joinedload(Projeto.extras).joinedload(ProjetoExtra.aprovador),
        joinedload(Projeto.contrato).joinedload(Contrato.eventos_criticos),
        joinedload(Projeto.contrato).joinedload(Contrato.pendencias)
    ).filter(Projeto.id_projeto == id_projeto).first()
    
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    # Snapshot sob demanda (apenas no detalhe para preservar memória operacional)
    from src.read_models.project_operational_state import ProjectOperationalState
    try:
        ProjectOperationalState(projeto).persist_snapshot()
    except:
        pass

    return projeto

@router.patch("/{id_projeto}", response_model=ProjetoRead)
def atualizar_projeto(
    id_projeto: int, 
    projeto_update: ProjetoUpdate, 
    db: Session = Depends(get_db)
):
    # 1. Busca estado anterior para auditoria
    db_projeto = db.query(Projeto).filter(Projeto.id_projeto == id_projeto).first()
    
    if not db_projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    update_data = projeto_update.model_dump(exclude_unset=True)
    
    # 2. Identifica Mudanças Reais
    real_changes = {}
    for key, value in update_data.items():
        old_val = getattr(db_projeto, key)
        if str(old_val) != str(value): # Comparação simples para detecção de drift
            real_changes[key] = {"de": str(old_val), "para": str(value)}
            setattr(db_projeto, key, value)

    if not real_changes:
        return db_projeto

    try:
        # 3. Registro de Auditoria (Memória Longitudinal)
        AuditManager.log_change("projeto", id_projeto, real_changes)
        
        db.commit()
        db.refresh(db_projeto)
        
        # 4. Trigger de Recálculo de Inteligência (Implícito no GET/Refresh)
        return db_projeto
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar governança: {str(e)}")

@router.get("/{id_projeto}/auditoria")
def obter_auditoria_projeto(id_projeto: int):
    """
    Retorna o histórico de governança e intervenções humanas do projeto.
    """
    return AuditManager.get_history("projeto", id_projeto)

@router.delete("/{id_projeto}/auditoria/{timestamp}")
def deletar_auditoria_projeto(id_projeto: int, timestamp: str):
    """
    Remove um registro específico de governança/auditoria pelo timestamp.
    """
    # Em um sistema real, decodificaria a URL, mas FastAPI já trata isso
    success = AuditManager.delete_log(timestamp)
    if not success:
        raise HTTPException(status_code=404, detail="Registro de auditoria não encontrado")
    return {"message": "Registro removido com sucesso"}