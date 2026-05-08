from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserLogin, Token
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

VALID_ROLES = {"nutritionist", "personal_trainer", "physiotherapist", "admin"}

# Detecta tipo de banco uma vez
_DB_URL = str(engine.url)
IS_PG = "postgresql" in _DB_URL or "postgres" in _DB_URL


def _get_users_columns(db: Session) -> set:
    """Retorna o conjunto de colunas existentes na tabela users."""
    try:
        if IS_PG:
            rows = db.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='users'"
            )).fetchall()
            return {r[0] for r in rows}
        else:
            rows = db.execute(text("PRAGMA table_info(users)")).fetchall()
            return {r[1] for r in rows}
    except Exception:
        # Fallback: assume colunas base
        return {"id", "name", "email", "hashed_password", "phone", "crn", "is_active", "plan", "created_at"}


def _safe_user_dict(user) -> dict:
    """Serializa User com segurança — campos novos podem não existir."""
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

    # Descobre colunas existentes
    existing_cols = _get_users_columns(db)

    # Campos base — sempre existem
    fields = {
        "name": data.name,
        "email": data.email,
        "hashed_password": hashed,
        "is_active": True,
        "plan": "free",
    }

    # Campos opcionais — só insere se a coluna existir
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

    if IS_PG:
        result = db.execute(
            text(f"INSERT INTO users ({cols}) VALUES ({placeholders}) RETURNING id, name, email, created_at"),
            fields
        )
        row = result.fetchone()
        db.commit()
        return {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "role": role,
            "crn": fields.get("crn"),
            "cref": fields.get("cref"),
            "crefito": fields.get("crefito"),
            "phone": fields.get("phone"),
            "specialty": fields.get("specialty"),
            "bio": fields.get("bio"),
            "plan": "free",
            "created_at": row[3],
        }
    else:
        db.execute(text(f"INSERT INTO users ({cols}) VALUES ({placeholders})"), fields)
        db.commit()
        row = db.execute(
            text("SELECT id, name, email, created_at FROM users WHERE email = :email"),
            {"email": data.email}
        ).fetchone()
        return {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "role": role,
            "crn": fields.get("crn"),
            "cref": fields.get("cref"),
            "crefito": fields.get("crefito"),
            "phone": fields.get("phone"),
            "specialty": fields.get("specialty"),
            "bio": fields.get("bio"),
            "plan": "free",
            "created_at": row[3],
        }


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    # Busca via SQL puro para evitar problema com colunas novas
    row = db.execute(
        text("SELECT id, name, email, hashed_password, is_active, plan, created_at FROM users WHERE email = :email"),
        {"email": data.email}
    ).fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    user_id, name, email, hashed_pw, is_active, plan, created_at = row

    if not verify_password(data.password, hashed_pw):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    if is_active is False:
        raise HTTPException(status_code=401, detail="Conta desativada")

    # Busca campos extras com segurança
    extra = {}
    for col in ["role", "crn", "cref", "crefito", "phone", "specialty", "bio"]:
        try:
            r = db.execute(text(f"SELECT {col} FROM users WHERE id = :id"), {"id": user_id}).fetchone()
            extra[col] = r[0] if r else None
        except Exception:
            extra[col] = None

    token = create_access_token({"sub": str(user_id)})
    user_dict = {
        "id": user_id,
        "name": name,
        "email": email,
        "role": extra.get("role") or "nutritionist",
        "crn": extra.get("crn"),
        "cref": extra.get("cref"),
        "crefito": extra.get("crefito"),
        "phone": extra.get("phone"),
        "specialty": extra.get("specialty"),
        "bio": extra.get("bio"),
        "plan": plan or "free",
        "created_at": created_at,
    }
    return {"access_token": token, "token_type": "bearer", "user": user_dict}


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return _safe_user_dict(user)


@router.put("/me")
def update_me(data: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    allowed = {"name", "phone", "specialty", "bio", "crn", "cref", "crefito"}
    existing_cols = _get_users_columns(db)
    for k, v in data.items():
        if k in allowed and k in existing_cols:
            try:
                db.execute(text(f"UPDATE users SET {k} = :{k} WHERE id = :id"), {k: v, "id": user.id})
            except Exception:
                pass
    db.commit()
    updated = db.query(User).filter(User.id == user.id).first()
    return _safe_user_dict(updated)
