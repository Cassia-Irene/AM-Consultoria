from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import clientes, contatos, contratos, visitas, projetos, pendencias, eventos_criticos, visitas_extra, projeto_parcelas, projetos_extra, tipos_pagamento, contrato_pagamento, recebimentos, faturamento_cliente, entregas

# 1º Criar a instância da aplicação
app = FastAPI(title="AM Consultoria API")

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, especifique o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2º Incluir os routers (DEPOIS de criar o app)
app.include_router(clientes.router)
app.include_router(contatos.router) 
app.include_router(contratos.router) 
app.include_router(visitas.router)
app.include_router(projetos.router)
app.include_router(pendencias.router)
app.include_router(eventos_criticos.router)
app.include_router(visitas_extra.router)
app.include_router(projeto_parcelas.router)
app.include_router(projetos_extra.router)
app.include_router(tipos_pagamento.router)
app.include_router(contrato_pagamento.router)
app.include_router(recebimentos.router)
app.include_router(faturamento_cliente.router)
app.include_router(entregas.router)

@app.get("/")
def root():
    return {"msg": "API AM Consultoria rodando 🚀"}