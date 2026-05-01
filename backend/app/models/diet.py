from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Diet(Base):
    __tablename__ = "diets"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    nutritionist_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(200), nullable=False, default="Plano Alimentar")
    description = Column(Text, nullable=True)
    total_calories = Column(Float, nullable=True)
    is_template = Column(Boolean, default=False)     # salvar como modelo reutilizável
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="diets")
    meals = relationship("Meal", back_populates="diet", cascade="all, delete-orphan", order_by="Meal.order")


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    diet_id = Column(Integer, ForeignKey("diets.id"), nullable=False)

    name = Column(String(100), nullable=False)       # Café da manhã, Almoço, etc.
    time = Column(String(10), nullable=True)         # 07:00
    order = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    diet = relationship("Diet", back_populates="meals")
    foods = relationship("MealFood", back_populates="meal", cascade="all, delete-orphan")


class MealFood(Base):
    __tablename__ = "meal_foods"

    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)

    food_name = Column(String(200), nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String(30), nullable=True)         # g, ml, colher, xícara, unidade
    calories = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)           # g
    carbs = Column(Float, nullable=True)             # g
    fat = Column(Float, nullable=True)               # g
    notes = Column(String(200), nullable=True)

    meal = relationship("Meal", back_populates="foods")
