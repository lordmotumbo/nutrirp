from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    nutritionist_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Dados pessoais
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)       # M | F | outro

    # Dados clínicos
    weight = Column(Float, nullable=True)            # kg
    height = Column(Float, nullable=True)            # cm
    goal = Column(String(50), nullable=True)         # emagrecimento | ganho_massa | manutencao | saude
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    nutritionist = relationship("User", back_populates="patients")
    anamneses = relationship("Anamnese", back_populates="patient", cascade="all, delete-orphan")
    diets = relationship("Diet", back_populates="patient", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    evolutions = relationship("Evolution", back_populates="patient", cascade="all, delete-orphan")
