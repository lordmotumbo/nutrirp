from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ChatMessage(Base):
    """Mensagens do chat interno."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    nutritionist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender = Column(String(20), nullable=False)   # nutritionist | patient
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", backref="messages")


class TelegramConfig(Base):
    """Configuração do bot Telegram por nutricionista."""
    __tablename__ = "telegram_configs"

    id = Column(Integer, primary_key=True, index=True)
    nutritionist_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    bot_token = Column(String(200))
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PatientTelegram(Base):
    """Chat ID do Telegram de cada paciente."""
    __tablename__ = "patient_telegrams"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), unique=True, nullable=False)
    telegram_chat_id = Column(String(50))
    is_active = Column(Boolean, default=False)
    hydration_reminder = Column(Boolean, default=False)
    hydration_interval_hours = Column(Integer, default=2)
    patient = relationship("Patient", backref="telegram_config")
