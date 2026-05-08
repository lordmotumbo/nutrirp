"""
Router Personal Trainer — planos de treino, exercícios, check-ins, evolução corporal.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime
from app.database import get_db
from app.models.workout import WorkoutPlan, WorkoutSession, WorkoutExercise, ExerciseLibrary, CheckIn
from app.models.physiotherapy import BodyEvolution, ClientRestriction
from app.models.professional_client import ProfessionalClient
from app.models.patient import Patient
from app.models.user import User
from app.services.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/personal", tags=["Personal Trainer"])


# ── Helpers ───────────────────────────────────────────────────────────
def _get_client(client_id: int, user: User, db: Session) -> Patient:
    """Verifica se o profissional tem acesso ao cliente."""
    link = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == user.id,
        ProfessionalClient.client_id == client_id,
        ProfessionalClient.is_active == True,
    ).first()
    # Também aceita se for o nutricionista original do paciente
    patient = db.query(Patient).filter(Patient.id == client_id).first()
    if not patient:
        raise HTTPException(404, "Cliente não encontrado")
    if not link and patient.nutritionist_id != user.id:
        raise HTTPException(403, "Sem acesso a este cliente")
    return patient


# ── Schemas ───────────────────────────────────────────────────────────
class WorkoutPlanIn(BaseModel):
    client_id: int
    title: str
    objective: Optional[str] = None
    observations: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    frequency_per_week: Optional[int] = None


class WorkoutSessionIn(BaseModel):
    plan_id: int
    name: str
    day_of_week: Optional[str] = None
    order_index: Optional[int] = 0
    notes: Optional[str] = None


class WorkoutExerciseIn(BaseModel):
    session_id: int
    exercise_id: Optional[int] = None
    exercise_name: Optional[str] = None
    sets: Optional[int] = None
    reps: Optional[str] = None
    rest_time: Optional[int] = None
    load: Optional[str] = None
    tempo: Optional[str] = None
    execution_notes: Optional[str] = None
    order_index: Optional[int] = 0


class ExerciseLibraryIn(BaseModel):
    name: str
    description: Optional[str] = None
    muscle_group: Optional[str] = None
    difficulty: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail: Optional[str] = None
    equipment: Optional[str] = None
    category: Optional[str] = "strength"


class CheckInIn(BaseModel):
    client_id: int
    date: Optional[datetime] = None
    mood: Optional[int] = None
    energy: Optional[int] = None
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = None
    stress: Optional[int] = None
    workout_done: Optional[bool] = None
    workout_adherence: Optional[int] = None
    workout_notes: Optional[str] = None
    diet_adherence: Optional[int] = None
    water_ml: Optional[int] = None
    pain_level: Optional[int] = None
    pain_location: Optional[str] = None
    notes: Optional[str] = None


class BodyEvolutionIn(BaseModel):
    client_id: int
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    visceral_fat: Optional[int] = None
    bone_mass: Optional[float] = None
    hydration: Optional[float] = None
    measurements: Optional[dict] = None
    notes: Optional[str] = None


# ── Biblioteca de exercícios ──────────────────────────────────────────
@router.get("/exercises/library")
def list_exercises(
    q: Optional[str] = None,
    muscle_group: Optional[str] = None,
    difficulty: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Lista exercícios da biblioteca (globais + criados pelo profissional)."""
    query = db.query(ExerciseLibrary).filter(
        ExerciseLibrary.is_active == True,
        (ExerciseLibrary.created_by == None) | (ExerciseLibrary.created_by == user.id)
    )
    if q:
        query = query.filter(ExerciseLibrary.name.ilike(f"%{q}%"))
    if muscle_group:
        query = query.filter(ExerciseLibrary.muscle_group == muscle_group)
    if difficulty:
        query = query.filter(ExerciseLibrary.difficulty == difficulty)
    if category:
        query = query.filter(ExerciseLibrary.category == category)
    return query.order_by(ExerciseLibrary.name).limit(100).all()


