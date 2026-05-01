from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    nutritionist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    status = Column(String(20), default="agendado")  # agendado | confirmado | realizado | cancelado
    type = Column(String(30), default="consulta")    # consulta | retorno | avaliacao
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    nutritionist = relationship("User", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")


class Evolution(Base):
    __tablename__ = "evolutions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    weight = Column(Float, nullable=True)
    body_fat = Column(Float, nullable=True)
    muscle_mass = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="evolutions")
