"""
Portal do Paciente — login próprio, diário, metas, agendamento, pré-consulta, recordatório.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime, date
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
    sleep_quality: Optional[str] = None
    water_ml: Optional[int] = None
    physical_activity: Optional[str] = None
    activity_duration_min: Optional[int] = None
    activity_intensity: Optional[str] = None
    diet_adherence: Optional[int] = None
    hunger_level: Optional[int] = None
    energy_level: Optional[int] = None
    stress_level: Optional[int] = None
    bowel_function: Optional[str] = None
    symptoms: Optional[str] = None
    medications_taken: Optional[str] = None
    notes: Optional[str] = None


class WaterUpdateIn(BaseModel):
    water_ml: int
    date: Optional[datetime] = None


@router.post("/diary", status_code=201)
def add_diary(data: DiaryIn, current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    d = PatientDiary(**data.model_dump(), patient_id=current.patient_id)
    db.add(d); db.commit(); db.refresh(d)
    return d


@router.get("/diary")
def list_diary(current: PatientUser = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(PatientDiary).filter(PatientDiary.patient_id == current.patient_id).order_by(PatientDiary.date.desc()).limit(30).all()


@router.patch("/diary/water")
def update_water_intake(
    data: WaterUpdateIn,
    current: PatientUser = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Adiciona água ao registro do dia atual (cria entrada se não existir)."""
    target_date = data.date or datetime.utcnow()
    # Busca registro do dia
    day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    entry = db.query(PatientDiary).filter(
        PatientDiary.patient_id == current.patient_id,
        PatientDiary.date >= day_start,
        PatientDiary.date <= day_end,
    ).first()

    if entry:
        entry.water_ml = (entry.water_ml or 0) + data.water_ml
        db.commit()
        db.refresh(entry)
        return entry
    else:
        # Cria novo registro do dia com apenas a água
        new_entry = PatientDiary(
            patient_id=current.patient_id,
            date=target_date,
            water_ml=data.water_ml,
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        return new_entry


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


class AppointmentActionIn(BaseModel):
    action: str  # confirmar | cancelar | reagendar
    reason: Optional[str] = None
    new_date: Optional[datetime] = None


@router.post("/appointments/{appt_id}/action", status_code=200)
def patient_appointment_action(
    appt_id: int,
    data: AppointmentActionIn,
    current: PatientUser = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Paciente confirma, cancela ou pede reagendamento de consulta."""
    appt = db.query(Appointment).filter(
        Appointment.id == appt_id,
        Appointment.patient_id == current.patient_id
    ).first()
    if not appt:
        raise HTTPException(404, "Consulta não encontrada")

    if data.action == "confirmar":
        appt.status = "confirmado"
        msg_text = "✅ Paciente confirmou a consulta."
    elif data.action == "cancelar":
        appt.status = "cancelado"
        appt.cancel_reason = data.reason
        msg_text = f"❌ Paciente cancelou a consulta."
        if data.reason:
            msg_text += f"\nMotivo: {data.reason}"
    elif data.action == "reagendar":
        appt.status = "reagendamento_solicitado"
        appt.cancel_reason = data.reason
        msg_text = "🔄 Paciente solicitou reagendamento."
        if data.reason:
            msg_text += f"\nMotivo: {data.reason}"
        if data.new_date:
            msg_text += f"\nData sugerida: {data.new_date.strftime('%d/%m/%Y às %H:%M')}"
    else:
        raise HTTPException(400, "Ação inválida. Use: confirmar, cancelar ou reagendar")

    # Envia mensagem ao nutricionista via chat
    chat_msg = ChatMessage(
        patient_id=current.patient_id,
        nutritionist_id=appt.nutritionist_id,
        sender="patient",
        message=msg_text,
    )
    db.add(chat_msg)
    db.commit()
    db.refresh(appt)
    return appt


# ── Relatório diário do paciente ──────────────────────────────────────
@router.get("/diary/report/{report_date}")
def get_daily_report(
    report_date: date,
    current: PatientUser = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Retorna o resumo do diário de um dia específico."""
    day_start = datetime.combine(report_date, datetime.min.time())
    day_end = datetime.combine(report_date, datetime.max.time())

    entries = db.query(PatientDiary).filter(
        PatientDiary.patient_id == current.patient_id,
        PatientDiary.date >= day_start,
        PatientDiary.date <= day_end,
    ).all()

    return {
        "date": report_date.isoformat(),
        "entries": entries,
        "summary": {
            "total_water_ml": sum(e.water_ml or 0 for e in entries),
            "avg_mood": [e.mood for e in entries if e.mood],
            "total_sleep_hours": sum(e.sleep_hours or 0 for e in entries),
            "activities": [e.physical_activity for e in entries if e.physical_activity],
            "avg_diet_adherence": (
                sum(e.diet_adherence or 0 for e in entries if e.diet_adherence) //
                max(1, len([e for e in entries if e.diet_adherence]))
            ) if entries else 0,
        }
    }


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
    msgs = db.query(ChatMessage).filter(
        ChatMessage.patient_id == current.patient_id
    ).order_by(ChatMessage.created_at.asc()).limit(100).all()
    # Marcar mensagens do nutricionista como lidas
    db.query(ChatMessage).filter(
        ChatMessage.patient_id == current.patient_id,
        ChatMessage.sender == "nutritionist",
        ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()
    return msgs


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

