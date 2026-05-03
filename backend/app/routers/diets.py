from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.diet import Diet, Meal, MealFood
from app.models.patient import Patient
from app.models.user import User
from app.schemas.diet import DietCreate, DietOut
from app.services.auth import get_current_user
from app.services.pdf_generator import generate_diet_pdf

router = APIRouter(prefix="/api/diets", tags=["Dietas"])


def _check_patient(patient_id: int, user: User, db: Session) -> Patient:
    patient = db.query(Patient).filter(
        Patient.id == patient_id, Patient.nutritionist_id == user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return patient


@router.get("/patient/{patient_id}", response_model=List[DietOut])
def list_diets(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_patient(patient_id, current_user, db)
    return db.query(Diet).filter(Diet.patient_id == patient_id).order_by(Diet.created_at.desc()).all()


@router.get("/templates", response_model=List[DietOut])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Diet).filter(
        Diet.nutritionist_id == current_user.id, Diet.is_template == True
    ).all()


@router.post("", response_model=DietOut, status_code=201)
def create_diet(
    data: DietCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_patient(data.patient_id, current_user, db)

    diet = Diet(
        patient_id=data.patient_id,
        nutritionist_id=current_user.id,
        title=data.title,
        description=data.description,
        total_calories=data.total_calories,
        is_template=data.is_template,
    )
    db.add(diet)
    db.flush()

    for i, meal_data in enumerate(data.meals or []):
        meal = Meal(
            diet_id=diet.id,
            name=meal_data.name,
            time=meal_data.time,
            order=meal_data.order if meal_data.order is not None else i,
            notes=meal_data.notes,
        )
        db.add(meal)
        db.flush()
        for food_data in meal_data.foods or []:
            food = MealFood(meal_id=meal.id, **food_data.model_dump())
            db.add(food)

    db.commit()
    db.refresh(diet)
    return diet


@router.get("/{diet_id}", response_model=DietOut)
def get_diet(
    diet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    diet = db.query(Diet).filter(Diet.id == diet_id, Diet.nutritionist_id == current_user.id).first()
    if not diet:
        raise HTTPException(status_code=404, detail="Dieta não encontrada")
    return diet


@router.put("/{diet_id}", response_model=DietOut)
def update_diet(
    diet_id: int,
    data: DietCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Editar plano alimentar existente — substitui todas as refeições."""
    diet = db.query(Diet).filter(Diet.id == diet_id, Diet.nutritionist_id == current_user.id).first()
    if not diet:
        raise HTTPException(status_code=404, detail="Dieta não encontrada")

    diet.title = data.title
    diet.description = data.description
    diet.total_calories = data.total_calories
    diet.is_template = data.is_template

    # Remove refeições antigas e recria
    for meal in diet.meals:
        db.delete(meal)
    db.flush()

    for i, meal_data in enumerate(data.meals or []):
        meal = Meal(
            diet_id=diet.id,
            name=meal_data.name,
            time=meal_data.time,
            order=meal_data.order if meal_data.order is not None else i,
            notes=meal_data.notes,
        )
        db.add(meal)
        db.flush()
        for food_data in meal_data.foods or []:
            food = MealFood(meal_id=meal.id, **food_data.model_dump())
            db.add(food)

    db.commit()
    db.refresh(diet)
    return diet


@router.delete("/{diet_id}", status_code=204)
def delete_diet(
    diet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    diet = db.query(Diet).filter(Diet.id == diet_id, Diet.nutritionist_id == current_user.id).first()
    if not diet:
        raise HTTPException(status_code=404, detail="Dieta não encontrada")
    db.delete(diet)
    db.commit()


@router.get("/{diet_id}/pdf")
def export_diet_pdf(
    diet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    diet = db.query(Diet).filter(Diet.id == diet_id, Diet.nutritionist_id == current_user.id).first()
    if not diet:
        raise HTTPException(status_code=404, detail="Dieta não encontrada")

    patient = db.query(Patient).filter(Patient.id == diet.patient_id).first()
    pdf_bytes = generate_diet_pdf(diet, patient, current_user)

    filename = f"dieta_{patient.name.replace(' ', '_')}_{diet.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )



# Endpoint correto com validação de token de paciente
from fastapi import Query as FQuery
from jose import jwt as jose_jwt, JWTError as JoseJWTError
from app.models.patient_user import PatientUser
from app.services.auth import SECRET_KEY, ALGORITHM


@router.get("/{diet_id}/pdf-for-patient")
def export_diet_pdf_for_patient(
    diet_id: int,
    token: str = FQuery(...),
    db: Session = Depends(get_db),
):
    """PDF da dieta acessível pelo paciente usando seu próprio token."""
    try:
        payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        patient_sub = payload.get("patient_sub")
        if not patient_sub:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JoseJWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    pu = db.query(PatientUser).filter(
        PatientUser.id == int(patient_sub), PatientUser.is_active == True
    ).first()
    if not pu:
        raise HTTPException(status_code=401, detail="Paciente não encontrado")

    diet = db.query(Diet).filter(Diet.id == diet_id, Diet.patient_id == pu.patient_id).first()
    if not diet:
        raise HTTPException(status_code=404, detail="Dieta não encontrada")

    patient = db.query(Patient).filter(Patient.id == pu.patient_id).first()
    # Busca o nutricionista para o PDF
    nutritionist = db.query(User).filter(User.id == diet.nutritionist_id).first()
    pdf_bytes = generate_diet_pdf(diet, patient, nutritionist)

    filename = f"dieta_{patient.name.replace(' ', '_')}_{diet.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

