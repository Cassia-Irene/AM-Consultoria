from src.database import SessionLocal
from sqlalchemy import text
import json

db = SessionLocal()
try:
    # 1. Tabelas e Colunas
    query = text("""
        SELECT 
            table_name, 
            column_name, 
            data_type, 
            is_nullable,
            column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
    """)
    rows = db.execute(query).fetchall()
    
    schema = {}
    for r in rows:
        t = r[0]
        if t not in schema: schema[t] = []
        schema[t].append({
            "column": r[1],
            "type": r[2],
            "nullable": r[3],
            "default": r[4]
        })
        
    # 2. Check Constraints (Importante para enums simulados)
    query_check = text("""
        SELECT
            conname,
            pg_get_constraintdef(c.oid)
        FROM
            pg_constraint c
        JOIN
            pg_namespace n ON n.oid = c.connamespace
        WHERE
            n.nspname = 'public' AND c.contype = 'c';
    """)
    checks = db.execute(query_check).fetchall()
    
    # 3. Foreign Keys
    query_fk = text("""
        SELECT
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY';
    """)
    fks = db.execute(query_fk).fetchall()

    result = {
        "tables": schema,
        "checks": [{"name": c[0], "definition": c[1]} for c in checks],
        "fks": [{"table": f[0], "column": f[1], "ref_table": f[2], "ref_column": f[3]} for f in fks]
    }
    
    print(json.dumps(result, indent=2))
finally:
    db.close()
