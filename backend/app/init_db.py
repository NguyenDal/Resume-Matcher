from app.database import Base, engine
import app.models  # 

print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Database tables created.")
