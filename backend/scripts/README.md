# backend/scripts/
# Scripts utilitários do AM Consultoria

Este diretório contém scripts de manutenção e infraestrutura.

## run_sql_migrations.py

Executor oficial de migrations SQL.

```bash
# Aplicar migrations pendentes
python backend/scripts/run_sql_migrations.py

# Verificar status sem aplicar
python backend/scripts/run_sql_migrations.py --status

# Validar arquivos SQL em disco
python backend/scripts/run_sql_migrations.py --validate
```

Ver documentação completa em: docs/DATABASE_SETUP.md
