from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "nutritionist"  # nutritionist | personal_trainer | physiotherapist
    crn: Optional[str] = None
    cref: Optional[str] = None
    crefito: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    crn: Optional[str]
    cref: Optional[str]
    crefito: Optional[str]
    phone: Optional[str]
    specialty: Optional[str]
    bio: Optional[str]
    plan: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut
