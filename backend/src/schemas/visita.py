from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class VisitaBase(BaseModel):
    id_cliente: int
    # Ajustado para id_projeto para seguir o Modelo Lógico
    id_projeto: int 
    # Renomeado de data_visita para data
    data: date 
    modalidade: str
    duracao_estimada_minutos: int
    status: str = "Agendada"
    descricao: Optional[str] = None
    resultado: Optional[str] = None

class VisitaCreate(VisitaBase):
    pass

class VisitaRead(VisitaBase):
    id_visita: int
    
    # Configuração para integração com SQLAlchemy
    model_config = ConfigDict(from_attributes=True)