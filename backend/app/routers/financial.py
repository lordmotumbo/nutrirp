from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models.financial import FinancialRecord, PatientGoal, PatientDiary
from app.models.patient import Patient
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/financial", tags=["Financeiro"])


class FinancialIn(BaseModel):
    type: str  # receita | despesa
    category: Optional[str] = "consulta"
    description: str
    amount: float
    payment_method: Optional[str] = "pix"
    is_paid: Optional[bool] = False
    due_date: Optional[datetime] = None
    patient_id: Optional[int] = None
    appointment_id: Optional[int] = None
    notes: Optional[str] = None


class GoalIn(BaseModel):
    patient_id: int
    title: str
    description: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    deadline: Optional[datetime] = None


class DiaryIn(BaseModel):
    patient_id: int
    date: datetime
    mood: Optional[str] = None
    sleep_hours: Optional[float] = None
    water_ml: Optional[int] = None
    physical_activity: Optional[str] = None
    diet_adherence: Optional[int] = None
    notes: Optional[str] = None


@router.post("/record", status_code=201)
def create_record(data: FinancialIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    r = FinancialRecord(**data.model_dump(), nutritionist_id=user.id)
    db.add(r); db.commit(); db.refresh(r)
    return r


@router.get("/records")
def list_records(
    month: Optional[int] = None, year: Optional[int] = None,
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    q = db.query(FinancialRecord).filter(FinancialRecord.nutritionist_id == user.id)
    if month:
        q = q.filter(extract('month', FinancialRecord.created_at) == month)
    if year:
        q = q.filter(extract('year', FinancialRecord.created_at) == year)
    records = q.order_by(FinancialRecord.created_at.desc()).all()

    total_in = sum(r.amount for r in records if r.type == "receita")
    total_out = sum(r.amount for r in records if r.type == "despesa")
    return {"records": records, "total_receita": total_in, "total_despesa": total_out, "saldo": total_in - total_out}


@router.put("/record/{rid}/pay", status_code=200)
def mark_paid(rid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    r = db.query(FinancialRecord).filter(FinancialRecord.id == rid, FinancialRecord.nutritionist_id == user.id).first()
    if not r:
        raise HTTPException(404)
    r.is_paid = True
    r.paid_at = datetime.utcnow()
    db.commit()
    return r


@router.delete("/record/{rid}", status_code=204)
def delete_record(rid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    r = db.query(FinancialRecord).filter(FinancialRecord.id == rid, FinancialRecord.nutritionist_id == user.id).first()
    if not r:
        raise HTTPException(404)
    db.delete(r); db.commit()


# ── Metas ────────────────────────────────────────────────────────────
@router.post("/goal", status_code=201)
def create_goal(data: GoalIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    g = PatientGoal(**data.model_dump(), nutritionist_id=user.id)
    db.add(g); db.commit(); db.refresh(g)
    return g


@router.get("/goals/{patient_id}")
def list_goals(patient_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(PatientGoal).filter(PatientGoal.patient_id == patient_id).all()


@router.put("/goal/{gid}")
def update_goal(gid: int, current_value: float, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    g = db.query(PatientGoal).filter(PatientGoal.id == gid, PatientGoal.nutritionist_id == user.id).first()
    if not g:
        raise HTTPException(404)
    g.current_value = current_value
    if g.target_value and current_value >= g.target_value:
        g.status = "concluido"
    db.commit()
    return g


# ── Diário ───────────────────────────────────────────────────────────
@router.post("/diary", status_code=201)
def add_diary(data: DiaryIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    d = PatientDiary(**data.model_dump())
    db.add(d); db.commit(); db.refresh(d)
    return d


@router.get("/diary/{patient_id}")
def list_diary(patient_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(PatientDiary).filter(PatientDiary.patient_id == patient_id).order_by(PatientDiary.date.desc()).limit(30).all()
