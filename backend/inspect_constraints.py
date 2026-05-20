import sqlalchemy
from sqlalchemy import create_engine, text
engine = create_engine('postgresql://admin:admin123@127.0.0.1:5432/am_consultoria')
with engine.connect() as conn:
    result = conn.execute(text("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public' AND conrelid = 'visitas_extra'::regclass"))
    for row in result:
        print(row)
