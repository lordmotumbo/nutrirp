"""
Portal do Paciente — login próprio, diário, metas, agendamento, pré-consulta, recordatório.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime
import bcrypt
from jose import jwt
from app.database import get_db
from app.models.patient_user import PatientUser
from app.models.patient import Patient
from app.models.financial import PatientGoal, PatientDiary
from app.models.appointment import Appointment
from app.models.messaging import ChatMessage, TelegramConfig, PatientTelegram
from app.models.preconsult import PreConsultForm, FoodRecord
from app.services.auth import SECRET_KEY, ALGORITHM, create_access_token
import httpx
import os

router = APIRouter(prefix="/api/patient-portal", tags=["Portal do Paciente"])


# ── Auth helpers ─────────────────────────────────────────────────────
def _hash(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
def _verify(pw, h): return bcrypt.checkpw(pw.encode(), h.encode())


def get_patient_user(token: str, db: Session) -> PatientUser:
    from fastapi.security import OAuth2PasswordBearer
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        pid = payload.get("patient_sub")
        if not pid:
            raise HTTPException(401, "Token inválido")
    except Exception:
        raise HTTPException(401, "Token inválido")
    pu = db.query(PatientUser).filter(PatientUser.id == int(pid), PatientUser.is_active == True).first()
    if not pu:
        raise HTTPException(401, "Paciente não encontrado")
    return pu


from fastapi import Header

def get_current_patient(authorization: str = Header(...), db: Session = Depends(get_db)) -> PatientUser:
    token = authorization.replace("Bearer ", "")
    return get_patient_user(token, db)


# ── Registro / Login ─────────────────────────────────────────────────
class PatientRegisterIn(BaseModel):
    patient_id: int
    email: EmailStr
    password: str


class PatientLoginIn(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=201)
def register_patient(data: PatientRegisterIn, db: Session = Depends(get_db)):
    if db.query(PatientUser).filter(PatientUser.email == data.email).first():
        raise HTTPException(400, "E-mail já cadastrado")
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(404, "Paciente não encontrado")
    pu = PatientUser(patient_id=data.patient_id, email=data.email, hashed_password=_hash(data.password))
    db.add(pu); db.commit(); db.refresh(pu)
    return {"id": pu.id, "email": pu.email}


@router.post("/login")
def login_patient(data: PatientLoginIn, db: Session = Depends(get_db)):
    pu = db.query(PatientUser).filter(PatientUser.email == data.email).first()
    if not pu or not _verify(data.password, pu.hashed_password):
        raise HTTPException(401, "E-mail ou senha incorretos")
    token = create_access_token({"patient_sub": str(pu.id)})
    patient = db.query(Patient).filter(Patient.id == pu.patient_id).first()
    return {"access_token": token, "token_type": "bearer",
            "patient": {"id": patient.id, "name": patient.name, "goal": patient.goal}}


# ── Perfil ────────────────────────────────────────────────────────────
@router.get("/me")
def get_me(current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == current.patient_id).first()
    return {"id": p.id, "name": p.name, "weight": p.weight, "height": p.height,
            "goal": p.goal, "email": current.email}


# ── Diário ────────────────────────────────────────────────────────────
class DiaryIn(BaseModel):
    date: datetime
    mood: Optional[str] = None
    sleep_hours: Optional[float] = None
    water_ml: Optional[int] = None
    physical_activity: Optional[str] = None
    diet_adherence: Optional[int] = None
    notes: Optional[str] = None


@router.post("/diary", status_code=201)
def add_diary(data: DiaryIn, current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    d = PatientDiary(**data.model_dump(), patient_id=current.patient_id)
    db.add(d); db.commit(); db.refresh(d)
    return d


@router.get("/diary")
def list_diary(current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(PatientDiary).filter(PatientDiary.patient_id == current.patient_id).order_by(PatientDiary.date.desc()).limit(30).all()


# ── Metas ─────────────────────────────────────────────────────────────
@router.get("/goals")
def list_goals(current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(PatientGoal).filter(PatientGoal.patient_id == current.patient_id).all()


# ── Consultas ─────────────────────────────────────────────────────────
@router.get("/appointments")
def list_appointments(current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(Appointment).filter(
        Appointment.patient_id == current.patient_id
    ).order_by(Appointment.scheduled_at).all()


@router.post("/appointments/request", status_code=201)
def request_appointment(
    preferred_date: datetime,
    notes: Optional[str] = None,
    current: PatientUser = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == current.patient_id).first()
    appt = Appointment(
        patient_id=current.patient_id,
        nutritionist_id=patient.nutritionist_id,
        scheduled_at=preferred_date,
        status="agendado",
        type="consulta",
        notes=notes,
    )
    db.add(appt); db.commit(); db.refresh(appt)
    return appt


# ── Pré-consulta ──────────────────────────────────────────────────────
class PreConsultIn(BaseModel):
    appointment_id: Optional[int] = None
    main_complaint: Optional[str] = None
    current_symptoms: Optional[str] = None
    recent_changes: Optional[str] = None
    sleep_quality: Optional[str] = None
    stress_level: Optional[str] = None
    physical_activity_last_week: Optional[str] = None
    water_intake_today: Optional[str] = None
    breakfast: Optional[str] = None
    morning_snack: Optional[str] = None
    lunch: Optional[str] = None
    afternoon_snack: Optional[str] = None
    dinner: Optional[str] = None
    night_snack: Optional[str] = None
    medications_changes: Optional[str] = None
    additional_notes: Optional[str] = None


@router.post("/preconsult", status_code=201)
def submit_preconsult(data: PreConsultIn, current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    form = PreConsultForm(**data.model_dump(), patient_id=current.patient_id)
    db.add(form); db.commit(); db.refresh(form)
    return form


@router.get("/preconsult")
def list_preconsult(current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(PreConsultForm).filter(PreConsultForm.patient_id == current.patient_id).order_by(PreConsultForm.created_at.desc()).all()


# ── Recordatório 24h ──────────────────────────────────────────────────
class FoodRecordIn(BaseModel):
    record_date: datetime
    meals: list
    total_calories: Optional[float] = None
    total_protein: Optional[float] = None
    total_carbs: Optional[float] = None
    total_fat: Optional[float] = None
    notes: Optional[str] = None


@router.post("/food-record", status_code=201)
def add_food_record(data: FoodRecordIn, current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    r = FoodRecord(**data.model_dump(), patient_id=current.patient_id)
    db.add(r); db.commit(); db.refresh(r)
    return r


@router.get("/food-record")
def list_food_records(current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(FoodRecord).filter(FoodRecord.patient_id == current.patient_id).order_by(FoodRecord.record_date.desc()).limit(30).all()


# ── Chat ──────────────────────────────────────────────────────────────
class MessageIn(BaseModel):
    message: str


@router.post("/chat", status_code=201)
async def send_message(
    data: MessageIn,
    background_tasks: BackgroundTasks,
    current: PatientUser = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == current.patient_id).first()
    msg = ChatMessage(
        patient_id=current.patient_id,
        nutritionist_id=patient.nutritionist_id,
        sender="patient",
        message=data.message,
    )
    db.add(msg); db.commit(); db.refresh(msg)
    return msg


@router.get("/chat")
def get_chat(current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(ChatMessage).filter(
        ChatMessage.patient_id == current.patient_id
    ).order_by(ChatMessage.created_at.asc()).limit(100).all()


# ── Dieta ativa ───────────────────────────────────────────────────────
@router.get("/diet")
def get_active_diet(current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    from app.models.diet import Diet
    diet = db.query(Diet).filter(
        Diet.patient_id == current.patient_id,
        Diet.is_active == True
    ).order_by(Diet.created_at.desc()).first()
    if not diet:
        raise HTTPException(404, "Nenhuma dieta ativa")
    return diet
