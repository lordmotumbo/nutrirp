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
    crn = Column(String(20), nullable=True)          # Conselho Regional de Nutrição
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    plan = Column(String(20), default="free")        # free | pro | enterprise
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patients = relationship("Patient", back_populates="nutritionist")
    appointments = relationship("Appointment", back_populates="nutritionist")
