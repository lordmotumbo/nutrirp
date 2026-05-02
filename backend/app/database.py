from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# No Render, o disco persistente é montado em /opt/render/project/src
# O DATABASE_URL deve apontar para esse caminho para persistir entre deploys
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nutrirp.db")

# Garantir que o diretório do SQLite existe
if DATABASE_URL.startswith("sqlite:///") and not DATABASE_URL.startswith("sqlite:///:"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(os.path.abspath(db_path))
    os.makedirs(db_dir, exist_ok=True)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
