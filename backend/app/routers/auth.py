from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserLogin, Token
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

VALID_ROLES = {"nutritionist", "personal_trainer", "physiotherapist", "admin"}


def _safe_user_dict(user: User) -> dict:
    """Serializa User com segurança — campos novos podem não existir no banco antigo."""
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": getattr(user, "role", None) or "nutritionist",
        "crn": getattr(user, "crn", None),
        "cref": getattr(user, "cref", None),
        "crefito": getattr(user, "crefito", None),
        "phone": getattr(user, "phone", None),
        "specialty": getattr(user, "specialty", None),
        "bio": getattr(user, "bio", None),
        "plan": getattr(user, "plan", None) or "free",
        "created_at": user.created_at,
    }


@router.post("/register", status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    # Verifica email duplicado
    existing = db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": data.email}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    role = data.role if data.role in VALID_ROLES else "nutritionist"
    hashed = hash_password(data.password)

    # Descobre quais colunas existem na tabela users
    try:
        cols_result = db.execute(text("PRAGMA table_info(users)")).fetchall()
        existing_cols = {row[1] for row in cols_result}
    except Exception:
        # PostgreSQL
        try:
            cols_result = db.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='users'"
            )).fetchall()
            existing_cols = {row[0] for row in cols_result}
        except Exception:
            existing_cols = {"id", "name", "email", "hashed_password", "phone", "crn", "is_active", "plan", "created_at"}

    # Monta INSERT apenas com colunas que existem
    fields = {
        "name": data.name,
        "email": data.email,
        "hashed_password": hashed,
    }
    optional = {
        "role": role,
        "phone": data.phone,
        "crn": data.crn,
        "cref": data.cref,
        "crefito": data.crefito,
        "specialty": data.specialty,
        "bio": data.bio,
    }
    for k, v in optional.items():
        if k in existing_cols and v is not None:
            fields[k] = v

    cols = ", ".join(fields.keys())
    placeholders = ", ".join(f":{k}" for k in fields.keys())
    db.execute(text(f"INSERT INTO users ({cols}) VALUES ({placeholders})"), fields)
    db.commit()

    # Busca o usuário recém criado
    row = db.execute(
        text("SELECT * FROM users WHERE email = :email"),
        {"email": data.email}
    ).fetchone()

    if not row:
        raise HTTPException(status_code=500, detail="Erro ao criar usuário")

    # Mapeia resultado para dict
    keys = row._fields if hasattr(row, '_fields') else row.keys()
    user_dict = dict(zip(keys, row))

    return {
        "id": user_dict.get("id"),
        "name": user_dict.get("name"),
        "email": user_dict.get("email"),
        "role": user_dict.get("role") or "nutritionist",
        "crn": user_dict.get("crn"),
        "cref": user_dict.get("cref"),
        "crefito": user_dict.get("crefito"),
        "phone": user_dict.get("phone"),
        "specialty": user_dict.get("specialty"),
        "bio": user_dict.get("bio"),
        "plan": user_dict.get("plan") or "free",
        "created_at": user_dict.get("created_at"),
    }


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Conta desativada")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": _safe_user_dict(user)}


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return _safe_user_dict(user)


@router.put("/me")
def update_me(data: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    allowed = {"name", "phone", "specialty", "bio", "crn", "cref", "crefito"}
    for k, v in data.items():
        if k in allowed:
            try:
                db.execute(text(f"UPDATE users SET {k} = :{k} WHERE id = :id"), {k: v, "id": user.id})
            except Exception:
                pass
    db.commit()
    updated = db.query(User).filter(User.id == user.id).first()
    return _safe_user_dict(updated)
