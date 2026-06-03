# 🗄️ Database Setup — AM Consultoria

Guia completo de configuração do banco de dados, execução de migrations SQL e verificação de estado para ambientes local e produção (Neon).

---

## Sistema de Migrations

O projeto utiliza **migrations SQL versionadas** com o padrão Flyway-like (`V001__`, `V002__`, ...):

```
database/migrations/
├── V001__create_table_clientes.sql
├── V002__create_table_contatos.sql
├── V003__create_table_contratos.sql
├── V004__create_table_tipos_pagamento.sql
├── V005__create_table_contrato_pagamento.sql
├── V006__create_table_historico_contratos.sql
├── V007__create_table_projetos.sql
├── V008__create_table_projeto_parcelas.sql
├── V009__create_table_projetos_extra.sql
├── V010__create_table_entregas.sql
├── V011__create_table_visitas.sql
├── V012__create_table_visitas_extra.sql
├── V013__cretae_table_eventos_criticos.sql
├── V014__create_table_faturamento_cliente.sql
└── V015__create_table_pendencias.sql
```

O executor de migrations está em:
```
backend/scripts/run_sql_migrations.py
```

---

## Tabela de Controle — `schema_migrations`

O executor cria automaticamente uma tabela de controle no banco:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    id            SERIAL PRIMARY KEY,
    version       VARCHAR(10)  NOT NULL UNIQUE,  -- Ex: 'V001'
    filename      VARCHAR(255) NOT NULL,          -- Nome completo do arquivo
    checksum      VARCHAR(64)  NOT NULL,          -- SHA-256 do conteúdo
    executed_at   TIMESTAMPTZ  NOT NULL,          -- Quando foi aplicada
    execution_ms  INTEGER                         -- Tempo de execução
);
```

**Garantias:**
- Cada migration é aplicada **uma única vez** (verificação por `version` UNIQUE)
- Múltiplas execuções do script são seguras
- Interrupção em caso de erro com rollback automático

---

## Comandos

### Executar todas as migrations pendentes

```bash
# Da raiz do projeto:
python backend/scripts/run_sql_migrations.py
```

Saída esperada:
```
============================================================
  AM Consultoria — SQL Migration Runner
============================================================
  Banco  : postgresql://admin:***@localhost:5432/am_consultoria
  Pasta  : .../database/migrations
============================================================

✅ Tabela schema_migrations verificada.

  Migrations já aplicadas : 0
  Migrations pendentes    : 15

  ⏳ Aplicando V001__create_table_clientes.sql ...          ✅ (12ms)
  ⏳ Aplicando V002__create_table_contatos.sql ...          ✅  (8ms)
  ...
  ⏳ Aplicando V015__create_table_pendencias.sql ...        ✅  (9ms)

============================================================
  ✅ 15 migration(s) aplicada(s) com sucesso.
============================================================
```

### Verificar status sem aplicar

```bash
python backend/scripts/run_sql_migrations.py --status
```

Saída esperada:
```
  Versão   Status       Arquivo                                       Executado em
  -------- ------------ --------------------------------------------- --------------------
  V001     ✅ aplicada  V001__create_table_clientes.sql               2026-06-03 01:00
  V002     ✅ aplicada  V002__create_table_contatos.sql               2026-06-03 01:00
  ...
  V015     ✅ aplicada  V015__create_table_pendencias.sql             2026-06-03 01:00
```

### Validar arquivos SQL sem conectar ao banco

```bash
python backend/scripts/run_sql_migrations.py --validate
```

---

## Como Criar um Banco Novo (Local)

### Opção A — Docker (recomendado)

```bash
# Sobe o PostgreSQL via Docker Compose
docker-compose up -d

# Aplica as migrations
python backend/scripts/run_sql_migrations.py
```

O Docker Compose já cria o banco `am_consultoria` automaticamente.

### Opção B — PostgreSQL local instalado

```bash
# Cria o banco manualmente (via psql ou pgAdmin)
psql -U postgres -c "CREATE USER admin WITH PASSWORD 'admin123';"
psql -U postgres -c "CREATE DATABASE am_consultoria OWNER admin;"

