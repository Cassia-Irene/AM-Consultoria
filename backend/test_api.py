import requests

try:
    response = requests.get("http://127.0.0.1:8000/projetos/")
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text[:200]}...")
except Exception as e:
    print(f"Error: {e}")
