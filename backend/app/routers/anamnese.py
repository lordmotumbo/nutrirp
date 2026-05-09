from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.anamnese import Anamnese
from app.models.patient import Patient
from app.models.user import User
from app.models.professional_client import ProfessionalClient
from app.models.patient_user import PatientUser
from app.schemas.anamnese import AnamneseCreate, AnamneseOut
from app.services.auth import get_current_user, SECRET_KEY, ALGORITHM
from app.services.pdf_generator import generate_anamnese_pdf
from fastapi import Query
from jose import jwt as jose_jwt, JWTError as JoseJWTError

router = APIRouter(prefix="/api/anamnese", tags=["Anamnese"])


def _check_patient(patient_id: int, user: User, db: Session) -> Patient:
    """Verifica acesso: dono ou profissional compartilhado."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    if patient.nutritionist_id == user.id:
        return patient
    # Verifica vínculo compartilhado
    link = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == user.id,
        ProfessionalClient.client_id == patient_id,
        ProfessionalClient.is_active == True,
    ).first()
    if link:
        return patient
    raise HTTPException(status_code=403, detail="Sem acesso a este paciente")


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


# ── PDF — Anamnese ────────────────────────────────────────────────────

@router.get("/{anamnese_id}/pdf")
def export_anamnese_pdf(
    anamnese_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """PDF da anamnese — acesso para profissional dono ou compartilhado."""
    anamnese = db.query(Anamnese).filter(Anamnese.id == anamnese_id).first()
    if not anamnese:
        raise HTTPException(404, "Anamnese não encontrada")
    patient = _check_patient(anamnese.patient_id, current_user, db)
    pdf = generate_anamnese_pdf(anamnese, patient, current_user)
    filename = f"anamnese_{patient.name.replace(' ', '_')}.pdf"
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/{anamnese_id}/pdf-for-patient")
def export_anamnese_pdf_patient(
    anamnese_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """PDF da anamnese — acesso pelo paciente via token do portal."""
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
    if not pu:
        raise HTTPException(401, "Paciente não encontrado")

    anamnese = db.query(Anamnese).filter(
        Anamnese.id == anamnese_id,
        Anamnese.patient_id == pu.patient_id
    ).first()
    if not anamnese:
        raise HTTPException(404, "Anamnese não encontrada")

    patient = db.query(Patient).filter(Patient.id == pu.patient_id).first()
    professional = db.query(User).filter(User.id == patient.nutritionist_id).first()
    pdf = generate_anamnese_pdf(anamnese, patient, professional)
    filename = f"anamnese_{patient.name.replace(' ', '_')}.pdf"
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})
