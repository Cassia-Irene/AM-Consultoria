import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import clientes, contatos, contratos, visitas, projetos, pendencias, eventos_criticos, visitas_extra, projeto_parcelas, projetos_extra, tipos_pagamento, contrato_pagamento, faturamento_cliente, entregas, analytics, intelligence

# Cria a instância da aplicação
app = FastAPI(title="AM Consultoria API")

# ── CORS ──────────────────────────────────────────────────────────────────────
# Em desenvolvimento: CORS_ORIGINS não definido → fallback para localhost
# Em produção: definir CORS_ORIGINS=https://meu-app.vercel.app no painel do Render
_cors_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
CORS_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir os routers
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
app.include_router(faturamento_cliente.router)
app.include_router(entregas.router)
app.include_router(analytics.router)
app.include_router(intelligence.router)

@app.get("/")
def root():
    return {"msg": "API AM Consultoria rodando 🚀"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    print(f"[BACKEND] Iniciando servidor na porta {port} (todas as interfaces)...")
    uvicorn.run(app, host="0.0.0.0", port=port)