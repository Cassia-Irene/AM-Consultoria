import requests
import json
from datetime import datetime

url = "http://localhost:8000/visitas/"
payload = {
    "id_contrato": 1,
    "id_projeto": None,
    "status": "agendada",
    "data_hora": datetime.now().isoformat(),
    "duracao_minutos": 60,
    "tipo_visita": "rotineira",
    "modalidade": "presencial",
    "descricao": "Teste de integração REAL",
    "resultados": None
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
