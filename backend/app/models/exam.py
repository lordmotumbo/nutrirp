from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ExamRequest(Base):
    """Solicitação de exames laboratoriais."""
    __tablename__ = "exam_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    nutritionist_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(200), default="Solicitação de Exames")
    exams = Column(JSON)             # lista de exames solicitados
    justification = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", backref="exam_requests")
    results = relationship("ExamResult", back_populates="request", cascade="all, delete-orphan")


class ExamResult(Base):
    """Resultado de exame com análise."""
    __tablename__ = "exam_results"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("exam_requests.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    exam_name = Column(String(200), nullable=False)
    value = Column(String(100))
    unit = Column(String(50))
    reference_min = Column(Float)
    reference_max = Column(Float)
    status = Column(String(20))      # normal | alto | baixo | critico
    analysis = Column(Text)          # análise do nutricionista
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    request = relationship("ExamRequest", back_populates="results")
    patient = relationship("Patient", backref="exam_results")


class Supplement(Base):
    """Prescrição de suplementos e fitoterápicos."""
    __tablename__ = "supplements"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    nutritionist_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String(200), nullable=False)
    type = Column(String(30))        # suplemento | fitoterapico | vitamina | mineral
    dosage = Column(String(100))     # ex: 500mg
    frequency = Column(String(100))  # ex: 2x ao dia
    timing = Column(String(100))     # ex: antes do treino
    duration = Column(String(100))   # ex: 3 meses
    brand = Column(String(100))
    justification = Column(Text)
    contraindications = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", backref="supplements")
