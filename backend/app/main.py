from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, patients, anamnese, diets, appointments, foods
from app.routers import anthropometry, exams, financial, messaging
from app.routers import patient_portal, reports, alerts

from app.models import user, patient, anamnese as anamnese_model, diet, appointment
from app.models import anthropometry as anthro_model
from app.models import exam, financial as fin_model, messaging as msg_model
from app.models import patient_user, preconsult
from app.models import alerts as alerts_model

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NUTRIRP API",
    description="Sistema completo de gestão para nutricionistas",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers existentes
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(anamnese.router)
app.include_router(diets.router)
app.include_router(appointments.router)
app.include_router(foods.router)

# Novos routers
app.include_router(anthropometry.router)
app.include_router(exams.router)
app.include_router(financial.router)
app.include_router(messaging.router)
app.include_router(patient_portal.router)
app.include_router(reports.router)
app.include_router(alerts.router)


@app.get("/")
def root():
    return {"message": "NUTRIRP API v2.0 rodando", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
