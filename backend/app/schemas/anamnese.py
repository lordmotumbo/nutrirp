from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class AnamneseCreate(BaseModel):
    patient_id: int
    meals_per_day: Optional[int] = None
    water_intake: Optional[str] = None
    physical_activity: Optional[str] = None
    activity_frequency: Optional[str] = None
    pathologies: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    food_intolerances: Optional[str] = None
    food_preferences: Optional[str] = None
    food_aversions: Optional[str] = None
    sleep_hours: Optional[float] = None
    stress_level: Optional[str] = None
    alcohol: Optional[str] = None
    smoking: Optional[str] = None
    extra_answers: Optional[Any] = None
    notes: Optional[str] = None


class AnamneseOut(AnamneseCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
