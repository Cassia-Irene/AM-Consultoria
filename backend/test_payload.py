import requests
import json

response = requests.get("http://127.0.0.1:8000/projetos/")
if response.status_code == 200:
    data = response.json()
    if data:
        print(json.dumps(data[0], indent=2, ensure_ascii=False))
else:
    print(f"Error: {response.status_code}")
