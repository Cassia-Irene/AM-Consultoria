from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional

class ContatoBase(BaseModel):
    id_cliente: int
    nome: str
    cargo: Optional[str] = None
    papel: str
    telefone_whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None # Valida se o formato do e-mail está certo
    contato_emergencia: bool = False
    contato_financeiro: bool = False

class ContatoCreate(ContatoBase):
    pass

class ContatoRead(ContatoBase):
    id_contato: int
    
    model_config = ConfigDict(from_attributes=True)