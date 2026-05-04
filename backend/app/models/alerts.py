"""Configuração de alertas do paciente (email + Telegram)."""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class PatientAlertConfig(Base):
    """Configuração de alertas por paciente."""
    __tablename__ = "patient_alert_configs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), unique=True, nullable=False)

    # Email
    email_alerts = Column(Boolean, default=False)
    alert_email = Column(String(150), nullable=True)   # pode ser diferente do login

    # Telegram
    telegram_alerts = Column(Boolean, default=False)
    telegram_chat_id = Column(String(50), nullable=True)

    # Alertas de refeição
    meal_alerts = Column(Boolean, default=True)

    # Alertas de água
    water_alerts = Column(Boolean, default=True)
    water_interval_hours = Column(Integer, default=2)   # a cada X horas
    water_start_hour = Column(Integer, default=7)       # começa às 7h
    water_end_hour = Column(Integer, default=22)        # termina às 22h

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", backref="alert_config")
