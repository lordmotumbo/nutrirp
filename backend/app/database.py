from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nutrirp.db")

# Render fornece URLs postgres:// mas SQLAlchemy precisa de postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite: check_same_thread=False | PostgreSQL: sem args extras
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    # Garantir que o diretório existe
    db_path = DATABASE_URL.replace("sqlite:///", "").replace("sqlite://", "")
    if db_path and db_path != ":memory:":
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
else:
    connect_args = {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
