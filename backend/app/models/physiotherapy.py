"""
Módulo Fisioterapia: prontuários, exercícios corretivos e restrições físicas.
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class PhysiotherapyRecord(Base):
    """Prontuário fisioterapêutico do paciente."""
    __tablename__ = "physiotherapy_records"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    # Avaliação
    pain_level = Column(Integer, nullable=True)         # 0-10
    pain_location = Column(String(200), nullable=True)
    pain_type = Column(String(100), nullable=True)      # aguda | crônica | irradiada | difusa
    mobility_notes = Column(Text, nullable=True)        # avaliação de mobilidade
    posture_notes = Column(Text, nullable=True)         # avaliação postural

    # Histórico
    injury_history = Column(Text, nullable=True)        # histórico de lesões
    surgeries = Column(Text, nullable=True)
    previous_treatments = Column(Text, nullable=True)

    # Plano de tratamento
    diagnosis = Column(Text, nullable=True)             # diagnóstico fisioterapêutico
    treatment_plan = Column(Text, nullable=True)        # plano de tratamento
    goals = Column(Text, nullable=True)                 # objetivos do tratamento
    frequency = Column(String(100), nullable=True)      # frequência das sessões

    # Sessão atual
    session_notes = Column(Text, nullable=True)         # notas da sessão
    techniques_used = Column(Text, nullable=True)       # técnicas utilizadas
    recommendations = Column(Text, nullable=True)       # recomendações para casa

    # Evolução
    evolution_notes = Column(Text, nullable=True)
    discharge_criteria = Column(Text, nullable=True)    # critérios de alta

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    professional = relationship("User", foreign_keys=[professional_id])
    client = relationship("Patient", foreign_keys=[client_id], backref="physio_records")
    exercises = relationship("PhysiotherapyExercise", back_populates="record", cascade="all, delete-orphan")


class PhysiotherapyExercise(Base):
    """Exercícios corretivos/reabilitação prescritos pelo fisioterapeuta."""
    __tablename__ = "physiotherapy_exercises"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("physiotherapy_records.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercise_library.id"), nullable=True)

    # Pode ter nome manual
    exercise_name = Column(String(200), nullable=True)

    repetitions = Column(String(50), nullable=True)     # ex: "10 repetições" ou "30 segundos"
    sets = Column(Integer, nullable=True)
    frequency = Column(String(100), nullable=True)      # ex: "2x ao dia"
    duration = Column(String(50), nullable=True)        # duração do exercício
    observations = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    record = relationship("PhysiotherapyRecord", back_populates="exercises")
    exercise = relationship("ExerciseLibrary", foreign_keys=[exercise_id])


class ClientRestriction(Base):
    """
    Restrições físicas do cliente — visíveis para TODOS os profissionais vinculados.
    Ex: joelho operado, hérnia de disco, hipertensão.
    """
    __tablename__ = "client_restrictions"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    restriction_type = Column(String(50), nullable=False)  # lesao | doenca | cirurgia | alergia | medicamento | outro
    severity = Column(String(20), nullable=True)           # leve | moderada | grave
    description = Column(Text, nullable=False)
    affected_area = Column(String(100), nullable=True)     # área afetada (ex: joelho direito)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)             # null = permanente
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Patient", foreign_keys=[client_id], backref="restrictions")
    creator = relationship("User", foreign_keys=[created_by])


class BodyEvolution(Base):
    """
    Evolução corporal compartilhada entre todos os profissionais.
    Substitui/complementa a tabela Evolution existente com mais campos.
    """
    __tablename__ = "body_evolutions"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    weight = Column(Float, nullable=True)           # kg
    body_fat = Column(Float, nullable=True)         # %
    muscle_mass = Column(Float, nullable=True)      # kg
    visceral_fat = Column(Integer, nullable=True)   # nível 1-20
    bone_mass = Column(Float, nullable=True)        # kg
    hydration = Column(Float, nullable=True)        # %

    # Medidas (cm)
    measurements = Column(JSON, nullable=True)      # {"waist": 80, "hip": 95, "arm": 35, ...}

    # Fotos de evolução
    photos = Column(JSON, nullable=True)            # lista de URLs

    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Patient", foreign_keys=[client_id], backref="body_evolutions")
    creator = relationship("User", foreign_keys=[created_by])
