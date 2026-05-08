"""
Script de migração para adicionar novas colunas ao banco de dados existente.
Execute: python migrate.py
"""
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nutrirp.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")

MIGRATIONS = [
    # Appointment: novas colunas
    ("appointments", "cancel_reason", "TEXT"),
    ("appointments", "reschedule_requested_at", "DATETIME"),
    # PatientDiary: novas colunas
    ("patient_diaries", "sleep_quality", "VARCHAR(20)"),
    ("patient_diaries", "activity_duration_min", "INTEGER"),
    ("patient_diaries", "activity_intensity", "VARCHAR(20)"),
    ("patient_diaries", "hunger_level", "INTEGER"),
    ("patient_diaries", "energy_level", "INTEGER"),
    ("patient_diaries", "stress_level", "INTEGER"),
    ("patient_diaries", "bowel_function", "VARCHAR(30)"),
    ("patient_diaries", "symptoms", "TEXT"),
    ("patient_diaries", "medications_taken", "TEXT"),
]

CREATE_TABLES = [
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
        mood INTEGER,
        energy INTEGER,
        sleep_hours REAL,
        sleep_quality INTEGER,
        stress INTEGER,
        workout_done BOOLEAN,
        workout_adherence INTEGER,
        workout_notes TEXT,
        diet_adherence INTEGER,
        water_ml INTEGER,
        pain_level INTEGER,
        pain_location VARCHAR(200),
        notes TEXT,
        photos TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS physiotherapy_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        professional_id INTEGER NOT NULL REFERENCES users(id),
        client_id INTEGER NOT NULL REFERENCES patients(id),
        pain_level INTEGER,
        pain_location VARCHAR(200),
        pain_type VARCHAR(100),
        mobility_notes TEXT,
        posture_notes TEXT,
        injury_history TEXT,
        surgeries TEXT,
        previous_treatments TEXT,
        diagnosis TEXT,
        treatment_plan TEXT,
        goals TEXT,
        frequency VARCHAR(100),
        session_notes TEXT,
        techniques_used TEXT,
        recommendations TEXT,
        evolution_notes TEXT,
        discharge_criteria TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
    )""",
    """CREATE TABLE IF NOT EXISTS physiotherapy_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER NOT NULL REFERENCES physiotherapy_records(id),
        exercise_id INTEGER REFERENCES exercise_library(id),
        exercise_name VARCHAR(200),
        repetitions VARCHAR(50),
        sets INTEGER,
        frequency VARCHAR(100),
        duration VARCHAR(50),
        observations TEXT,
        order_index INTEGER DEFAULT 0
    )""",
    """CREATE TABLE IF NOT EXISTS client_restrictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES patients(id),
        created_by INTEGER NOT NULL REFERENCES users(id),
        restriction_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20),
        description TEXT NOT NULL,
        affected_area VARCHAR(100),
        start_date DATETIME,
        end_date DATETIME,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS body_evolutions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES patients(id),
        created_by INTEGER NOT NULL REFERENCES users(id),
        weight REAL,
        body_fat REAL,
        muscle_mass REAL,
        visceral_fat INTEGER,
        bone_mass REAL,
        hydration REAL,
        measurements TEXT,
        photos TEXT,
        notes TEXT,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
]

# Colunas novas em tabelas existentes
USER_MIGRATIONS = [
    ("users", "role", "VARCHAR(30) DEFAULT 'nutritionist'"),
    ("users", "cref", "VARCHAR(20)"),
    ("users", "crefito", "VARCHAR(20)"),
    ("users", "specialty", "VARCHAR(100)"),
    ("users", "bio", "VARCHAR(500)"),
]

if is_sqlite:
    import sqlite3

    # Suporta sqlite:///./path, sqlite:////abs/path, sqlite:///path
    raw = DATABASE_URL
    if raw.startswith("sqlite:////"):
        db_path = "/" + raw[len("sqlite:////"):]
    elif raw.startswith("sqlite:///"):
        db_path = raw[len("sqlite:///"):]
        if not db_path:
            db_path = "./nutrirp.db"
    else:
        db_path = raw[len("sqlite://"):]

    print(f"📂 SQLite path: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    for table, column, col_type in MIGRATIONS:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            print(f"✅ Added {table}.{column}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"⏭  {table}.{column} already exists")
            else:
                print(f"❌ Error adding {table}.{column}: {e}")

    # Novas colunas na tabela users
    for table, column, col_type in USER_MIGRATIONS:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            print(f"✅ Added {table}.{column}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"⏭  {table}.{column} already exists")
            else:
                print(f"❌ Error adding {table}.{column}: {e}")

    for stmt in CREATE_TABLES:
        try:
            cursor.execute(stmt)
            print(f"✅ Table created/verified")
        except Exception as e:
            print(f"❌ {e}")

    conn.commit()
    conn.close()
    print("\n✅ Migration complete (SQLite)")

else:
    try:
        import psycopg2
        from urllib.parse import urlparse

        parsed = urlparse(DATABASE_URL)
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            dbname=parsed.path[1:],
            user=parsed.username,
            password=parsed.password,
            sslmode="require"
        )
        cursor = conn.cursor()

        for table, column, col_type in MIGRATIONS:
            try:
                cursor.execute(
                    f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type}"
                )
                conn.commit()
                print(f"✅ Added/verified {table}.{column}")
            except Exception as e:
                print(f"❌ Error adding {table}.{column}: {e}")
                conn.rollback()

        for table, column, col_type in USER_MIGRATIONS:
            try:
                cursor.execute(
                    f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type}"
                )
                conn.commit()
                print(f"✅ Added/verified {table}.{column}")
            except Exception as e:
                print(f"❌ Error adding {table}.{column}: {e}")
                conn.rollback()

        for stmt in CREATE_TABLES:
            # Adapta para PostgreSQL (AUTOINCREMENT → SERIAL, etc.)
            pg_stmt = stmt.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY") \
                          .replace("BOOLEAN DEFAULT 0", "BOOLEAN DEFAULT FALSE") \
                          .replace("BOOLEAN DEFAULT 1", "BOOLEAN DEFAULT TRUE") \
                          .replace("DATETIME DEFAULT CURRENT_TIMESTAMP", "TIMESTAMP DEFAULT NOW()") \
                          .replace("DATETIME", "TIMESTAMP") \
                          .replace("REAL", "FLOAT")
            try:
                cursor.execute(pg_stmt)
                conn.commit()
                print(f"✅ Table created/verified")
            except Exception as e:
                print(f"❌ {e}")
                conn.rollback()

        cursor.close()
        conn.close()
        print("\n✅ Migration complete (PostgreSQL)")

    except ImportError:
        print("⚠️  psycopg2 not available, skipping PostgreSQL migration")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
