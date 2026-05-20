import requests

endpoints = ["/clientes/", "/visitas/", "/projetos/", "/pendencias/", "/analytics/summary"]

for ep in endpoints:
    try:
        response = requests.get(f"http://127.0.0.1:8000{ep}")
        print(f"{ep}: {response.status_code}")
    except Exception as e:
        print(f"{ep}: Error {e}")
