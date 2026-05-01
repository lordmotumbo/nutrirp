from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, patients, anamnese, diets, appointments

# Cria as tabelas automaticamente (SQLite dev / SQL Server prod)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NUTRIRP API",
    description="Sistema de gestão para nutricionistas",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Em produção, restringir ao domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(anamnese.router)
app.include_router(diets.router)
app.include_router(appointments.router)


@app.get("/")
def root():
    return {"message": "NUTRIRP API rodando", "docs": "/docs"}
