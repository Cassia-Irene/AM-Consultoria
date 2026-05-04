from pydantic import BaseModel, ConfigDict
from typing import Optional

class ClienteBase(BaseModel):
    nome_instituicao: str
    tipo_instituicao: str
    cidade: str
    status: str = "ativo"
    nivel_complexidade: Optional[str] = None
    modalidade_atendimento: Optional[str] = None
    observacoes_gerais: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass # Usado para o POST

class ClienteRead(ClienteBase):
    id_cliente: int
    
    # Configuração necessária para o Pydantic entender o Model do SQLAlchemy
    model_config = ConfigDict(from_attributes=True)