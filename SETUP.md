# 🛠 NUTRIRP — Setup no novo computador

## Pré-requisitos

Instale antes de começar:

| Software | Versão usada | Download |
|---|---|---|
| Python | 3.13+ | https://python.org/downloads |
| Node.js | 22+ | https://nodejs.org |
| Git | qualquer | https://git-scm.com |

> **Windows**: durante a instalação do Python, marque ✅ "Add Python to PATH"

---

## 1. Abrir o projeto

Se copiou a pasta diretamente (pen drive / HD externo):
```
Abra a pasta nutrirp no VS Code (ou editor de preferência)
```

Se quiser clonar do GitHub:
```bash
git clone https://github.com/lordmotumbo/nutrirp.git
```

---

## 2. Backend (FastAPI)

```bash
cd nutrirp/backend
pip install -r requirements.txt
python migrate.py
```

Crie o arquivo `.env` (copie do exemplo):
```bash
copy .env.example .env
```

Edite o `.env` com suas configurações (SECRET_KEY, SMTP, etc.)

Rodar o servidor:
```bash
uvicorn app.main:app --reload
```

Backend disponível em: http://localhost:8000
Documentação da API: http://localhost:8000/docs

---

## 3. Frontend (React + Vite)

```bash
cd nutrirp/frontend
npm install
npm run dev
```

Frontend disponível em: http://localhost:5173

> O Vite já está configurado para fazer proxy das chamadas `/api` para `localhost:8000`.
> Não precisa configurar nada extra.

---

## 4. Variáveis de ambiente (`.env`)

O arquivo `backend/.env` **não é versionado** (está no `.gitignore`).
Use o `backend/.env.example` como base:

```env
DATABASE_URL=sqlite:///./nutrirp.db
SECRET_KEY=qualquer-chave-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email (opcional — para alertas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua_senha_de_app_google
SMTP_FROM=NUTRIRP <seuemail@gmail.com>

# Cron secret (para endpoints de disparo automático)
CRON_SECRET=nutrirp-cron-secret-2024
```

---

## 5. Banco de dados

O banco SQLite (`backend/nutrirp.db`) **está incluído na pasta** — já tem todos os dados.

Se quiser começar do zero (banco limpo):
```bash
cd nutrirp/backend
del nutrirp.db        # Windows
python migrate.py     # recria as tabelas
```

---

## 6. Deploy no Render (produção)

Qualquer push para o GitHub dispara o deploy automático:
```bash
git add -A
git commit -m "sua mensagem"
git push origin master
```

- **Backend**: https://nutrirp-api.onrender.com
- **Frontend**: https://nutrirp-frontend.onrender.com

---

## 7. Estrutura do projeto

```
nutrirp/
├── backend/
│   ├── app/
│   │   ├── models/        # Modelos do banco (SQLAlchemy)
│   │   ├── routers/       # Endpoints da API (FastAPI)
│   │   ├── schemas/       # Validação de dados (Pydantic)
│   │   ├── services/      # Lógica: auth, PDF, notificações
│   │   ├── data/          # Tabela TACO de alimentos
│   │   ├── database.py    # Conexão com banco
│   │   └── main.py        # App FastAPI principal
│   ├── migrate.py         # Script de migração do banco
│   ├── requirements.txt   # Dependências Python
│   ├── .env.example       # Exemplo de variáveis de ambiente
│   └── nutrirp.db         # Banco SQLite local
│
├── frontend/
│   ├── src/
│   │   ├── pages/         # Páginas React
│   │   │   └── patient/   # Portal do paciente
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── context/       # Auth e Theme context
│   │   ├── api.js         # Cliente Axios (nutricionista)
│   │   └── App.jsx        # Rotas da aplicação
│   ├── package.json
│   └── vite.config.js
│
├── render.yaml            # Configuração de deploy (Render.com)
├── SETUP.md               # Este arquivo
└── DEPLOY.md              # Instruções de deploy
```

---

## 8. Comandos úteis

```bash
# Ver logs do backend em tempo real
uvicorn app.main:app --reload --log-level debug

# Rodar migração do banco
python migrate.py

# Build do frontend para produção
npm run build

# Verificar se o backend importa sem erros
python -c "from app.main import app; print('OK')"
```

---

## Tecnologias usadas

- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2, SQLite/PostgreSQL
- **Frontend**: React 18, Vite, Tailwind CSS, Axios, date-fns, Recharts
- **Deploy**: Render.com (backend + frontend estático)
- **Auth**: JWT (python-jose), bcrypt
- **PDF**: ReportLab
- **Email**: smtplib (built-in Python)
- **Telegram**: Bot API via httpx
