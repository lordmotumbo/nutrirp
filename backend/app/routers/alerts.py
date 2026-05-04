"""
Router de alertas — configuração e disparo de notificações de refeição e água.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.database import get_db
from app.models.alerts import PatientAlertConfig
from app.models.patient import Patient
from app.models.patient_user import PatientUser
from app.models.messaging import TelegramConfig, PatientTelegram
from app.models.financial import PatientDiary
from app.services.auth import get_current_user, SECRET_KEY, ALGORITHM
from app.services.notifications import (
    send_email, send_telegram,
    meal_alert_email_html, water_alert_email_html,
)
from app.models.user import User
from jose import jwt
from fastapi import Header

router = APIRouter(prefix="/api/alerts", tags=["Alertas"])


# ── Auth paciente ─────────────────────────────────────────────────────
def _get_patient(authorization: str = Header(...), db: Session = Depends(get_db)) -> PatientUser:
    token = authorization.replace("Bearer ", "")
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


# ── Schemas ───────────────────────────────────────────────────────────
class AlertConfigIn(BaseModel):
    email_alerts: Optional[bool] = None
    alert_email: Optional[str] = None
    telegram_alerts: Optional[bool] = None
    telegram_chat_id: Optional[str] = None
    meal_alerts: Optional[bool] = None
    water_alerts: Optional[bool] = None
    water_interval_hours: Optional[int] = None
    water_start_hour: Optional[int] = None
    water_end_hour: Optional[int] = None


# ── Endpoints do paciente ─────────────────────────────────────────────
@router.get("/config")
def get_alert_config(
    current: PatientUser = Depends(_get_patient),
    db: Session = Depends(get_db)
):
    """Retorna configuração de alertas do paciente."""
    cfg = db.query(PatientAlertConfig).filter(
        PatientAlertConfig.patient_id == current.patient_id
    ).first()
    if not cfg:
        # Retorna defaults
        return {
            "email_alerts": False,
            "alert_email": current.email,
            "telegram_alerts": False,
            "telegram_chat_id": None,
            "meal_alerts": True,
            "water_alerts": True,
            "water_interval_hours": 2,
            "water_start_hour": 7,
            "water_end_hour": 22,
        }
    return {
        "email_alerts": cfg.email_alerts,
        "alert_email": cfg.alert_email or current.email,
        "telegram_alerts": cfg.telegram_alerts,
        "telegram_chat_id": cfg.telegram_chat_id,
        "meal_alerts": cfg.meal_alerts,
        "water_alerts": cfg.water_alerts,
        "water_interval_hours": cfg.water_interval_hours,
        "water_start_hour": cfg.water_start_hour,
        "water_end_hour": cfg.water_end_hour,
    }


@router.put("/config")
def save_alert_config(
    data: AlertConfigIn,
    current: PatientUser = Depends(_get_patient),
    db: Session = Depends(get_db)
):
    """Salva configuração de alertas do paciente."""
    cfg = db.query(PatientAlertConfig).filter(
        PatientAlertConfig.patient_id == current.patient_id
    ).first()
    if not cfg:
        cfg = PatientAlertConfig(patient_id=current.patient_id)
        db.add(cfg)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cfg, field, value)

    # Se não definiu email, usa o do login
    if not cfg.alert_email:
        cfg.alert_email = current.email

    db.commit()
    db.refresh(cfg)
    return {"ok": True, "config": cfg}


@router.post("/test/water")
async def test_water_alert(
    current: PatientUser = Depends(_get_patient),
    db: Session = Depends(get_db)
):
    """Dispara um alerta de água de teste para o paciente."""
    patient = db.query(Patient).filter(Patient.id == current.patient_id).first()
    cfg = db.query(PatientAlertConfig).filter(
        PatientAlertConfig.patient_id == current.patient_id
    ).first()

    sent = []

    # Email
    email_to = (cfg.alert_email if cfg else None) or current.email
    if email_to:
        html = water_alert_email_html(patient.name)
        ok = send_email(email_to, "💧 Hora de beber água! — NUTRIRP", html)
        if ok:
            sent.append("email")

    # Telegram via config do nutricionista
    nutritionist_id = patient.nutritionist_id
    tg_config = db.query(TelegramConfig).filter(
        TelegramConfig.nutritionist_id == nutritionist_id,
        TelegramConfig.is_active == True
    ).first()
    pt = db.query(PatientTelegram).filter(
        PatientTelegram.patient_id == current.patient_id,
        PatientTelegram.is_active == True
    ).first()

    # Telegram direto do paciente (configurado pelo próprio)
    patient_tg_id = (cfg.telegram_chat_id if cfg else None) or (pt.telegram_chat_id if pt else None)
    tg_token = tg_config.bot_token if tg_config else None

    if tg_token and patient_tg_id:
        ok = await send_telegram(
            tg_token, patient_tg_id,
            f"💧 <b>Hora de beber água!</b>\n\nOlá, {patient.name}! Lembre-se de se manter hidratado. 🥤\n\n<i>NUTRIRP — Lembrete de hidratação</i>"
        )
        if ok:
            sent.append("telegram")

    if not sent:
        return {"ok": False, "message": "Nenhum canal configurado. Configure email SMTP ou Telegram."}
    return {"ok": True, "sent_via": sent}


@router.post("/test/meal")
async def test_meal_alert(
    current: PatientUser = Depends(_get_patient),
    db: Session = Depends(get_db)
):
    """Dispara um alerta de refeição de teste."""
    from app.models.diet import Diet
    patient = db.query(Patient).filter(Patient.id == current.patient_id).first()
    cfg = db.query(PatientAlertConfig).filter(
        PatientAlertConfig.patient_id == current.patient_id
    ).first()

    diet = db.query(Diet).filter(
        Diet.patient_id == current.patient_id,
        Diet.is_active == True
    ).order_by(Diet.created_at.desc()).first()

    meal_name = diet.meals[0].name if diet and diet.meals else "Refeição"
    meal_time = diet.meals[0].time if diet and diet.meals else "—"
    foods = [{"food_name": f.food_name, "quantity": f.quantity, "unit": f.unit}
             for f in (diet.meals[0].foods if diet and diet.meals else [])]

    sent = []
    email_to = (cfg.alert_email if cfg else None) or current.email
    if email_to:
        html = meal_alert_email_html(patient.name, meal_name, meal_time or "—", foods)
        ok = send_email(email_to, f"🍽 Hora do {meal_name}! — NUTRIRP", html)
        if ok:
            sent.append("email")

    nutritionist_id = patient.nutritionist_id
    tg_config = db.query(TelegramConfig).filter(
        TelegramConfig.nutritionist_id == nutritionist_id,
        TelegramConfig.is_active == True
    ).first()
    pt = db.query(PatientTelegram).filter(
        PatientTelegram.patient_id == current.patient_id,
        PatientTelegram.is_active == True
    ).first()
    patient_tg_id = (cfg.telegram_chat_id if cfg else None) or (pt.telegram_chat_id if pt else None)
    tg_token = tg_config.bot_token if tg_config else None

    if tg_token and patient_tg_id:
        foods_text = "\n".join(f"• {f['food_name']} — {f.get('quantity','')} {f.get('unit','')}" for f in foods) or "Consulte seu plano"
        ok = await send_telegram(
            tg_token, patient_tg_id,
            f"🍽 <b>Hora do {meal_name}!</b> ({meal_time})\n\nOlá, {patient.name}!\n\n<b>Alimentos:</b>\n{foods_text}\n\n<i>NUTRIRP — Lembrete alimentar</i>"
        )
        if ok:
            sent.append("telegram")

    if not sent:
        return {"ok": False, "message": "Nenhum canal configurado."}
    return {"ok": True, "sent_via": sent}


# ── Endpoint chamado pelo scheduler (cron) ────────────────────────────
@router.post("/trigger/water", include_in_schema=False)
async def trigger_water_alerts(
    secret: str,
    db: Session = Depends(get_db)
):
    """
    Endpoint para ser chamado por um cron job externo (ex: cron-job.org).
    Envia alertas de água para todos os pacientes que têm alertas ativos.
    Protegido por secret key.
    """
    import os
    if secret != os.getenv("CRON_SECRET", "nutrirp-cron-secret"):
        raise HTTPException(403, "Forbidden")

    now = datetime.utcnow()
    current_hour = now.hour

    configs = db.query(PatientAlertConfig).filter(
        PatientAlertConfig.water_alerts == True
    ).all()

    sent_count = 0
    for cfg in configs:
        # Verifica se está dentro do horário configurado
        if current_hour < cfg.water_start_hour or current_hour > cfg.water_end_hour:
            continue

        patient = db.query(Patient).filter(Patient.id == cfg.patient_id).first()
        pu = db.query(PatientUser).filter(PatientUser.patient_id == cfg.patient_id).first()
        if not patient or not pu:
            continue

        # Calcula água consumida hoje
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        diary_today = db.query(PatientDiary).filter(
            PatientDiary.patient_id == cfg.patient_id,
            PatientDiary.date >= day_start,
        ).all()
        total_water = sum(d.water_ml or 0 for d in diary_today)

        # Email
        if cfg.email_alerts and cfg.alert_email:
            html = water_alert_email_html(patient.name, total_water)
            send_email(cfg.alert_email, "💧 Hora de beber água! — NUTRIRP", html)

        # Telegram
        tg_config = db.query(TelegramConfig).filter(
            TelegramConfig.nutritionist_id == patient.nutritionist_id,
            TelegramConfig.is_active == True
        ).first()
        patient_tg_id = cfg.telegram_chat_id
        if not patient_tg_id:
            pt = db.query(PatientTelegram).filter(
                PatientTelegram.patient_id == cfg.patient_id,
                PatientTelegram.is_active == True
            ).first()
            patient_tg_id = pt.telegram_chat_id if pt else None

        if cfg.telegram_alerts and tg_config and patient_tg_id:
            water_text = f"\nVocê já consumiu <b>{total_water}ml</b> hoje." if total_water else ""
            await send_telegram(
                tg_config.bot_token, patient_tg_id,
                f"💧 <b>Hora de beber água!</b>\n\nOlá, {patient.name}!{water_text}\n\n<i>NUTRIRP</i>"
            )

        sent_count += 1

    return {"ok": True, "notified": sent_count}


@router.post("/trigger/meals", include_in_schema=False)
async def trigger_meal_alerts(
    secret: str,
    db: Session = Depends(get_db)
):
    """
    Cron job: envia alertas de refeição para pacientes com alertas ativos.
    Verifica se alguma refeição da dieta ativa está programada para a hora atual.
    """
    import os
    if secret != os.getenv("CRON_SECRET", "nutrirp-cron-secret"):
        raise HTTPException(403, "Forbidden")

    from app.models.diet import Diet, Meal

    now = datetime.utcnow()
    current_time = now.strftime("%H:%M")
    # Janela de ±5 minutos
    window = [
        (now - timedelta(minutes=m)).strftime("%H:%M")
        for m in range(0, 6)
    ]

    configs = db.query(PatientAlertConfig).filter(
        PatientAlertConfig.meal_alerts == True
    ).all()

    sent_count = 0
    for cfg in configs:
        patient = db.query(Patient).filter(Patient.id == cfg.patient_id).first()
        if not patient:
            continue

        diet = db.query(Diet).filter(
            Diet.patient_id == cfg.patient_id,
            Diet.is_active == True
        ).order_by(Diet.created_at.desc()).first()
        if not diet:
            continue

        for meal in (diet.meals or []):
            if not meal.time or meal.time not in window:
                continue

            foods = [{"food_name": f.food_name, "quantity": f.quantity, "unit": f.unit}
                     for f in (meal.foods or [])]

            # Email
            if cfg.email_alerts and cfg.alert_email:
                html = meal_alert_email_html(patient.name, meal.name, meal.time, foods)
                send_email(cfg.alert_email, f"🍽 Hora do {meal.name}! — NUTRIRP", html)

            # Telegram
            tg_config = db.query(TelegramConfig).filter(
                TelegramConfig.nutritionist_id == patient.nutritionist_id,
                TelegramConfig.is_active == True
            ).first()
            patient_tg_id = cfg.telegram_chat_id
            if not patient_tg_id:
                pt = db.query(PatientTelegram).filter(
                    PatientTelegram.patient_id == cfg.patient_id,
                    PatientTelegram.is_active == True
                ).first()
                patient_tg_id = pt.telegram_chat_id if pt else None

            if cfg.telegram_alerts and tg_config and patient_tg_id:
                foods_text = "\n".join(
                    f"• {f['food_name']} — {f.get('quantity','')} {f.get('unit','')}"
                    for f in foods
                ) or "Consulte seu plano"
                await send_telegram(
                    tg_config.bot_token, patient_tg_id,
                    f"🍽 <b>Hora do {meal.name}!</b> ({meal.time})\n\nOlá, {patient.name}!\n\n<b>Alimentos:</b>\n{foods_text}\n\n<i>NUTRIRP</i>"
                )

            sent_count += 1

    return {"ok": True, "notified": sent_count}
