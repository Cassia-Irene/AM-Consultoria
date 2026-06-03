# Procfile — AM Consultoria Backend
#
# Ponto de entrada para o Render (e Heroku-compatible platforms).
#
# - PYTHONPATH=backend  → permite que 'import src.*' funcione a partir da raiz
# - $PORT               → porta dinâmica fornecida pelo Render
# - --host 0.0.0.0      → necessário para aceitar conexões externas em cloud
#
# Equivalente local: python run_backend.py
web: PYTHONPATH=backend uvicorn src.main:app --host 0.0.0.0 --port $PORT
