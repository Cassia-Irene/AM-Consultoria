"""
snapshot_neon_restore.py
========================
Aplica o arquivo SQL backend/snapshots/presentation_snapshot.sql
no banco de dados especificado pela variável de ambiente DATABASE_URL.

Uso:
    # Para aplicar no Neon (ou em qualquer outro target):
    DATABASE_URL="postgresql://..." python backend/snapshot_neon_restore.py
"""

import os
import sys
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Caminhos
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT_FILE = PROJECT_ROOT / "backend" / "snapshots" / "presentation_snapshot.sql"
ENV_FILE = PROJECT_ROOT / ".env"

# Tabelas para validação
TABLES = [
    "tipos_pagamento",
    "clientes",
    "contatos",
    "contratos",
    "contrato_pagamento",
    "projetos",
    "projeto_parcelas",
    "projetos_extra",
    "visitas",
    "visitas_extra",
    "pendencias",
    "eventos_criticos",
    "entregas",
    "faturamento_cliente",
    "historico_contratos",
]

def load_database_url() -> str:
    load_dotenv(ENV_FILE)
    url = os.getenv("DATABASE_URL")
    if not url:
        # Fallback local
        user = os.getenv("DB_USER", "admin")
        password = os.getenv("DB_PASSWORD", "admin123")
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "5432")
        name = os.getenv("DB_NAME", "am_consultoria")
        url = f"postgresql://{user}:{password}@{host}:{port}/{name}"
    return url

def mask_url(url: str) -> str:
    import re
    return re.sub(r"(://[^:]+:)[^@]+(@)", r"\1***\2", url)

def main():
    print("=" * 60)
    print("  SNAPSHOT RESTORE TO DATABASE_URL - AM Consultoria")
    print("=" * 60)

    db_url = load_database_url()
    print(f">> Banco Alvo: {mask_url(db_url)}")
    print(f">> Snapshot  : {SNAPSHOT_FILE}")

    if not SNAPSHOT_FILE.exists():
        print(f"\n❌ Arquivo de snapshot não encontrado em: {SNAPSHOT_FILE}")
        print("   Por favor, execute 'python backend/snapshot_export.py' primeiro no banco de origem.")
        sys.exit(1)

    print("\n⚠️  AVISO: Esta operação vai APAGAR (Truncate) os dados do banco alvo.")
    print("   Pressione ENTER para continuar ou Ctrl+C para cancelar.")
    try:
        input()
    except KeyboardInterrupt:
        print("\nOperação cancelada pelo usuário.")
        sys.exit(0)

    # Conectar ao banco alvo
    print("\n[1/3] Conectando ao banco alvo...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
    except Exception as e:
        print(f"❌ Falha ao conectar: {e}")
        sys.exit(1)
    print("   ✅ Conectado com sucesso.")

    # Ler e aplicar snapshot SQL
    file_size_kb = SNAPSHOT_FILE.stat().st_size / 1024
    print(f"\n[2/3] Aplicando snapshot SQL ({file_size_kb:.1f} KB)...")
    try:
        sql = SNAPSHOT_FILE.read_text(encoding="utf-8")
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        print("   ✅ Snapshot aplicado com sucesso.")
    except Exception as e:
        conn.rollback()
        print(f"❌ Erro ao aplicar snapshot (transação revertida): {e}")
        conn.close()
        sys.exit(1)

    # Validação e contagem
    print("\n[3/3] Validando contagem de registros...")
    total_records = 0
    try:
        with conn.cursor() as cur:
            print(f"\n  {'Tabela':<30} {'Registros'}")
            print(f"  {'-'*30} {'-'*10}")
            for table in TABLES:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                total_records += count
                status = "✅" if count > 0 else "  "
                print(f"  {status} {table:<30} {count:>5}")
    except Exception as e:
        print(f"❌ Erro ao contar registros: {e}")
        conn.close()
        sys.exit(1)

    print(f"\n  📦 TOTAL RESTAURADO: {total_records} registros")
    print("=" * 60)
    print("\n✅ RESTORE CONCLUÍDO COM SUCESSO!\n")
    conn.close()

if __name__ == "__main__":
    main()
