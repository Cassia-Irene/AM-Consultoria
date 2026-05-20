from datetime import date
from fastapi import HTTPException
from sqlalchemy.orm import Session
from src.models.contrato import Contrato
from src.models.historico_contrato import HistoricoContrato
from src.models.contrato_pagamento import ContratoPagamento
from src.schemas.contrato import ContratoReplaceRequest
def encerrar_e_criar_novo_contrato(db: Session, data: ContratoReplaceRequest):
    # 1. Buscar contrato atual
    antigo = db.query(Contrato).filter(Contrato.id_contrato == data.contrato_id).first()
    if not antigo:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    # 🚨 NOVA VALIDAÇÃO DE SEGURANÇA (O Escudo Anti-Zumbi)
    if antigo.data_fim is not None and antigo.data_fim <= date.today():
        raise HTTPException(status_code=400, detail="Este contrato já está encerrado e não pode ser substituído novamente.")
    
    try:
        # 2. Encerrar antigo
        antigo.data_fim = date.today()
        
        # 3. Preparar o novo contrato
        novo = Contrato(
            id_cliente=antigo.id_cliente,
            data_inicio=date.today(),
            servicos_contratados=antigo.servicos_contratados,
            visitas_previstas_mes=data.visitas_previstas_mes, # Valor novo vindo da requisição
            inclui_relatorio=antigo.inclui_relatorio,
            observacoes_gerais=f"Substituição do contrato {antigo.id_contrato}"
        )
        
        db.add(novo)
        
        # 4. O PULO DO GATO: flush() sincroniza com o banco e gera o ID do 'novo'
        # sem encerrar a transação (commit).
        db.flush() 

        # 5. Se houver novo valor, cria o pagamento vinculado
        if data.novo_valor_mensal:
            tipo_id = 1 # Mensalidade por padrão
            if antigo.pagamentos:
                tipo_id = antigo.pagamentos[0].id_tipo_pagamento
            
            novo_pagamento = ContratoPagamento(
                id_contrato=novo.id_contrato,
                id_tipo_pagamento=tipo_id,
                valor=data.novo_valor_mensal
            )
            db.add(novo_pagamento)

        # 6. Agora criamos o histórico com os dois IDs garantidos
        historico = HistoricoContrato(
            id_contrato_encerrado=antigo.id_contrato,
            id_contrato_novo=novo.id_contrato, # Agora este ID já existe!
            data_alteracao=antigo.data_fim, # Data do encerramento do contrato antigo
            motivo_alteracao=f"Substituição automática: Visitas {data.visitas_previstas_mes}, Valor R$ {data.novo_valor_mensal or 'mantido'}"
        )
        
        db.add(historico)

        # 6. Finaliza tudo de uma vez
        db.commit()
        db.refresh(novo)
        return novo

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro na substituição: {str(e)}")