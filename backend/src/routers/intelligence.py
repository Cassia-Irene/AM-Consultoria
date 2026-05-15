from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.intelligence_service import IntelligenceService

router = APIRouter(prefix="/intelligence", tags=["Inteligência Operacional"])

@router.get("/attention")
def get_attention(db: Session = Depends(get_db)):
    """Retorna itens que requerem atenção imediata do Adriano."""
    return IntelligenceService.get_global_attention(db)
