from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MealFoodCreate(BaseModel):
    food_name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    notes: Optional[str] = None


class MealFoodOut(MealFoodCreate):
    id: int
    model_config = {"from_attributes": True}


class MealCreate(BaseModel):
    name: str
    time: Optional[str] = None
    order: Optional[int] = 0
    notes: Optional[str] = None
    foods: Optional[List[MealFoodCreate]] = []


class MealOut(BaseModel):
    id: int
    name: str
    time: Optional[str]
    order: int
    notes: Optional[str]
    foods: List[MealFoodOut] = []

    model_config = {"from_attributes": True}


class DietCreate(BaseModel):
    patient_id: int
    title: Optional[str] = "Plano Alimentar"
    description: Optional[str] = None
    total_calories: Optional[float] = None
    is_template: Optional[bool] = False
    meals: Optional[List[MealCreate]] = []


class DietOut(BaseModel):
    id: int
    patient_id: int
    title: str
    description: Optional[str]
    total_calories: Optional[float]
    is_template: bool
    is_active: bool
    created_at: datetime
    meals: List[MealOut] = []

    model_config = {"from_attributes": True}
