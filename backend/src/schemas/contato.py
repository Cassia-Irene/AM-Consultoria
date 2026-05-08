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
    observacoes_gerais: Optional[str] = None

class ContatoCreate(ContatoBase):
    pass

class ContatoRead(ContatoBase):
    id_contato: int
    
    model_config = ConfigDict(from_attributes=True)