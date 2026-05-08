"""
Vínculo entre profissional e cliente/paciente.
Permite que um cliente tenha múltiplos profissionais (nutricionista, personal, fisio).
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
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
    role = Column(String(30), nullable=False)  # nutritionist | personal_trainer | physiotherapist | all

    # Quem compartilhou e quais dados foram compartilhados
    shared_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    shared_data = Column(Text, nullable=True)  # CSV: "dados_pessoais,dieta,exames,..."

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    professional = relationship("User", foreign_keys=[professional_id])
    shared_by = relationship("User", foreign_keys=[shared_by_id])
    client = relationship("Patient", foreign_keys=[client_id], backref="professional_links")
