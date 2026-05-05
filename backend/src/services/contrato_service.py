# Lógica de versionamento
from sqlalchemy.orm import Session
from datetime import date
from src.models.contrato import Contrato, HistoricoContrato
from src.schemas.contrato import ContratoReplaceRequest
from fastapi import HTTPException

def encerrar_e_criar_novo_contrato(db: Session, data: ContratoReplaceRequest):
    """
    Fluxo:
    1. Buscar contrato atual (id_contrato_encerrado)
    2. Validar que está ativo
    3. Atualizar: status = 'inativo', data_fim = hoje
    4. Criar novo contrato com mesmos dados base + novos parâmetros
    5. Registrar no histórico
    """
    # 1. Buscar contrato atual
    antigo = db.query(Contrato).filter(Contrato.id_contrato == data.contrato_id).first()
    if not antigo:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    # 2. Validar que está ativo
    if antigo.status != "ativo":
        raise HTTPException(status_code=400, detail="Apenas contratos ativos podem ser substituídos")
    
    # 3. Encerrar antigo
    antigo.status = "inativo"
    antigo.data_fim = date.today()
    
    # 4. Criar novo contrato
    novo = Contrato(
        id_cliente=antigo.id_cliente,
        tipo_cobranca=antigo.tipo_cobranca,
        valor_mensal=data.novo_valor_mensal,
        visitas_previstas_mes=data.visitas_previstas_mes,
        valor_visita_extra=antigo.valor_visita_extra,
        inclui_relatorio=antigo.inclui_relatorio,
        data_inicio=date.today(),
        status="ativo",
        observacoes=antigo.observacoes
    )
    db.add(novo)
    db.flush() # Para pegar o novo.id_contrato
    
    # 5. Criar registro em HISTORICO_CONTRATOS
    historico = HistoricoContrato(
        id_contrato_encerrado=antigo.id_contrato,
        id_contrato_novo=novo.id_contrato,
        data_alteracao=date.today(),
        motivo_alteracao=data.motivo_alteracao
    )
    db.add(historico)
    
    db.commit()
    db.refresh(novo)
    return novo