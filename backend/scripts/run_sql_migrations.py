"""
run_sql_migrations.py
=====================
Executor oficial de migrations SQL para o AM Consultoria.

Aplica todos os arquivos V*.sql da pasta database/migrations/ em ordem,
rastreando a execução na tabela schema_migrations para evitar reaplicacao.

Compativel com:
  - PostgreSQL local (Docker ou instalacao direta)
  - Neon (producao) via sslmode=require

Uso:
    # Da raiz do projeto:
    python backend/scripts/run_sql_migrations.py

    # Contra o Neon (sem alterar .env):
    DATABASE_URL="postgresql://..." python backend/scripts/run_sql_migrations.py

    # Apenas verificar status (sem aplicar):
    python backend/scripts/run_sql_migrations.py --status
"""

import os
import re
import sys
import argparse
import hashlib
from datetime import datetime, timezone
from pathlib import Path

# Garante saida UTF-8 no terminal Windows (compatibilidade com psycopg2 + Windows)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import psycopg2
from psycopg2.extensions import connection as PgConnection
from dotenv import load_dotenv


# ─── Caminhos ────────────────────────────────────────────────────────────────

# Raiz do projeto: dois níveis acima de backend/scripts/
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Pasta de migrations SQL
MIGRATIONS_DIR = PROJECT_ROOT / "database" / "migrations"

# .env na raiz do projeto
ENV_FILE = PROJECT_ROOT / ".env"


# ─── Helpers de configuração ─────────────────────────────────────────────────

def load_database_url() -> str:
    """Carrega DATABASE_URL do ambiente (.env ou variável de sistema)."""
    load_dotenv(ENV_FILE)

    url = os.getenv("DATABASE_URL")
    if url:
        return url

    # Fallback para partes individuais
    user = os.getenv("DB_USER", "admin")
    password = os.getenv("DB_PASSWORD", "admin123")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "am_consultoria")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


def mask_url(url: str) -> str:
    """Mascara a senha na URL para exibição segura em logs."""
    return re.sub(r"(://[^:]+:)[^@]+(@)", r"\1***\2", url)


# ─── Conexão ─────────────────────────────────────────────────────────────────

def connect(database_url: str) -> PgConnection:
    """Estabelece conexão com o PostgreSQL a partir da DATABASE_URL."""
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = False
        return conn
    except psycopg2.OperationalError as e:
        print(f"\n❌ ERRO DE CONEXÃO: {e}")
        print(f"   URL utilizada: {mask_url(database_url)}")
        print("   Verifique se o banco está acessível e as credenciais estão corretas.")
        sys.exit(1)


# ─── Tabela de controle ───────────────────────────────────────────────────────

SCHEMA_MIGRATIONS_DDL = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    id            SERIAL PRIMARY KEY,
    version       VARCHAR(10)  NOT NULL UNIQUE,
    filename      VARCHAR(255) NOT NULL,
    checksum      VARCHAR(64)  NOT NULL,
    executed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    execution_ms  INTEGER
);
"""

def ensure_migrations_table(conn: PgConnection) -> None:
    """Cria a tabela schema_migrations se não existir."""
    with conn.cursor() as cur:
        cur.execute(SCHEMA_MIGRATIONS_DDL)
    conn.commit()
    print("✅ Tabela schema_migrations verificada.")


def get_applied_versions(conn: PgConnection) -> dict:
    """Retorna dict {version: row} com todas as migrations já aplicadas."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT version, filename, checksum, executed_at, execution_ms "
            "FROM schema_migrations ORDER BY version"
        )
        rows = cur.fetchall()
    return {
        row[0]: {
            "version": row[0],
            "filename": row[1],
            "checksum": row[2],
            "executed_at": row[3],
            "execution_ms": row[4],
        }
        for row in rows
    }


