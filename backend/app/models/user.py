from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Tipo de profissional
    role = Column(String(30), default="nutritionist")  # nutritionist | personal_trainer | physiotherapist | admin

    # Registros profissionais
    crn = Column(String(20), nullable=True)   # Nutricionista
    cref = Column(String(20), nullable=True)  # Personal Trainer
    crefito = Column(String(20), nullable=True)  # Fisioterapeuta

    phone = Column(String(20), nullable=True)
    specialty = Column(String(100), nullable=True)  # especialidade
    bio = Column(String(500), nullable=True)

    is_active = Column(Boolean, default=True)
    plan = Column(String(20), default="free")  # free | pro | enterprise
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patients = relationship("Patient", back_populates="nutritionist", foreign_keys="Patient.nutritionist_id")
    appointments = relationship("Appointment", back_populates="nutritionist")
