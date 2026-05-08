from decimal import Decimal

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

# O Projeto é a entidade que representa a execução do contrato, ou seja, o acompanhamento das visitas, entregas e resultados. Ele tem um ciclo de vida próprio, com início, andamento e conclusão. Por isso, ele tem uma tabela separada no banco de dados e um schema específico para validação dos dados.
class ProjetoBase(BaseModel):
    id_contrato: int
    titulo: str
    descricao: Optional[str] = None
    valor_total: Decimal
    status: str
    data_inicio: date
    data_fim_prevista: Optional[date] = None
    data_fim_real: Optional[date] = None
    observacoes_gerais: Optional[str] = None
    
class ProjetoCreate(ProjetoBase):
    pass

class ProjetoRead(ProjetoBase):
    id_projeto: int
    
    model_config = ConfigDict(from_attributes=True)