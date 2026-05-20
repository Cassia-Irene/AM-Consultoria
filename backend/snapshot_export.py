"""
snapshot_export.py
==================
Gera backend/snapshots/presentation_snapshot.sql com o estado exato do banco atual.

O arquivo gerado contém:
  - TRUNCATE CASCADE de todas as tabelas
  - INSERT de todos os registros, na ordem correta de FK
  - SETVAL de todas as sequences para o valor exato atual

Uso:
    python snapshot_export.py

Saída:
    backend/snapshots/presentation_snapshot.sql
"""

import os
import sys
import psycopg2
from decimal import Decimal
from datetime import date, datetime

# ─── Configuração ────────────────────────────────────────────────────────────

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "am_consultoria"),
    "user": os.getenv("DB_USER", "admin"),
    "password": os.getenv("DB_PASSWORD", "admin123"),
}

# Carrega .env se disponível
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    DB_CONFIG = {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "dbname": os.getenv("DB_NAME", "am_consultoria"),
        "user": os.getenv("DB_USER", "admin"),
        "password": os.getenv("DB_PASSWORD", "admin123"),
    }

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "snapshots")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "presentation_snapshot.sql")

# ─── Ordem de inserção (respeita dependências de FK) ─────────────────────────

TABLE_ORDER = [
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

# ─── Helpers de serialização ──────────────────────────────────────────────────

def escape_val(val):
    """Converte um valor Python em literal SQL seguro."""
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, int):
        return str(val)
    if isinstance(val, (float, Decimal)):
        return str(val)
    if isinstance(val, datetime):
        return f"'{val.strftime('%Y-%m-%d %H:%M:%S')}'"
    if isinstance(val, date):
        return f"'{val.isoformat()}'"
    if isinstance(val, str):
        # Escapa aspas simples dobrando-as (padrão SQL)
        escaped = val.replace("'", "''")
        return f"'{escaped}'"
    # Fallback
    return f"'{str(val)}'"


def dump_table(conn, table_name):
    """Retorna bloco SQL de INSERT para toda a tabela."""
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table_name} ORDER BY 1")
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    cur.close()

    if not rows:
        return f"-- [TABELA VAZIA: {table_name}]\n", 0

    lines = []
    lines.append(f"-- {table_name} ({len(rows)} registros)")
    for row in rows:
        values = ", ".join(escape_val(v) for v in row)
        col_list = ", ".join(cols)
        lines.append(
            f"INSERT INTO {table_name} ({col_list}) VALUES ({values});"
        )
    lines.append("")
    return "\n".join(lines), len(rows)


def get_sequences(conn):
    """Retorna dict {sequence_name: last_value}."""
    cur = conn.cursor()
    cur.execute(
        "SELECT sequence_name FROM information_schema.sequences "
        "WHERE sequence_schema = 'public' ORDER BY sequence_name"
    )
    seq_names = [r[0] for r in cur.fetchall()]
    cur.close()

    result = {}
    for seq in seq_names:
        c = conn.cursor()
        c.execute(f"SELECT last_value, is_called FROM {seq}")
        lv, is_called = c.fetchone()
        c.close()
        result[seq] = (lv, is_called)
    return result


# -- Main ---------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  SNAPSHOT EXPORT - AM Consultoria")
    print("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"\n>> Conectando ao banco: {DB_CONFIG['dbname']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        print(f"\n[ERRO] Falha na conexao: {e}")
        sys.exit(1)
    print("[OK] Conectado.\n")

    sql_blocks = []

    # -- Header --------------------------------------------------------------
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sql_blocks.append(f"""-- ============================================================
-- AM Consultoria - Snapshot Oficial para Apresentacao
-- Gerado em: {now_str}
-- Banco: {DB_CONFIG['dbname']} @ {DB_CONFIG['host']}:{DB_CONFIG['port']}
--
-- ATENCAO: Este arquivo e o espelho exato do banco de origem.
-- Nao edite manualmente. Use snapshot_restore.py para aplicar.
-- ============================================================

SET client_encoding = 'UTF8';
BEGIN;
""")

    # -- TRUNCATE CASCADE (limpa sem precisar respeitar FK order) ------------
    tables_reversed = ", ".join(reversed(TABLE_ORDER))
    sql_blocks.append(
        f"-- LIMPEZA COMPLETA DAS TABELAS\n"
        f"TRUNCATE TABLE {tables_reversed} RESTART IDENTITY CASCADE;\n"
    )

    # -- INSERT por tabela ----------------------------------------------------
    sql_blocks.append("-- ============================================================")
    sql_blocks.append("-- DADOS")
    sql_blocks.append("-- ============================================================\n")

    total_records = 0
    counts = {}
    for table in TABLE_ORDER:
        print(f"  Exportando: {table} ...", end=" ", flush=True)
        block, count = dump_table(conn, table)
        sql_blocks.append(block)
        counts[table] = count
        total_records += count
        print(f"{count} registros")

    # -- SETVAL das sequences -------------------------------------------------
    sql_blocks.append("\n-- ============================================================")
    sql_blocks.append("-- RESET DE SEQUENCES")
    sql_blocks.append("-- ============================================================\n")

    sequences = get_sequences(conn)
    for seq_name, (last_value, is_called) in sequences.items():
        called_str = "true" if is_called else "false"
        sql_blocks.append(f"SELECT setval('{seq_name}', {last_value}, {called_str});")
    sql_blocks.append("")

    # -- Footer ---------------------------------------------------------------
    sql_blocks.append("COMMIT;")
    sql_blocks.append(f"\n-- Snapshot concluido com sucesso. Total: {total_records} registros.")

    conn.close()

    # -- Escreve o arquivo -----------------------------------------------------
    full_sql = "\n".join(sql_blocks)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(full_sql)

    file_size_kb = os.path.getsize(OUTPUT_FILE) / 1024

    # -- Relatorio -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("  RELATORIO DO SNAPSHOT")
    print("=" * 60)
    for table, count in counts.items():
        status = "[OK]" if count > 0 else "[--]"
        print(f"  {status} {table:<30} {count:>5} registros")
    print("-" * 60)
    print(f"  TOTAL GERAL: {total_records} registros")
    print(f"  Arquivo: {OUTPUT_FILE}")
    print(f"  Tamanho: {file_size_kb:.1f} KB")
    print("=" * 60)
    print("\n[OK] Snapshot gerado com sucesso!")
    print("   Envie o arquivo 'presentation_snapshot.sql' para o outro dev.")
    print("   Ele deve usar 'snapshot_restore.py' para aplicar.\n")


if __name__ == "__main__":
    main()
