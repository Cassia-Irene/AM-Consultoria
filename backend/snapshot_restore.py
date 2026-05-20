"""
snapshot_restore.py
===================
Restaura o banco de dados a partir do arquivo presentation_snapshot.sql.

O que este script faz:
  1. Conecta ao PostgreSQL (banco 'postgres' para administração)
  2. Encerra conexões ativas ao banco alvo
  3. Dropa e recria o banco am_consultoria do zero
  4. Cria o schema completo via SQLAlchemy (tabelas, constraints, índices)
  5. Aplica o snapshot SQL (TRUNCATE + INSERTs + SETVAL de sequences)
  6. Valida contagem de registros e exibe relatório

Pré-requisitos (no notebook destino):
  - PostgreSQL instalado e rodando
  - Python 3.10+
  - pip install -r requirements.txt  (psycopg2 já está na lista)
  - Arquivo .env na raiz do projeto com credenciais do banco local
  - Arquivo snapshots/presentation_snapshot.sql copiado para backend/snapshots/

Uso:
    python snapshot_restore.py
"""

import os
import sys
import re
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# ─── Configuração ────────────────────────────────────────────────────────────

# Carrega .env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

DB_HOST     = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT     = int(os.getenv("DB_PORT", "5432"))
DB_NAME     = os.getenv("DB_NAME", "am_consultoria")
DB_USER     = os.getenv("DB_USER", "admin")
DB_PASSWORD = os.getenv("DB_PASSWORD", "admin123")

SNAPSHOT_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "snapshots", "presentation_snapshot.sql"
)

# Contagens esperadas para validação (espelho do ambiente de origem)
EXPECTED_COUNTS = {
    "tipos_pagamento":      5,
    "clientes":             8,
    "contatos":            19,
    "contratos":            7,
    "contrato_pagamento":   7,
    "projetos":            26,
    "projeto_parcelas":    96,
    "projetos_extra":      20,
    "visitas":            211,
    "visitas_extra":        0,
    "pendencias":         119,
    "eventos_criticos":    14,
    "entregas":           141,
    "faturamento_cliente": 42,
    "historico_contratos":  0,
}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def connect_admin():
    """Conecta ao banco 'postgres' para operações administrativas (DROP/CREATE)."""
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname="postgres",
        user=DB_USER, password=DB_PASSWORD
    )


def connect_target():
    """Conecta ao banco alvo após o restore."""
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD
    )


def recreate_database():
    """Dropa e recria o banco alvo. Usa autocommit pois DDL de banco não suporta transação."""
    print(f"\n[1/5] Recriando banco '{DB_NAME}'...")
    conn = connect_admin()
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    # Encerra todas as conexões ativas ao banco alvo
    cur.execute(f"""
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '{DB_NAME}' AND pid <> pg_backend_pid()
    """)
    terminated = cur.rowcount
    if terminated > 0:
        print(f"   ⚠  {terminated} conexão(ões) encerrada(s) ao banco alvo.")

    cur.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
    print(f"   ✅ DROP DATABASE {DB_NAME}")

    cur.execute(f"CREATE DATABASE {DB_NAME} ENCODING 'UTF8'")
    print(f"   ✅ CREATE DATABASE {DB_NAME}")

    cur.close()
    conn.close()


def create_schema():
    """Cria o schema completo via SQLAlchemy (tabelas, constraints, índices, sequences)."""
    print("\n[2/5] Criando schema (tabelas, constraints, sequences)...")
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from src.database import Base, engine
    from src.models import (
        Cliente, Contato, Contrato, ContratoPagamento,
        Projeto, ProjetoParcela, ProjetoExtra,
        Visita, VisitaExtra, Pendencia, EventoCritico,
        Entrega, FaturamentoCliente, HistoricoContrato, TipoPagamento
    )
    Base.metadata.create_all(bind=engine)
    print("   ✅ Schema criado com sucesso.")


def apply_snapshot():
    """Aplica o arquivo SQL do snapshot no banco alvo."""
    if not os.path.exists(SNAPSHOT_FILE):
        print(f"\n❌ Arquivo não encontrado: {SNAPSHOT_FILE}")
        print("   Copie o arquivo 'presentation_snapshot.sql' para a pasta backend/snapshots/")
        sys.exit(1)

    file_size_kb = os.path.getsize(SNAPSHOT_FILE) / 1024
    print(f"\n[3/5] Aplicando snapshot ({file_size_kb:.1f} KB)...")

    with open(SNAPSHOT_FILE, "r", encoding="utf-8") as f:
        sql_content = f.read()

    conn = connect_target()
    cur = conn.cursor()

    try:
        cur.execute(sql_content)
        conn.commit()
        print("   ✅ Snapshot aplicado com sucesso.")
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Erro ao aplicar snapshot: {e}")
        cur.close()
        conn.close()
        sys.exit(1)

    cur.close()
    conn.close()


def validate_counts():
    """Valida que as contagens de registros batem com o ambiente de origem."""
    print("\n[4/5] Validando integridade dos dados...")
    conn = connect_target()
    cur = conn.cursor()

    all_ok = True
    results = {}

    for table, expected in EXPECTED_COUNTS.items():
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        actual = cur.fetchone()[0]
        results[table] = (actual, expected)
        if actual != expected:
            all_ok = False

    cur.close()
    conn.close()
    return results, all_ok


def print_report(results, all_ok):
    """Exibe relatório final de validação."""
    print("\n" + "=" * 60)
    print("  RELATÓRIO DO RESTORE")
    print("=" * 60)
    for table, (actual, expected) in results.items():
        ok = actual == expected
        status = "✅" if ok else "❌"
        diff = f" (esperado: {expected})" if not ok else ""
        print(f"  {status} {table:<30} {actual:>5} registros{diff}")
    print("=" * 60)
    total_actual = sum(a for a, _ in results.values())
    total_expected = sum(e for _, e in results.values())
    print(f"  📦 TOTAL: {total_actual} / {total_expected} registros")
    print("=" * 60)

    if all_ok:
        print("\n✅ RESTORE CONCLUÍDO. Ambiente 100% idêntico ao de origem.")
        print("   O sistema está pronto para a apresentação.\n")
    else:
        print("\n⚠️  ATENÇÃO: Divergências detectadas nas contagens.")
        print("   Verifique se o arquivo snapshot é o correto e tente novamente.\n")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  SNAPSHOT RESTORE — AM Consultoria")
    print("=" * 60)
    print(f"\n  Banco alvo : {DB_NAME}@{DB_HOST}:{DB_PORT}")
    print(f"  Snapshot   : {SNAPSHOT_FILE}")

    print("\n⚠️  AVISO: Esta operação vai APAGAR e RECRIAR o banco.")
    print("   Pressione ENTER para continuar ou Ctrl+C para cancelar.")
    try:
        input()
    except KeyboardInterrupt:
        print("\nOperação cancelada pelo usuário.")
        sys.exit(0)

    recreate_database()
    create_schema()
    apply_snapshot()

    print("\n[5/5] Validando...")
    results, all_ok = validate_counts()
    print_report(results, all_ok)


if __name__ == "__main__":
    main()
