from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from src.models.pendencia import Pendencia
from src.models.visita import Visita

def get_diff_dias(data_prazo: date) -> int:
    hoje = date.today()
    return (data_prazo - hoje).days

def calculate_pendencia_score(p: Pendencia) -> int:
    """
    Algoritmo central de priorização (Modo Caos).
    Regras (maior score = maior prioridade):
      1. Atrasado (diff < 0):  base 1000 + quanto mais atrasado, maior
      2. Vence hoje  (diff 0): 500
      3. Vence amanhã (diff 1): 400
      4. Vence em 2d  (diff 2): 300
    """
    if not p.data_prazo:
        return 0

    diff = get_diff_dias(p.data_prazo)

    if diff < 0:
        return 1000 + abs(diff) * 10
    if diff == 0:
        return 500
    if diff == 1:
        return 400
    if diff == 2:
        return 300

    return 0

def get_urgency_label(data_prazo: date) -> str:
    diff = get_diff_dias(data_prazo)
    if diff < 0:
        return "ontem" if diff == -1 else f"{abs(diff)}d atrás"
    if diff == 0:
        return "hoje"
    if diff == 1:
        return "amanhã"
    return f"em {diff}d"

def get_top_priority_insight(db: Session, pendencias_abertas: List[Pendencia]):
    if not pendencias_abertas:
        return None

    scored = []
    for p in pendencias_abertas:
        score = calculate_pendencia_score(p)
        if score > 0:
            scored.append({"p": p, "score": score})

    if not scored:
        return None

    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[0]["p"]
    prazo = getattr(top, "data_prazo", None)
    diff = get_diff_dias(prazo) if prazo else 0

    # Acesso seguro a relacionamentos (ORM ou Pydantic)
    contrato = getattr(top, "contrato", None)
    cliente = getattr(contrato, "cliente", None) if contrato else None
    cliente_nome = getattr(cliente, "nome", "Desconhecido") if cliente else "Desconhecido"

    return {
        "tipo": "top1",
        "titulo": getattr(top, "descricao", "Sem descrição"),
        "cliente_nome": cliente_nome,
        "entidade_id": getattr(top, "id_pendencia", None),
        "prazo_label": get_urgency_label(prazo) if prazo else "sem prazo",
        "atraso": diff < 0,
        "score": scored[0]["score"]
    }
