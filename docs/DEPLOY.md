# 🚀 Deploy — AM Consultoria

Guia completo para deploy em produção: **Neon** (banco), **Render** (backend) e **Vercel** (frontend).

---

## Arquitetura de Produção

```
Usuário → Vercel (Next.js)
              ↓ HTTPS
        Render (FastAPI)
              ↓ SSL
         Neon (PostgreSQL)
```

---

## Parte 1 — Neon (Banco de Dados)

### Checklist Neon

- [ ] Conta criada em [neon.tech](https://neon.tech)
- [ ] Projeto criado na região `sa-east-1` (São Paulo) ou mais próxima
- [ ] `DATABASE_URL` copiada do painel do Neon (Connection String)
- [ ] Migrations aplicadas no banco Neon
- [ ] Conexão testada localmente com a URL do Neon

### 1.1 Criar Projeto no Neon

1. Acesse [neon.tech](https://neon.tech) → **New Project**
2. Nome: `am-consultoria`
3. Região: `South America (São Paulo)` — `sa-east-1`
4. PostgreSQL version: 16
5. Clique em **Create Project**

### 1.2 Obter a Connection String

No painel do Neon:
1. Clique na aba **Connection Details**
2. Copie a **Connection string** (formato pooler, recomendado):
   ```
   postgresql://neondb_owner:SENHA@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```

> **Nota**: Use a URL do **pooler** (contém `-pooler` no hostname) para melhor performance em produção.

### 1.3 Aplicar Migrations no Neon

**Método oficial — Executor SQL Python (recomendado):**

```powershell
# Windows PowerShell — define a URL do Neon temporariamente:
$env:DATABASE_URL = "postgresql://neondb_owner:SENHA@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

python backend/scripts/run_sql_migrations.py
```

```bash
# Linux/macOS:
DATABASE_URL="postgresql://neondb_owner:SENHA@ep-xxx-pooler.neon.tech/neondb?sslmode=require" \
  python backend/scripts/run_sql_migrations.py
```

Saída esperada:
```
============================================================
  AM Consultoria — SQL Migration Runner
============================================================
  Banco  : postgresql://neondb_owner:***@ep-xxx-pooler...
  Pasta  : .../database/migrations
============================================================

✅ Tabela schema_migrations verificada.
  ⏳ Aplicando V001__create_table_clientes.sql ...     ✅  (45ms)
  ...
  ⏳ Aplicando V015__create_table_pendencias.sql ...   ✅  (38ms)

✅ 15 migration(s) aplicada(s) com sucesso.
```

**Verificar status após aplicação:**

```bash
python backend/scripts/run_sql_migrations.py --status
```

> 📖 Ver mais opções em: [docs/DATABASE_SETUP.md](DATABASE_SETUP.md)

### 1.4 Testar Conexão Local com Neon

```bash
# No .env local, substitua temporariamente:
DATABASE_URL=postgresql://neondb_owner:SENHA@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Inicia o backend e verifica o log:
python run_backend.py
# Deve aparecer: [BACKEND] DATABASE_URL: postgresql://neondb_owner:***@ep-xxx-pooler...
```

---

## Parte 2 — Render (Backend FastAPI)

### Checklist Render

- [ ] Conta criada em [render.com](https://render.com)
- [ ] Repositório GitHub conectado ao Render
- [ ] Serviço Web criado com as configurações corretas
- [ ] `DATABASE_URL` configurada com a URL do Neon
- [ ] `CORS_ORIGINS` configurada com a URL da Vercel
- [ ] `ENVIRONMENT=production` configurado
- [ ] Deploy bem-sucedido
- [ ] `GET https://meu-backend.onrender.com/` retorna `{"msg": "API AM Consultoria rodando 🚀"}`

### 2.1 Criar Serviço no Render

1. Acesse [render.com](https://render.com) → **New** → **Web Service**
2. Conecte o repositório GitHub: `Am-Consultoria`
3. Configure o serviço:

| Campo | Valor |
|-------|-------|
| **Name** | `am-consultoria-api` |
| **Region** | Oregon (US West) ou mais próximo |
| **Branch** | `main` |
| **Root Directory** | *(deixar em branco — usa raiz do repositório)* |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r backend/requirements.txt` |
| **Start Command** | `PYTHONPATH=backend uvicorn src.main:app --host 0.0.0.0 --port $PORT` |

### 2.2 Configurar Variáveis de Ambiente no Render

No painel do serviço → **Environment** → adicione:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:SENHA@ep-xxx-pooler.neon.tech/neondb?sslmode=require` |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | `https://meu-app.vercel.app` *(adicionar após criar o projeto na Vercel)* |

### 2.3 Executar Deploy

1. Clique em **Deploy** (ou aguarde o deploy automático após push na `main`)
2. Aguarde o build completar (~2-3 minutos)
3. Verifique os logs — deve aparecer:
   ```
   [BACKEND] ENVIRONMENT : production
   [BACKEND] DATABASE_URL: postgresql://neondb_owner:***@ep-xxx-pooler...
   INFO:     Application startup complete.
   ```

### 2.4 Testar o Backend em Produção

```bash
curl https://am-consultoria-api.onrender.com/
# Esperado: {"msg":"API AM Consultoria rodando 🚀"}

curl https://am-consultoria-api.onrender.com/docs
# Deve retornar a página do Swagger
```

---

## Parte 3 — Vercel (Frontend Next.js)

### Checklist Vercel

- [ ] Conta criada em [vercel.com](https://vercel.com)
- [ ] Repositório GitHub conectado à Vercel
- [ ] `Root Directory` configurado como `frontend`
- [ ] `NEXT_PUBLIC_API_URL` configurada com a URL do Render
- [ ] Deploy bem-sucedido
- [ ] Frontend abre e conecta à API do Render

### 3.1 Criar Projeto na Vercel

1. Acesse [vercel.com](https://vercel.com) → **New Project**
2. Importe o repositório `Am-Consultoria`
3. Configure o projeto:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | `Next.js` |
| **Root Directory** | `frontend` |
| **Build Command** | *(padrão: `next build`)* |
| **Output Directory** | *(padrão: `.next`)* |

### 3.2 Configurar Variáveis de Ambiente na Vercel

Em **Settings** → **Environment Variables**:

| Variável | Valor | Ambientes |
|----------|-------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://am-consultoria-api.onrender.com` | Production, Preview |
| `NEXT_PUBLIC_USE_MOCK` | `false` | Production, Preview |

### 3.3 Atualizar CORS no Render

Após obter a URL da Vercel (ex: `https://am-consultoria.vercel.app`):

1. Volte ao painel do Render
2. Em **Environment** → edite `CORS_ORIGINS`:
   ```
   https://am-consultoria.vercel.app
   ```
3. Clique em **Save Changes** → o Render vai redeployar automaticamente

### 3.4 Testar o Frontend em Produção

1. Acesse a URL da Vercel
2. Abra o DevTools → aba **Network**
3. Verifique que as requisições vão para `https://am-consultoria-api.onrender.com`
4. Confirme que não há erros de CORS

---

## Checklist de Validação Pós-Deploy

### Neon
- [ ] Painel do Neon mostra tabelas criadas
- [ ] Query de teste retorna dados: `SELECT COUNT(*) FROM clientes;`

### Render
- [ ] `GET /` retorna `{"msg": "API AM Consultoria rodando 🚀"}`
- [ ] `GET /docs` carrega o Swagger
- [ ] Logs não expõem credenciais (senha aparece como `***`)
- [ ] `ENVIRONMENT=production` nos logs

### Vercel
- [ ] Página inicial carrega sem erros
- [ ] Aba Network não mostra erros CORS
- [ ] `NEXT_PUBLIC_API_URL` aponta para o Render (verificar no console do navegador)

### Integração
- [ ] Frontend (Vercel) consegue buscar dados do backend (Render)
- [ ] Backend (Render) conecta no banco (Neon) sem erros de SSL
- [ ] Dados são exibidos corretamente na interface

---

## Resolução de Problemas

### Erro de CORS
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solução**: Adicione a URL da Vercel em `CORS_ORIGINS` no Render e redesploy.

### Erro de SSL (Neon)
```
SSL connection required
```
**Solução**: Confirme que a `DATABASE_URL` contém `?sslmode=require`.

### Backend não inicia no Render
```
ModuleNotFoundError: No module named 'src'
```
**Solução**: Confirme que o **Start Command** inclui `PYTHONPATH=backend`.

### Frontend não consegue acessar a API
**Solução**: Confirme que `NEXT_PUBLIC_API_URL` está configurada na Vercel apontando para a URL correta do Render (sem barra final).
