from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.exam import ExamRequest, ExamResult, Supplement
from app.models.patient import Patient
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/exams", tags=["Exames e Suplementos"])


# ── Solicitação de exames ────────────────────────────────────────────
class ExamRequestIn(BaseModel):
    patient_id: int
    title: Optional[str] = "Solicitação de Exames"
    exams: Optional[list] = []
    justification: Optional[str] = None
    notes: Optional[str] = None


class ExamResultIn(BaseModel):
    patient_id: int
    request_id: Optional[int] = None
    exam_name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    reference_min: Optional[float] = None
    reference_max: Optional[float] = None
    status: Optional[str] = None
    analysis: Optional[str] = None


class SupplementIn(BaseModel):
    patient_id: int
    name: str
    type: Optional[str] = "suplemento"
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    duration: Optional[str] = None
    brand: Optional[str] = None
    justification: Optional[str] = None
    contraindications: Optional[str] = None


def _check_patient(patient_id, user, db):
    p = db.query(Patient).filter(Patient.id == patient_id, Patient.nutritionist_id == user.id).first()
    if not p:
        raise HTTPException(404, "Paciente não encontrado")
    return p


@router.post("/request", status_code=201)
def create_request(data: ExamRequestIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_patient(data.patient_id, user, db)
    req = ExamRequest(**data.model_dump(), nutritionist_id=user.id)
    db.add(req); db.commit(); db.refresh(req)
    return req


@router.get("/request/patient/{patient_id}")
def list_requests(patient_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_patient(patient_id, user, db)
    return db.query(ExamRequest).filter(ExamRequest.patient_id == patient_id).order_by(ExamRequest.created_at.desc()).all()


@router.post("/result", status_code=201)
def add_result(data: ExamResultIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_patient(data.patient_id, user, db)
    # Auto-classificar status
    if data.value and data.reference_min and data.reference_max:
        try:
            v = float(data.value)
            if v < data.reference_min:
                data.status = "baixo"
            elif v > data.reference_max:
                data.status = "alto"
            else:
                data.status = "normal"
        except Exception:
            pass
    result = ExamResult(**data.model_dump())
    db.add(result); db.commit(); db.refresh(result)
    return result


@router.get("/result/patient/{patient_id}")
def list_results(patient_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_patient(patient_id, user, db)
    return db.query(ExamResult).filter(ExamResult.patient_id == patient_id).order_by(ExamResult.recorded_at.desc()).all()


# ── Suplementos ──────────────────────────────────────────────────────
@router.post("/supplement", status_code=201)
def create_supplement(data: SupplementIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_patient(data.patient_id, user, db)
    s = Supplement(**data.model_dump(), nutritionist_id=user.id)
    db.add(s); db.commit(); db.refresh(s)
    return s


@router.get("/supplement/patient/{patient_id}")
def list_supplements(patient_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_patient(patient_id, user, db)
    return db.query(Supplement).filter(Supplement.patient_id == patient_id, Supplement.is_active == True).all()


@router.delete("/supplement/{sid}", status_code=204)
def delete_supplement(sid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(Supplement).filter(Supplement.id == sid, Supplement.nutritionist_id == user.id).first()
    if not s:
        raise HTTPException(404)
    s.is_active = False
    db.commit()
