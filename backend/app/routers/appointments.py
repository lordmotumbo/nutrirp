from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel
from app.database import get_db
from app.models.appointment import Appointment, Evolution
from app.models.patient import Patient
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentOut, EvolutionCreate, EvolutionOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/appointments", tags=["Agenda"])


class StatusUpdateIn(BaseModel):
    status: str
    reason: Optional[str] = None
    new_scheduled_at: Optional[datetime] = None  # para reagendamento


@router.get("", response_model=List[AppointmentOut])
def list_appointments(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Appointment).filter(Appointment.nutritionist_id == current_user.id)
    if date_from:
        query = query.filter(Appointment.scheduled_at >= date_from)
    if date_to:
        query = query.filter(Appointment.scheduled_at <= date_to)
    appointments = query.order_by(Appointment.scheduled_at).all()

    result = []
    for appt in appointments:
        patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        appt_dict = {
            "id": appt.id,
            "patient_id": appt.patient_id,
            "nutritionist_id": appt.nutritionist_id,
            "scheduled_at": appt.scheduled_at,
            "duration_minutes": appt.duration_minutes,
            "status": appt.status,
            "type": appt.type,
            "notes": appt.notes,
            "cancel_reason": appt.cancel_reason,
            "created_at": appt.created_at,
            "patient_name": patient.name if patient else None,
        }
        result.append(appt_dict)
    return result


@router.post("", response_model=AppointmentOut, status_code=201)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(
        Patient.id == data.patient_id, Patient.nutritionist_id == current_user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    appt = Appointment(**data.model_dump(), nutritionist_id=current_user.id)
    db.add(appt)
    db.commit()
    db.refresh(appt)

    return {**appt.__dict__, "patient_name": patient.name}


@router.put("/{appt_id}/status")
def update_status(
    appt_id: int,
    data: StatusUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualiza status da consulta. Para reagendamento, pode incluir novo horário e mensagem ao paciente."""
    appt = db.query(Appointment).filter(
        Appointment.id == appt_id, Appointment.nutritionist_id == current_user.id
    ).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Consulta não encontrada")

    appt.status = data.status
    if data.reason:
        appt.cancel_reason = data.reason

    if data.status == "reagendado" and data.new_scheduled_at:
        appt.scheduled_at = data.new_scheduled_at
        appt.reschedule_requested_at = datetime.utcnow()
        # Envia mensagem interna ao paciente via chat
        from app.models.messaging import ChatMessage
        msg_text = f"📅 Sua consulta foi reagendada para {data.new_scheduled_at.strftime('%d/%m/%Y às %H:%M')}."
        if data.reason:
            msg_text += f"\nMotivo: {data.reason}"
        msg_text += "\n\nPor favor, confirme, solicite novo reagendamento ou cancele."
        chat_msg = ChatMessage(
            patient_id=appt.patient_id,
            nutritionist_id=current_user.id,
            sender="nutritionist",
            message=msg_text,
        )
        db.add(chat_msg)

    db.commit()
    db.refresh(appt)
    patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
    return {**appt.__dict__, "patient_name": patient.name if patient else None}


@router.delete("/{appt_id}", status_code=204)
def delete_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.query(Appointment).filter(
        Appointment.id == appt_id, Appointment.nutritionist_id == current_user.id
    ).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Consulta não encontrada")
    db.delete(appt)
    db.commit()


# Evolução do paciente
@router.post("/evolution", response_model=EvolutionOut, status_code=201)
def add_evolution(
    data: EvolutionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(
        Patient.id == data.patient_id, Patient.nutritionist_id == current_user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    evo = Evolution(**data.model_dump())
    db.add(evo)
    db.commit()
    db.refresh(evo)
    return evo


@router.get("/evolution/{patient_id}", response_model=List[EvolutionOut])
def list_evolutions(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id, Patient.nutritionist_id == current_user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return db.query(Evolution).filter(Evolution.patient_id == patient_id).order_by(Evolution.recorded_at).all()
