import os
from sqlalchemy import create_engine, text

DB_URL = "postgresql://admin:admin@127.0.0.1:5432/am_consultoria"
engine = create_engine(DB_URL)

with engine.connect() as conn:
    res = conn.execute(text("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'visitas'::regclass;"))
    for row in res:
        print(row)