# Aplica as migrations
python backend/scripts/run_sql_migrations.py
```

---

## Como Aplicar Migrations no Neon (Produção)

### Opção A — Via script Python (recomendado)

```bash
# Substitua com suas credenciais do Neon:
$env:DATABASE_URL = "postgresql://neondb_owner:SENHA@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

python backend/scripts/run_sql_migrations.py
```

O script usa a URL do Neon e aplica somente as migrations pendentes.

### Opção B — Via psql

```bash
# Aplica todos os arquivos em sequência:
$DB = "postgresql://neondb_owner:SENHA@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# Windows (PowerShell):
Get-ChildItem "database\migrations\V*.sql" | Sort-Object Name | ForEach-Object {
    Write-Host "Aplicando $($_.Name)..."
    psql $DB -f $_.FullName
}
```

> **Atenção**: Com psql, não há controle de migrations já aplicadas. Use o script Python para execuções incrementais.

### Opção C — Via painel web do Neon

1. Acesse [neon.tech](https://neon.tech) → seu projeto → **SQL Editor**
2. Copie e cole o conteúdo de cada arquivo SQL em ordem (V001 → V015)
3. Execute cada um

---

## Verificar Migrations Executadas

```bash
# Localmente:
python backend/scripts/run_sql_migrations.py --status

# Diretamente via SQL:
psql -h localhost -U admin -d am_consultoria \
  -c "SELECT version, filename, executed_at, execution_ms FROM schema_migrations ORDER BY version;"

# No Neon:
psql "postgresql://..." \
  -c "SELECT version, filename, executed_at FROM schema_migrations ORDER BY version;"
```

---

## Dependências Entre Tabelas

A ordem das migrations respeita todas as chaves estrangeiras:

```
clientes (V001)
├── contatos (V002)  → FK: clientes.id_cliente
├── contratos (V003) → FK: clientes.id_cliente
│   ├── tipos_pagamento (V004)
│   ├── contrato_pagamento (V005) → FK: contratos + tipos_pagamento
│   ├── historico_contratos (V006) → FK: contratos × 2
│   ├── projetos (V007) → FK: contratos
│   │   ├── projeto_parcelas (V008) → FK: projetos
│   │   ├── projetos_extra (V009)   → FK: projetos + contatos
│   │   └── entregas (V010)         → FK: projetos
│   ├── visitas (V011) → FK: contratos + projetos
│   │   ├── visitas_extra (V012)    → FK: visitas + contatos
│   │   └── eventos_criticos (V013) → FK: contratos + visitas
│   ├── faturamento_cliente (V014)  → FK: contratos
│   └── pendencias (V015)           → FK: contratos + visitas
```

**A ordem atual (V001→V015) está correta.**

---

## Como Adicionar uma Nova Migration

1. Crie um arquivo com o próximo número de versão:
   ```
   database/migrations/V016__nome_descritivo.sql
   ```

2. Escreva o SQL:
   ```sql
   -- database/migrations/V016__add_column_example.sql
   ALTER TABLE clientes ADD COLUMN cnpj VARCHAR(18);
   ```

3. Aplique:
   ```bash
   python backend/scripts/run_sql_migrations.py
   ```

   Somente V016 será aplicado (as anteriores já foram registradas).

> ⚠️ **NUNCA altere o conteúdo de uma migration já aplicada.** Crie sempre uma nova versão para correções.

---

## Checklist de Validação

- [ ] `python backend/scripts/run_sql_migrations.py --validate` → 15 arquivos OK
- [ ] `docker-compose up -d` → banco rodando
- [ ] `python backend/scripts/run_sql_migrations.py` → 15 migrations aplicadas
- [ ] `python backend/scripts/run_sql_migrations.py --status` → todas como "aplicada"
- [ ] Segunda execução do script → "Nenhuma migration pendente" (idempotente)
- [ ] Backend inicia sem erros de schema: `python run_backend.py`
- [ ] `GET /clientes` retorna lista vazia ou dados → schema ok
