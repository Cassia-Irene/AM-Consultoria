from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.services.analytics_service import AnalyticsService
from src.schemas.analytics import (
    DashboardSummary, 
    TimelineEvent, 
    CaosScore,
    OpenPendency, 
    ActiveProject, 
    FinancialMonth, 
    ContractHistory, 
    CriticalEvent, 
    ExtraVisitSummary,
    TopPriority,
    PlanningOverview,
    ClientHealth,
    TodayVisit
)

router = APIRouter(prefix="/analytics", tags=["Inteligência Operacional"])

@router.get("/summary", response_model=DashboardSummary)

def get_summary(db: Session = Depends(get_db)):

    """Resumo de indicadores para o Dashboard Home."""
    return AnalyticsService.get_dashboard_summary(db)

@router.get("/timeline", response_model=List[TimelineEvent])
def get_timeline(db: Session = Depends(get_db)):
    """Timeline consolidada (Visitas, Pendências, Financeiro)."""
    return AnalyticsService.get_operational_timeline(db)

@router.get("/caos-score", response_model=List[CaosScore])
def get_caos_score(db: Session = Depends(get_db)):
    """Índice de instabilidade operacional por cliente."""
    return AnalyticsService.get_caos_score(db)

@router.get("/pendencies", response_model=List[OpenPendency])
def get_pendencies(db: Session = Depends(get_db)):
    """Lista de pendências em aberto com status de prazo."""
    return AnalyticsService.get_open_pendencies(db)

@router.get("/projects", response_model=List[ActiveProject])
def get_projects(db: Session = Depends(get_db)):
    """Visão de progresso dos projetos ativos."""
    return AnalyticsService.get_active_projects(db)

@router.get("/finance", response_model=List[FinancialMonth])
def get_finance(db: Session = Depends(get_db)):
    """Histórico financeiro consolidado mensal."""
    return AnalyticsService.get_financial_overview(db)

@router.get("/contracts-history", response_model=List[ContractHistory])
def get_contracts_history(db: Session = Depends(get_db)):
    """Histórico de alterações e substituições de contratos."""
    return AnalyticsService.get_contract_history(db)

@router.get("/critical-events", response_model=List[CriticalEvent])
def get_critical_events(db: Session = Depends(get_db)):
    """Alertas de eventos graves sem ação tomada."""
    return AnalyticsService.get_critical_events(db)

@router.get("/extra-visits", response_model=List[ExtraVisitSummary])
def get_extra_visits(db: Session = Depends(get_db)):
    """Resumo de visitas extras por mês."""
    return AnalyticsService.get_extra_visits(db)

@router.get("/priorities", response_model=List[TopPriority])
def get_priorities(db: Session = Depends(get_db)):
    """Ações imediatas e prioridades de campo."""
    return AnalyticsService.get_top_priorities(db)

@router.get("/planning", response_model=List[PlanningOverview])
def get_planning(db: Session = Depends(get_db)):
    """Visão de planejamento semanal e carga operacional."""
    return AnalyticsService.get_planning_overview(db)

@router.get("/client-health", response_model=List[ClientHealth])
def get_client_health(db: Session = Depends(get_db)):
    """Indicadores de saúde, desgaste e horas invisíveis por cliente."""
    return AnalyticsService.get_client_health(db)

@router.get("/today-agenda", response_model=List[TodayVisit])
def get_today_agenda(db: Session = Depends(get_db)):
    """Visitas programadas para o dia de hoje."""
    return AnalyticsService.get_today_agenda(db)

@router.get("/weekly-agenda", response_model=List[TodayVisit])
def get_weekly_agenda(db: Session = Depends(get_db)):
    """Visitas programadas para os próximos 7 dias."""
    return AnalyticsService.get_weekly_agenda(db)



