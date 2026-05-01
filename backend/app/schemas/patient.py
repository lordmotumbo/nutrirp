from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime


class PatientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    goal: Optional[str] = None
    notes: Optional[str] = None


class PatientUpdate(PatientCreate):
    name: Optional[str] = None


class PatientOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    birth_date: Optional[date]
    gender: Optional[str]
    weight: Optional[float]
    height: Optional[float]
    goal: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
