# 🛠️ Desenvolvimento Local — AM Consultoria

Guia completo para configurar e executar o projeto localmente.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Instalação |
|-----------|---------------|------------|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Docker Desktop | qualquer | [docker.com](https://docker.com) |
| Git | qualquer | [git-scm.com](https://git-scm.com) |

---

## 1. Clonar o Repositório

```bash
git clone https://github.com/SEU-ORG/Am-Consultoria.git
cd Am-Consultoria
```

---

## 2. Configurar Variáveis de Ambiente

```bash
# Copia o exemplo para o arquivo real (ignorado pelo git)
cp .env.example .env
```

Para desenvolvimento local, o `.env` padrão já funciona sem alterações:

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/am_consultoria
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 3. Iniciar o Banco de Dados (Docker)

```bash
# Sobe o PostgreSQL em background
docker-compose up -d

# Verifica se está rodando
docker-compose ps

# Para parar:
docker-compose down
```

O Docker Compose cria automaticamente:
- Banco: `am_consultoria`
- Usuário: `admin`
- Senha: `admin123`
- Porta: `5432`

> **Alternativa sem Docker**: Instale o PostgreSQL localmente e crie o banco manualmente:
> ```sql
> CREATE USER admin WITH PASSWORD 'admin123';
> CREATE DATABASE am_consultoria OWNER admin;
> ```

---

## 4. Configurar o Backend (FastAPI)

```bash
cd backend

# Cria e ativa ambiente virtual
python -m venv venv

# Windows:
venv\Scripts\activate

# Linux/macOS:
source venv/bin/activate

# Instala dependências
pip install -r requirements.txt

cd ..
```

---

## 5. Aplicar Migrations (Banco de Dados)

O projeto usa migrations SQL versionadas em `database/migrations/`.

### Executar todas as migrations (método oficial)

```bash
# Da raiz do projeto:
python backend/scripts/run_sql_migrations.py
```

Saída esperada:
```
✅ Tabela schema_migrations verificada.
  ⏳ Aplicando V001__create_table_clientes.sql ...     ✅  (12ms)
  ⏳ Aplicando V002__create_table_contatos.sql ...     ✅   (8ms)
  ...
  ⏳ Aplicando V015__create_table_pendencias.sql ...   ✅   (9ms)
✅ 15 migration(s) aplicada(s) com sucesso.
```

### Verificar status das migrations

```bash
python backend/scripts/run_sql_migrations.py --status
```

### Validar arquivos sem conectar ao banco

```bash
python backend/scripts/run_sql_migrations.py --validate
```

> 📖 **Guia completo**: [docs/DATABASE_SETUP.md](DATABASE_SETUP.md)

---

## 6. Iniciar o Backend

```bash
# Da raiz do projeto:
python run_backend.py
```

Ou manualmente:

```bash
cd backend
venv\Scripts\activate      # Windows
# source venv/bin/activate   # Linux/macOS
cd ..
PYTHONPATH=backend uvicorn src.main:app --reload --port 8000
```

O backend estará disponível em:
- API: http://localhost:8000
- Swagger/Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 7. Configurar o Frontend (Next.js)

```bash
cd frontend

# Copia o exemplo de env local do frontend
cp .env.local.example .env.local

# Instala dependências
npm install

# Inicia o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: http://localhost:3000

---

## 8. Verificação

| Check | URL | Esperado |
|-------|-----|---------|
| Backend raiz | http://localhost:8000/ | `{"msg": "API AM Consultoria rodando 🚀"}` |
| Swagger | http://localhost:8000/docs | Interface do Swagger |
| Frontend | http://localhost:3000 | Interface da aplicação |
| DB (Docker) | `docker-compose ps` | `am_consultoria_db` rodando |

---

## Checklist — Desenvolvimento Local

- [ ] `.env` criado a partir do `.env.example`
- [ ] Docker Desktop rodando
- [ ] `docker-compose up -d` executado com sucesso
- [ ] `pip install -r backend/requirements.txt` executado
- [ ] `python run_backend.py` → backend respondendo em :8000
- [ ] `npm install` executado na pasta `frontend/`
- [ ] `frontend/.env.local` configurado
- [ ] `npm run dev` → frontend respondendo em :3000
- [ ] Swagger em http://localhost:8000/docs carrega normalmente
- [ ] Log do backend mostra `DATABASE_URL: postgresql://admin:***@localhost:5432/am_consultoria`

---

## Comandos Úteis

```bash
# Reiniciar o banco (APAGA TODOS OS DADOS)
docker-compose down -v
docker-compose up -d

# Restaurar snapshot de apresentação
cd backend
python snapshot_restore.py

# Ver logs do banco
docker-compose logs postgres

# Verificar variáveis de ambiente carregadas
cd backend
python -c "from src.config import DATABASE_URL, ENVIRONMENT; print(DATABASE_URL, ENVIRONMENT)"
```
