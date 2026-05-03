from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FinancialRecord(Base):
    """Controle financeiro do consultório."""
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    nutritionist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)

    type = Column(String(10), nullable=False)   # receita | despesa
    category = Column(String(50))               # consulta | retorno | material | aluguel...
    description = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(30))         # dinheiro | pix | cartao | transferencia
    is_paid = Column(Boolean, default=False)
    due_date = Column(DateTime)
    paid_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", backref="financial_records")


class PatientGoal(Base):
    """Metas do paciente."""
    __tablename__ = "patient_goals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    nutritionist_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(200), nullable=False)
    description = Column(Text)
    target_value = Column(Float)
    current_value = Column(Float)
    unit = Column(String(30))        # kg, %, kcal...
    deadline = Column(DateTime)
    status = Column(String(20), default="ativo")  # ativo | concluido | cancelado
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", backref="goals")


class PatientDiary(Base):
    """Diário do paciente."""
    __tablename__ = "patient_diaries"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    date = Column(DateTime, nullable=False)
    mood = Column(String(20))        # otimo | bom | regular | ruim
    sleep_hours = Column(Float)
    sleep_quality = Column(String(20))   # otima | boa | regular | ruim
    water_ml = Column(Integer)       # ml consumidos
    physical_activity = Column(String(200))
    activity_duration_min = Column(Integer)   # duração em minutos
    activity_intensity = Column(String(20))   # leve | moderada | intensa
    diet_adherence = Column(Integer) # 0-100%
    hunger_level = Column(Integer)   # 1-5 (nível de fome ao longo do dia)
    energy_level = Column(Integer)   # 1-5 (disposição/energia)
    stress_level = Column(Integer)   # 1-5 (nível de estresse)
    bowel_function = Column(String(30))  # normal | constipado | diarreia | irregular
    symptoms = Column(Text)          # sintomas: inchaço, gases, refluxo, etc.
    medications_taken = Column(Text) # medicamentos/suplementos tomados
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", backref="diaries")
