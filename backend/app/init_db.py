from app.database import Base, engine
from app.models import User

print("Creating all tables...")
# Use SQLAlchemy's metadata to create all tables defined in the ORM models.
Base.metadata.create_all(bind=engine)
print("Database tables created.")
