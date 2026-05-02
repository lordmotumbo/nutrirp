from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.anthropometry import Anthropometry
from app.models.patient import Patient
from app.models.user import User
from app.services.auth import get_current_user
import math

router = APIRouter(prefix="/api/anthropometry", tags=["Antropometria"])


class AnthropometryIn(BaseModel):
    patient_id: int
    weight: Optional[float] = None
    height: Optional[float] = None
    age: Optional[int] = None
    triceps: Optional[float] = None
    biceps: Optional[float] = None
    subscapular: Optional[float] = None
    suprailiac: Optional[float] = None
    abdominal: Optional[float] = None
    thigh: Optional[float] = None
    calf: Optional[float] = None
    chest: Optional[float] = None
    midaxillary: Optional[float] = None
    waist: Optional[float] = None
    hip: Optional[float] = None
    neck: Optional[float] = None
    arm: Optional[float] = None
    forearm: Optional[float] = None
    thigh_circ: Optional[float] = None
    calf_circ: Optional[float] = None
    protocol: Optional[str] = "pollock7"
    activity_factor: Optional[float] = 1.55
    bmr_formula: Optional[str] = "mifflin"
    notes: Optional[str] = None


def calc_body_fat(data: AnthropometryIn, gender: str = "F") -> Optional[float]:
    """Calcula % gordura pelos protocolos disponíveis."""
    try:
        if data.protocol == "pollock7" and all([
            data.triceps, data.subscapular, data.suprailiac,
            data.abdominal, data.thigh, data.chest, data.midaxillary
        ]):
            sum_folds = (data.triceps + data.subscapular + data.suprailiac +
                         data.abdominal + data.thigh + data.chest + data.midaxillary)
            age = data.age or 30
            if gender == "M":
                density = 1.112 - (0.00043499 * sum_folds) + (0.00000055 * sum_folds**2) - (0.00028826 * age)
            else:
                density = 1.097 - (0.00046971 * sum_folds) + (0.00000056 * sum_folds**2) - (0.00012828 * age)
            return round((4.95 / density - 4.50) * 100, 1)

        if data.protocol == "pollock3" and data.weight and data.height:
            if gender == "M" and data.chest and data.abdominal and data.thigh:
                sum_folds = data.chest + data.abdominal + data.thigh
                age = data.age or 30
                density = 1.10938 - (0.0008267 * sum_folds) + (0.0000016 * sum_folds**2) - (0.0002574 * age)
                return round((4.95 / density - 4.50) * 100, 1)
            elif gender == "F" and data.triceps and data.suprailiac and data.thigh:
                sum_folds = data.triceps + data.suprailiac + data.thigh
                age = data.age or 30
                density = 1.0994921 - (0.0009929 * sum_folds) + (0.0000023 * sum_folds**2) - (0.0001392 * age)
                return round((4.95 / density - 4.50) * 100, 1)
    except Exception:
        pass
    return None


def calc_bmr(weight, height, age, gender, formula="mifflin") -> Optional[float]:
    """Calcula TMB."""
    if not all([weight, height, age]):
        return None
    if formula == "mifflin":
        if gender == "M":
            return round(10 * weight + 6.25 * height - 5 * age + 5, 1)
        return round(10 * weight + 6.25 * height - 5 * age - 161, 1)
    else:  # harris_benedict
        if gender == "M":
            return round(88.362 + 13.397 * weight + 4.799 * height - 5.677 * age, 1)
        return round(447.593 + 9.247 * weight + 3.098 * height - 4.330 * age, 1)


@router.post("", status_code=201)
def create(data: AnthropometryIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == data.patient_id, Patient.nutritionist_id == user.id).first()
    if not patient:
        raise HTTPException(404, "Paciente não encontrado")

    gender = patient.gender or "F"
    bmi = round(data.weight / ((data.height / 100) ** 2), 1) if data.weight and data.height else None
    bf = calc_body_fat(data, gender)
    fat_mass = round(data.weight * bf / 100, 1) if data.weight and bf else None
    lean_mass = round(data.weight - fat_mass, 1) if data.weight and fat_mass else None
    whr = round(data.waist / data.hip, 2) if data.waist and data.hip else None
    bmr = calc_bmr(data.weight, data.height, data.age or patient.birth_date and
                   ((2024 - patient.birth_date.year) if patient.birth_date else None),
                   gender, data.bmr_formula or "mifflin")
    tdee = round(bmr * (data.activity_factor or 1.55), 1) if bmr else None

    record = Anthropometry(
        **{k: v for k, v in data.model_dump().items() if k != "patient_id"},
        patient_id=data.patient_id,
        bmi=bmi, body_fat_pct=bf, fat_mass=fat_mass,
        lean_mass=lean_mass, waist_hip_ratio=whr, bmr=bmr, tdee=tdee,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/patient/{patient_id}")
def list_by_patient(patient_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.nutritionist_id == user.id).first()
    if not patient:
        raise HTTPException(404, "Paciente não encontrado")
    return db.query(Anthropometry).filter(Anthropometry.patient_id == patient_id).order_by(Anthropometry.recorded_at.desc()).all()
