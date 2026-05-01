from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.anamnese import Anamnese
from app.models.patient import Patient
from app.models.user import User
from app.schemas.anamnese import AnamneseCreate, AnamneseOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/anamnese", tags=["Anamnese"])


def _check_patient(patient_id: int, user: User, db: Session) -> Patient:
    patient = db.query(Patient).filter(
        Patient.id == patient_id, Patient.nutritionist_id == user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return patient


@router.get("/patient/{patient_id}", response_model=List[AnamneseOut])
def list_anamneses(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_patient(patient_id, current_user, db)
    return db.query(Anamnese).filter(Anamnese.patient_id == patient_id).order_by(Anamnese.created_at.desc()).all()


@router.post("", response_model=AnamneseOut, status_code=201)
def create_anamnese(
    data: AnamneseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_patient(data.patient_id, current_user, db)
    anamnese = Anamnese(**data.model_dump())
    db.add(anamnese)
    db.commit()
    db.refresh(anamnese)
    return anamnese


@router.get("/{anamnese_id}", response_model=AnamneseOut)
def get_anamnese(
    anamnese_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    anamnese = db.query(Anamnese).filter(Anamnese.id == anamnese_id).first()
    if not anamnese:
        raise HTTPException(status_code=404, detail="Anamnese não encontrada")
    _check_patient(anamnese.patient_id, current_user, db)
    return anamnese
