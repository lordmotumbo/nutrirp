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

        cursor.close()
        conn.close()
        print("\n✅ Migration complete (PostgreSQL)")

    except ImportError:
        print("⚠️  psycopg2 not available, skipping PostgreSQL migration")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
