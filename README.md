# 🥗 NUTRIRP — Sistema para Nutricionistas

Sistema web completo para gestão de consultório nutricional.

## Funcionalidades

| Módulo | O que faz |
|--------|-----------|
| **Autenticação** | Login/cadastro com JWT, plano free/pro |
| **Pacientes** | Cadastro completo com dados clínicos, busca rápida |
| **Anamnese** | Questionário completo: hábitos, saúde, estilo de vida |
| **Dieta** | Montagem visual por refeição, cálculo automático de macros |
| **Exportação PDF** | Gera PDF profissional da dieta com logo e tabela nutricional |
| **Agenda** | Calendário mensal, agendamento, controle de status |
| **Evolução** | Gráfico de peso ao longo do tempo |

---

## 🚀 Rodando localmente (desenvolvimento)

### Pré-requisitos
- Python 3.11+
- Node.js 20+

### Backend

```bash
cd backend
cp .env.example .env          # edite se necessário
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Acesse a documentação da API: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000

---

## 🐳 Rodando com Docker (produção)

```bash
docker-compose up -d --build
```

Acesse: http://localhost

---

## 🌐 Deploy gratuito (Render.com)

### Backend (Web Service)
1. Crie conta em https://render.com
2. New → Web Service → conecte o repositório
3. Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Adicione variável de ambiente: `SECRET_KEY=sua-chave-aqui`

### Frontend (Static Site)
1. New → Static Site → mesmo repositório
2. Root Directory: `frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Adicione variável: `VITE_API_URL=https://seu-backend.onrender.com/api`

---

## 🗄️ Banco de dados

- **Desenvolvimento**: SQLite (automático, sem configuração)
- **Produção com SQL Server 2014**:

```
DATABASE_URL=mssql+pyodbc://usuario:senha@servidor:1433/nutrirp?driver=ODBC+Driver+17+for+SQL+Server
```

---

## 📁 Estrutura do projeto

```
nutrirp/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── database.py       # Conexão SQLAlchemy
│   │   ├── models/           # Tabelas do banco
│   │   ├── schemas/          # Validação Pydantic
│   │   ├── routers/          # Endpoints da API
│   │   └── services/         # Auth, PDF
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/            # Dashboard, Pacientes, Dieta, Agenda...
        ├── components/       # Modais reutilizáveis
        ├── context/          # AuthContext
        └── api.js            # Axios configurado
```

---

## 🔮 Próximas funcionalidades (roadmap)

- [ ] IA para sugestão automática de dieta
- [ ] Integração WhatsApp (envio de dieta + lembretes)
- [ ] Tabela TACO integrada (busca de alimentos com macros automáticos)
- [ ] App mobile (React Native)
- [ ] Plano SaaS com cobrança mensal
- [ ] Fotos de evolução do paciente