@router.post("/exercises/library", status_code=201)
def create_exercise(
    data: ExerciseLibraryIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ex = ExerciseLibrary(**data.model_dump(), created_by=user.id)
    db.add(ex); db.commit(); db.refresh(ex)
    return ex


# ── Planos de treino ──────────────────────────────────────────────────
@router.get("/clients/{client_id}/plans")
def list_plans(
    client_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(client_id, user, db)
    return db.query(WorkoutPlan).filter(
        WorkoutPlan.client_id == client_id,
        WorkoutPlan.professional_id == user.id,
    ).order_by(WorkoutPlan.created_at.desc()).all()


@router.post("/plans", status_code=201)
def create_plan(
    data: WorkoutPlanIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(data.client_id, user, db)
    plan = WorkoutPlan(**data.model_dump(), professional_id=user.id)
    db.add(plan); db.commit(); db.refresh(plan)
    return plan


@router.get("/plans/{plan_id}")
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.id == plan_id,
        WorkoutPlan.professional_id == user.id,
    ).first()
    if not plan:
        raise HTTPException(404, "Plano não encontrado")
    return plan


@router.put("/plans/{plan_id}")
def update_plan(
    plan_id: int,
    data: WorkoutPlanIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.id == plan_id, WorkoutPlan.professional_id == user.id
    ).first()
    if not plan:
        raise HTTPException(404, "Plano não encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(plan, k, v)
    db.commit(); db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}", status_code=204)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.id == plan_id, WorkoutPlan.professional_id == user.id
    ).first()
    if not plan:
        raise HTTPException(404)
    db.delete(plan); db.commit()


# ── Sessões de treino ─────────────────────────────────────────────────
@router.post("/sessions", status_code=201)
def create_session(
    data: WorkoutSessionIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.id == data.plan_id, WorkoutPlan.professional_id == user.id
    ).first()
    if not plan:
        raise HTTPException(404, "Plano não encontrado")
    session = WorkoutSession(**data.model_dump())
    db.add(session); db.commit(); db.refresh(session)
    return session


@router.put("/sessions/{session_id}")
def update_session(
    session_id: int,
    data: WorkoutSessionIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = db.query(WorkoutSession).join(WorkoutPlan).filter(
        WorkoutSession.id == session_id,
        WorkoutPlan.professional_id == user.id,
    ).first()
    if not s:
        raise HTTPException(404)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(s, k, v)
    db.commit(); db.refresh(s)
    return s


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = db.query(WorkoutSession).join(WorkoutPlan).filter(
        WorkoutSession.id == session_id,
        WorkoutPlan.professional_id == user.id,
    ).first()
    if not s:
        raise HTTPException(404)
    db.delete(s); db.commit()


# ── Exercícios do treino ──────────────────────────────────────────────
@router.post("/exercises", status_code=201)
def add_exercise(
    data: WorkoutExerciseIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = db.query(WorkoutSession).join(WorkoutPlan).filter(
        WorkoutSession.id == data.session_id,
        WorkoutPlan.professional_id == user.id,
    ).first()
    if not s:
        raise HTTPException(404, "Sessão não encontrada")
    ex = WorkoutExercise(**data.model_dump())
    db.add(ex); db.commit(); db.refresh(ex)
    return ex


@router.put("/exercises/{exercise_id}")
def update_exercise(
    exercise_id: int,
    data: WorkoutExerciseIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ex = db.query(WorkoutExercise).join(WorkoutSession).join(WorkoutPlan).filter(
        WorkoutExercise.id == exercise_id,
        WorkoutPlan.professional_id == user.id,
    ).first()
    if not ex:
        raise HTTPException(404)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(ex, k, v)
    db.commit(); db.refresh(ex)
    return ex


@router.delete("/exercises/{exercise_id}", status_code=204)
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ex = db.query(WorkoutExercise).join(WorkoutSession).join(WorkoutPlan).filter(
        WorkoutExercise.id == exercise_id,
        WorkoutPlan.professional_id == user.id,
    ).first()
    if not ex:
        raise HTTPException(404)
    db.delete(ex); db.commit()


# ── Check-ins ─────────────────────────────────────────────────────────
@router.post("/checkins", status_code=201)
def create_checkin(
    data: CheckInIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(data.client_id, user, db)
    payload = data.model_dump()
    payload["date"] = payload.get("date") or datetime.utcnow()
    ci = CheckIn(**payload)
    db.add(ci); db.commit(); db.refresh(ci)
    return ci


@router.get("/clients/{client_id}/checkins")
def list_checkins(
    client_id: int,
    limit: int = 30,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(client_id, user, db)
    return db.query(CheckIn).filter(
        CheckIn.client_id == client_id
    ).order_by(CheckIn.date.desc()).limit(limit).all()


# ── Evolução corporal ─────────────────────────────────────────────────
@router.post("/body-evolution", status_code=201)
def add_body_evolution(
    data: BodyEvolutionIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(data.client_id, user, db)
    evo = BodyEvolution(**data.model_dump(), created_by=user.id)
    db.add(evo); db.commit(); db.refresh(evo)
    return evo


@router.get("/clients/{client_id}/body-evolution")
def list_body_evolution(
    client_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(client_id, user, db)
    return db.query(BodyEvolution).filter(
        BodyEvolution.client_id == client_id
    ).order_by(BodyEvolution.recorded_at.desc()).all()


# ── Restrições físicas ────────────────────────────────────────────────
@router.get("/clients/{client_id}/restrictions")
def list_restrictions(
    client_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Restrições visíveis para todos os profissionais vinculados."""
    _get_client(client_id, user, db)
    return db.query(ClientRestriction).filter(
        ClientRestriction.client_id == client_id,
        ClientRestriction.is_active == True,
    ).all()


@router.post("/clients/{client_id}/restrictions", status_code=201)
def add_restriction(
    client_id: int,
    data: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_client(client_id, user, db)
    r = ClientRestriction(**data, client_id=client_id, created_by=user.id)
    db.add(r); db.commit(); db.refresh(r)
    return r


# ── Vínculos profissional-cliente ─────────────────────────────────────
@router.get("/my-clients")
def list_my_clients(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Lista todos os clientes vinculados ao profissional."""
    links = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == user.id,
        ProfessionalClient.is_active == True,
    ).all()
    client_ids = [l.client_id for l in links]

    # Também inclui pacientes diretos (nutritionist_id)
    direct = db.query(Patient).filter(Patient.nutritionist_id == user.id).all()
    direct_ids = {p.id for p in direct}

    all_ids = list(set(client_ids) | direct_ids)
    return db.query(Patient).filter(Patient.id.in_(all_ids)).order_by(Patient.name).all()


@router.post("/link-client", status_code=201)
def link_client(
    client_id: int,
    role: str = "personal_trainer",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Vincula um cliente ao profissional."""
    patient = db.query(Patient).filter(Patient.id == client_id).first()
    if not patient:
        raise HTTPException(404, "Cliente não encontrado")

    existing = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == user.id,
        ProfessionalClient.client_id == client_id,
    ).first()
    if existing:
        existing.is_active = True
        existing.role = role
        db.commit()
        return existing

    link = ProfessionalClient(
        professional_id=user.id,
        client_id=client_id,
        role=role,
    )
    db.add(link); db.commit(); db.refresh(link)
    return link
