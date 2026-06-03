"""
Script utilitário: inspeciona constraints do PostgreSQL.
Usa DATABASE_URL do ambiente (.env ou variável de sistema).
"""
import os
import sys
from dotenv import load_dotenv
import sqlalchemy
from sqlalchemy import create_engine, text

# Carrega .env da raiz do projeto
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

DATABASE_URL = os.getenv("DATABASE_URL") or (
    "postgresql://"
    f"{os.getenv('DB_USER', 'admin')}:{os.getenv('DB_PASSWORD', 'admin123')}"
    f"@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}"
    f"/{os.getenv('DB_NAME', 'am_consultoria')}"
)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text(
        "SELECT conname, pg_get_constraintdef(c.oid) "
        "FROM pg_constraint c "
        "JOIN pg_namespace n ON n.oid = c.connamespace "
        "WHERE n.nspname = 'public' AND conrelid = 'visitas_extra'::regclass"
    ))
    for row in result:
        print(row)
