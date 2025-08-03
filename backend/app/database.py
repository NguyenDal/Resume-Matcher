import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Get the absolute path to the directory where this file is located.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Build the full path to the SQLite database file (app.db) one directory up.
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, '..', 'app.db')}"

# Create the SQLAlchemy engine for connecting to the SQLite database.
# The 'check_same_thread' option is set to False to allow usage with FastAPI.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

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