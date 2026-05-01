from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate, PatientOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/patients", tags=["Pacientes"])


@router.get("", response_model=List[PatientOut])
def list_patients(
    search: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Patient).filter(Patient.nutritionist_id == current_user.id)
    if search:
        query = query.filter(Patient.name.ilike(f"%{search}%"))
    return query.order_by(Patient.name).all()


@router.post("", response_model=PatientOut, status_code=201)
def create_patient(
    data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = Patient(**data.model_dump(), nutritionist_id=current_user.id)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id, Patient.nutritionist_id == current_user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id, Patient.nutritionist_id == current_user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id, Patient.nutritionist_id == current_user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    db.delete(patient)
    db.commit()
