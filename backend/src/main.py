from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"msg": "API AM Consultoria rodando 🚀"}