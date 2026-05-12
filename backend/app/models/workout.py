"""
Módulo Personal Trainer: planos de treino, exercícios e biblioteca.
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ExerciseLibrary(Base):
    """Biblioteca global de exercícios (compartilhada entre todos os profissionais)."""
    __tablename__ = "exercise_library"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    muscle_group = Column(String(100), nullable=True)   # peito | costas | pernas | ombros | braços | core | full_body
    difficulty = Column(String(20), nullable=True)      # iniciante | intermediario | avancado
    video_url = Column(String(500), nullable=True)
    thumbnail = Column(String(500), nullable=True)
    equipment = Column(String(200), nullable=True)      # halteres | barra | máquina | peso_corporal | elástico
    category = Column(String(30), default="strength")   # strength | cardio | flexibility | rehabilitation
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = exercício global
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", foreign_keys=[created_by])


class WorkoutPlan(Base):
    """Plano de treino criado pelo personal trainer para um cliente."""
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    title = Column(String(200), nullable=False)
    objective = Column(String(200), nullable=True)   # hipertrofia | emagrecimento | condicionamento | reabilitacao
    observations = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    frequency_per_week = Column(Integer, nullable=True)  # dias por semana
    is_active = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    professional = relationship("User", foreign_keys=[professional_id])
    client = relationship("Patient", foreign_keys=[client_id], backref="workout_plans")
    sessions = relationship("WorkoutSession", back_populates="plan", cascade="all, delete-orphan")


class WorkoutSession(Base):
    """Sessão/dia de treino dentro de um plano (ex: Treino A, Treino B)."""
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=False)
    name = Column(String(100), nullable=False)   # Treino A | Treino B | Segunda-feira
    day_of_week = Column(String(20), nullable=True)  # segunda | terca | quarta...
    order_index = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    plan = relationship("WorkoutPlan", back_populates="sessions")
    exercises = relationship("WorkoutExercise", back_populates="session", cascade="all, delete-orphan",
                             order_by="WorkoutExercise.order_index")


class WorkoutExercise(Base):
    """Exercício dentro de uma sessão de treino."""
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercise_library.id"), nullable=True)

    # Pode ter nome manual se não estiver na biblioteca
    exercise_name = Column(String(200), nullable=True)

    muscle_group = Column(String(100), nullable=True)  # grupo muscular do exercício nesta sessão
    sets = Column(Integer, nullable=True)           # séries
    reps = Column(String(50), nullable=True)        # repetições (ex: "8-12" ou "15")
    rest_time = Column(Integer, nullable=True)      # descanso em segundos
    load = Column(String(50), nullable=True)        # carga (ex: "20kg" ou "60% 1RM")
    tempo = Column(String(20), nullable=True)       # cadência (ex: "2-0-2")
    execution_notes = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    session = relationship("WorkoutSession", back_populates="exercises")
    exercise = relationship("ExerciseLibrary", foreign_keys=[exercise_id])


class CheckIn(Base):
    """Check-in diário do cliente — compartilhado entre todos os profissionais."""
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    date = Column(DateTime, nullable=False)

    # Bem-estar geral
    mood = Column(Integer, nullable=True)           # 1-5
    energy = Column(Integer, nullable=True)         # 1-5
    sleep_hours = Column(Float, nullable=True)
    sleep_quality = Column(Integer, nullable=True)  # 1-5
    stress = Column(Integer, nullable=True)         # 1-5

    # Treino
    workout_done = Column(Boolean, nullable=True)
    workout_adherence = Column(Integer, nullable=True)  # 0-100%
    workout_notes = Column(Text, nullable=True)

    # Dieta
    diet_adherence = Column(Integer, nullable=True)  # 0-100%
    water_ml = Column(Integer, nullable=True)

    # Dor/desconforto
    pain_level = Column(Integer, nullable=True)     # 0-10
    pain_location = Column(String(200), nullable=True)

    # Observações
    notes = Column(Text, nullable=True)
    photos = Column(JSON, nullable=True)            # lista de URLs de fotos

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Patient", foreign_keys=[client_id], backref="checkins")


class SessionCheckin(Base):
    """Registro de execução de uma sessão de treino pelo paciente."""
    __tablename__ = "session_checkins"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=False)

    rpe = Column(Integer, nullable=False)                   # Rate of Perceived Exertion (0-10)
    performed_at = Column(DateTime, nullable=False)         # data/hora da execução

    duration_minutes = Column(Integer, nullable=True)       # duração total da sessão
    notes = Column(Text, nullable=True)                     # observações gerais

    # Lista de {exercise_id, exercise_name, sets_done, reps_done, load_used, notes}
    exercise_logs = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", foreign_keys=[patient_id], backref="session_checkins")
    session = relationship("WorkoutSession", foreign_keys=[session_id])
    plan = relationship("WorkoutPlan", foreign_keys=[plan_id])
