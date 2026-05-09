from fastapi.testclient import TestClient
from src.main import app
from datetime import datetime
import json

client = TestClient(app)

def test_visitas_flow():
    print("--- 1. VALIDANDO POST /visitas/ ---")
    payload = {
        "id_cliente": 1,
        "id_contrato": 1,
        "id_projeto": None,
        "status": "agendada",
        "data_hora": datetime.now().isoformat(),
        "duracao_estimada_minutos": 60,
        "tipo_visita": "rotineira",
        "modalidade": "presencial",
        "descricao": "Visita de teste para validação",
        "resultados": "Resultados da visita"
    }
    
    response = client.post("/visitas/", json=payload)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Response JSON:")
        print(json.dumps(data, indent=2))
        
        id_visita = data.get("id_visita")
        print(f"\n--- 3. VALIDANDO ID DA VISITA ---")
        print(f"id_visita retornado: {id_visita}")
        
        print("\n--- 2. VALIDANDO GET /visitas/ ---")
        get_response = client.get("/visitas/")
        print(f"Status Code: {get_response.status_code}")
        if get_response.status_code == 200:
            visitas = get_response.json()
            print(f"Total de visitas: {len(visitas)}")
            if len(visitas) > 0:
                print("Exemplo de retorno (primeira visita):")
                print(json.dumps(visitas[0], indent=2))
    else:
        print(f"Erro no POST: {response.text}")

if __name__ == "__main__":
    test_visitas_flow()
