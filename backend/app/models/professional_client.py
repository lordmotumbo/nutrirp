"""
Vínculo entre profissional e cliente/paciente.
Permite que um cliente tenha múltiplos profissionais (nutricionista, personal, fisio).
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ProfessionalClient(Base):
    """Relacionamento N:N entre profissionais e clientes."""
    __tablename__ = "professional_clients"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)

    # Papel do profissional neste vínculo
    role = Column(String(30), nullable=False)  # nutritionist | personal_trainer | physiotherapist

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    professional = relationship("User", foreign_keys=[professional_id])
    client = relationship("Patient", foreign_keys=[client_id], backref="professional_links")
