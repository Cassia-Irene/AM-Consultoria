from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional

#
class ContatoBase(BaseModel):
    id_cliente: int
    nome: str
    cargo: Optional[str] = None
    papel: str
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    is_principal: bool = False
    status: str = "ativo"
    observacoes_gerais: Optional[str] = None

class ContatoCreate(ContatoBase):
    pass

class ContatoRead(ContatoBase):
    id_contato: int
    
    model_config = ConfigDict(from_attributes=True)

class ContatoUpdate(BaseModel):
    nome: str | None = None
    cargo: str | None = None
    papel: str | None = None
    telefone: str | None = None
    email: str | None = None
    is_principal: bool | None = None
    status: str | None = None
    observacoes_gerais: str | None = None