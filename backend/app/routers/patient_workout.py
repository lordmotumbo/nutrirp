"""
Portal do Paciente — endpoints de treino.
Autenticação: header Authorization: Bearer <token> com patient_sub no JWT.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.database import get_db
from app.models.patient_user import PatientUser
from app.models.workout import (
    WorkoutPlan,
    WorkoutSession,
    WorkoutExercise,
    ExerciseLibrary,
    SessionCheckin,
)
from app.routers.patient_portal import get_current_patient

router = APIRouter(prefix="/api/patient", tags=["Portal Paciente — Treino"])


# ── 4.2 — Plano de treino ativo ───────────────────────────────────────

@router.get("/workout/active-plan")
def get_active_plan(
    current: PatientUser = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """Retorna o plano de treino ativo e publicado mais recente do paciente."""
    plan = (
        db.query(WorkoutPlan)
        .filter(
            WorkoutPlan.client_id == current.patient_id,
            WorkoutPlan.is_active == True,
            WorkoutPlan.is_published == True,
        )
        .order_by(WorkoutPlan.created_at.desc())
        .first()
    )
    if not plan:
        raise HTTPException(404, "Nenhum plano de treino ativo publicado")

    # Montar resposta aninhada
    sessions_out = []
    for session in sorted(plan.sessions, key=lambda s: s.order_index):
        exercises_out = []
        for ex in sorted(session.exercises, key=lambda e: e.order_index):
            # Dados da biblioteca (se vinculado)
            lib = ex.exercise
            exercises_out.append({
                "id": ex.id,
                "exercise_id": ex.exercise_id,
                "exercise_name": ex.exercise_name or (lib.name if lib else None),
                "muscle_group": ex.muscle_group or (lib.muscle_group if lib else None),
                "sets": ex.sets,
                "reps": ex.reps,
                "load": ex.load,
                "rest_time": ex.rest_time,
                "execution_notes": ex.execution_notes,
                "video_url": lib.video_url if lib else None,
                "thumbnail": lib.thumbnail if lib else None,
                "order_index": ex.order_index,
            })
        sessions_out.append({
            "id": session.id,
            "name": session.name,
            "day_of_week": session.day_of_week,
            "order_index": session.order_index,
            "notes": session.notes,
            "exercises": exercises_out,
        })

    return {
        "id": plan.id,
        "title": plan.title,
        "objective": plan.objective,
        "observations": plan.observations,
        "start_date": plan.start_date,
        "end_date": plan.end_date,
        "frequency_per_week": plan.frequency_per_week,
        "is_active": plan.is_active,
        "is_published": plan.is_published,
        "created_at": plan.created_at,
        "sessions": sessions_out,
    }


# ── 4.3 — Check-in de sessão ──────────────────────────────────────────

class ExerciseLogIn(BaseModel):
    exercise_id: Optional[int] = None
    exercise_name: Optional[str] = None
    sets_done: Optional[int] = None
    reps_done: Optional[str] = None
    load_used: Optional[str] = None
    notes: Optional[str] = None


class SessionCheckinIn(BaseModel):
    session_id: int
    rpe: int = Field(ge=0, le=10)
    performed_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    exercise_logs: Optional[List[ExerciseLogIn]] = None


@router.post("/workout/checkin", status_code=201)
def create_checkin(
    data: SessionCheckinIn,
    current: PatientUser = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """Registra a execução de uma sessão de treino pelo paciente."""
    performed_at = data.performed_at or datetime.utcnow()

    # Verificar unicidade: mesmo session_id + mesmo dia calendário (UTC)
    day_start = performed_at.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = performed_at.replace(hour=23, minute=59, second=59, microsecond=999999)

    existing = (
        db.query(SessionCheckin)
        .filter(
            SessionCheckin.patient_id == current.patient_id,
            SessionCheckin.session_id == data.session_id,
            SessionCheckin.performed_at >= day_start,
            SessionCheckin.performed_at <= day_end,
        )
        .first()
    )
    if existing:
        raise HTTPException(409, "Já existe um check-in para esta sessão hoje")

    # Buscar plan_id a partir da sessão
    session = db.query(WorkoutSession).filter(WorkoutSession.id == data.session_id).first()
    if not session:
        raise HTTPException(404, "Sessão não encontrada")

    # Serializar exercise_logs
    logs = None
    if data.exercise_logs is not None:
        logs = [log.model_dump() for log in data.exercise_logs]

    checkin = SessionCheckin(
        patient_id=current.patient_id,
        session_id=data.session_id,
        plan_id=session.plan_id,
        rpe=data.rpe,
        performed_at=performed_at,
        duration_minutes=data.duration_minutes,
        notes=data.notes,
        exercise_logs=logs,
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


# ── 4.6 — Listar check-ins do paciente ───────────────────────────────

@router.get("/workout/checkins")
def list_checkins(
    current: PatientUser = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """Retorna todos os check-ins de sessão do paciente autenticado."""
    return (
        db.query(SessionCheckin)
        .filter(SessionCheckin.patient_id == current.patient_id)
        .order_by(SessionCheckin.performed_at.desc())
        .all()
    )


# ── 4.7 — Histórico de exercício ──────────────────────────────────────

@router.get("/workout/exercise-history/{exercise_id}")
def get_exercise_history(
    exercise_id: int,
    current: PatientUser = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """Retorna o histórico de carga de um exercício específico para o paciente."""
    checkins = (
        db.query(SessionCheckin)
        .filter(
            SessionCheckin.patient_id == current.patient_id,
            SessionCheckin.exercise_logs.isnot(None),
        )
        .order_by(SessionCheckin.performed_at.asc())
        .all()
    )

    history = []
    for checkin in checkins:
        logs = checkin.exercise_logs or []
        for log in logs:
            if isinstance(log, dict) and log.get("exercise_id") == exercise_id:
                history.append({
                    "performed_at": checkin.performed_at,
                    "load_used": log.get("load_used"),
                    "reps_done": log.get("reps_done"),
                    "sets_done": log.get("sets_done"),
                    "rpe": checkin.rpe,
                })

    return history


# ── 4.8 — Detalhes de exercício da biblioteca ─────────────────────────

@router.get("/exercises/library")
def get_exercise_library(
    exercise_id: Optional[int] = Query(None),
    q: Optional[str] = Query(None),
    muscle_group: Optional[str] = Query(None),
    current: PatientUser = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """
    Retorna exercícios da biblioteca para o paciente.
    - Com exercise_id: retorna detalhes de um exercício específico
    - Com q/muscle_group: busca na biblioteca (para o paciente explorar)
    """
    if exercise_id:
        exercise = (
            db.query(ExerciseLibrary)
            .filter(ExerciseLibrary.id == exercise_id, ExerciseLibrary.is_active == True)
            .first()
        )
        if not exercise:
            raise HTTPException(404, "Exercício não encontrado")
        return {
            "id": exercise.id,
            "name": exercise.name,
            "description": exercise.description,
            "muscle_group": exercise.muscle_group,
            "difficulty": exercise.difficulty,
            "video_url": exercise.video_url,
            "thumbnail": exercise.thumbnail,
            "equipment": exercise.equipment,
            "category": exercise.category,
        }

    # Busca na biblioteca
    query = db.query(ExerciseLibrary).filter(
        ExerciseLibrary.is_active == True,
        ExerciseLibrary.created_by == None,  # só exercícios globais para o paciente
    )
    if q:
        query = query.filter(ExerciseLibrary.name.ilike(f"%{q}%"))
    if muscle_group:
        query = query.filter(ExerciseLibrary.muscle_group == muscle_group)

    exercises = query.order_by(ExerciseLibrary.name).limit(50).all()
    return [
        {
            "id": ex.id,
            "name": ex.name,
            "description": ex.description,
            "muscle_group": ex.muscle_group,
            "difficulty": ex.difficulty,
            "video_url": ex.video_url,
            "thumbnail": ex.thumbnail,
            "equipment": ex.equipment,
            "category": ex.category,
        }
        for ex in exercises
    ]
