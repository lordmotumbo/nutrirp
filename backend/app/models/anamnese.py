from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Anamnese(Base):
    __tablename__ = "anamneses"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    # Hábitos alimentares
    meals_per_day = Column(Integer, nullable=True)
    water_intake = Column(String(50), nullable=True)       # litros/dia
    physical_activity = Column(String(100), nullable=True)
    activity_frequency = Column(String(50), nullable=True)

    # Histórico de saúde
    pathologies = Column(Text, nullable=True)              # doenças / condições
    medications = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    food_intolerances = Column(Text, nullable=True)
    food_preferences = Column(Text, nullable=True)
    food_aversions = Column(Text, nullable=True)

    # Hábitos de vida
    sleep_hours = Column(Float, nullable=True)
    stress_level = Column(String(20), nullable=True)       # baixo | médio | alto
    alcohol = Column(String(20), nullable=True)
    smoking = Column(String(20), nullable=True)

    # Respostas extras (campo livre JSON para perguntas customizadas)
    extra_answers = Column(JSON, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="anamneses")
