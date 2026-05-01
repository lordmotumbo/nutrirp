# 🚀 Deploy NUTRIRP no Render.com (Gratuito)

Repositório: https://github.com/lordmotumbo/nutrirp

---

## PASSO 1 — Criar conta no Render
Acesse https://render.com e clique em **"Get Started for Free"**
→ Faça login com sua conta GitHub (lordmotumbo)

---

## PASSO 2 — Deploy do Backend (FastAPI)

1. No dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte o repositório: **lordmotumbo/nutrirp**
3. Preencha:
   - **Name:** `nutrirp-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
4. Em **Environment Variables**, adicione:
   - `SECRET_KEY` = (clique em "Generate" para gerar automaticamente)
   - `DATABASE_URL` = `sqlite:///./nutrirp.db`
5. Clique **"Create Web Service"**
6. Aguarde o build (~3 min). Anote a URL: `https://nutrirp-backend.onrender.com`

---

## PASSO 3 — Deploy do Frontend (React)

1. Clique em **"New +"** → **"Static Site"**
2. Conecte o mesmo repositório: **lordmotumbo/nutrirp**
3. Preencha:
   - **Name:** `nutrirp-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Em **Environment Variables**, adicione:
   - `VITE_API_URL` = `https://nutrirp-backend.onrender.com/api`
5. Clique **"Create Static Site"**
6. Aguarde o build (~2 min)

---

## ✅ Resultado Final

- **Frontend:** https://nutrirp-frontend.onrender.com
- **Backend API:** https://nutrirp-backend.onrender.com
- **Documentação API:** https://nutrirp-backend.onrender.com/docs

---

## ⚠️ Observação sobre o plano Free

No plano gratuito do Render, o backend "dorme" após 15 min sem uso.
A primeira requisição após o sleep demora ~30s para acordar.
Para produção real, considere o plano **Starter ($7/mês)**.
