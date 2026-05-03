from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class PreConsultForm(Base):
    """Questionário pré-consulta enviado pelo paciente."""
    __tablename__ = "preconsult_forms"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)

    # Sintomas e queixas
    main_complaint = Column(Text)
    current_symptoms = Column(Text)
    recent_changes = Column(Text)

    # Hábitos recentes
    sleep_quality = Column(String(20))   # boa | regular | ruim
    stress_level = Column(String(20))
    physical_activity_last_week = Column(String(200))
    water_intake_today = Column(String(50))

    # Alimentação recente
    breakfast = Column(Text)
    morning_snack = Column(Text)
    lunch = Column(Text)
    afternoon_snack = Column(Text)
    dinner = Column(Text)
    night_snack = Column(Text)

    # Extras
    medications_changes = Column(Text)
    additional_notes = Column(Text)
    answers = Column(JSON)   # respostas extras customizáveis

    is_reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", backref="preconsult_forms")


class FoodRecord(Base):
    """Recordatório alimentar de 24h."""
    __tablename__ = "food_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    record_date = Column(DateTime, nullable=False)
    meals = Column(JSON)          # lista de refeições com alimentos
    total_calories = Column(Float, nullable=True)
    total_protein = Column(Float, nullable=True)
    total_carbs = Column(Float, nullable=True)
    total_fat = Column(Float, nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", backref="food_records")
