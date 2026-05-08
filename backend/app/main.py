from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, patients, anamnese, diets, appointments, foods
from app.routers import anthropometry, exams, financial, messaging
from app.routers import patient_portal, reports, alerts
from app.routers import personal, physiotherapy

# Modelos existentes
from app.models import user, patient, anamnese as anamnese_model, diet, appointment
from app.models import anthropometry as anthro_model
from app.models import exam, financial as fin_model, messaging as msg_model
from app.models import patient_user, preconsult
from app.models import alerts as alerts_model

# Novos modelos
from app.models import professional_client, workout, physiotherapy as physio_model

# ── Migração automática na inicialização ──────────────────────────────
def run_migrations():
    """Garante que todas as colunas e tabelas existam no banco."""
    from sqlalchemy import text, inspect
    import logging
    logger = logging.getLogger("migrations")

    with engine.connect() as conn:
        # Colunas a adicionar em tabelas existentes
        column_migrations = [
            ("appointments", "cancel_reason", "TEXT"),
            ("appointments", "reschedule_requested_at", "DATETIME"),
            ("patient_diaries", "sleep_quality", "VARCHAR(20)"),
            ("patient_diaries", "activity_duration_min", "INTEGER"),
            ("patient_diaries", "activity_intensity", "VARCHAR(20)"),
            ("patient_diaries", "hunger_level", "INTEGER"),
            ("patient_diaries", "energy_level", "INTEGER"),
            ("patient_diaries", "stress_level", "INTEGER"),
            ("patient_diaries", "bowel_function", "VARCHAR(30)"),
            ("patient_diaries", "symptoms", "TEXT"),
            ("patient_diaries", "medications_taken", "TEXT"),
            ("users", "role", "VARCHAR(30) DEFAULT 'nutritionist'"),
            ("users", "cref", "VARCHAR(20)"),
            ("users", "crefito", "VARCHAR(20)"),
            ("users", "specialty", "VARCHAR(100)"),
            ("users", "bio", "VARCHAR(500)"),
        ]

        for table, column, col_type in column_migrations:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                conn.commit()
                logger.info(f"Added column {table}.{column}")
            except Exception as e:
                err = str(e).lower()
                if "duplicate" in err or "already exists" in err:
                    pass  # já existe, ok
                else:
                    logger.warning(f"Could not add {table}.{column}: {e}")

        # Novas tabelas (CREATE TABLE IF NOT EXISTS)
        new_tables = [
            """CREATE TABLE IF NOT EXISTS patient_alert_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER UNIQUE NOT NULL REFERENCES patients(id),
                email_alerts BOOLEAN DEFAULT 0,
                alert_email VARCHAR(150),
                telegram_alerts BOOLEAN DEFAULT 0,
                telegram_chat_id VARCHAR(50),
                meal_alerts BOOLEAN DEFAULT 1,
                water_alerts BOOLEAN DEFAULT 1,
                water_interval_hours INTEGER DEFAULT 2,
                water_start_hour INTEGER DEFAULT 7,
                water_end_hour INTEGER DEFAULT 22,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME
            )""",
            """CREATE TABLE IF NOT EXISTS professional_clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                professional_id INTEGER NOT NULL REFERENCES users(id),
                client_id INTEGER NOT NULL REFERENCES patients(id),
                role VARCHAR(30) NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS exercise_library (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                muscle_group VARCHAR(100),
                difficulty VARCHAR(20),
                video_url VARCHAR(500),
                thumbnail VARCHAR(500),
                equipment VARCHAR(200),
                category VARCHAR(30) DEFAULT 'strength',
                created_by INTEGER REFERENCES users(id),
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS workout_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                professional_id INTEGER NOT NULL REFERENCES users(id),
                client_id INTEGER NOT NULL REFERENCES patients(id),
                title VARCHAR(200) NOT NULL,
                objective VARCHAR(200),
                observations TEXT,
                start_date DATE,
                end_date DATE,
                frequency_per_week INTEGER,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME
            )""",
            """CREATE TABLE IF NOT EXISTS workout_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_id INTEGER NOT NULL REFERENCES workout_plans(id),
                name VARCHAR(100) NOT NULL,
                day_of_week VARCHAR(20),
                order_index INTEGER DEFAULT 0,
                notes TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS workout_exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL REFERENCES workout_sessions(id),
                exercise_id INTEGER REFERENCES exercise_library(id),
                exercise_name VARCHAR(200),
                sets INTEGER,
                reps VARCHAR(50),
                rest_time INTEGER,
                load VARCHAR(50),
                tempo VARCHAR(20),
                execution_notes TEXT,
                order_index INTEGER DEFAULT 0
            )""",
            """CREATE TABLE IF NOT EXISTS checkins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL REFERENCES patients(id),
                date DATETIME NOT NULL,
                mood INTEGER, energy INTEGER, sleep_hours REAL,
                sleep_quality INTEGER, stress INTEGER,
                workout_done BOOLEAN, workout_adherence INTEGER,
                workout_notes TEXT, diet_adherence INTEGER,
                water_ml INTEGER, pain_level INTEGER,
                pain_location VARCHAR(200), notes TEXT, photos TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS physiotherapy_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                professional_id INTEGER NOT NULL REFERENCES users(id),
                client_id INTEGER NOT NULL REFERENCES patients(id),
                pain_level INTEGER, pain_location VARCHAR(200),
                pain_type VARCHAR(100), mobility_notes TEXT,
                posture_notes TEXT, injury_history TEXT,
                surgeries TEXT, previous_treatments TEXT,
                diagnosis TEXT, treatment_plan TEXT, goals TEXT,
                frequency VARCHAR(100), session_notes TEXT,
                techniques_used TEXT, recommendations TEXT,
                evolution_notes TEXT, discharge_criteria TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME
            )""",
            """CREATE TABLE IF NOT EXISTS physiotherapy_exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                record_id INTEGER NOT NULL REFERENCES physiotherapy_records(id),
                exercise_id INTEGER REFERENCES exercise_library(id),
                exercise_name VARCHAR(200), repetitions VARCHAR(50),
                sets INTEGER, frequency VARCHAR(100), duration VARCHAR(50),
                observations TEXT, order_index INTEGER DEFAULT 0
            )""",
            """CREATE TABLE IF NOT EXISTS client_restrictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL REFERENCES patients(id),
                created_by INTEGER NOT NULL REFERENCES users(id),
                restriction_type VARCHAR(50) NOT NULL,
                severity VARCHAR(20), description TEXT NOT NULL,
                affected_area VARCHAR(100), start_date DATETIME,
                end_date DATETIME, is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS body_evolutions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL REFERENCES patients(id),
                created_by INTEGER NOT NULL REFERENCES users(id),
                weight REAL, body_fat REAL, muscle_mass REAL,
                visceral_fat INTEGER, bone_mass REAL, hydration REAL,
                measurements TEXT, photos TEXT, notes TEXT,
                recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )""",
        ]

        for stmt in new_tables:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception as e:
                if "already exists" not in str(e).lower():
                    logger.warning(f"Table creation warning: {e}")


# Cria tabelas base via ORM
Base.metadata.create_all(bind=engine)

# Roda migrações de colunas/tabelas novas
run_migrations()

# ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="NutriRP Platform API",
    description="Plataforma SaaS integrada: Nutrição · Personal Trainer · Fisioterapia",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers existentes (Nutrição) ─────────────────────────────────────
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(anamnese.router)
app.include_router(diets.router)
app.include_router(appointments.router)
app.include_router(foods.router)
app.include_router(anthropometry.router)
app.include_router(exams.router)
app.include_router(financial.router)
app.include_router(messaging.router)
app.include_router(patient_portal.router)
app.include_router(reports.router)
app.include_router(alerts.router)

# ── Novos routers (Personal + Fisio) ─────────────────────────────────
app.include_router(personal.router)
app.include_router(physiotherapy.router)


@app.get("/")
def root():
    return {
        "message": "NutriRP Platform API v3.0",
        "docs": "/docs",
        "modules": ["nutrition", "personal_trainer", "physiotherapy"],
    }


@app.get("/health")
def health():
    return {"status": "ok"}
