from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AppointmentCreate(BaseModel):
    patient_id: int
    scheduled_at: datetime
    duration_minutes: Optional[int] = 60
    status: Optional[str] = "agendado"
    type: Optional[str] = "consulta"
    notes: Optional[str] = None


class AppointmentOut(AppointmentCreate):
    id: int
    nutritionist_id: int
    patient_name: Optional[str] = None
    cancel_reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EvolutionCreate(BaseModel):
    patient_id: int
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    notes: Optional[str] = None


class EvolutionOut(EvolutionCreate):
    id: int
    recorded_at: datetime

    model_config = {"from_attributes": True}
