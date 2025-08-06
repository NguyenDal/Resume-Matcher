import os
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Get the absolute path to the directory where this file is located.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- CHANGED: Use Railway PostgreSQL database instead of local SQLite ---
# SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, '..', 'app.db')}"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create the SQLAlchemy engine for connecting to the PostgreSQL database.
engine = create_engine(SQLALCHEMY_DATABASE_URL)  # <-- Removed connect_args for Postgres

# Set up a session factory for database sessions.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models.
Base = declarative_base()

def get_db():
    """
    Dependency function to get a database session.
    Yields a session and ensures it is closed after use.
    """
    from sqlalchemy.orm import Session
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()