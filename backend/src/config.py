import os
import re
from dotenv import load_dotenv

# Carrega .env da raiz do projeto (funciona localmente; em produção as vars vêm do ambiente)
_env_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(_env_path)

# ── Partes individuais (retrocompatibilidade local) ───────────────────────────
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASSWORD", "admin123")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "am_consultoria")

# ── DATABASE_URL: prioridade para a variável completa, fallback para as partes ─
_url_from_parts = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
DATABASE_URL: str = os.getenv("DATABASE_URL") or _url_from_parts

# ── Ambiente ──────────────────────────────────────────────────────────────────
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")


def _mask_url(url: str) -> str:
    """Substitui a senha na URL por *** para evitar exposição em logs."""
    return re.sub(r"(://[^:]+:)[^@]+(@)", r"\1***\2", url)


# ── Log de inicialização (sem expor credenciais) ──────────────────────────────
print(f"[BACKEND] ENVIRONMENT : {ENVIRONMENT}")
print(f"[BACKEND] DATABASE_URL: {_mask_url(DATABASE_URL)}")