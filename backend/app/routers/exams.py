from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.exam import ExamRequest, ExamResult, Supplement
from app.models.patient import Patient
from app.models.user import User
from app.models.professional_client import ProfessionalClient
from app.models.patient_user import PatientUser
from app.services.auth import get_current_user, SECRET_KEY, ALGORITHM
from app.services.pdf_generator import generate_supplements_pdf
from jose import jwt as jose_jwt, JWTError as JoseJWTError

router = APIRouter(prefix="/api/exams", tags=["Exames e Suplementos"])


# ── Schemas ───────────────────────────────────────────────────────────
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


def _check_patient(patient_id, user, db) -> Patient:
    """Verifica acesso: dono ou profissional compartilhado."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Paciente não encontrado")
    if patient.nutritionist_id == user.id:
        return patient
    link = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == user.id,
        ProfessionalClient.client_id == patient_id,
        ProfessionalClient.is_active == True,
    ).first()
    if link:
        return patient
    raise HTTPException(403, "Sem acesso a este paciente")


# ── Exames ────────────────────────────────────────────────────────────
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


# ── Suplementos ───────────────────────────────────────────────────────
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


# ── PDF — Suplementos ─────────────────────────────────────────────────

@router.get("/supplement/patient/{patient_id}/pdf")
def export_supplements_pdf(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """PDF dos suplementos — profissional dono ou compartilhado."""
    patient = _check_patient(patient_id, user, db)
    supplements = db.query(Supplement).filter(
        Supplement.patient_id == patient_id,
        Supplement.is_active == True
    ).all()
    pdf = generate_supplements_pdf(supplements, patient, user)
    filename = f"suplementos_{patient.name.replace(' ', '_')}.pdf"
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/supplement/patient/{patient_id}/pdf-for-patient")
def export_supplements_pdf_patient(
    patient_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """PDF dos suplementos — acesso pelo paciente via token do portal."""
    try:
        payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        patient_sub = payload.get("patient_sub")
        if not patient_sub:
            raise HTTPException(401, "Token inválido")
    except JoseJWTError:
        raise HTTPException(401, "Token inválido ou expirado")

    pu = db.query(PatientUser).filter(
        PatientUser.id == int(patient_sub), PatientUser.is_active == True
    ).first()
    if not pu or pu.patient_id != patient_id:
        raise HTTPException(403, "Acesso negado")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Paciente não encontrado")

    supplements = db.query(Supplement).filter(
        Supplement.patient_id == patient_id,
        Supplement.is_active == True
    ).all()
    professional = db.query(User).filter(User.id == patient.nutritionist_id).first()
    pdf = generate_supplements_pdf(supplements, patient, professional)
    filename = f"suplementos_{patient.name.replace(' ', '_')}.pdf"
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})
