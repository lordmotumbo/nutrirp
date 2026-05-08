"""
Router Fisioterapia — prontuários, exercícios corretivos, restrições.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.models.physiotherapy import PhysiotherapyRecord, PhysiotherapyExercise, ClientRestriction
from app.models.professional_client import ProfessionalClient
from app.models.patient import Patient
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/physio", tags=["Fisioterapia"])


# ── Helpers ───────────────────────────────────────────────────────────
def _get_client(client_id: int, user: User, db: Session) -> Patient:
    link = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == user.id,
        ProfessionalClient.client_id == client_id,
        ProfessionalClient.is_active == True,
    ).first()
    patient = db.query(Patient).filter(Patient.id == client_id).first()
    if not patient:
        raise HTTPException(404, "Paciente não encontrado")
    if not link and patient.nutritionist_id != user.id:
        raise HTTPException(403, "Sem acesso a este paciente")
    return patient


# ── Schemas ───────────────────────────────────────────────────────────
class PhysioRecordIn(BaseModel):
    client_id: int
    pain_level: Optional[int] = None
    pain_location: Optional[str] = None
    pain_type: Optional[str] = None
    mobility_notes: Optional[str] = None
    posture_notes: Optional[str] = None
    injury_history: Optional[str] = None
    surgeries: Optional[str] = None
    previous_treatments: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    goals: Optional[str] = None
    frequency: Optional[str] = None
    session_notes: Optional[str] = None
    techniques_used: Optional[str] = None
    recommendations: Optional[str] = None
    evolution_notes: Optional[str] = None
    discharge_criteria: Optional[str] = None


class PhysioExerciseIn(BaseModel):
    record_id: int
    exercise_id: Optional[int] = None
    exercise_name: Optional[str] = None
    repetitions: Optional[str] = None
    sets: Optional[int] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    observations: Optional[str] = None
    order_index: Optional[int] = 0


class RestrictionIn(BaseModel):
    restriction_type: str
    severity: Optional[str] = None
    description: str
    affected_area: Optional[str] = None
    is_active: Optional[bool] = True


# ── Prontuários ───────────────────────────────────────────────────────
@router.get("/clients/{client_id}/records")
def list_records(
    client_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(client_id, user, db)
    return db.query(PhysiotherapyRecord).filter(
        PhysiotherapyRecord.client_id == client_id,
        PhysiotherapyRecord.professional_id == user.id,
    ).order_by(PhysiotherapyRecord.created_at.desc()).all()


@router.post("/records", status_code=201)
def create_record(
    data: PhysioRecordIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(data.client_id, user, db)
    record = PhysiotherapyRecord(**data.model_dump(), professional_id=user.id)
    db.add(record); db.commit(); db.refresh(record)
    return record


@router.get("/records/{record_id}")
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = db.query(PhysiotherapyRecord).filter(
        PhysiotherapyRecord.id == record_id,
        PhysiotherapyRecord.professional_id == user.id,
    ).first()
    if not record:
        raise HTTPException(404, "Prontuário não encontrado")
    return record


@router.put("/records/{record_id}")
def update_record(
    record_id: int,
    data: PhysioRecordIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = db.query(PhysiotherapyRecord).filter(
        PhysiotherapyRecord.id == record_id,
        PhysiotherapyRecord.professional_id == user.id,
    ).first()
    if not record:
        raise HTTPException(404)
    for k, v in data.model_dump(exclude_none=True).items():
        if k != "client_id":
            setattr(record, k, v)
    db.commit(); db.refresh(record)
    return record


@router.delete("/records/{record_id}", status_code=204)
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = db.query(PhysiotherapyRecord).filter(
        PhysiotherapyRecord.id == record_id,
        PhysiotherapyRecord.professional_id == user.id,
    ).first()
    if not record:
        raise HTTPException(404)
    db.delete(record); db.commit()


# ── Exercícios corretivos ─────────────────────────────────────────────
@router.post("/exercises", status_code=201)
def add_exercise(
    data: PhysioExerciseIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = db.query(PhysiotherapyRecord).filter(
        PhysiotherapyRecord.id == data.record_id,
        PhysiotherapyRecord.professional_id == user.id,
    ).first()
    if not record:
        raise HTTPException(404, "Prontuário não encontrado")
    ex = PhysiotherapyExercise(**data.model_dump())
    db.add(ex); db.commit(); db.refresh(ex)
    return ex


@router.put("/exercises/{ex_id}")
def update_exercise(
    ex_id: int,
    data: PhysioExerciseIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ex = db.query(PhysiotherapyExercise).join(PhysiotherapyRecord).filter(
        PhysiotherapyExercise.id == ex_id,
        PhysiotherapyRecord.professional_id == user.id,
    ).first()
    if not ex:
        raise HTTPException(404)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(ex, k, v)
    db.commit(); db.refresh(ex)
    return ex


@router.delete("/exercises/{ex_id}", status_code=204)
def delete_exercise(
    ex_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ex = db.query(PhysiotherapyExercise).join(PhysiotherapyRecord).filter(
        PhysiotherapyExercise.id == ex_id,
        PhysiotherapyRecord.professional_id == user.id,
    ).first()
    if not ex:
        raise HTTPException(404)
    db.delete(ex); db.commit()


# ── Restrições físicas ────────────────────────────────────────────────
@router.get("/clients/{client_id}/restrictions")
def list_restrictions(
    client_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(client_id, user, db)
    return db.query(ClientRestriction).filter(
        ClientRestriction.client_id == client_id,
        ClientRestriction.is_active == True,
    ).all()


@router.post("/clients/{client_id}/restrictions", status_code=201)
def add_restriction(
    client_id: int,
    data: RestrictionIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(client_id, user, db)
    r = ClientRestriction(**data.model_dump(), client_id=client_id, created_by=user.id)
    db.add(r); db.commit(); db.refresh(r)
    return r


@router.put("/restrictions/{rid}")
def update_restriction(
    rid: int,
    data: RestrictionIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    r = db.query(ClientRestriction).filter(
        ClientRestriction.id == rid,
        ClientRestriction.created_by == user.id,
    ).first()
    if not r:
        raise HTTPException(404)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(r, k, v)
    db.commit(); db.refresh(r)
    return r


# ── Vínculos ──────────────────────────────────────────────────────────
@router.get("/my-patients")
def list_my_patients(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    links = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == user.id,
        ProfessionalClient.is_active == True,
    ).all()
    client_ids = [l.client_id for l in links]
    direct = db.query(Patient).filter(Patient.nutritionist_id == user.id).all()
    direct_ids = {p.id for p in direct}
    all_ids = list(set(client_ids) | direct_ids)
    return db.query(Patient).filter(Patient.id.in_(all_ids)).order_by(Patient.name).all()


@router.post("/link-patient", status_code=201)
def link_patient(
    client_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == client_id).first()
    if not patient:
        raise HTTPException(404, "Paciente não encontrado")
    existing = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == user.id,
        ProfessionalClient.client_id == client_id,
    ).first()
    if existing:
        existing.is_active = True
        existing.role = "physiotherapist"
        db.commit()
        return existing
    link = ProfessionalClient(
        professional_id=user.id,
        client_id=client_id,
        role="physiotherapist",
    )
    db.add(link); db.commit(); db.refresh(link)
    return link
