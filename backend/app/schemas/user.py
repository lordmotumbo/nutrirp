from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    crn: Optional[str] = None
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    crn: Optional[str]
    phone: Optional[str]
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
