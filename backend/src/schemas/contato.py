from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional

#
class ContatoBase(BaseModel):
    id_cliente: int
    nome: str
    cargo: Optional[str] = None
    papel: str
    telefone_whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    # ✅ Adicionado observacoes_gerais que existe no SQL e no diagrama
    observacoes_gerais: Optional[str] = None

class ContatoCreate(ContatoBase):
    pass

class ContatoRead(ContatoBase):
    id_contato: int
    
    model_config = ConfigDict(from_attributes=True)