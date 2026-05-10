import subprocess
import sys
import os

# Adiciona o diretório 'backend' ao PYTHONPATH para que 'src' seja encontrável
backend_path = os.path.join(os.getcwd(), "backend")
env = os.environ.copy()
env["PYTHONPATH"] = backend_path + os.pathsep + env.get("PYTHONPATH", "")

print(f"[RUNNER] Iniciando Backend a partir de: {backend_path}")

try:
    # Roda o uvicorn apontando para src.main:app
    subprocess.run(["uvicorn", "src.main:app", "--reload", "--port", "8000"], env=env, check=True)
except KeyboardInterrupt:
    print("[RUNNER] Backend parado pelo usuário.")
except Exception as e:
    print(f"[RUNNER] Erro ao iniciar backend: {e}")
