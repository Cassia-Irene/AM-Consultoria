from pydantic import BaseModel, ConfigDict, computed_field, Field
from typing import Optional, Any

class ProjetoExtraBase(BaseModel):
    id_projeto: int
    solicitado_por: int
    aprovado_por: Optional[int] = None

class ProjetoExtraCreate(ProjetoExtraBase):
    pass

class ProjetoExtraRead(ProjetoExtraBase):
    id_extra: int
    solicitante: Optional[Any] = Field(None, exclude=True)
    aprovador: Optional[Any] = Field(None, exclude=True)
    
    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def solicitado_por_nome(self) -> str:
        return self.solicitante.nome if self.solicitante else "Desconhecido"

    @computed_field
    @property
    def aprovado_por_nome(self) -> Optional[str]:
        return self.aprovador.nome if self.aprovador else None

class ProjetoExtraUpdate(BaseModel):
    aprovado_por:(Optional[int]) = None 