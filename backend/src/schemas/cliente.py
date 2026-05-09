from datetime import date

from pydantic import BaseModel, ConfigDict
from typing import Optional
from pydantic import BaseModel, field_validator # Importe o field_validator


class ClienteBase(BaseModel):
    nome: str
    tipo_instituicao: str
    cidade: str
    status: str = "ativo"
    nivel_complexidade: Optional[str] = None
    #modalidade_atendimento: Optional[str] = None
    observacoes_gerais: Optional[str] = None

    # Esse validador garante que 'Alta' vire 'alta' antes de chegar no banco
    @field_validator('nivel_complexidade', 'status')
    @classmethod
    def para_minusculo(cls, v: str) -> str:
        return v.lower()

class ClienteCreate(ClienteBase):
    pass # Usado para o POST

class ClienteRead(ClienteBase):
    id_cliente: int
    
    # Configuração necessária para o Pydantic entender o Model do SQLAlchemy
    model_config = ConfigDict(from_attributes=True)


class ClienteUpdate(BaseModel):
    nome: str | None = None
    tipo_instituicao: str | None = None
    cidade: str | None = None
    status: str | None = None
    nivel_complexidade: str | None = None
    observacoes_gerais: str | None = None
    