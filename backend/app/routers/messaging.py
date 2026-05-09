from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.messaging import ChatMessage, TelegramConfig, PatientTelegram
from app.models.patient import Patient
from app.models.user import User
from app.services.auth import get_current_user
import httpx
import base64
import os

router = APIRouter(prefix="/api/messaging", tags=["Mensagens e Telegram"])

# Tamanho máximo de anexo: 10MB
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024


class MessageIn(BaseModel):
    patient_id: int
    message: Optional[str] = None
    sender: str = "nutritionist"
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_name: Optional[str] = None


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


# ── Chat interno ──────────────────────────────────────────────────────
@router.post("/chat", status_code=201)
async def send_message(
    data: MessageIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not data.message and not data.attachment_url:
        raise HTTPException(400, "Mensagem ou anexo obrigatório")

    msg = ChatMessage(
        patient_id=data.patient_id,
        nutritionist_id=user.id,
        sender=data.sender,
        message=data.message,
        attachment_url=data.attachment_url,
        attachment_type=data.attachment_type,
        attachment_name=data.attachment_name,
    )
    db.add(msg); db.commit(); db.refresh(msg)

    # Telegram
    tg_config = db.query(TelegramConfig).filter(
        TelegramConfig.nutritionist_id == user.id, TelegramConfig.is_active == True
    ).first()
    pt = db.query(PatientTelegram).filter(
        PatientTelegram.patient_id == data.patient_id, PatientTelegram.is_active == True
    ).first()
    if tg_config and pt and data.sender == "nutritionist":
        tg_text = f"💬 <b>Mensagem do seu nutricionista:</b>\n\n{data.message or '[Anexo]'}"
        background_tasks.add_task(_send_telegram, tg_config.bot_token, pt.telegram_chat_id, tg_text)

    return _msg_dict(msg)


@router.post("/chat/upload", status_code=201)
async def send_message_with_file(
    patient_id: int = Form(...),
    sender: str = Form("nutritionist"),
    message: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Envia mensagem com arquivo/imagem anexado (armazenado como base64)."""
    content = await file.read()
    if len(content) > MAX_ATTACHMENT_SIZE:
        raise HTTPException(413, "Arquivo muito grande. Máximo 10MB.")

    # Determina tipo
    content_type = file.content_type or ""
    if content_type.startswith("image/"):
        att_type = "image"
    else:
        att_type = "file"

    # Armazena como data URL base64
    b64 = base64.b64encode(content).decode()
    data_url = f"data:{content_type};base64,{b64}"

    msg = ChatMessage(
        patient_id=patient_id,
        nutritionist_id=user.id,
        sender=sender,
        message=message,
        attachment_url=data_url,
        attachment_type=att_type,
        attachment_name=file.filename,
    )
    db.add(msg); db.commit(); db.refresh(msg)
    return _msg_dict(msg)


@router.get("/chat/{patient_id}")
def get_chat(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    msgs = db.query(ChatMessage).filter(
        ChatMessage.patient_id == patient_id,
        ChatMessage.nutritionist_id == user.id
    ).order_by(ChatMessage.created_at.asc()).limit(200).all()

    db.query(ChatMessage).filter(
        ChatMessage.patient_id == patient_id,
        ChatMessage.nutritionist_id == user.id,
        ChatMessage.sender == "patient",
        ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()
    return [_msg_dict(m) for m in msgs]


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Retorna contagem de mensagens não lidas por paciente."""
    from sqlalchemy import func as sqlfunc
    rows = db.query(
        ChatMessage.patient_id,
        sqlfunc.count(ChatMessage.id).label("count")
    ).filter(
        ChatMessage.nutritionist_id == user.id,
        ChatMessage.sender == "patient",
        ChatMessage.is_read == False
    ).group_by(ChatMessage.patient_id).all()

    total = sum(r.count for r in rows)
    by_patient = {r.patient_id: r.count for r in rows}
    return {"total": total, "by_patient": by_patient}


def _msg_dict(m: ChatMessage) -> dict:
    return {
        "id": m.id,
        "patient_id": m.patient_id,
        "nutritionist_id": m.nutritionist_id,
        "sender": m.sender,
        "message": m.message,
        "attachment_url": m.attachment_url,
        "attachment_type": m.attachment_type,
        "attachment_name": m.attachment_name,
        "is_read": m.is_read,
        "created_at": m.created_at,
    }


# ── Telegram ──────────────────────────────────────────────────────────
@router.post("/telegram/config")
def save_telegram_config(data: TelegramConfigIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cfg = db.query(TelegramConfig).filter(TelegramConfig.nutritionist_id == user.id).first()
    if cfg:
        cfg.bot_token = data.bot_token; cfg.is_active = True
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