def mark_applied(
    conn: PgConnection,
    version: str,
    filename: str,
    checksum: str,
    execution_ms: int,
) -> None:
    """Registra uma migration como aplicada na tabela de controle."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO schema_migrations (version, filename, checksum, executed_at, execution_ms)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (version, filename, checksum, datetime.now(timezone.utc), execution_ms),
        )
    conn.commit()


# ─── Parsing dos arquivos ─────────────────────────────────────────────────────

VERSION_PATTERN = re.compile(r"^(V\d+)__", re.IGNORECASE)


def parse_version(filename: str) -> str | None:
    """Extrai o prefixo de versão (ex: 'V001') do nome do arquivo."""
    match = VERSION_PATTERN.match(filename)
    return match.group(1).upper() if match else None


def file_checksum(path: Path) -> str:
    """Calcula SHA-256 do conteúdo do arquivo para detecção de alterações."""
    content = path.read_bytes()
    return hashlib.sha256(content).hexdigest()


def list_migration_files() -> list[tuple[str, Path]]:
    """
    Lista todos os arquivos V*.sql em MIGRATIONS_DIR, ordenados por versão.
    Retorna lista de (version, path).
    """
    if not MIGRATIONS_DIR.exists():
        print(f"❌ Pasta de migrations não encontrada: {MIGRATIONS_DIR}")
        sys.exit(1)

    files = []
    for path in sorted(MIGRATIONS_DIR.glob("V*.sql")):
        version = parse_version(path.name)
        if version:
            files.append((version, path))

    return files


# ─── Execução ─────────────────────────────────────────────────────────────────

def run_migration(conn: PgConnection, version: str, path: Path) -> int:
    """
    Executa um arquivo SQL em uma única transação.
    Retorna o tempo de execução em milissegundos.
    Aborta o processo em caso de erro.
    """
    sql = path.read_text(encoding="utf-8")
    start = datetime.now(timezone.utc)

    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERRO ao executar {path.name}:")
        print(f"   {e}")
        print("\n   A migration foi revertida (rollback). Corrija o SQL e tente novamente.")
        sys.exit(1)

    elapsed_ms = int((datetime.now(timezone.utc) - start).total_seconds() * 1000)
    return elapsed_ms


# ─── Comandos principais ──────────────────────────────────────────────────────

def cmd_migrate(database_url: str) -> None:
    """Aplica todas as migrations pendentes."""
    print(f"\n{'='*60}")
    print("  AM Consultoria — SQL Migration Runner")
    print(f"{'='*60}")
    print(f"  Banco  : {mask_url(database_url)}")
    print(f"  Pasta  : {MIGRATIONS_DIR}")
    print(f"{'='*60}\n")

    conn = connect(database_url)
    ensure_migrations_table(conn)

    migration_files = list_migration_files()
    applied = get_applied_versions(conn)

    if not migration_files:
        print("⚠️  Nenhum arquivo de migration encontrado em database/migrations/")
        conn.close()
        return

    pending = [(v, p) for v, p in migration_files if v not in applied]

    if not pending:
        print(f"✅ Banco de dados atualizado. {len(applied)} migration(s) já aplicada(s).")
        print("   Nenhuma migration pendente.\n")
        conn.close()
        return

    print(f"  Migrations já aplicadas : {len(applied)}")
    print(f"  Migrations pendentes    : {len(pending)}")
    print()

    for version, path in pending:
        checksum = file_checksum(path)
        print(f"  ⏳ Aplicando {path.name} ...", end="", flush=True)
        elapsed_ms = run_migration(conn, version, path)
        mark_applied(conn, version, path.name, checksum, elapsed_ms)
        print(f" ✅  ({elapsed_ms}ms)")

    print(f"\n{'='*60}")
    print(f"  ✅ {len(pending)} migration(s) aplicada(s) com sucesso.")
    print(f"{'='*60}\n")

    conn.close()


def cmd_status(database_url: str) -> None:
    """Exibe o status de todas as migrations (aplicadas e pendentes)."""
    print(f"\n{'='*60}")
    print("  AM Consultoria — Status das Migrations SQL")
    print(f"{'='*60}")
    print(f"  Banco  : {mask_url(database_url)}")
    print(f"{'='*60}\n")

    conn = connect(database_url)
    ensure_migrations_table(conn)

    migration_files = list_migration_files()
    applied = get_applied_versions(conn)

    print(f"  {'Versão':<8} {'Status':<12} {'Arquivo':<45} {'Executado em'}")
    print(f"  {'-'*8} {'-'*12} {'-'*45} {'-'*20}")

    for version, path in migration_files:
        if version in applied:
            row = applied[version]
            executed_at = row["executed_at"].strftime("%Y-%m-%d %H:%M") if row["executed_at"] else "-"
            status = "✅ aplicada"
        else:
            executed_at = "-"
            status = "⏳ pendente"

        print(f"  {version:<8} {status:<12} {path.name:<45} {executed_at}")

    # Verifica se há migrations aplicadas que não existem mais em disco
    disk_versions = {v for v, _ in migration_files}
    orphaned = [v for v in applied if v not in disk_versions]
    if orphaned:
        print(f"\n  ⚠️  Migrations aplicadas sem arquivo correspondente: {', '.join(orphaned)}")

    total_applied = len([v for v, _ in migration_files if v in applied])
    total_pending = len([v for v, _ in migration_files if v not in applied])
    print(f"\n  Total: {total_applied} aplicada(s), {total_pending} pendente(s).\n")

    conn.close()


def cmd_validate() -> None:
    """Valida os arquivos SQL em disco sem conectar ao banco."""
    print(f"\n{'='*60}")
    print("  AM Consultoria — Validação das Migrations SQL")
    print(f"{'='*60}\n")

    migration_files = list_migration_files()

    if not migration_files:
        print("⚠️  Nenhum arquivo encontrado.")
        return

    print(f"  {'Versão':<8} {'Arquivo':<50} {'Tamanho'}")
    print(f"  {'-'*8} {'-'*50} {'-'*10}")

    seen_versions = set()
    errors = []

    for version, path in migration_files:
        size = path.stat().st_size
        print(f"  {version:<8} {path.name:<50} {size:>6} bytes")

        if version in seen_versions:
            errors.append(f"Versão duplicada: {version}")
        seen_versions.add(version)

        if size == 0:
            errors.append(f"Arquivo vazio: {path.name}")

    if errors:
        print("\n❌ ERROS ENCONTRADOS:")
        for e in errors:
            print(f"   - {e}")
    else:
        print(f"\n✅ {len(migration_files)} arquivo(s) validado(s). Nenhum problema encontrado.\n")


# ─── Entry point ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="AM Consultoria — Executor de Migrations SQL",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python backend/scripts/run_sql_migrations.py
  python backend/scripts/run_sql_migrations.py --status
  python backend/scripts/run_sql_migrations.py --validate
  DATABASE_URL="postgresql://..." python backend/scripts/run_sql_migrations.py
        """,
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Exibe status de todas as migrations sem aplicá-las",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Valida os arquivos SQL em disco sem conectar ao banco",
    )
    args = parser.parse_args()

    if args.validate:
        cmd_validate()
        return

    database_url = load_database_url()

    if args.status:
        cmd_status(database_url)
    else:
        cmd_migrate(database_url)


if __name__ == "__main__":
    main()
