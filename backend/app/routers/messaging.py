from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.messaging import ChatMessage, TelegramConfig, PatientTelegram
from app.models.patient import Patient
from app.models.user import User
from app.services.auth import get_current_user
import httpx

router = APIRouter(prefix="/api/messaging", tags=["Mensagens e Telegram"])


class MessageIn(BaseModel):
    patient_id: int
    message: str
    sender: str = "nutritionist"


class TelegramConfigIn(BaseModel):
    bot_token: str


class TelegramPatientIn(BaseModel):
    patient_id: int
    telegram_chat_id: str
    hydration_reminder: bool = False
    hydration_interval_hours: int = 2


async def _send_telegram(bot_token: str, chat_id: str, text: str):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})


# ── Chat interno ─────────────────────────────────────────────────────
@router.post("/chat", status_code=201)
async def send_message(
    data: MessageIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    msg = ChatMessage(
        patient_id=data.patient_id,
        nutritionist_id=user.id,
        sender=data.sender,
        message=data.message,
    )
    db.add(msg); db.commit(); db.refresh(msg)

    # Enviar via Telegram se configurado
    tg_config = db.query(TelegramConfig).filter(
        TelegramConfig.nutritionist_id == user.id, TelegramConfig.is_active == True
    ).first()
    pt = db.query(PatientTelegram).filter(
        PatientTelegram.patient_id == data.patient_id, PatientTelegram.is_active == True
    ).first()
    if tg_config and pt and data.sender == "nutritionist":
        patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
        text = f"💬 <b>Mensagem do seu nutricionista:</b>\n\n{data.message}"
        background_tasks.add_task(_send_telegram, tg_config.bot_token, pt.telegram_chat_id, text)

    return msg


@router.get("/chat/{patient_id}")
def get_chat(patient_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    msgs = db.query(ChatMessage).filter(
        ChatMessage.patient_id == patient_id,
        ChatMessage.nutritionist_id == user.id
    ).order_by(ChatMessage.created_at.asc()).limit(100).all()
    # Marcar como lido
    db.query(ChatMessage).filter(
        ChatMessage.patient_id == patient_id,
        ChatMessage.nutritionist_id == user.id,
        ChatMessage.sender == "patient",
        ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()
    return msgs


# ── Telegram ─────────────────────────────────────────────────────────
@router.post("/telegram/config")
def save_telegram_config(data: TelegramConfigIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cfg = db.query(TelegramConfig).filter(TelegramConfig.nutritionist_id == user.id).first()
    if cfg:
        cfg.bot_token = data.bot_token
        cfg.is_active = True
    else:
        cfg = TelegramConfig(nutritionist_id=user.id, bot_token=data.bot_token, is_active=True)
        db.add(cfg)
    db.commit()
    return {"ok": True}


@router.post("/telegram/patient")
def link_patient_telegram(data: TelegramPatientIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pt = db.query(PatientTelegram).filter(PatientTelegram.patient_id == data.patient_id).first()
    if pt:
        pt.telegram_chat_id = data.telegram_chat_id
        pt.is_active = True
        pt.hydration_reminder = data.hydration_reminder
        pt.hydration_interval_hours = data.hydration_interval_hours
    else:
        pt = PatientTelegram(**data.model_dump())
        db.add(pt)
    db.commit()
    return {"ok": True}


@router.post("/telegram/send/{patient_id}")
async def send_telegram_direct(
    patient_id: int, message: str,
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    cfg = db.query(TelegramConfig).filter(TelegramConfig.nutritionist_id == user.id, TelegramConfig.is_active == True).first()
    pt = db.query(PatientTelegram).filter(PatientTelegram.patient_id == patient_id, PatientTelegram.is_active == True).first()
    if not cfg or not pt:
        raise HTTPException(400, "Telegram não configurado para este paciente")
    await _send_telegram(cfg.bot_token, pt.telegram_chat_id, message)
    return {"ok": True}


@router.get("/telegram/config")
def get_telegram_config(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cfg = db.query(TelegramConfig).filter(TelegramConfig.nutritionist_id == user.id).first()
    return {"configured": cfg is not None and cfg.is_active, "has_token": cfg is not None}
