from sqlalchemy import Column, Integer, Float, Text, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Anthropometry(Base):
    """Protocolo de antropometria completo."""
    __tablename__ = "anthropometries"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    # Medidas básicas
    weight = Column(Float)           # kg
    height = Column(Float)           # cm
    age = Column(Integer)

    # Dobras cutâneas (mm)
    triceps = Column(Float)
    biceps = Column(Float)
    subscapular = Column(Float)
    suprailiac = Column(Float)
    abdominal = Column(Float)
    thigh = Column(Float)
    calf = Column(Float)
    chest = Column(Float)
    midaxillary = Column(Float)

    # Circunferências (cm)
    waist = Column(Float)
    hip = Column(Float)
    neck = Column(Float)
    arm = Column(Float)
    forearm = Column(Float)
    thigh_circ = Column(Float)
    calf_circ = Column(Float)

    # Resultados calculados
    bmi = Column(Float)              # IMC
    body_fat_pct = Column(Float)     # % gordura
    fat_mass = Column(Float)         # kg gordura
    lean_mass = Column(Float)        # kg massa magra
    waist_hip_ratio = Column(Float)  # RCQ
    protocol = Column(String(50))    # Pollock7, Durnin, Jackson-Pollock3...

    # Gasto energético
    bmr = Column(Float)              # TMB (Harris-Benedict / Mifflin)
    tdee = Column(Float)             # GET (TMB × fator atividade)
    activity_factor = Column(Float)  # 1.2 sedentário ... 1.9 muito ativo
    bmr_formula = Column(String(30)) # harris_benedict | mifflin

    notes = Column(Text)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", backref="anthropometries")
