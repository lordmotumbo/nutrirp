from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserLogin, Token
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

VALID_ROLES = {"nutritionist", "personal_trainer", "physiotherapist", "admin"}


def _has_column(db: Session, table: str, column: str) -> bool:
    """Verifica se uma coluna existe na tabela (SQLite e PostgreSQL)."""
    try:
        db.execute(text(f"SELECT {column} FROM {table} LIMIT 1"))
        return True
    except Exception:
        return False


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    role = data.role if data.role in VALID_ROLES else "nutritionist"

    # Campos base — sempre existem
    user_data = {
        "name": data.name,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "phone": data.phone,
    }

    # Campos novos — só adiciona se a coluna existir no banco
    if _has_column(db, "users", "role"):
        user_data["role"] = role
    if _has_column(db, "users", "crn"):
        user_data["crn"] = data.crn
    if _has_column(db, "users", "cref"):
        user_data["cref"] = data.cref
    if _has_column(db, "users", "crefito"):
        user_data["crefito"] = data.crefito
    if _has_column(db, "users", "specialty"):
        user_data["specialty"] = data.specialty
    if _has_column(db, "users", "bio"):
        user_data["bio"] = data.bio

    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    token = create_access_token({"sub": str(user.id)})
    # Serializa com segurança — campos novos podem não existir no banco antigo
    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": getattr(user, "role", "nutritionist") or "nutritionist",
        "crn": getattr(user, "crn", None),
        "cref": getattr(user, "cref", None),
        "crefito": getattr(user, "crefito", None),
        "phone": getattr(user, "phone", None),
        "specialty": getattr(user, "specialty", None),
        "bio": getattr(user, "bio", None),
        "plan": getattr(user, "plan", "free") or "free",
        "created_at": user.created_at,
    }
    return {"access_token": token, "token_type": "bearer", "user": user_dict}


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
def update_me(data: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    allowed = {"name", "phone", "specialty", "bio", "crn", "cref", "crefito"}
    for k, v in data.items():
        if k in allowed and _has_column(db, "users", k):
            setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user
