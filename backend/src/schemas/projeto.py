from decimal import Decimal

from pydantic import BaseModel, ConfigDict, computed_field
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

    @computed_field
    @property
    def atrasado(self) -> bool:
        """Calcula se o projeto está atrasado com base na data atual."""
        if not self.status or not self.data_fim_prevista:
            return False
            
        # Normalização para comparação robusta
        status_limpo = self.status.lower().strip()
        return status_limpo == 'em andamento' and self.data_fim_prevista < date.today()

class ProjetoUpdate(BaseModel):
    titulo: str | None = None
    descricao: str | None = None
    valor_total: Decimal | None = None
    status: str | None = None
    data_inicio: date | None = None
    data_fim_prevista: date | None = None
    data_fim_real: date | None = None
    observacoes_gerais: str | None = None