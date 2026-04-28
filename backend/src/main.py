from fastapi import FastAPI
from src.routers import clientes, contatos, contratos, visitas

# 1º Criar a instância da aplicação
app = FastAPI(title="AM Consultoria API")

# 2º Incluir os routers (DEPOIS de criar o app)
app.include_router(clientes.router)
app.include_router(contatos.router) # Descomente quando criar o ficheiro src/routers/contatos.py
app.include_router(contratos.router) # Descomente quando criar o ficheiro src/routers/contratos.py
app.include_router(visitas.router)

@app.get("/")
def root():
    return {"msg": "API AM Consultoria rodando 🚀"}